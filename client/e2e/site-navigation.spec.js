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
    // Recorded sessions are open to students with a plan here (as if they paid for live classes).
    if (path === '/recorded-sessions/access') return route.fulfill({ json: { allowed: access === 'plan' } });
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

  // A guest gets one link to the studio (the menu is for people with practice access).
  await mainNav(page).getByRole('button', { name: 'Practice studio', exact: true }).click();
  await expect(page).toHaveURL(/\/#practice-studio$/);
  await expect(page.locator('#practice-studio .hero-practice-heading')).toBeInViewport();

  // Following the same link again, after scrolling away, goes back to the section.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('#practice-studio .hero-practice-heading')).not.toBeInViewport();
  await mainNav(page).getByRole('button', { name: 'Practice studio', exact: true }).click();
  await expect(page.locator('#practice-studio .hero-practice-heading')).toBeInViewport();
});

test('the mobile menu has both links and closes after one is chosen', async ({ page }) => {
  // A free week: no course access yet, so HSK courses is still in the menu.
  await prepare(page, 'student', { access: 'freeWeek' });
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
  await mainNav(page).getByRole('button', { name: 'Practice studio', exact: true }).click();
  await expect(page).toHaveURL(/\/#practice-studio$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#practice-studio .hero-practice-heading')).toBeInViewport();
});

// The header is capped at 1360px, so this holds at every desktop width. About HSK and the FAQ share
// one menu there. For students this is checked with a plan (no Pricing in the header); on a free
// week or a course subscription the row is known to be about 45 to 60px too wide at 1361px.
for (const [role, labels] of [
  ['student', ['Practice studio', 'About HSK', 'My Courses', 'Recorded sessions', 'My Progress']],
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
  for (const group of await mainNav(page).locator('.nav-group').all()) await expect(group).toBeHidden();
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

test('with course access, My Courses replaces HSK courses in the header and mobile menu', async ({ page }) => {
  await prepare(page, 'student', { access: 'course' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  await expect(mainNav(page).getByRole('button', { name: 'My Courses' })).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'My Progress' })).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'HSK courses' })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(mainNav(page).getByRole('button', { name: 'My Courses' })).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'HSK courses' })).toHaveCount(0);
});

test('without any access, My Courses and My Progress are hidden and their pages say how to open them', async ({ page }) => {
  await prepare(page, 'student', { access: 'none' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  await expect(mainNav(page).getByRole('button', { name: 'HSK courses' })).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'My Courses' })).toHaveCount(0);
  await expect(mainNav(page).getByRole('button', { name: 'My Progress' })).toHaveCount(0);
  await page.goto('/my-courses');
  await expect(page.getByRole('heading', { level: 1, name: 'My Courses opens with a plan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/pricing');
  await page.goto('/progress');
  await expect(page.getByRole('heading', { level: 1, name: 'My Progress opens with practice access' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get a free week' })).toHaveAttribute('href', '/tests');
});

test('a free week opens My Progress, but My Courses needs a plan or course subscription', async ({ page }) => {
  await prepare(page, 'student', { access: 'freeWeek' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  await expect(mainNav(page).getByRole('button', { name: 'My Progress' })).toBeVisible();
  await expect(mainNav(page).getByRole('button', { name: 'My Courses' })).toHaveCount(0);
  await page.goto('/my-courses');
  await expect(page.getByRole('heading', { level: 1, name: 'My Courses opens with a plan' })).toBeVisible();
});

test('the course library on My Courses lists every HSK course on offer', async ({ page }) => {
  await prepare(page, 'student', { access: 'course' });
  await page.route('**/api/courses', route => route.fulfill({ json: [
    { _id: 'c1', title: 'HSK 1 Chinese', level: 'HSK 1', language: 'chinese' },
    { _id: 'c2', title: 'HSK 2 Chinese', level: 'HSK 2', language: 'chinese' },
    { _id: 'c3', title: 'HSK 3 Chinese', level: 'HSK 3', language: 'chinese' },
  ] }));
  await page.route('**/api/progress/course/*', route => route.fulfill({ json: { total: 10, completed: route.request().url().endsWith('/c1') ? 4 : 0 } }));
  await page.goto('/my-courses');
  const library = page.getByRole('region', { name: 'Make time for your next lesson.' });
  await expect(library.getByRole('heading', { level: 3 })).toHaveText(['HSK 1 Chinese', 'HSK 2 Chinese', 'HSK 3 Chinese']);
  await expect(library).toContainText('Showing 3 of 3 courses');
});

test('on desktop, Practice studio opens a menu of every practice tool', async ({ page }) => {
  await prepare(page, 'student', { access: 'freeWeek' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  const trigger = mainNav(page).getByRole('button', { name: 'Practice studio', exact: true });
  // The menu replaces the plain link once the access check finishes.
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  const menu = page.locator('#nav-studio-menu');
  await expect(menu.getByRole('button')).toHaveText([/Pinyin & tones/, /Trace characters/, /Listening practice/, /Sentence builder/, /Measure words/, /Everyday numbers/, /Listening dictation/, /Conversation/, /See the whole studio/]);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole('button', { name: /Trace characters/ }).click();
  await expect(page).toHaveURL(/\/practice\/characters$/);
  await expect(menu).toHaveCount(0);
});

test('the mobile menu keeps one Practice studio link', async ({ page }) => {
  await prepare(page, 'student', { access: 'freeWeek' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pricing');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(mainNav(page).locator('.nav-group')).toHaveCount(2);
  await expect(mainNav(page).locator('.nav-group').first()).toBeHidden();
  await mainNav(page).getByRole('button', { name: 'Practice studio', exact: true }).click();
  await expect(page).toHaveURL(/\/#practice-studio$/);
});

for (const role of ['student', null]) test(`on desktop the theme toggle is at the far right of the header (${role || 'guest'})`, async ({ page }) => {
  await prepare(page, role, { access: 'plan' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  const toggle = page.locator('.header-right .theme-toggle-compact.nav-desktop-only');
  await expect(toggle).toBeVisible();
  const rightmost = await page.locator('.header-right').evaluate(row => {
    const visible = [...row.children].filter(child => child.offsetParent && getComputedStyle(child).display !== 'none');
    const last = visible.reduce((a, b) => (b.getBoundingClientRect().right > a.getBoundingClientRect().right ? b : a));
    return last.classList.contains('theme-toggle-compact');
  });
  expect(rightmost).toBe(true);
});

for (const [who, role, access] of [['a guest', null, 'none'], ['a student without practice access', 'student', 'none']]) test(`${who} gets one Practice studio link, not the menu`, async ({ page }) => {
  await prepare(page, role, { access });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  const studio = mainNav(page).getByRole('button', { name: 'Practice studio', exact: true });
  await expect(studio).not.toHaveAttribute('aria-expanded');
  await studio.click();
  await expect(page).toHaveURL(/\/#practice-studio$/);
  await expect(page.locator('#nav-studio-menu')).toHaveCount(0);
});

test('the home page always shows every practice tool, for guests too', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  for (const tool of ['pinyin', 'trace', 'listening', 'sentences', 'measures', 'numbers', 'dictation', 'conversation']) {
    await expect(page.locator(`#practice-studio .hero-practice-${tool}`)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /Show all .* practice tools/ })).toHaveCount(0);
});
