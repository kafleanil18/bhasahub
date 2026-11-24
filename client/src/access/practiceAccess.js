import { useCallback, useEffect, useState } from 'react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' });
export const isStaff = user => ['admin', 'superadmin'].includes(user?.role);

export const FREE_ACCESS_DAYS = 7;
// Free (tests-scope) access lasts a week from approval; older approvals have no end date.
export const freeAccessLive = row => row.status === 'approved' && (!row.expiresAt || new Date(row.expiresAt).getTime() > Date.now());
const approvalLive = row => row.status === 'approved' && (row.scope !== 'tests' || freeAccessLive(row));

// The student's practice status from their access requests.
// loading | approved | pending | expired (free week used up) | denied | none | signed-out
export function practiceStatus(requests) {
  if (requests.some(approvalLive)) return 'approved';
  if (requests.some(row => row.status === 'pending')) return 'pending';
  if (requests.some(row => row.scope === 'tests' && row.status === 'approved')) return 'expired';
  return requests.some(row => row.scope === 'tests' && row.status === 'denied') ? 'denied' : 'none';
}

// A student may practise while any of their access requests (course, or a live free week) is approved.
export function usePracticeAccess(user) {
  const signedIn = !!user && !!localStorage.getItem('token');
  const [status, setStatus] = useState(() => isStaff(user) ? 'approved' : signedIn ? 'loading' : 'signed-out');

  useEffect(() => {
    if (isStaff(user)) return setStatus('approved');
    if (!signedIn) return setStatus('signed-out');
    let active = true;
    setStatus('loading');
    const check = () => fetch(`${window.API_BASE_URL}/api/access-requests/my`, { headers: authHeaders() })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (!active) return;
        setStatus(practiceStatus(Array.isArray(data) ? data : []));
      })
      // If the check fails, keep the page usable rather than locking a student out by mistake.
      .catch(() => { if (active) setStatus('approved'); });
    void check();
    // Re-check while the page is open so an approval clears "waiting" boxes without a reload.
    const interval = window.setInterval(check, 15000);
    window.addEventListener('focus', check);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', check); };
  }, [user, signedIn]);

  const request = useCallback(async () => {
    const response = await fetch(`${window.API_BASE_URL}/api/access-requests`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ scope: 'tests' }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not send your request.');
    setStatus('pending');
  }, []);

  return { status, request };
}
