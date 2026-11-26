import { useEffect, useRef } from 'react';

// Signs people out after two hours without any activity. The last activity time is kept in
// localStorage, so every open tab shares it: working in one tab keeps the others signed in, and a
// tab reopened after a long break (or a computer waking from sleep) is signed out straight away.
export const IDLE_LIMIT_MS = 2 * 60 * 60 * 1000;
const ACTIVITY_KEY = 'lastActivityAt';
const NOTICE_KEY = 'signedOutForInactivity';
const WRITE_EVERY_MS = 30 * 1000;
const CHECK_EVERY_MS = 60 * 1000;
const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];

const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage may be blocked */ } };

export function markActive(now = Date.now()) { write(ACTIVITY_KEY, String(now)); }

// True when a saved sign-in has had no activity for longer than the limit.
export function isSessionIdle(now = Date.now()) {
  const last = Number(read(ACTIVITY_KEY));
  return Number.isFinite(last) && last > 0 && now - last > IDLE_LIMIT_MS;
}

// Clears an idle sign-in before the app first renders, and remembers to explain why.
export function clearIdleSession() {
  if (!read('token') || !isSessionIdle()) return false;
  try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch { /* ignore */ }
  rememberIdleSignOut();
  return true;
}

export function rememberIdleSignOut() { try { sessionStorage.setItem(NOTICE_KEY, '1'); } catch { /* ignore */ } }
export function hasIdleSignOutNotice() {
  try { return sessionStorage.getItem(NOTICE_KEY) === '1'; } catch { return false; }
}
export function clearIdleSignOutNotice() { try { sessionStorage.removeItem(NOTICE_KEY); } catch { /* ignore */ } }

// While someone is signed in, records their activity and calls onIdle once the limit passes.
export function useIdleSignOut(signedIn, onIdle) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;
  useEffect(() => {
    if (!signedIn) return undefined;
    let lastWrite = 0;
    const activity = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_EVERY_MS) return;
      lastWrite = now; markActive(now);
    };
    const check = () => { if (isSessionIdle()) onIdleRef.current(); };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    // Start the clock only if this sign-in has none yet (a reload must not reset it).
    if (!Number(read(ACTIVITY_KEY))) markActive();
    EVENTS.forEach(name => window.addEventListener(name, activity, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    check();
    return () => {
      EVENTS.forEach(name => window.removeEventListener(name, activity, { capture: true }));
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      window.clearInterval(timer);
    };
  }, [signedIn]);
}
