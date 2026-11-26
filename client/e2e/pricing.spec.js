import { test, expect } from '@playwright/test';

async function prepare(page, role, state = {}) {
  await page.addInitScript(user => {
    if (!user) return;
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, role ? { id: role, name: role === 'student' ? 'Sita' : 'Owner', role } : null);
  await page.route('https://**/*', route => route.abort());
  const calls = [];
  let request = state.request || null;
  let planRequests = state.planRequests || [];
  let members = state.members || [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    const method = route.request().method();
    const body = route.request().postDataJSON?.() ?? null;
    if (path === '/plans/my') return route.fulfill({ json: { pass: state.pass || null, request } });
    if (path === '/plans/requests' && method === 'POST') {
      calls.push({ method, path, body });
      const prices = { '1-month': 1000, '3-months': 2000, '6-months': 3000 };
      const created = !request;
      request = { _id: 'r1', plan: body.planId, price: prices[body.planId], status: 'pending' };
      return route.fulfill({ status: created ? 201 : 200, json: request });
    }
    if (path === '/plans/requests/my' && method === 'DELETE') { calls.push({ method, path }); request = null; return route.fulfill({ json: { ok: true } }); }
    if (path === '/plans/requests' && method === 'GET') return route.fulfill({ json: planRequests });
    if (path === '/plans/members') return route.fulfill({ json: members });
    const notify = path.match(/^\/plans\/requests\/([^/]+)\/notify$/);
    if (notify) {
      calls.push({ method, path });
      planRequests = planRequests.map(row => row._id === notify[1] ? { ...row, adminEmail: { sentTo: ['owner@example.com'], error: '', at: '2026-11-21T10:00:00.000Z' } } : row);
      return route.fulfill({ json: { adminEmail: { sentTo: ['owner@example.com'] } } });
    }
    const approve = path.match(/^\/plans\/requests\/([^/]+)\/approve$/);
    if (approve) {
      calls.push({ method, path });
      const approved = planRequests.find(row => row._id === approve[1]);
      planRequests = planRequests.map(row => row._id === approve[1] ? { ...row, status: 'approved' } : row);
      members = [{ _id: 'p1', user: approved.user, plan: approved.plan, expiresAt: '2027-05-20T00:00:00.000Z' }];
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: [] });
  });
  return calls;
}

test('visitors see the three plans with monthly savings and sign in to choose', async ({ page }) => {
  await prepare(page, null);
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: /One plan\.\s*Every course\./ })).toBeVisible();
  const cards = page.locator('.pricing-card');
  await expect(cards).toHaveCount(3);
  await expect(page.getByRole('article', { name: '1 month' })).toContainText('Rs 1,000');
  await expect(page.getByRole('article', { name: '3 months' })).toContainText('Rs 667 a month · Save 33%');
  const six = page.getByRole('article', { name: '6 months' });
  await expect(six).toContainText('Rs 3,000');
  await expect(six).toContainText('Rs 500 a month · Save 50%');
  await expect(six).toContainText('Best value');
  await six.getByRole('button', { name: /Choose the 6 months plan/ }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fpricing/);
});

test('a student requests a plan, switches it, and can cancel', async ({ page }) => {
  const calls = await prepare(page, 'student');
  await page.goto('/pricing');
  await page.getByRole('button', { name: /Choose the 3 months plan/ }).click();
  await expect(page.locator('.pricing-banner.is-success')).toContainText('Your 3 months plan request is in');
  await expect(page.locator('.pricing-banner.is-pending')).toContainText('We’ll email you how to pay Rs 2,000');
  await expect(page.getByRole('button', { name: '3 months plan requested' })).toBeDisabled();
  await page.getByRole('button', { name: /Choose the 6 months plan/ }).click();
  await expect(page.locator('.pricing-banner.is-pending')).toContainText('Rs 3,000');
  expect(calls.map(call => call.body?.planId)).toEqual(['3-months', '6-months']);
  await page.getByRole('button', { name: 'Cancel request' }).click();
  await expect(page.locator('.pricing-banner.is-success')).toContainText('cancelled');
  await expect(page.locator('.pricing-banner.is-pending')).toHaveCount(0);
});

test('a student with an active plan sees when it ends', async ({ page }) => {
  await prepare(page, 'student', { pass: { expiresAt: '2027-03-12T00:00:00.000Z', plan: '6-months' } });
  await page.goto('/pricing');
  await expect(page.locator('.pricing-banner.is-active')).toContainText('Your 6 months plan is active until');
  const active = page.getByRole('article', { name: '6 months' });
  await expect(active).toHaveClass(/is-active/);
  await expect(active).toContainText('Active plan');
  await expect(active).toContainText('Active until');
  await expect(active.getByRole('button')).toHaveCount(0);
  await expect(active).toHaveCSS('border-top-color', 'rgb(31, 122, 69)');
  for (const name of ['1 month', '3 months']) {
    const card = page.getByRole('article', { name });
    await expect(card).toHaveClass(/is-locked/);
    await expect(card.getByRole('button', { name: new RegExp(`${name} plan, available when your current plan ends`) })).toBeDisabled();
  }
});

test('the pricing page fits a phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await prepare(page, 'student');
  await page.goto('/pricing');
  await expect(page.getByRole('article', { name: '6 months' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('an admin starts a plan once payment is received', async ({ page }) => {
  const calls = await prepare(page, 'superadmin', { planRequests: [{ _id: 'r9', user: { _id: 'u1', name: 'Sita Rai', email: 'sita@example.com' }, plan: '3-months', price: 2000, days: 90, status: 'pending', createdAt: '2026-11-20T00:00:00.000Z' }] });
  await page.goto('/admin/subscriptions');
  await page.getByRole('button', { name: 'Review plans' }).click();
  const row = page.getByRole('article', { name: 'Plan request from Sita Rai' });
  await expect(row).toContainText('3 months · Rs 2,000');
  await row.getByRole('button', { name: 'Payment received · Start plan' }).click();
  await expect(page.locator('.access-feedback.is-success')).toContainText('3 months plan started for Sita Rai');
  expect(calls).toEqual([{ method: 'PUT', path: '/plans/requests/r9/approve' }]);
  await expect(page.locator('.access-plan-members')).toContainText('Sita Rai');
});

test('below the plans, every platform feature is described and live classes can be enquired about', async ({ page }) => {
  await prepare(page, null);
  await page.goto('/pricing');
  const features = page.getByRole('region', { name: 'Everything on the platform' });
  for (const group of ['HSK courses', 'HSK mock tests', 'Practice studio', 'Progress and habits', 'Live classes']) {
    await expect(features.getByRole('heading', { name: group, exact: true })).toBeVisible();
  }
  const studio = features.getByRole('article', { name: 'Practice studio' });
  await expect(studio.locator('li')).toHaveCount(9);
  for (const tool of ['Pinyin chart', 'Tone listening', 'Trace characters', 'Listening practice', 'Sentence builder', 'Measure words', 'Everyday numbers', 'Listening dictation', 'Conversation practice']) {
    await expect(studio).toContainText(tool);
  }
  const freeTest = features.getByRole('article', { name: 'HSK mock tests' }).getByRole('listitem').filter({ hasText: 'One mock test' });
  await expect(freeTest.locator('.pricing-feature-tag')).toHaveText('Free');
  await expect(freeTest).toContainText('H11226');
  await expect(features).toContainText('A free account includes one full HSK 1 mock test');
  await expect(features).toContainText('Spaced-repetition review');
  await expect(features).toContainText('Daily practice reminder');
  const live = features.getByRole('article', { name: 'Live classes' });
  await expect(live.getByRole('link', { name: 'Chat with us on WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/9779800000000\?text=/);
  await expect(live.getByRole('link', { name: 'Chat with us on Viber' })).toHaveAttribute('href', /^viber:\/\/chat\?number=%2B9779800000000/);
  await expect(live.getByRole('button')).toHaveCount(0);
});

test('admins see when the plan email failed and can send it again', async ({ page }) => {
  const calls = await prepare(page, 'superadmin', { planRequests: [{ _id: 'r7', user: { _id: 'u1', name: 'Sita Rai', email: 'sita@example.com' }, plan: '1-month', price: 1000, days: 30, status: 'pending', createdAt: '2026-11-20T00:00:00.000Z', adminEmail: { sentTo: [], error: 'owner@example.com: Email delivery is not configured', at: '2026-11-20T00:00:00.000Z' } }] });
  await page.goto('/admin/subscriptions');
  await page.getByRole('button', { name: 'Review plans' }).click();
  const row = page.getByRole('article', { name: 'Plan request from Sita Rai' });
  await expect(row).toContainText('Email not sent.');
  await expect(row).toContainText('Admin → Email settings');
  await row.getByRole('button', { name: 'Send email again' }).click();
  await expect(row).toContainText('✓ Email sent to owner@example.com');
  expect(calls).toEqual([{ method: 'POST', path: '/plans/requests/r7/notify' }]);
});
