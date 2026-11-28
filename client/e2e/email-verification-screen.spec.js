import { test, expect } from '@playwright/test';

// Verify your email: after a sign-in that needs a code, "Resend code" and "Back to sign in" are
// proper outlined buttons beside each other, and "Verify and sign in" stays the main action.
async function openVerification(page, { retryAfter = 2 } = {}) {
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/login') return route.fulfill({ json: { verificationRequired: true, message: 'We sent a six-digit code to your email.', retryAfter } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/sign-in');
  await page.locator('#login-email').fill('student@example.com');
  await page.locator('#login-password').fill('password-fixture');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByLabel('Six-digit verification code')).toBeVisible();
}

test('resend and back are outlined buttons side by side under the code field', async ({ page }) => {
  await page.clock.install();
  await openVerification(page);
  const resend = page.getByRole('button', { name: /Resend/ });
  const back = page.getByRole('button', { name: 'Back to sign in' });
  for (const button of [resend, back]) {
    const style = await button.evaluate(element => { const css = getComputedStyle(element); return { border: css.borderTopStyle, height: element.getBoundingClientRect().height, cursor: css.cursor }; });
    expect(style.border).toBe('solid');
    expect(style.height).toBeGreaterThanOrEqual(44);
  }
  const [a, b] = [await resend.boundingBox(), await back.boundingBox()];
  expect(Math.round(a.y)).toBe(Math.round(b.y));
  await expect(page.getByRole('button', { name: 'Verify and sign in' })).toBeVisible();

  // The resend button waits out its cooldown.
  await expect(resend).toBeDisabled();
  await expect(resend).toHaveText('Resend in 2s');
  await page.clock.runFor(2500);
  await expect(resend).toBeEnabled();
  await expect(resend).toHaveText('Resend code');

  await back.click();
  await expect(page.getByLabel('Six-digit verification code')).toHaveCount(0);
  await expect(page.locator('#login-password')).toBeVisible();
});

test('on a small phone the two buttons stack', async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 740 });
  await openVerification(page);
  const [a, b] = [await page.getByRole('button', { name: /Resend/ }).boundingBox(), await page.getByRole('button', { name: 'Back to sign in' }).boundingBox()];
  expect(b.y).toBeGreaterThan(a.y + a.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(340);
});
