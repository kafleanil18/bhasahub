import { test, expect } from '@playwright/test';

// Manage tests (Test Studio): sort papers, see which one is free, choose another free paper, and tell
// live papers (red) from hidden ones (grey).
const papers = () => [
  { id: 'h11226', title: 'HSK 1 · Listening & Reading', code: 'H11226', published: true, free: true, addedAt: '2026-11-05T12:58:21+05:45' },
  { id: 'h10901', title: 'HSK 1 · Listening & Reading', code: 'H10901', published: true, free: false, addedAt: '2026-11-05T19:30:34+05:45' },
  { id: 'h11552', title: 'HSK 1 · H11552', code: 'H11552', published: false, free: false, addedAt: '2026-11-28T23:44:00+05:45' },
  { id: 'h11009', title: 'HSK 1 · H11009', code: 'H11009', published: false, free: false, addedAt: '2026-11-28T23:41:00+05:45' },
];

async function prepare(page, role = 'superadmin') {
  const state = { papers: papers(), calls: [] };
  await page.addInitScript(role => { localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify({ id: 'boss', name: 'Boss', role })); }, role);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    const method = route.request().method();
    if (path === '/auth/me') return route.fulfill({ json: { id: 'boss', name: 'Boss', role } });
    if (path === '/hsk1') return route.fulfill({ json: state.papers });
    const publication = /^\/hsk1\/([a-z0-9-]+)\/publication$/.exec(path);
    if (publication) return route.fulfill({ json: { published: state.papers.find(row => row.id === publication[1])?.published } });
    const free = /^\/hsk1\/([a-z0-9-]+)\/free$/.exec(path);
    if (free && method === 'PUT') {
      state.calls.push(free[1]);
      state.papers = state.papers.map(row => ({ ...row, free: row.id === free[1] }));
      return route.fulfill({ json: { free: free[1] } });
    }
    return route.fulfill({ json: [] });
  });
  return state;
}

const codes = page => page.locator('.hsk-featured-test small').allTextContents();

test('papers sort oldest uploaded first by default, or by latest upload or HSK paper number', async ({ page }) => {
  await prepare(page);
  await page.goto('/admin/tests');
  await expect(page.locator('.hsk-featured-test')).toHaveCount(4);
  await expect(page.getByLabel('Sort papers')).toHaveValue('oldest');
  await expect.poll(() => codes(page)).toEqual(['HSK 1 paper H11226', 'HSK 1 paper H10901', 'HSK 1 paper H11009', 'HSK 1 paper H11552']);
  await page.getByLabel('Sort papers').selectOption('latest');
  await expect.poll(() => codes(page)).toEqual(['HSK 1 paper H11552', 'HSK 1 paper H11009', 'HSK 1 paper H10901', 'HSK 1 paper H11226']);
  await page.getByLabel('Sort papers').selectOption('number');
  await expect.poll(() => codes(page)).toEqual(['HSK 1 paper H10901', 'HSK 1 paper H11009', 'HSK 1 paper H11226', 'HSK 1 paper H11552']);
});

test('the free paper is tagged, and a super admin can make another live paper free', async ({ page }) => {
  const state = await prepare(page);
  await page.goto('/admin/tests');
  const card = code => page.locator('.hsk-featured-test').filter({ hasText: `paper ${code}` });
  await expect(card('H11226').locator('.mock-test-free-tag')).toHaveText('Free for all signed-in users');
  await expect(page.locator('.paper-free-summary')).toContainText('H11226 is free for all signed-in users');
  await expect(card('H11226').getByRole('button', { name: 'Make this the free paper' })).toHaveCount(0);
  await expect(card('H11009').getByRole('button', { name: 'Make this the free paper' })).toHaveCount(0, { timeout: 1000 });
  page.once('dialog', dialog => dialog.accept());
  await card('H10901').getByRole('button', { name: 'Make this the free paper' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'is now the free mock test' })).toBeVisible();
  expect(state.calls).toEqual(['h10901']);
  await expect(card('H10901').locator('.mock-test-free-tag')).toBeVisible();
  await expect(card('H11226').locator('.mock-test-free-tag')).toHaveCount(0);
});

test('hidden papers are grey and live papers red', async ({ page }) => {
  await prepare(page);
  await page.goto('/admin/tests');
  const hidden = page.locator('.hsk-featured-test').filter({ hasText: 'paper H11009' });
  const live = page.locator('.hsk-featured-test').filter({ hasText: 'paper H11226' });
  await expect(hidden).toHaveClass(/is-hidden/);
  await expect(hidden).toContainText('Hidden, staff preview only');
  await expect(live).not.toHaveClass(/is-hidden/);
  const colours = await Promise.all([hidden, live].map(card => card.evaluate(element => getComputedStyle(element).backgroundColor)));
  expect(colours[0]).toBe('rgb(138, 133, 128)');
  expect(colours[1]).not.toBe(colours[0]);
});

test('ordinary admins see the free tag but can’t change it', async ({ page }) => {
  await prepare(page, 'admin');
  await page.goto('/admin/tests');
  await expect(page.locator('.mock-test-free-tag').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Make this the free paper' })).toHaveCount(0);
});
