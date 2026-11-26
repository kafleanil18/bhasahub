import { test, expect } from '@playwright/test';

const student = { id: 'student', name: 'Sita', role: 'student' };

async function prepare(page, lastActivityAt) {
  await page.addInitScript(([user, last]) => {
    if (sessionStorage.getItem('fixtureLoaded')) return;
    sessionStorage.setItem('fixtureLoaded', '1');
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify(user));
    if (last) localStorage.setItem('lastActivityAt', String(last));
  }, [student, lastActivityAt]);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => route.fulfill({ json: [] }));
}

test('a sign-in left unused for over two hours is ended when the site is opened again', async ({ page }) => {
  await prepare(page, Date.now() - (2 * 60 + 5) * 60 * 1000);
  await page.goto('/my-courses');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmy-courses/);
  await expect(page.getByRole('status').filter({ hasText: 'signed out after 2 hours' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('recent activity keeps the student signed in', async ({ page }) => {
  await prepare(page, Date.now() - 90 * 60 * 1000);
  await page.goto('/my-courses');
  await expect(page).toHaveURL(/\/my-courses$/);
  await expect(page.getByRole('button', { name: /Account menu for Sita/ })).toBeVisible();
  await expect(page.locator('.idle-notice')).toHaveCount(0);
});

test('an open page with no activity for two hours signs out and returns there after sign-in', async ({ page }) => {
  await page.clock.install();
  await prepare(page, null);
  await page.goto('/my-courses');
  await expect(page.getByRole('button', { name: /Account menu for Sita/ })).toBeVisible();
  await page.clock.fastForward('01:30:00');
  await expect(page).toHaveURL(/\/my-courses$/);
  await page.clock.fastForward('00:31:00');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmy-courses/);
  await expect(page.locator('.idle-notice')).toContainText('signed out after 2 hours');
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.locator('.idle-notice')).toHaveCount(0);
});

test('activity in the page resets the two-hour clock', async ({ page }) => {
  await page.clock.install();
  await prepare(page, null);
  await page.goto('/my-courses');
  await expect(page.getByRole('button', { name: /Account menu for Sita/ })).toBeVisible();
  await page.clock.fastForward('01:50:00');
  await page.keyboard.press('Shift');
  await page.clock.fastForward('01:00:00');
  await expect(page).toHaveURL(/\/my-courses$/);
  await expect(page.getByRole('button', { name: /Account menu for Sita/ })).toBeVisible();
});
