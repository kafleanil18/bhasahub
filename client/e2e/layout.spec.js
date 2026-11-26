import { test, expect } from '@playwright/test';

async function signedIn(page, { delay = 0 } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture');
    localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', async route => {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/access-requests/my') return route.fulfill({ json: [{ scope: 'tests', status: 'approved' }] });
    if (path === '/api/sentences') return route.fulfill({ json: { topics: [{ id: 'greetings', title: 'Greetings' }], sentences: [{ id: 's1', number: 1, chinese: '你好', pinyin: 'nǐ hǎo', english: 'Hello', topic: 'greetings', audioUrl: 'https://example.com/a.mp3' }] } });
    return route.fulfill({ json: [] });
  });
}

const footerBottom = page => page.locator('.app-footer').evaluate(element => Math.round(element.getBoundingClientRect().bottom));

test('on a short page the footer sits at the bottom of the screen', async ({ page }) => {
  await signedIn(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/courses/missing-course');
  await expect(page.getByRole('heading', { name: 'Course not found' })).toBeVisible();
  expect(await footerBottom(page)).toBe(900);
});

test('while a page loads, the loader fills the screen and the footer waits for the page', async ({ page }) => {
  await signedIn(page, { delay: 2000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/practice/conversations');
  const loader = page.locator('.ink-loader').first();
  await expect(loader).toBeVisible();
  await expect(page.locator('.app-footer')).toBeHidden();
  const box = await loader.boundingBox();
  expect(Math.round(box.y + box.height)).toBe(844);
  await expect(page.locator('.ink-loader')).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator('.app-footer')).toBeVisible();
});

test('refresh controls are buttons with the reload icon, not text links', async ({ page }) => {
  await signedIn(page);
  await page.goto('/practice/dictation');
  const refresh = page.getByRole('button', { name: 'Refresh available recordings' });
  await expect(refresh).toHaveClass(/refresh-button/);
  await expect(refresh.locator('svg.ui-icon')).toHaveCount(1);
});
