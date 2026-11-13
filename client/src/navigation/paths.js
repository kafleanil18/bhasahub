export const practicePaths = {
  pinyin: '/practice/pinyin', tones: '/practice/tones', trace: '/practice/characters', listening: '/practice/listening',
  sentences: '/practice/sentences', measures: '/practice/measure-words', numbers: '/practice/numbers',
  dictation: '/practice/dictation', conversation: '/practice/conversations', tests: '/tests',
};
export const adminPaths = {
  dashboard: '/admin', courses: '/admin/courses', conversations: '/admin/conversations', tests: '/admin/tests',
  subscriptions: '/admin/subscriptions', pinyin: '/admin/pinyin', trace: '/admin/characters',
  'sentence-audio': '/admin/sentence-audio', testimonials: '/admin/testimonials', inbox: '/admin/inbox',
  admins: '/admin/users', audit: '/admin/audit', settings: '/admin/settings/email', reminders: '/admin/reminders',
};
export const homePath = user => user?.role === 'superadmin' ? '/admin' : '/';
export const coursePath = id => `/courses/${encodeURIComponent(id)}`;
export const manageCoursePath = id => `/admin/courses/${encodeURIComponent(id)}/lessons`;
export const testPath = (id, preview = false) => `/tests/${encodeURIComponent(id)}${preview ? '?preview=1' : ''}`;
export const signInPath = destination => `/sign-in?next=${encodeURIComponent(destination)}`;

export function safeReturnPath(value, fallback = '/') {
  // Only accept same-origin paths, and never send a completed sign-in back to auth.
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return fallback;
  const url = new URL(value, 'https://local.invalid');
  if (['/sign-in', '/register', '/forgot-password', '/reset-password'].includes(url.pathname)) return fallback;
  return url.pathname + url.search + url.hash;
}
