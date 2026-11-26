import { test, expect } from '@playwright/test';

// A superadmin has just made this student an admin. The database says admin, but the browser
// still holds the student role it was given at sign-in, and the student has no free week or
// course subscription, so with that role every practice tool and course would be locked.
async function promotedWhileSignedIn(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'person', name: 'Mei', email: 'mei@example.com', role: 'student', isFirstLogin: false }));
  });
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    const course = { _id: 'course', title: 'HSK 1 Chinese', level: 'HSK 1', language: 'chinese', published: true };
    let data = [];
    if (path === '/auth/me') data = { id: 'person', name: 'Mei', email: 'mei@example.com', role: 'admin' };
    if (path === '/courses' || path === '/courses/all') data = [course];
    if (path === '/subscriptions/check/course') data = { hasAccess: false, expiresAt: null };
    if (path === '/lessons/course/course') data = [{ _id: 'first', title: 'First lesson', order: 1, category: 'vocabulary' }];
    if (path === '/progress/course/course') data = { total: 1, completed: 0, completedLessonIds: [] };
    return route.fulfill({ json: data });
  });
}

const storedUser = page => page.evaluate(() => JSON.parse(localStorage.getItem('user')));

test('a student made admin can use every practice tool without signing in again', async ({ page }) => {
  await promotedWhileSignedIn(page);
  await page.goto('/practice/measure-words');
  await expect.poll(async () => (await storedUser(page)).role).toBe('admin');
  await expect(page.locator('.practice-gate-panel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mixed practice' }).click();
  await expect(page.locator('.measure-chip')).toHaveText('Mixed');
  // Only the account details change; the rest of what sign-in saved stays.
  expect(await storedUser(page)).toEqual({ id: 'person', name: 'Mei', email: 'mei@example.com', role: 'admin', isFirstLogin: false });
});

test('a student made admin can open every course without signing in again', async ({ page }) => {
  await promotedWhileSignedIn(page);
  await page.goto('/courses/course');
  await expect(page.getByRole('button', { name: /Preview a lesson/ })).toBeVisible();
  await expect(page.getByText('Unlock this course with a plan')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /First lesson, start lesson/ })).toBeVisible();
});
