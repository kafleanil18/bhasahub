import { test, expect } from '@playwright/test';

// A plan or an active course subscription includes the whole practice studio and every mock test,
// with no free-week request needed.
const course = { _id: 'c1', title: 'HSK 1 Chinese', level: 'HSK 1' };
const FUTURE = '2099-01-01T00:00:00.000Z';
const PAST = '2000-01-01T00:00:00.000Z';
const plan = [{ _id: 'plan-c1', course, expiresAt: FUTURE, plan: true }];
const papers = [
  { id: 'h11226', title: 'HSK 1 · Listening & Reading', code: 'H11226', free: true, published: true },
  { id: 'h10901', title: 'HSK 1 · Second paper', code: 'H10901', published: true },
];

async function prepare(page, { subscriptions = [], requests = [] } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/access-requests/my') return route.fulfill({ json: requests });
    if (path === '/subscriptions/my') return route.fulfill({ json: subscriptions });
    if (path === '/hsk1') return route.fulfill({ json: papers });
    return route.fulfill({ json: [] });
  });
}

async function startMixedRound(page) {
  await page.goto('/practice/measure-words');
  await page.getByRole('button', { name: 'Mixed practice' }).click();
  await expect(page.locator('.measure-chip')).toHaveText('Mixed');
  await expect(page.locator('.practice-gate-panel')).toHaveCount(0);
}

test('a plan unlocks the practice studio without a free week', async ({ page }) => {
  await prepare(page, { subscriptions: plan });
  await startMixedRound(page);
});

test('an active course subscription unlocks the practice studio too', async ({ page }) => {
  await prepare(page, { subscriptions: [{ _id: 's1', course, expiresAt: FUTURE }] });
  await startMixedRound(page);
});

test('when the free week is over and there is no plan, practice locks with a pointer to plans', async ({ page }) => {
  await prepare(page, { requests: [{ scope: 'tests', status: 'approved', expiresAt: PAST }] });
  await page.goto('/practice/measure-words');
  await expect(page.locator('.practice-gate-panel')).toContainText('Your free week has ended');
});

test('a plan unlocks every mock test, not just the free one', async ({ page }) => {
  await prepare(page, { subscriptions: plan });
  await page.goto('/tests');
  await expect(page.getByText('HSK 1 paper H10901')).toBeVisible();
  await expect(page.locator('.mock-test-lock-tag')).toHaveCount(0);
  await expect(page.locator('.test-access-banner')).toHaveCount(0);
});

test('without a plan or free week, only the free mock test is open', async ({ page }) => {
  await prepare(page);
  await page.goto('/tests');
  await expect(page.getByText('HSK 1 paper H10901')).toBeVisible();
  await expect(page.locator('.test-access-banner')).toContainText('One mock test is free');
  await expect(page.locator('.mock-test-lock-tag')).toHaveCount(1);
});
