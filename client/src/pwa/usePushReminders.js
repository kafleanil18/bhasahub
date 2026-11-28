import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

// An explicit token (signing this device out with the old one) is sent as given; otherwise apiFetch adds the stored one.
const api = (path, options = {}, token) => apiFetch(`/api/push${path}`, {
  ...options, signal: options.signal || AbortSignal.timeout(15000),
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
}).then(async response => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Could not reach the server. Please try again.'), { status: response.status });
  return data;
});

export function urlBase64ToUint8Array(value) {
  const base64 = (value + '='.repeat((4 - value.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

export const browserTimezone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function serviceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  // The worker is only registered in production builds; don't wait forever in development.
  return Promise.race([navigator.serviceWorker.ready, new Promise(resolve => setTimeout(() => resolve(null), 4000))]);
}

async function currentSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

// Called on sign-out so a shared device stops receiving the previous student's reminders.
export async function forgetPushDevice(token) {
  try {
    const subscription = await currentSubscription();
    if (!subscription) return;
    if (token) await api('/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }), keepalive: true }, token).catch(() => {});
    await subscription.unsubscribe();
  } catch { /* Signing out must never fail because of reminders. */ }
}

export default function usePushReminders() {
  const [state, setState] = useState({ status: 'loading' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setError('');
    if (!pushSupported()) { setState({ status: isIos() && !isStandalone() ? 'ios-install' : 'unsupported' }); return; }
    try {
      const { configured, publicKey } = await api('/public-key');
      if (!configured) { setState({ status: 'not-configured' }); return; }
      const subscription = await currentSubscription();
      const me = await api(`/me${subscription ? `?endpoint=${encodeURIComponent(subscription.endpoint)}` : ''}`);
      setState({ status: 'ready', publicKey, permission: Notification.permission, ...me, timezone: me.timezone || browserTimezone() });
    } catch (err) { setState({ status: 'error' }); setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (name, action) => {
    if (busy) return;
    setBusy(name); setError(''); setMessage('');
    try { await action(); } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(''); }
  };

  const enable = time => run('enable', async () => {
    // Ask straight from the click so browsers show the permission prompt.
    const permission = await Notification.requestPermission();
    setState(previous => ({ ...previous, permission }));
    if (permission !== 'granted') throw new Error(permission === 'denied'
      ? 'Notifications are blocked for this site. Allow them in your browser’s site settings, then try again.'
      : 'Notifications were not allowed. Turn reminders on again when you are ready.');
    const registration = await serviceWorkerRegistration();
    if (!registration) throw new Error('Reminders need the installed app or the live site. Open Xiao Ao from your Home Screen or the published website.');
    const subscription = await registration.pushManager.getSubscription()
      || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(state.publicKey) });
    const timezone = browserTimezone();
    const saved = await api('/subscriptions', { method: 'POST', body: JSON.stringify({ subscription: subscription.toJSON(), time, timezone }) });
    setState(previous => ({ ...previous, ...saved, devices: Math.max(previous.devices || 0, 1) }));
    setMessage(`Reminders are on. We’ll nudge you at ${formatTime(saved.time)} if you haven’t practised yet.`);
  });

  const disable = () => run('disable', async () => {
    const subscription = await currentSubscription();
    if (subscription) {
      const saved = await api('/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) });
      await subscription.unsubscribe().catch(() => {});
      setState(previous => ({ ...previous, ...saved }));
    } else setState(previous => ({ ...previous, thisDevice: false }));
    setMessage('Reminders are off on this device.');
  });

  const changeTime = time => run('time', async () => {
    const saved = await api('/settings', { method: 'PUT', body: JSON.stringify({ time, timezone: browserTimezone() }) });
    setState(previous => ({ ...previous, ...saved }));
    setMessage(`Reminder time saved: ${formatTime(saved.time)}.`);
  });

  const sendTest = () => run('test', async () => {
    await api('/test', { method: 'POST' });
    setMessage('Test sent. It should appear in a few seconds.');
  });

  return { ...state, busy, error, message, enable, disable, changeTime, sendTest, retry: load };
}

export function formatTime(time) {
  const [hours, minutes] = String(time || '19:00').split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
