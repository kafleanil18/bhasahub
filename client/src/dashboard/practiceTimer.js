import { useEffect, useRef } from 'react';
import { apiFetch } from '../lib/apiClient';

// Counts active learning time for the daily goal and streak. Time counts while the student is on a
// lesson, practice tool or test, the tab is visible, and they have clicked, typed or scrolled in the
// last two minutes (the idle sign-out tracker keeps that activity time in localStorage).
const LEARNING = /^\/(practice|courses|continue|tests)(\/|$)/;
const TICK_SECONDS = 15;
const SEND_AFTER_SECONDS = 60;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
export const PRACTICE_TIME_SAVED = 'practice-time-saved';

export const localToday = (now = new Date()) => {
  const pad = value => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const recentlyActive = () => {
  try { return Date.now() - Number(localStorage.getItem('lastActivityAt')) < ACTIVE_WINDOW_MS; } catch { return true; }
};

function send(seconds, date) {
  let token;
  try { token = localStorage.getItem('token'); } catch { return; }
  if (!token || seconds < 1) return;
  apiFetch(`${window.API_BASE_URL}/api/practice-time`, {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, seconds: Math.min(120, Math.round(seconds)) }),
  }).then(response => { if (response.ok) window.dispatchEvent(new CustomEvent(PRACTICE_TIME_SAVED)); }).catch(() => {});
}

export default function usePracticeTimer(enabled, pathname) {
  const pending = useRef({ seconds: 0, date: localToday() });
  const learning = enabled && LEARNING.test(pathname);

  useEffect(() => {
    const flush = () => {
      const { seconds, date } = pending.current;
      pending.current = { seconds: 0, date: localToday() };
      send(seconds, date);
    };
    if (!learning) { flush(); return undefined; }
    const tick = () => {
      if (document.visibilityState !== 'visible' || !recentlyActive()) return;
      // Time from before midnight belongs to the day it was spent.
      if (pending.current.date !== localToday()) flush();
      pending.current.seconds += TICK_SECONDS;
      if (pending.current.seconds >= SEND_AFTER_SECONDS) flush();
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    const timer = window.setInterval(tick, TICK_SECONDS * 1000);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [learning]);
}
