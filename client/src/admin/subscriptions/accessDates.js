export const active = sub => new Date(sub.expiresAt).getTime() > Date.now();
export const daysLeft = sub => Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86400000));
export const formatDate = value => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable';
};
export const initials = name => (name || 'Student').trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
