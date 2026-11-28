import { test, expect } from '@playwright/test';

// Where the HSK mock tests live. On the home page, only people who can't open every mock test see the
// red "HSK 1 free mock test" bar, which goes straight to the free paper. Everyone finds their level's
// mock tests near the top of the HSK course page.
const hsk1 = { _id: 'c1', title: 'HSK 1 (Beginner level)', level: 'HSK 1 · Beginner', language: 'chinese', description: 'First steps.' };
const hsk2 = { _id: 'c2', title: 'HSK 2', level: 'HSK 2', language: 'chinese', description: 'Next steps.' };
const papers = [
  { id: 'h10901', title: 'HSK 1 · Second paper', code: 'H10901', published: true },
  { id: 'h11226', title: 'HSK 1 · Listening & Reading', code: 'H11226', free: true, published: true },
  { id: 'h11556', title: 'HSK 1 · Hidden paper', code: 'H11556', published: false },
];
const FUTURE = '2099-01-01T00:00:00.000Z';

// `access`: 'none' (no free week, plan or subscription), 'freeWeek', 'plan'.
async function prepare(page, { role = 'student', access = 'none', customTests = [], completed = [] } = {}) {
  const student = { id: 'student', name: 'Sita', role };
  if (role) await page.addInitScript(user => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, student);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/auth/me') return route.fulfill({ json: student });
    if (path === '/auth/login') return route.fulfill({ json: { user: { id: 'student', name: 'Sita', role: 'student' }, token: 'fixture-token' } });
    if (path === '/courses') return route.fulfill({ json: [hsk1, hsk2] });
    if (path === '/hsk1') return route.fulfill({ json: papers });
    const attempts = /^\/hsk1\/([a-z0-9-]+)\/attempts$/.exec(path);
    if (attempts) return route.fulfill({ json: completed.includes(attempts[1]) ? [{ _id: 'a1', score: 160 }] : [] });
    if (path === '/tests') return route.fulfill({ json: customTests });
    if (path === '/access-requests/my') return route.fulfill({ json: access === 'freeWeek' ? [{ scope: 'tests', status: 'approved', expiresAt: FUTURE }] : [] });
    if (path === '/subscriptions/my') return route.fulfill({ json: access === 'plan' ? [{ _id: 'plan-c1', course: hsk1, expiresAt: FUTURE, plan: true }] : [] });
    if (/^\/subscriptions\/check\//.test(path)) return route.fulfill({ json: { hasAccess: access === 'plan' } });
    return route.fulfill({ json: [] });
  });
}

const freeBar = page => page.locator('#practice-studio .hero-practice-tests');
const mockTests = page => page.getByRole('region', { name: /HSK \d mock tests/ });

test('a guest sees the HSK 1 free mock test, signs in, and lands on the free paper without the access prompt', async ({ page }) => {
  await prepare(page, { role: null });
  await page.goto('/');
  await expect(freeBar(page)).toContainText('HSK 1 free mock test');
  await expect(freeBar(page)).toContainText('Sign in to start');
  await freeBar(page).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Ftests%2Fh11226$/);
  await page.locator('#login-email').fill('student@example.com');
  await page.locator('#login-password').fill('password-fixture');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/tests\/h11226$/);
  await page.waitForTimeout(500);
  await expect(page.getByRole('dialog', { name: /Unlock practice|Waiting for approval|free week/ })).toHaveCount(0);
});

test('a student without every mock test gets the free bar, which opens the free paper', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await expect(freeBar(page)).toContainText('HSK 1 free mock test');
  await expect(freeBar(page)).toContainText('Start the free test');
  await freeBar(page).click();
  await expect(page).toHaveURL(/\/tests\/h11226$/);
});

for (const access of ['freeWeek', 'plan']) test(`with ${access === 'plan' ? 'a plan' : 'a free week'}, the home page has no mock test bar`, async ({ page }) => {
  await prepare(page, { access });
  await page.goto('/');
  await expect(page.locator('#practice-studio .hero-practice-pinyin')).toBeVisible();
  await expect(freeBar(page)).toHaveCount(0);
});

test('staff don’t get the free bar either', async ({ page }) => {
  await prepare(page, { role: 'admin' });
  await page.goto('/');
  await expect(page.locator('#practice-studio .hero-practice-pinyin')).toBeVisible();
  await expect(freeBar(page)).toHaveCount(0);
});

test('the HSK 1 course page lists every HSK 1 mock test near the top, all open with access', async ({ page }) => {
  await prepare(page, { access: 'plan', completed: ['h10901'] });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/courses/c1');
  const section = mockTests(page);
  await expect(section.getByRole('heading', { level: 2, name: 'HSK 1 mock tests' })).toBeVisible();
  await expect(section).toBeInViewport({ ratio: 0.2 });
  const cards = section.getByRole('listitem');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('Paper H11226');
  await expect(cards.first().getByRole('link', { name: 'Start test' })).toHaveAttribute('href', '/tests/h11226');
  await expect(cards.nth(1)).toContainText('Completed');
  await expect(cards.nth(1).getByRole('link', { name: 'View results' })).toHaveAttribute('href', '/tests/h10901');
  await expect(section.getByText('Locked')).toHaveCount(0);
  // It comes before the lesson library.
  const order = await page.evaluate(() => !!(document.querySelector('.course-mock-tests').compareDocumentPosition(document.querySelector('#course-lesson-library')) & Node.DOCUMENT_POSITION_FOLLOWING));
  expect(order).toBe(true);
});

test('without every mock test, only the free paper opens; the others say how to unlock', async ({ page }) => {
  await prepare(page);
  await page.goto('/courses/c1');
  const section = mockTests(page);
  await expect(section).toContainText('The free paper is open now.');
  const cards = section.getByRole('listitem');
  await expect(cards.first()).toContainText('Free');
  await expect(cards.first().getByRole('link', { name: 'Start test' })).toBeVisible();
  await expect(cards.nth(1)).toContainText('Locked');
  await expect(cards.nth(1).getByRole('link', { name: 'How to unlock' })).toHaveAttribute('href', '/tests');
});

test('other levels show their own mock tests, and nothing when they have none yet', async ({ page }) => {
  await prepare(page, { access: 'plan' });
  await page.goto('/courses/c2');
  await expect(page.getByRole('heading', { level: 1, name: 'HSK 2' })).toBeVisible();
  await expect(mockTests(page)).toHaveCount(0);

  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await prepare(page, { access: 'plan', customTests: [{ _id: 't2', title: 'HSK 2 practice test', level: 'HSK 2', questions: [{}, {}, {}] }] });
  await page.reload();
  const section = mockTests(page);
  await expect(section.getByRole('heading', { level: 2, name: 'HSK 2 mock tests' })).toBeVisible();
  await expect(section.getByRole('listitem')).toHaveCount(1);
  await expect(section).toContainText('HSK 2 practice test');
  await expect(section).toContainText('3 questions');
  await expect(section.getByRole('link', { name: 'Start test' })).toHaveAttribute('href', '/tests/t2');
});
