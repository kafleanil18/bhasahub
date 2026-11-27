import { test, expect } from '@playwright/test';

async function prepare(page, user = null) {
  await page.addInitScript(user => {
    if (user) { localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify(user)); }
  }, user);
  await page.route('**/api/**', route => route.fulfill({ json: [] }));
  await page.route('https://**/*', route => route.abort());
}

test('public footer policies open without sign-in and survive refresh', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Policies' }).getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Policy pages' }).getByRole('link', { name: 'Cookies & browser storage' }).click();
  await expect(page).toHaveURL(/\/cookies$/);
  await expect(page.getByRole('table')).toContainText('HSK exam drafts');
  await page.goBack();
  await expect(page).toHaveURL(/\/privacy$/);
});

test('the Terms of Service open from the footer and from the account creation form', async ({ page, context }) => {
  await prepare(page);
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Policies' }).getByRole('link', { name: 'Terms of Service', exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Policy pages' }).getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('aria-current', 'page');
  await page.goto('/register');
  const [terms] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Terms of Service (opens in a new tab)' }).click(),
  ]);
  await terms.waitForLoadState();
  await expect(terms).toHaveURL(/\/terms$/);
  await expect(terms.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible();
});

test('the privacy policy explains account deletion and points full erasure to the contact button', async ({ page }) => {
  await prepare(page);
  await page.goto('/privacy');
  const deletion = page.locator('#privacy-deletion');
  await expect(deletion.getByRole('heading', { name: 'Deleting your account and data' })).toBeVisible();
  await expect(deletion).toContainText('HSK test attempts and scores');
  const contact = page.getByRole('button', { name: 'Contact us about privacy' });
  await deletion.scrollIntoViewIfNeeded();
  await expect(contact).not.toBeInViewport();
  await deletion.getByRole('link', { name: 'Ask the team to erase all my data' }).click();
  await expect(contact).toBeInViewport();
  await expect(contact).toBeFocused();
  await expect(page.locator('#privacy-contact')).toHaveClass(/is-pointed/);
});

test('signed-in super admins can read the public policy', async ({ page }) => {
  await prepare(page, { id: 'admin', name: 'Admin', role: 'superadmin' });
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/privacy$/);
});

test('privacy requests validate a reply email and send to the inbox with a privacy label', async ({ page }) => {
  await prepare(page);
  let submitted;
  await page.route('**/api/feedback', async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { message: 'Received' } });
  });
  await page.goto('/privacy');
  await page.getByRole('button', { name: 'Contact us about privacy' }).click();
  const dialog = page.getByRole('dialog', { name: 'Privacy request' });
  await dialog.getByRole('button', { name: 'Send privacy request' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Please enter an email');
  expect(submitted).toBeUndefined();
  await dialog.getByLabel('Name', { exact: true }).fill('Student');
  await dialog.getByLabel('Email Address').fill('student@example.com');
  await dialog.getByLabel('Message', { exact: true }).fill('Please send me a copy of my learning records.');
  await dialog.getByRole('button', { name: 'Send privacy request' }).click();
  await expect(dialog).toContainText('Your privacy request has been sent to the team');
  expect(submitted).toMatchObject({ email: 'student@example.com', message: 'Privacy request\n\nPlease send me a copy of my learning records.' });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Contact us about privacy' })).toBeFocused();
});

test('failed privacy requests preserve the message and can be closed with Escape', async ({ page }) => {
  await prepare(page);
  await page.route('**/api/feedback', route => route.fulfill({ status: 500, json: { error: 'Please try again' } }));
  await page.goto('/privacy');
  await page.getByRole('button', { name: 'Contact us about privacy' }).click();
  const dialog = page.getByRole('dialog', { name: 'Privacy request' });
  await dialog.getByLabel('Email Address').fill('student@example.com');
  await dialog.getByLabel('Message', { exact: true }).fill('Please correct my account information.');
  await dialog.getByRole('button', { name: 'Send privacy request' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Please try again');
  await expect(dialog.getByLabel('Message', { exact: true })).toHaveValue('Please correct my account information.');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('policy pages fit phones and desktops in light and dark mode', async ({ page }) => {
  await prepare(page);
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/privacy', '/cookies']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.privacy-page-header')).toHaveCSS('position', 'static');
      await expect(page.locator('.privacy-page-header')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      for (const dark of [false, true]) {
        await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  }
});

test('live classes link straight to WhatsApp and Viber instead of a form', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  const contact = page.getByRole('group', { name: 'Ask about live classes' });
  await expect(contact.getByRole('link', { name: 'Chat with us on WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/9779800000000\?text=/);
  await expect(contact.getByRole('link', { name: 'Chat with us on Viber' })).toHaveAttribute('href', /^viber:\/\/chat\?number=%2B9779800000000/);
  await expect(page.getByRole('button', { name: /Enquire now/ })).toHaveCount(0);
});
