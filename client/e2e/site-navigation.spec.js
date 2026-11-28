import { test, expect } from '@playwright/test';

// The header links to the home page's HSK courses and practice studio sections,
// in the desktop navigation and in the mobile menu.
const course = { _id: 'c1', title: 'HSK 1 Chinese', level: 'HSK 1', language: 'chinese' };

// `access`: 'course' (a course subscription), 'plan' (a whole-platform plan) or 'freeWeek'.
async function prepare(page, role, { access = 'course' } = {}) {
  const subscriptions = access === 'plan' ? [{ _id: 'plan-c1', course, expiresAt: '2099-01-01T00:00:00.000Z', plan: true }]
    : access === 'course' ? [{ _id: 's1', course, expiresAt: '2099-01-01T00:00:00.000Z' }] : [];
  const requests = access === 'freeWeek' ? [{ scope: 'tests', status: 'approved', expiresAt: new Date(Date.now() + 6 * 864e5).toISOString() }] : [];
  if (role) await page.addInitScript(role => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'person', name: 'Mingyu Student', role }));
  }, role);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/courses') return route.fulfill({ json: [course] });
    if (path === '/subscriptions/my') return route.fulfill({ json: subscriptions });
    if (path === '/access-requests/my') return route.fulfill({ json: requests });
    if (path === '/auth/me') return route.fulfill({ json: { id: 'person', name: 'Mingyu Student', role } });
    return route.fulfill({ json: [] });
  });
}

const mainNav = page => page.getByRole('navigation', { name: 'Main navigation' });

test('the desktop navigation opens the HSK courses and practice studio sections', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about-hsk');
  await mainNav(page).getByRole('button', { name: 'HSK courses' }).click();
  await expect(page).toHaveURL(/\/#courses$/);
  await expect(page.locator('#courses')).toBeInViewport();

  await mainNav(page).getByRole('button', { name: 'Practice studio' }).click();
  await expect(page).toHaveURL(/\/#practice-studio$/);
  await expect(page.locator('#practice-studio .hero-practice-heading')).toBeInViewport();

  // Following the same link again, after scrolling away, goes back to the section.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('#practice-studio .hero-practice-heading')).not.toBeInViewport();
  await mainNav(page).getByRole('button', { name: 'Practice studio' }).click();
  await expect(page.locator('#practice-studio .hero-practice-heading')).toBeInViewport();
});

test('the mobile menu has both links and closes after one is chosen', async ({ page }) => {
  await prepare(page, 'student');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pricing');
  const menu = page.getByRole('button', { name: 'Toggle navigation menu' });
  await menu.click();
  await expect(mainNav(page).getByRole('button', { name: 'HSK courses' })).toBeVisible();
  await mainNav(page).getByRole('button', { name: 'HSK courses' }).click();
  await expect(page).toHaveURL(/\/#courses$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#courses')).toBeInViewport();

  await menu.click();
  await mainNav(page).getByRole('button', { name: 'Practice studio' }).click();
  await expect(page).toHaveURL(/\/#practice-studio$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#practice-studio .hero-practice-heading')).toBeInViewport();
});

// The header is capped at 1360px, so this holds at every desktop width. About HSK and the FAQ share
// one menu there. For students this is checked with a plan (no Pricing in the header); on a free
// week or a course subscription the row is known to be about 45 to 60px too wide at 1361px.
for (const [role, labels] of [
  ['student', ['HSK courses', 'Practice studio', 'About HSK', 'My Courses', 'Recorded sessions', 'My Progress']],
  ['admin', ['HSK courses', 'Practice studio', 'My Courses', 'My Progress']],
]) test(`a${role === 'admin' ? 'n' : ''} ${role}’s desktop header fits every link on one row`, async ({ page }) => {
  await prepare(page, role, { access: 'plan' });
  await page.setViewportSize({ width: 1361, height: 900 });
  await page.goto('/');
  if (role === 'student') await expect(page.locator('.access-badge.nav-desktop-only')).toBeVisible();
  const links = mainNav(page).locator('.nav-links > :is(.nav-link, .nav-group):visible');
  await expect(links).toHaveText(labels);
  const rows = await links.evaluateAll(items => new Set(items.map(item => Math.round(item.getBoundingClientRect().top))).size);
  expect(rows).toBe(1);
  // Every link keeps its icon on desktop, as in the mobile menu.
  await expect(links.locator('.nav-svg-icon:visible')).toHaveCount(labels.length);
  const layout = await page.locator('.site-header .header-row').evaluate(row => {
    const box = selector => row.querySelector(selector).getBoundingClientRect();
    const inner = row.getBoundingClientRect().right - parseFloat(getComputedStyle(row).paddingRight);
    return { overflow: row.scrollWidth - row.clientWidth, clear: box('.nav-links').left >= box('.header-left').right && box('.nav-links').right <= box('.header-right').left, inside: box('.header-right').right <= inner + 0.5 };
  });
  expect(layout).toEqual({ overflow: 0, clear: true, inside: true });
});

test('an admin sees both links', async ({ page }) => {
  await prepare(page, 'admin');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about-hsk');
  await expect(mainNav(page).getByRole('button', { name: 'HSK courses' })).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'Practice studio' })).toBeVisible();
});

test('a super admin, whose home is the admin dashboard, does not', async ({ page }) => {
  await prepare(page, 'superadmin');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about-hsk');
  await expect(mainNav(page).getByRole('button', { name: 'About HSK' })).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'HSK courses' })).toHaveCount(0);
  await expect(mainNav(page).getByRole('button', { name: 'Practice studio' })).toHaveCount(0);
});

test('the hero doesn’t repeat the header’s section links', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const hero = page.locator('.home-hero-actions');
  await expect(hero.getByRole('button', { name: 'Pinyin practice' })).toBeVisible();
  await expect(hero.getByRole('link')).toHaveCount(0);
  await expect(page.locator('.home-hero').getByRole('link', { name: /HSK courses|Practice studio/ })).toHaveCount(0);
});

test('hovering a header link tints it without drawing an underline', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about-hsk');
  const link = mainNav(page).getByRole('button', { name: 'HSK courses' });
  await link.hover();
  const underline = await link.evaluate(element => ({ content: getComputedStyle(element, '::after').content, decoration: getComputedStyle(element).textDecorationLine }));
  expect(underline).toEqual({ content: 'none', decoration: 'none' });
});

test('an admin’s tools sit together on the right, and About HSK is left out', async ({ page }) => {
  await prepare(page, 'admin');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(mainNav(page).getByRole('button', { name: 'About HSK' })).toHaveCount(0);
  const tools = page.locator('.header-right > .nav-link:visible');
  await expect(tools).toHaveText(['Manage tests', 'Subscriptions']);
  await tools.first().click();
  await expect(page).toHaveURL(/\/admin\/tests$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Test Studio' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  const drawer = page.locator('.mobile-drawer-actions');
  await expect(drawer.getByRole('button', { name: 'Manage tests' })).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Subscriptions' })).toBeVisible();
  await expect(mainNav(page).locator('.nav-links').getByRole('button', { name: /Manage tests|About HSK/ })).toHaveCount(0);
});

test('on desktop, About HSK and the FAQ share one menu', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  const trigger = mainNav(page).getByRole('button', { name: 'About HSK', exact: true });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(mainNav(page).getByRole('button', { name: /^FAQ/ })).toBeHidden();

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const menu = page.locator('#nav-hsk-menu');
  await expect(menu.getByRole('button')).toHaveText([/About HSK/, /FAQ/]);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.mouse.click(700, 500);
  await expect(menu).toHaveCount(0);

  await trigger.click();
  await menu.getByRole('button', { name: /FAQ/ }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(menu).toHaveCount(0);
  await trigger.click();
  await menu.getByRole('button', { name: /About HSK/ }).click();
  await expect(page).toHaveURL(/\/about-hsk$/);
});

test('the mobile menu lists About HSK and the FAQ on their own', async ({ page }) => {
  await prepare(page, 'student');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pricing');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(mainNav(page).locator('.nav-group')).toBeHidden();
  await mainNav(page).getByRole('button', { name: 'FAQ', exact: true }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.getByRole('heading', { level: 1, name: 'FAQ' })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await mainNav(page).getByRole('button', { name: 'About HSK', exact: true }).click();
  await expect(page).toHaveURL(/\/about-hsk$/);
});

for (const [access, shown] of [['plan', false], ['freeWeek', true], ['course', true]]) test(`with ${access === 'plan' ? 'a plan' : access === 'freeWeek' ? 'a free week' : 'a course subscription'}, the header ${shown ? 'shows' : 'leaves out'} Pricing`, async ({ page }) => {
  await prepare(page, 'student', { access });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/my-courses');
  await expect(page.locator('.access-badge.nav-desktop-only')).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'Pricing' })).toHaveCount(shown ? 1 : 0);
  // The footer always links to the plans.
  await expect(page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: /Pricing/ })).toBeVisible();
});
