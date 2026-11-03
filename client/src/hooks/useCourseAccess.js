import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

export function useCourseAccess(courseId, token) {
  const [hasAccess, setHasAccess] = useState(false);
  const [accessExpiry, setAccessExpiry] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setHasAccess(false);
    setAccessExpiry(null);
    setAccessChecked(false);
    setError(null);
    if (!token) { setAccessChecked(true); return; }
    const controller = new AbortController();
    let checking = false;
    async function checkAccess() {
      if (checking || controller.signal.aborted) return;
      checking = true;
      try {
        const res = await fetch(`${API}/subscriptions/check/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (!res.ok) throw new Error('Access check failed');
        const data = await res.json();
        if (controller.signal.aborted) return;
        setHasAccess(!!data.hasAccess);
        setAccessExpiry(data.expiresAt || null);
        setError(null);
      } catch {
        if (!controller.signal.aborted) setError('Could not check your course access.');
      } finally {
        checking = false;
        if (!controller.signal.aborted) setAccessChecked(true);
      }
    }
    void checkAccess();
    const interval = window.setInterval(checkAccess, 15000);
    window.addEventListener('focus', checkAccess);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', checkAccess);
    };
  }, [courseId, token]);

  return { hasAccess, accessExpiry, accessChecked, error };
}
