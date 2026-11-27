import { test, expect } from '@playwright/test';

// The live classes card is for guests and students. It waits a few seconds on browsing pages,
// and stays away for a week after "Later" and for a month after someone messages us.
const DAY = 24 * 60 * 60 * 1000;

async function prepare(page, role) {
  if (role) await page.addInitScript(role => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'person', name: 'Mingyu', role }));
  }, role);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/auth/me') return route.fulfill({ json: { id: 'person', name: 'Mingyu', role } });
    return route.fulfill({ json: [] });
  });
  await page.clock.install();
}

const notice = page => page.getByRole('complementary', { name: 'Live classes available' });
const snoozedDays = page => page.evaluate(() => Math.round((JSON.parse(localStorage.getItem('liveClassNotice')).until - Date.now()) / (24 * 60 * 60 * 1000)));

test('a guest sees it after a few seconds, and "Later" keeps it away for a week', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await page.clock.runFor(5000);
  await expect(notice(page)).toHaveCount(0);
  await page.clock.runFor(3500);
  await expect(notice(page)).toBeVisible();
  await expect(notice(page)).toContainText('Learn Chinese with a teacher, live.');
  await expect(notice(page).getByRole('link', { name: 'Chat with us on WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+\?text=/);
  await expect(notice(page).getByRole('link', { name: 'Chat with us on Viber' })).toBeVisible();

  await notice(page).getByRole('button', { name: 'Later' }).click();
  await expect(notice(page)).toHaveCount(0);
  expect(await snoozedDays(page)).toBe(7);

  await page.reload();
  await page.clock.runFor(10000);
  await expect(notice(page)).toHaveCount(0);
  await page.evaluate(day => localStorage.setItem('liveClassNotice', JSON.stringify({ until: Date.now() - day })), DAY);
  await page.reload();
  await page.clock.runFor(8500);
  await expect(notice(page)).toBeVisible();
});

test('a student sees it on their pages, worded for someone already learning', async ({ page }) => {
  await prepare(page, 'student');
  await page.goto('/my-courses');
  await page.clock.runFor(8500);
  await expect(notice(page)).toContainText('Practise speaking with a teacher alongside your course.');
  await notice(page).getByRole('button', { name: 'Later' }).focus();
  await page.keyboard.press('Escape');
  await expect(notice(page)).toHaveCount(0);
  expect(await snoozedDays(page)).toBe(7);
});

test('messaging us closes it for a month', async ({ page }) => {
  await prepare(page);
  await page.goto('/pricing');
  await page.clock.runFor(8500);
  const viber = notice(page).getByRole('link', { name: 'Chat with us on Viber' });
  await viber.evaluate(link => link.addEventListener('click', event => event.preventDefault()));
  await viber.click();
  await page.clock.runFor(100);
  await expect(notice(page)).toHaveCount(0);
  expect(await snoozedDays(page)).toBe(30);
});

test('it never interrupts practice, and staff never see it', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/practice/pinyin');
  await page.clock.runFor(10000);
  await expect(notice(page)).toHaveCount(0);
  // Moving on to a browsing page starts the wait there.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'About HSK' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'What is the HSK?' })).toBeVisible();
  await page.clock.runFor(8500);
  await expect(notice(page)).toBeVisible();
});

for (const role of ['admin', 'superadmin']) test(`a${role === 'admin' ? 'n' : ''} ${role} doesn’t see it`, async ({ page }) => {
  await prepare(page, role);
  await page.goto(role === 'admin' ? '/' : '/about-hsk');
  await page.clock.runFor(10000);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(notice(page)).toHaveCount(0);
});

test('on a desktop it sits in the bottom right corner', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about-hsk');
  await page.clock.runFor(8500);
  // Measured once the short slide-up entrance has finished.
  await expect.poll(async () => { const box = await notice(page).boundingBox(); return [Math.round(box.x + box.width), Math.round(box.y + box.height)]; }).toEqual([1440 - 16, 900 - 16]);
  // The app update notice shares the corner and goes first; this card waits until it's gone.
  await page.evaluate(() => { const update = document.createElement('aside'); update.className = 'pwa-notice'; document.body.append(update); });
  await expect(notice(page)).toBeHidden();
  await page.evaluate(() => document.querySelector('.pwa-notice').remove());
  await expect(notice(page)).toBeVisible();
});

test('on a phone it spans the bottom of the screen', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about-hsk');
  await page.clock.runFor(8500);
  const box = await notice(page).boundingBox();
  expect(Math.round(box.x)).toBe(12);
  expect(Math.round(box.x + box.width)).toBe(378);
  expect(Math.round(box.y + box.height)).toBeLessThanOrEqual(832);
});
