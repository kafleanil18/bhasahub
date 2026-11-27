import { test, expect } from '@playwright/test';

// About Xiao Ao describes the platform and introduces the team managed in Admin > Teachers.
const teachers = [
  { _id: 't1', name: 'Zhang Mei', title: 'Chinese Teacher', bio: 'Zhang Mei focuses on pronunciation and tones.', photo: '' },
  { _id: 't2', name: 'Li Wei', title: 'HSK Coach', bio: 'Li Wei prepares students for the HSK.', photo: 'https://example.com/li.jpg' },
  { _id: 't3', name: '  ', title: 'Chinese Teacher', bio: '', photo: '' },
];

// The About pages API: About Xiao Ao is hidden unless `visible`; a hidden page is "not found"
// except for a super admin.
function aboutPages(route, path, { visible, content = {}, role } = {}) {
  if (path === '/api/about-pages') return route.fulfill({ json: [{ slug: 'xiao-ao', visible }, { slug: 'hsk', visible: true }] });
  if (path === '/api/about-pages/xiao-ao') return visible || role === 'superadmin' ? route.fulfill({ json: { slug: 'xiao-ao', visible, hideable: true, content } }) : route.fulfill({ status: 404, json: { error: 'Page not found' } });
  if (path === '/api/about-pages/hsk') return route.fulfill({ json: { slug: 'hsk', visible: true, hideable: false, content: {} } });
  return null;
}

async function prepare(page, { fail = false, visible = true, content, role } = {}) {
  if (role) await page.addInitScript(role => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'person', name: 'Mingyu', role }));
  }, role);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me' && role) return route.fulfill({ json: { id: 'person', name: 'Mingyu', role } });
    if (path === '/api/teachers') return fail ? route.fulfill({ status: 500, json: { error: 'down' } }) : route.fulfill({ json: teachers });
    return aboutPages(route, path, { visible, content, role }) || route.fulfill({ json: [] });
  });
}

test('the footer opens About Xiao Ao, which introduces the platform and the team', async ({ page }) => {
  await prepare(page);
  await page.goto('/pricing');
  await page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: 'About Xiao Ao' }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { level: 1, name: 'About Xiao Ao' })).toBeVisible();
  for (const name of ['How we teach', 'What you’ll find here', 'Meet the team', 'Start learning with us']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  const team = page.getByRole('region', { name: 'Meet the team' }).getByRole('listitem');
  await expect(team).toHaveCount(2);
  await expect(team.first()).toContainText('Zhang Mei');
  await expect(team.first()).toContainText('Zhang Mei focuses on pronunciation and tones.');
  await expect(team.first().locator('.is-initial')).toHaveText('Z');
  await expect(team.nth(1).locator('img')).toHaveAttribute('src', 'https://example.com/li.jpg');
});

test('if the team can’t load, the rest of the page still shows', async ({ page }) => {
  await prepare(page, { fail: true });
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1, name: 'About Xiao Ao' })).toBeVisible();
  await expect(page.getByText('We couldn’t load the team just now.')).toBeVisible();
});

test('the mobile menu links to About Xiao Ao, and the page fits a phone', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'About Xiao Ao' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'About Xiao Ao' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('the learning roadmap lives here, and switches stages with the keyboard', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about');
  const roadmap = page.getByRole('region', { name: 'Chinese learning roadmap' });
  await expect(roadmap.getByRole('button', { name: 'Sounds' })).toHaveAttribute('aria-pressed', 'true');
  await expect(roadmap.getByRole('link', { name: 'HSK 1 course' })).toHaveAttribute('href', '/?level=HSK%201#courses');
  await expect(roadmap.getByRole('link', { name: 'Pinyin & tones' })).toHaveAttribute('href', '/practice/pinyin');
  const conversation = roadmap.getByRole('button', { name: 'Conversation' });
  await conversation.focus();
  await page.keyboard.press('Enter');
  await expect(conversation).toHaveAttribute('aria-pressed', 'true');
  await expect(conversation).toBeFocused();
  await expect(roadmap.getByText('因为下雨，我没去。', { exact: true })).toBeVisible();
  await expect(roadmap.getByRole('link', { name: 'HSK 3 course' })).toHaveAttribute('href', '/?level=HSK%203#courses');
  await expect(roadmap.getByRole('link', { name: 'Sentence builder' })).toHaveAttribute('href', '/practice/sentences');
  await expect(roadmap.locator('.roadmap-milestone')).toHaveCSS('animation-name', 'none');
  await expect(roadmap.locator('.roadmap-route')).toHaveCSS('--roadmap-progress', '0.5');
  await roadmap.getByRole('button', { name: 'Longer texts' }).click();
  await expect(roadmap.getByRole('link', { name: 'What HSK 5 and 6 expect' })).toHaveAttribute('href', '/about-hsk#hsk-levels-title');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('About HSK no longer shows the roadmap', async ({ page }) => {
  await prepare(page);
  await page.goto('/about-hsk');
  await expect(page.getByRole('heading', { level: 1, name: 'What is the HSK?' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Chinese learning roadmap' })).toHaveCount(0);
});

test('a roadmap course link opens the course list on that level', async ({ page }) => {
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/courses') return route.fulfill({ json: [
      { _id: 'c1', title: 'HSK 1 (Beginner level)', level: 'HSK 1 · Beginner', language: 'chinese' },
      { _id: 'c2', title: 'HSK 2', level: 'HSK 2', language: 'chinese' },
      { _id: 'c3', title: 'HSK 3', level: 'HSK 3', language: 'chinese' },
    ] });
    if (path === '/api/teachers') return route.fulfill({ json: teachers });
    return aboutPages(route, path, { visible: true }) || route.fulfill({ json: [] });
  });
  await page.goto('/about');
  const roadmap = page.getByRole('region', { name: 'Chinese learning roadmap' });
  await roadmap.getByRole('button', { name: 'First words' }).click();
  await roadmap.getByRole('link', { name: 'HSK 2 course' }).click();
  await expect(page).toHaveURL(/\/\?level=HSK%202#courses$/);
  await expect(page.getByRole('button', { name: 'HSK 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#courses .course-card')).toHaveCount(1);
  await expect(page.locator('#courses .course-card-title')).toHaveText('HSK 2');
  await expect(page.locator('#courses')).toBeInViewport();
});

test('until a super admin shows it, the page is “not found” and nothing links to it', async ({ page }) => {
  await prepare(page, { visible: false });
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: 'About Xiao Ao' })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'About Xiao Ao' })).toHaveCount(0);
});

test('a super admin can open the hidden page, with a note that visitors can’t see it', async ({ page }) => {
  await prepare(page, { visible: false, role: 'superadmin' });
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1, name: 'About Xiao Ao' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Only you can see this page' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin > About pages' })).toHaveAttribute('href', '/admin/about-pages');
});

test('saved text replaces the default wording', async ({ page }) => {
  await prepare(page, { content: { title: 'Who we are', motto: 'One word at a time.' } });
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1, name: 'Who we are' })).toBeVisible();
  await expect(page.getByText('One word at a time.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'How we teach' })).toBeVisible();
});
