import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => route.fulfill({ json: [] }));
});

test('the footer links to About HSK', async ({ page }) => {
  await page.goto('/pricing');
  await page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: 'About HSK' }).click();
  await expect(page).toHaveURL(/\/about-hsk$/);
  await expect(page.getByRole('heading', { level: 1, name: 'What is the HSK?' })).toBeVisible();
});

test('visitors open About HSK from the main navigation and compare exam levels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'About HSK' }).click();
  await expect(page).toHaveURL(/\/about-hsk$/);
  await expect(page.getByRole('heading', { level: 1, name: 'What is the HSK?' })).toBeVisible();
  const levels = page.getByRole('radiogroup', { name: 'Pick a level' });
  await expect(levels.getByRole('radio')).toHaveCount(7);
  await expect(levels.getByRole('radio', { name: 'HSK 1' })).toBeChecked();
  await expect(page.locator('.hsk-detail h3')).toHaveText('HSK 1');
  await levels.getByRole('radio', { name: 'HSK 4' }).click();
  await expect(page.locator('.hsk-detail h3')).toHaveText('HSK 4');
  await expect(page.locator('.hsk-numbers')).toContainText('1,200');
  await expect(page.locator('.hsk-numbers')).toContainText('180 / 300');
  await expect(page.getByRole('list', { name: 'Sections in this exam' }).getByRole('listitem')).toHaveCount(3);
  await expect(page.locator('.hsk-detail')).toContainText('Most bachelor’s degrees taught in Chinese');
  await expect(page.getByRole('heading', { name: 'What’s in the exam' })).toBeVisible();
  await expect(page.getByRole('img', { name: /pass with 60 percent/ })).toBeVisible();
  await expect(page.getByRole('list').filter({ hasText: 'Register online' }).getByRole('listitem')).toHaveCount(4);
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Learning Chinese with Xiao Ao' }).click();
  await expect(page).toHaveURL(/#hsk-faq-title$/);
  await expect(page.getByRole('heading', { name: 'Learning Chinese with Xiao Ao' })).toBeFocused();
  const faq = page.locator('.hsk-faq');
  await expect(faq.locator('details')).toHaveCount(10);
  await expect(faq.locator('details').first()).toHaveAttribute('open', '');
  const free = faq.locator('details', { hasText: 'What can I try for free?' });
  await free.locator('summary').click();
  await expect(free).toContainText('7 days of the practice studio and mock tests free');
  await expect(faq.locator('details', { hasText: 'How much does a course plan cost?' })).toContainText('Rs 3,000 for 6 months');
  await levels.getByRole('radio', { name: 'HSK 4' }).click();
  await page.keyboard.press('ArrowRight');
  await expect(levels.getByRole('radio', { name: 'HSK 5' })).toBeChecked();
  await expect(levels.getByRole('radio', { name: 'HSK 5' })).toBeFocused();
  await page.mouse.move(0, 0); await page.waitForTimeout(500); await page.screenshot({ path: 'test-results/about-hsk-desktop.png', fullPage: true });
});

test('About HSK fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about-hsk');
  await page.getByRole('radio', { name: 'HSK 7–9' }).click();
  await expect(page.locator('.hsk-numbers')).toContainText('11,092');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/about-hsk-mobile.png', fullPage: true });
});

test('the roadmap switches milestones with the keyboard and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about-hsk');
  const roadmap = page.getByRole('region', { name: 'Chinese learning roadmap' });
  await expect(roadmap.getByRole('button', { name: 'Sounds' })).toHaveAttribute('aria-pressed', 'true');
  const conversation = roadmap.getByRole('button', { name: 'Conversation' });
  await conversation.focus();
  await page.keyboard.press('Enter');
  await expect(conversation).toHaveAttribute('aria-pressed', 'true');
  await expect(conversation).toBeFocused();
  await expect(roadmap.getByText('因为下雨，我没去。', { exact: true })).toBeVisible();
  await expect(roadmap.getByRole('link', { name: 'Practise building sentences' })).toHaveAttribute('href', '/practice/sentences');
  await expect(roadmap.locator('.roadmap-milestone')).toHaveCSS('animation-name', 'none');
  await expect(roadmap.locator('.roadmap-route')).toHaveCSS('--roadmap-progress', '0.5');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
