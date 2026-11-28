import { test, expect } from '@playwright/test';

// Admin > About pages: a super admin edits the About pages' text with a live preview, and decides
// whether visitors can see About Xiao Ao.
async function prepare(page, { role = 'superadmin', xiaoAo = { visible: false, content: {} } } = {}) {
  const puts = [];
  const pages = { 'xiao-ao': { slug: 'xiao-ao', hideable: true, ...xiaoAo }, hsk: { slug: 'hsk', visible: true, hideable: false, content: {} } };
  await page.addInitScript(role => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'boss', name: 'Boss', role }));
  }, role);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 'boss', name: 'Boss', role } });
    if (path === '/api/about-pages') return route.fulfill({ json: Object.values(pages).map(({ slug, visible }) => ({ slug, visible })) });
    const match = path.match(/^\/api\/about-pages\/(xiao-ao|hsk)$/);
    if (match) {
      const slug = match[1];
      if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        puts.push({ slug, body });
        Object.assign(pages[slug], body);
      }
      return route.fulfill({ json: pages[slug] });
    }
    if (path === '/api/teachers') return route.fulfill({ json: [{ _id: 't1', name: 'Zhang Mei', title: 'Chinese Teacher', bio: 'Tones.' }] });
    return route.fulfill({ json: [] });
  });
  return puts;
}

test('the sidebar opens About pages, where About Xiao Ao starts hidden and can be shown', async ({ page }) => {
  const puts = await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/teachers');
  await page.locator('#super-admin-navigation').getByRole('button', { name: 'About pages' }).click();
  await expect(page).toHaveURL(/\/admin\/about-pages$/);
  await expect(page.getByRole('heading', { level: 1, name: 'About pages' })).toBeVisible();
  const show = page.getByRole('switch', { name: 'Show About Xiao Ao to visitors' });
  await expect(show).not.toBeChecked();
  await expect(page.getByText('Hidden. Visitors get “Page not found”')).toBeVisible();

  await show.click();
  await expect(show).toBeChecked();
  expect(puts).toEqual([{ slug: 'xiao-ao', body: { visible: true } }]);
  await expect(page.getByRole('status').filter({ hasText: 'is now visible to everyone' })).toBeVisible();
  // The footer link appears once the page is visible.
  await expect(page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: 'About Xiao Ao' })).toBeVisible();
});

test('edits show in the preview straight away, and only changed fields are saved', async ({ page }) => {
  const puts = await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/about-pages');
  const form = page.getByRole('form', { name: 'About Xiao Ao text' });
  const preview = page.locator('.about-admin-preview-frame');
  await expect(preview.getByRole('heading', { level: 1, name: 'About Xiao Ao' })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  await form.getByLabel('Page title').fill('Who we are');
  await expect(preview.getByRole('heading', { level: 1, name: 'Who we are' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /About Xiao Ao \(unsaved\)/ })).toBeVisible();
  await form.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'About Xiao Ao saved' })).toBeVisible();
  expect(puts).toEqual([{ slug: 'xiao-ao', body: { content: { title: 'Who we are' } } }]);
  await expect(form.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  // "Use default" puts a field back; saving then clears the override.
  await form.getByRole('button', { name: 'Use default' }).click();
  await expect(form.getByLabel('Page title')).toHaveValue('About Xiao Ao');
  await form.getByRole('button', { name: 'Save changes' }).click();
  await expect.poll(() => puts.length).toBe(2);
  expect(puts[1]).toEqual({ slug: 'xiao-ao', body: { content: {} } });
});

test('About HSK is always visible, and its text is edited the same way', async ({ page }) => {
  const puts = await prepare(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/about-pages');
  await page.getByRole('tab', { name: 'About HSK' }).click();
  await expect(page.getByRole('switch')).toHaveCount(0);
  await expect(page.getByText('About HSK is always visible to everyone.')).toBeVisible();
  const form = page.getByRole('form', { name: 'About HSK text' });
  await form.getByLabel('Closing title').fill('Book your HSK');
  await expect(page.locator('.about-admin-preview-frame').getByRole('heading', { name: 'Book your HSK' })).toBeVisible();
  await form.getByRole('button', { name: 'Discard changes' }).click();
  await expect(form.getByLabel('Closing title')).toHaveValue('Try a timed mock test');
  expect(puts).toEqual([]);
});

test('ordinary admins can’t open About pages', async ({ page }) => {
  await prepare(page, { role: 'admin' });
  await page.goto('/admin/about-pages');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'About pages' })).toHaveCount(0);
});
