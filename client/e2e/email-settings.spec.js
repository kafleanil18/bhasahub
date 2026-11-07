import { test, expect } from '@playwright/test';

async function prepare(page, role = 'superadmin') {
  await page.addInitScript(role => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'owner', name: 'Owner', role }));
  }, role);
  let saved = { enabled: false, email: '', senderName: 'Xiao Ao', port: 465, hasAppPassword: false };
  const requests = [];
  let fail = false;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path.startsWith('/settings/email')) {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill({ json: saved });
      const body = route.request().postDataJSON(); requests.push({ method, body });
      if (fail) return route.fulfill({ status: 502, json: { error: 'Google SMTP could not be verified. Check your app password.' } });
      if (method === 'PUT') {
        saved = { enabled: body.enabled, email: body.email, senderName: body.senderName, port: body.port, hasAppPassword: saved.hasAppPassword || Boolean(body.appPassword) };
        return route.fulfill({ json: saved });
      }
      return route.fulfill({ json: { message: 'Google SMTP connection succeeded. No email was sent. Save your settings to apply changes.' } });
    }
    return route.fulfill({ json: path === '/health' ? { status: 'ok' } : [] });
  });
  await page.route('https://**/*', route => route.abort());
  return { requests, setFailure: value => { fail = value; } };
}

test('superadmin tests, enables, and disables Google SMTP without reloading secrets', async ({ page }) => {
  const { requests } = await prepare(page);
  await page.goto('/admin/settings/email');
  await expect(page.getByRole('heading', { name: 'Email settings', exact: true })).toBeVisible();
  await page.getByLabel('Google email address', { exact: true }).fill('owner@gmail.com');
  await page.getByLabel('Google app password', { exact: true }).fill('abcd efgh ijkl mnop');
  await page.getByRole('switch', { name: /Enable Google SMTP/ }).check();
  await page.getByRole('button', { name: 'Test connection', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'No email was sent' })).toBeVisible();
  await expect(page.getByText('Google SMTP disabled', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByText('Google SMTP enabled', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Google app password', { exact: true })).toHaveValue('');
  expect(requests.at(-1).body.appPassword).toBe('abcd efgh ijkl mnop');
  await page.reload();
  await expect(page.getByRole('switch', { name: /Enable Google SMTP/ })).toBeChecked();
  await expect(page.getByLabel('Google app password', { exact: true })).toHaveValue('');
  await page.getByRole('switch', { name: /Enable Google SMTP/ }).uncheck();
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByText('Google SMTP disabled', { exact: true })).toBeVisible();
  expect(requests.at(-1).body.appPassword).toBe('');
});

test('failed saves preserve the draft and allow a retry', async ({ page }) => {
  const { setFailure } = await prepare(page);
  await page.goto('/admin/settings/email');
  await page.getByLabel('Google email address', { exact: true }).fill('owner@gmail.com');
  await page.getByLabel('Google app password', { exact: true }).fill('abcdefghijklmnop');
  await page.getByRole('switch', { name: /Enable Google SMTP/ }).check();
  setFailure(true);
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not be verified');
  await expect(page.getByLabel('Google email address', { exact: true })).toHaveValue('owner@gmail.com');
  await expect(page.getByLabel('Google app password', { exact: true })).toHaveValue('abcdefghijklmnop');
  await expect(page.getByText('Google SMTP disabled', { exact: true })).toBeVisible();
  setFailure(false);
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByText('Google SMTP enabled', { exact: true })).toBeVisible();
});

test('ordinary admins and students cannot open email settings', async ({ page }) => {
  await prepare(page, 'admin');
  await page.goto('/admin/settings/email');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Email settings', exact: true })).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem('user', JSON.stringify({ id: 'student', role: 'student' })));
  await page.goto('/admin/settings/email');
  await expect(page).toHaveURL(/\/$/);
});

test('email settings fit phones and desktops and support keyboard input', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 800 });
  await prepare(page);
  await page.goto('/admin/settings/email');
  await expect(page.getByLabel('Google email address', { exact: true })).toBeVisible();
  await page.getByLabel('Google email address', { exact: true }).focus();
  await page.keyboard.type('owner@gmail.com');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Sender name', { exact: true })).toBeFocused();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Save settings', exact: true })).toBeVisible();
    if ([320, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`email-settings-${width}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});
