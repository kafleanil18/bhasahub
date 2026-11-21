import { test, expect } from '@playwright/test';

const sdk = `
window.google = { accounts: { id: {
  initialize(config) { window.googleCredentialCallback = config.callback; },
  renderButton(container, options) {
    const frame = document.createElement('iframe');
    frame.title = 'Sign in with Google Button';
    frame.style.width = options.width + 'px';
    frame.style.height = '44px';
    frame.style.border = '0';
    frame.srcdoc = '<button>Sign in with Google</button>';
    container.appendChild(frame);
  }
} } };
`;

async function prepare(page, googleScript) {
  await page.clock.install();
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => route.fulfill({ json: [] }));
  await page.route('https://accounts.google.com/gsi/client*', googleScript);
}

test('blocked Google script keeps the logo visible and can recover with retry', async ({ page }) => {
  let blocked = true;
  await prepare(page, route => blocked ? route.abort() : route.fulfill({ contentType: 'application/javascript', body: sdk }));
  await page.goto('/sign-in');
  await expect(page.locator('.google-custom-btn svg')).toBeVisible();
  await page.clock.fastForward(12500);
  const retry = page.getByRole('button', { name: 'Retry Google sign-in' });
  await expect(retry).toBeEnabled();
  await expect(page.getByText('Google sign-in could not load. Retry, or use email below.')).toBeVisible();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.google-custom-btn svg')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  blocked = false;
  await retry.click();
  await expect(page.locator('.google-btn-slot')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.frameLocator('.google-btn-slot iframe').getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  await expect(page.locator('.google-custom-btn')).toHaveCount(0);
  await expect(page.locator('.google-auth-status')).toHaveCount(0);
});

test('a delayed Google script preserves the sign-up button until native rendering completes', async ({ page }) => {
  let deliver;
  const released = new Promise(resolve => { deliver = resolve; });
  await prepare(page, async route => {
    await released;
    await route.fulfill({ contentType: 'application/javascript', body: sdk });
  });
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Sign up with Google' })).toBeVisible();
  await expect(page.getByText('Loading Google sign-in…')).toBeVisible();
  await expect(page.locator('.google-btn-slot')).toHaveAttribute('inert', '');
  deliver();
  await expect(page.locator('.google-btn-slot')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.google-custom-btn')).toHaveCount(0);
});

test('failed native rendering offers retry and never creates a login session', async ({ page }) => {
  await prepare(page, route => route.fulfill({ contentType: 'application/javascript', body: sdk.replace("const frame = document.createElement('iframe');", "throw new Error('render failed'); const frame = document.createElement('iframe');") }));
  await page.goto('/sign-in');
  await expect(page.getByRole('button', { name: 'Retry Google sign-in' })).toBeEnabled();
  await expect(page.locator('.google-custom-btn svg')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});
