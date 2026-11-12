import { test, expect } from '@playwright/test';

async function prepare(page, { completed = ['first'], expired = false, fail = false } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    const course = { _id: 'course', title: 'Chinese basics', level: 'HSK 1', language: 'chinese' };
    let data = [];
    if (path === '/courses') data = [course];
    if (path === '/enrollments/access') data = [{ courseId: 'course', completed: completed.length, total: 2 }];
    if (path === '/subscriptions/my') data = [{ course, expiresAt: expired ? '2000-01-01' : '2099-01-01' }];
    if (path === '/lessons/course/course') data = [
      { _id: 'second', title: 'Second lesson', order: 2, category: 'vocabulary' },
      { _id: 'hidden', title: 'Conversation', order: 0, category: 'conversation' },
      { _id: 'first', title: 'First lesson', order: 1, category: 'vocabulary' },
    ];
    if (path === '/progress/course/course') {
      if (fail) return route.fulfill({ status: 500, json: { error: 'Unavailable' } });
      data = { total: 2, completed: completed.length, completedLessonIds: completed };
    }
    if (path === '/subscriptions/check/course') data = { hasAccess: true };
    await route.fulfill({ json: data });
  });
  await page.route('https://**/*', route => route.abort());
}

test('resume opens the next unfinished lesson and skips disabled conversation lessons', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue learning', exact: true }).click();
  await expect(page).toHaveURL(/\/courses\/course\/lessons\/second$/);
  await expect(page.getByRole('heading', { name: 'Second lesson', exact: true })).toBeVisible();
});

test('a new course starts at the first lesson', async ({ page }) => {
  await prepare(page, { completed: [] });
  await page.goto('/continue');
  await expect(page).toHaveURL(/\/courses\/course\/lessons\/first$/);
});

test('completed courses show a completion message', async ({ page }) => {
  await prepare(page, { completed: ['first', 'second'] });
  await page.goto('/continue');
  await expect(page.getByRole('heading', { name: 'You’re all caught up!' })).toBeVisible();
});

test('expired access does not resume a lesson', async ({ page }) => {
  await prepare(page, { expired: true });
  await page.goto('/continue');
  await expect(page.getByRole('heading', { name: 'Find your next course' })).toBeVisible();
});

test('progress failure offers retry without opening a lesson', async ({ page }) => {
  await prepare(page, { fail: true });
  await page.goto('/continue');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page).toHaveURL(/\/continue$/);
});

test('a course-specific resume never opens a different course', async ({ page }) => {
  await prepare(page);
  await page.goto('/continue?course=other');
  await expect(page.getByRole('heading', { name: 'Find your next course' })).toBeVisible();
  await expect(page).toHaveURL(/course=other$/);
});
