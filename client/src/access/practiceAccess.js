import { useCallback, useEffect, useState } from 'react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' });
export const isStaff = user => ['admin', 'superadmin'].includes(user?.role);

// A student may practise once any of their access requests (course or mock tests) is approved.
// status: loading | approved | pending | denied | none | signed-out
export function usePracticeAccess(user) {
  const signedIn = !!user && !!localStorage.getItem('token');
  const [status, setStatus] = useState(() => isStaff(user) ? 'approved' : signedIn ? 'loading' : 'signed-out');

  useEffect(() => {
    if (isStaff(user)) return setStatus('approved');
    if (!signedIn) return setStatus('signed-out');
    let active = true;
    setStatus('loading');
    fetch(`${window.API_BASE_URL}/api/access-requests/my`, { headers: authHeaders() })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (!active) return;
        const requests = Array.isArray(data) ? data : [];
        if (requests.some(row => row.status === 'approved')) setStatus('approved');
        else if (requests.some(row => row.status === 'pending')) setStatus('pending');
        else setStatus(requests.some(row => row.scope === 'tests' && row.status === 'denied') ? 'denied' : 'none');
      })
      // If the check fails, keep the page usable rather than locking a student out by mistake.
      .catch(() => { if (active) setStatus('approved'); });
    return () => { active = false; };
  }, [user, signedIn]);

  const request = useCallback(async () => {
    const response = await fetch(`${window.API_BASE_URL}/api/access-requests`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ scope: 'tests' }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not send your request.');
    setStatus('pending');
  }, []);

  return { status, request };
}
