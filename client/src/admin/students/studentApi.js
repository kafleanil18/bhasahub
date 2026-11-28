import { apiJson } from '../../lib/apiClient';
// Calls to the super admin student endpoints. Every call resolves to the parsed body or throws with the server's message.
export const studentRequest = (path, options = {}) => apiJson(`/api${path}`, {
  ...options, headers: { 'Content-Type': 'application/json', ...options.headers },
});

const DAY = 86400000;
export const isLive = date => !!date && new Date(date).getTime() > Date.now();
export const daysUntil = date => Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / DAY));
export const activeCourses = student => (student.subscriptions || []).filter(sub => isLive(sub.expiresAt));

// paid: plan or course access; trial: free access running; none: neither.
export function accessKind(student) {
  if (student.plan || activeCourses(student).length) return 'paid';
  if (student.trial?.status === 'active') return 'trial';
  return 'none';
}
