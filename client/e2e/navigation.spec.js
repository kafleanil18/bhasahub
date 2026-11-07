import { test, expect } from '@playwright/test';

const course = { _id: 'course1', title: 'Mandarin foundations', language: 'chinese', level: 'HSK 1', published: true, description: 'Learn the basics.' };
const lesson = { _id: 'lesson1', course: 'course1', title: 'Your first lesson', order: 1, category: 'vocabulary', published: true };
const student = { id: 'student1', name: 'Student', email: 'student@example.com', role: 'student' };

async function prepare(page, user = null) {
  await page.addInitScript(user => {
    // Preserve the session across reloads; seed only fresh browser contexts.
    if (user && !sessionStorage.getItem('seeded')) {
      localStorage.setItem('token', 'fixture-token'); localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('seeded', 'true');
    }
  }, user);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    let data = [];
    if (path === '/health') data = { status: 'ok' };
    else if (path === '/courses' || path === '/courses/all') data = [course];
    else if (path === '/lessons/course/course1' || path === '/lessons/course/course1/all') data = [lesson];
    else if (path === '/subscriptions/check/course1') data = { hasAccess: true, expiresAt: '2099-01-01' };
    else if (path === '/progress/course/course1') data = { total: 1, completed: 0, completedLessonIds: [] };
    else if (path === '/auth/login') data = { user: student, token: 'fixture-token' };
    else if (path === '/pinyin-table') data = {};
    else if (path === '/admin-stats') data = { students: { total: 0, newLast7Days: 0, newLast30Days: 0, signupsByDay: [] }, courses: { total: 1, published: 1 }, subscriptions: { active: 0, expiringSoon: 0 }, lessons: { completed: 0 }, enrollments: { total: 0, topCourses: [] }, tests: { bundled: 3 }, admins: { total: 1 } };
    else if (path === '/hsk1/h11226') data = { code: 'H11226', groups: [], listeningSeconds: 100, transferSeconds: 10, readingSeconds: 100 };
    await route.fulfill({ json: data });
  });
  // No external identity, font, or network services are needed to test navigation.
  await page.route('https://**/*', route => route.abort());
}

test('public navigation supports Back, Forward, and refresh', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Pinyin practice', exact: true }).click();
  await expect(page).toHaveURL(/\/practice\/pinyin$/);
  await expect(page.getByRole('heading', { name: /Mandarin Pinyin Chart/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Mandarin Pinyin Chart/ })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /A Complete Mandarin/ })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/practice\/pinyin$/);
});

test('protected deep links return to the requested page after sign-in', async ({ page }) => {
  await prepare(page);
  await page.goto('/practice/numbers');
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await page.locator('#login-email').fill('student@example.com');
  await page.locator('#login-password').fill('password-fixture');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/practice\/numbers$/);
  await expect(page.getByRole('heading', { name: 'Everyday Chinese Numbers' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Everyday Chinese Numbers' })).toBeVisible();
});

test('course and lesson URLs hydrate on direct visits and survive refresh', async ({ page }) => {
  await prepare(page, student);
  await page.goto('/courses/course1');
  await expect(page.getByRole('heading', { name: course.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Start first lesson/ }).click();
  await expect(page).toHaveURL(/\/courses\/course1\/lessons\/lesson1$/);
  await expect(page.getByRole('heading', { name: lesson.title, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: lesson.title, exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/courses\/course1$/);
  await expect(page.getByRole('heading', { name: course.title, exact: true })).toBeVisible();
});

test('students cannot enter admin pages and ordinary admins cannot enter superadmin pages', async ({ page }) => {
  await prepare(page, student);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Admin Directory' })).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem('user', JSON.stringify({ id: 'admin1', name: 'Teacher', role: 'admin' })));
  await page.goto('/admin/courses');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/admin/tests');
  await expect(page.getByRole('heading', { name: 'Test Studio' })).toBeVisible();
});

test('superadmin sidebar and lesson management have independent URLs', async ({ page }) => {
  await prepare(page, { id: 'super1', name: 'Owner', role: 'superadmin' });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Manage courses', exact: true }).first().click();
  await expect(page).toHaveURL(/\/admin\/courses$/);
  await expect(page.getByRole('heading', { name: 'Course Studio' })).toBeVisible();
  await page.getByRole('button', { name: /Manage lessons/ }).click();
  await expect(page).toHaveURL(/\/admin\/courses\/course1\/lessons$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: course.title, exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Course Studio' })).toBeVisible();
});

test('test deep links and preview return destinations survive reload', async ({ page }) => {
  await prepare(page, { id: 'admin1', name: 'Teacher', role: 'admin' });
  await page.goto('/tests/h11226?preview=1');
  await expect(page.locator('.hsk-portal')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Back/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/tests$/);
});

test('legacy password-reset links remain valid', async ({ page }) => {
  await prepare(page);
  await page.goto('/?reset=email-token');
  await expect(page).toHaveURL(/\/reset-password\?token=email-token$/);
  await expect(page.getByRole('heading', { name: /Reset|password/i }).last()).toBeVisible();
  await page.reload();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
});

test('unknown pages show a recovery link, and external next URLs are rejected', async ({ page }) => {
  await prepare(page, student);
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('/sign-in?next=https://example.com');
  await expect(page).toHaveURL(/\/$/);
});

test('mobile navigation closes its drawer after changing pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, student);
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'My Courses', exact: true }).click();
  await expect(page).toHaveURL(/\/my-courses$/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('logging out prevents browser Back from reopening protected pages', async ({ page }) => {
  await prepare(page, student);
  await page.goto('/practice/numbers');
  await page.getByRole('button', { name: 'Account menu for Student' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/progress');
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: /A Complete Mandarin/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});

for (const firstLogin of [true, false]) {
  test(`${firstLogin ? 'first-time' : 'returning'} students see their personalized home greeting`, async ({ page }) => {
    await prepare(page, { ...student, name: 'Maya', isFirstLogin: firstLogin });
    await page.goto('/');
    const expected = firstLogin ? /Your next step starts here,\s*Maya\./ : /Welcome back,\s*Maya\./;
    await expect(page.locator('#home-hero-title')).toHaveText(expected);
    await page.reload();
    await expect(page.locator('#home-hero-title')).toHaveText(expected);
  });
}
