import { test, expect } from '@playwright/test';

async function prepare(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'owner', name: 'Owner', role: 'superadmin' }));
  });
  let saved = { provider: 'resend', enabled: false, senderEmail: '', senderName: 'Xiao Ao', hasApiKey: false, connectionError: '' };
  const requests = [];
  let fail = false;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/settings/email-api' || path === '/settings/email-api/check') {
      if (route.request().method() === 'GET') return route.fulfill({ json: saved });
      const body = route.request().postDataJSON(); requests.push({ path, body });
      if (path.endsWith('/check')) return route.fulfill({ json: { message: 'API access and sender verification succeeded. No email was sent.' } });
      saved = { provider: body.provider, enabled: fail ? false : body.enabled, senderEmail: body.senderEmail, senderName: body.senderName, hasApiKey: true, connectionError: fail ? 'Verify the sender domain in Resend first.' : '' };
      return route.fulfill({ json: saved });
    }
    if (path === '/settings/email') return route.fulfill({ json: { enabled: false, email: 'owner@gmail.com', senderName: 'Xiao Ao', port: 465, hasAppPassword: true, connectionError: '' } });
    return route.fulfill({ json: path === '/health' ? { status: 'ok' } : [] });
  });
  await page.route('https://**/*', route => route.abort());
  return { requests, setFailure: value => { fail = value; } };
}

test('HTTPS provider is checked without sending mail and saved with no key disclosed after reload', async ({ page }) => {
  const { requests } = await prepare(page);
  await page.goto('/admin/settings/email');
  await page.getByLabel('Verified sender email', { exact: true }).fill('teacher@example.com');
  await page.getByLabel('Provider API key', { exact: true }).fill('re_private_test_key');
  await page.getByRole('switch', { name: /Enable HTTPS email delivery/ }).check();
  await page.getByRole('button', { name: 'Check provider', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'No email was sent' })).toBeVisible();
  await page.getByRole('button', { name: 'Save email API settings', exact: true }).click();
  await expect(page.getByText('Resend enabled', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Provider API key', { exact: true })).toHaveValue('');
  await page.reload();
  await expect(page.getByRole('switch', { name: /Enable HTTPS email delivery/ })).toBeChecked();
  await expect(page.getByLabel('Provider API key', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Google email address', { exact: true })).toHaveValue('owner@gmail.com');
  expect(requests[0].path).toMatch(/check$/);
});

test('Brevo can be selected and failed first-time provider checks preserve an inactive draft', async ({ page }) => {
  const { setFailure } = await prepare(page);
  await page.goto('/admin/settings/email');
  await page.getByLabel('Email API provider', { exact: true }).selectOption('brevo');
  await expect(page.getByText('Add and verify this exact sender in Brevo.', { exact: false })).toBeVisible();
  await page.getByLabel('Verified sender email', { exact: true }).fill('teacher@example.com');
  await page.getByLabel('Provider API key', { exact: true }).fill('brevo_private_test_key');
  await page.getByRole('switch', { name: /Enable HTTPS email delivery/ }).check();
  setFailure(true);
  await page.getByRole('button', { name: 'Save email API settings', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Verify the sender domain');
  await expect(page.getByRole('switch', { name: /Enable HTTPS email delivery/ })).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Verify the sender domain');
  await expect(page.getByText('An API key is saved.', { exact: false })).toBeVisible();
});

test('email API settings fit phone and desktop layouts with no runtime errors', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await prepare(page);
  await page.goto('/admin/settings/email');
  await expect(page.getByLabel('Provider API key', { exact: true })).toBeVisible();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if ([320, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`email-api-${width}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});
