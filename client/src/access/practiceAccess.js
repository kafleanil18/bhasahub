import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

const authHeaders = () => ({ 'Content-Type': 'application/json' });
export const isStaff = user => ['admin', 'superadmin'].includes(user?.role);

export const FREE_ACCESS_DAYS = 7;
// Free (tests-scope) access lasts a week from approval; older approvals have no end date.
export const freeAccessLive = row => row.status === 'approved' && (!row.expiresAt || new Date(row.expiresAt).getTime() > Date.now());
// A row from /api/subscriptions/my that hasn't ended: a course subscription, or a course an active plan covers.
const subscriptionLive = row => new Date(row?.expiresAt).getTime() > Date.now();

/*
 * The student's practice status. The practice studio and every mock test are open during a free
 * week, an active plan or an active course subscription; the server's hasTestAccess follows the
 * same rule. loading | approved | pending | expired (free week used up) | denied | none | signed-out
 */
export function practiceStatus(requests, subscriptions = []) {
  if (subscriptions.some(subscriptionLive) || requests.some(row => row.scope === 'tests' && freeAccessLive(row))) return 'approved';
  if (requests.some(row => row.status === 'pending')) return 'pending';
  if (requests.some(row => row.scope === 'tests' && row.status === 'approved')) return 'expired';
  return requests.some(row => row.scope === 'tests' && row.status === 'denied') ? 'denied' : 'none';
}

const getJson = path => apiFetch(`${window.API_BASE_URL}/api${path}`, { headers: authHeaders() })
  .then(res => { if (!res.ok) throw new Error(); return res.json(); });

// Loads the student's access requests and subscriptions and works out their practice status.
export const loadPracticeStatus = () => Promise.all([getJson('/access-requests/my'), getJson('/subscriptions/my')])
  .then(([requests, subscriptions]) => practiceStatus(Array.isArray(requests) ? requests : [], Array.isArray(subscriptions) ? subscriptions : []));

export function usePracticeAccess(user) {
  const signedIn = !!user && !!localStorage.getItem('token');
  const [status, setStatus] = useState(() => isStaff(user) ? 'approved' : signedIn ? 'loading' : 'signed-out');

  useEffect(() => {
    if (isStaff(user)) return setStatus('approved');
    if (!signedIn) return setStatus('signed-out');
    let active = true;
    setStatus('loading');
    const check = () => loadPracticeStatus()
      .then(next => { if (active) setStatus(next); })
      // If the check fails, keep the page usable rather than locking a student out by mistake.
      .catch(() => { if (active) setStatus('approved'); });
    void check();
    // Re-check while the page is open so an approval clears "waiting" boxes without a reload.
    const interval = window.setInterval(check, 15000);
    window.addEventListener('focus', check);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', check); };
  }, [user, signedIn]);

  const request = useCallback(async () => {
    const response = await apiFetch(`${window.API_BASE_URL}/api/access-requests`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ scope: 'tests' }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not send your request.');
    setStatus('pending');
  }, []);

  return { status, request };
}
