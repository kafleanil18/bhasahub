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
    // File uploads are multipart, not JSON.
    let body = null;
    try { body = route.request().postDataJSON?.() ?? null; } catch { body = null; }
    if (path === '/plans/my') return route.fulfill({ json: { pass: state.pass || null, request } });
    if (path === '/plans' && method === 'GET' && state.plans) return route.fulfill({ json: state.plans });
    if (path === '/plans/requests' && method === 'POST') {
      calls.push({ method, path, body });
      if (!body.screenshot) return route.fulfill({ status: 400, json: { error: 'Upload a screenshot of your payment. It’s required to check your payment.' } });
      const prices = { '1-month': 1000, '3-months': 2000, '6-months': 3000 };
      const created = !request;
      request = { _id: 'r1', plan: body.planId, price: prices[body.planId], status: 'pending', payment: { method: body.method, screenshot: body.screenshot, reference: body.reference, submittedAt: '2026-11-28T09:00:00.000Z' } };
      return route.fulfill({ status: created ? 201 : 200, json: request });
    }
    if (path === '/plans/payment-proof' && method === 'POST') { calls.push({ method, path }); return route.fulfill({ status: 201, json: { url: 'https://res.cloudinary.com/demo/image/upload/payment-proofs/receipt.png' } }); }
    if (path === '/payment-settings' && method === 'GET') return route.fulfill({ json: state.paymentSettings || {
      bank: { bankName: 'Sample Bank Ltd.', accountName: 'Xiao Ao Learning (sample)', accountNumber: '0000 1111 2222 3333', branch: 'Kathmandu', sample: true },
      qr: { image: '/payments/sample-qr.svg', label: 'Sample merchant QR', sample: true }, note: '',
      ...(role === 'superadmin' ? { saved: { bank: {}, qr: {}, note: '' } } : {}),
    } });
    if (path === '/payment-settings' && method === 'PUT') {
      calls.push({ method, path, body });
      const defaults = [['1-month', 1, 30], ['3-months', 3, 90], ['6-months', 6, 180]];
      const plans = defaults.map(([id, months, days]) => ({ id, months, days, label: months === 1 ? '1 month' : `${months} months`, price: body.prices[id].plan, liveClassPrice: body.prices[id].liveClass }));
      return route.fulfill({ json: { bank: { ...body.bank, sample: !body.bank.bankName }, qr: { image: body.qr.image || '/payments/sample-qr.svg', label: body.qr.label || 'Merchant QR', sample: !body.qr.image }, note: body.note, saved: body, plans } });
    }
    if (path === '/upload' && method === 'POST') { calls.push({ method, path }); return route.fulfill({ status: 201, json: { url: 'https://res.cloudinary.com/demo/image/upload/qr.png' } }); }
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
  await expect(page.getByRole('article', { name: '3 months' })).toContainText('Rs 667 a month, save 33%');
  const six = page.getByRole('article', { name: '6 months' });
  await expect(six).toContainText('Rs 3,000');
  await expect(six).toContainText('Rs 500 a month, save 50%');
  await expect(six).toContainText('Best value');
  await six.getByRole('button', { name: /Pay for the 6 months plan/ }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fpricing/);
});

const PNG = { name: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a5b40000000049454e44ae426082', 'hex') };

test('a student pays by merchant QR: choose, confirm, pay, then upload the required screenshot', async ({ page }) => {
  const calls = await prepare(page, 'student');
  await page.goto('/pricing');
  await page.getByRole('button', { name: /Pay for the 3 months plan/ }).click();
  const checkout = page.getByRole('dialog', { name: 'Choose how to pay' });
  await expect(checkout).toContainText('Step 1 of 4');
  await expect(checkout.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await checkout.getByRole('radio', { name: /Merchant QR/ }).click();
  await checkout.getByRole('button', { name: 'Continue' }).click();

  const confirm = page.getByRole('dialog', { name: 'Confirm your plan' });
  await expect(confirm).toContainText('3 months');
  await expect(confirm).toContainText('Rs 2,000');
  await expect(confirm).toContainText('Merchant QR');
  await confirm.getByRole('button', { name: 'Confirm and see payment details' }).click();

  const pay = page.getByRole('dialog', { name: 'Pay' });
  await expect(pay).toContainText('Sample details.');
  await expect(pay).toContainText('don’t pay into them');
  await expect(pay.getByRole('img', { name: /Sample merchant QR/ })).toHaveAttribute('src', '/payments/sample-qr.svg');
  await pay.getByRole('button', { name: 'I’ve paid, upload screenshot' }).click();

  const proof = page.getByRole('dialog', { name: 'Upload your payment screenshot' });
  await expect(proof).toContainText('A screenshot of your payment is required.');
  const send = proof.getByRole('button', { name: 'Send payment for checking' });
  await expect(send).toBeDisabled();
  await proof.getByLabel(/Payment screenshot/).setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  await expect(proof.getByRole('alert')).toContainText('JPG, PNG or WebP');
  await proof.getByLabel(/Payment screenshot/).setInputFiles(PNG);
  await expect(proof.getByText('receipt.png uploaded')).toBeVisible();
  await proof.getByLabel(/Transaction ID/).fill('TX-778');
  await send.click();

  const done = page.getByRole('dialog', { name: 'Thank you, we’ve got your payment' });
  await expect(done).toContainText('start your 3 months plan');
  const sent = calls.find(call => call.path === '/plans/requests');
  expect(sent.body).toEqual({ planId: '3-months', liveClass: false, method: 'qr', screenshot: 'https://res.cloudinary.com/demo/image/upload/payment-proofs/receipt.png', reference: 'TX-778', note: '' });
  await done.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.pricing-banner.is-pending')).toContainText('We’re checking your payment for the 3 months plan');
  await expect(page.getByRole('button', { name: '3 months plan, payment being checked' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /6 months plan, available after we’ve checked your payment/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Cancel request' })).toHaveCount(0);
});

test('paying by bank transfer shows the account to copy, and cancelling sends nothing', async ({ page }) => {
  const calls = await prepare(page, 'student');
  await page.goto('/pricing');
  await page.getByRole('button', { name: /Pay for the 1 month plan/ }).click();
  await page.getByRole('radio', { name: /Bank transfer/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Confirm and see payment details' }).click();
  const pay = page.getByRole('dialog', { name: 'Pay' });
  for (const text of ['Sample Bank Ltd.', 'Xiao Ao Learning (sample)', '0000 1111 2222 3333', 'Kathmandu']) await expect(pay).toContainText(text);
  await expect(pay.getByRole('button', { name: 'Copy account number' })).toBeVisible();
  await pay.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(calls.filter(call => call.method === 'POST')).toEqual([]);
});

test('a request from before checkout asks the student to finish paying', async ({ page }) => {
  await prepare(page, 'student', { request: { _id: 'r0', plan: '6-months', price: 3000, status: 'pending' } });
  await page.goto('/pricing');
  await expect(page.locator('.pricing-banner.is-pending')).toContainText('Finish paying for your 6 months plan');
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByRole('dialog', { name: 'Choose how to pay' })).toContainText('6 months plan, Rs 3,000');
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
  await expect(row).toContainText('3 months, Rs 2,000');
  await row.getByRole('button', { name: 'Payment received, start plan' }).click();
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
  await expect(row).toContainText('under Email settings');
  await row.getByRole('button', { name: 'Send email again' }).click();
  await expect(row).toContainText('✓ Email sent to owner@example.com');
  expect(calls).toEqual([{ method: 'POST', path: '/plans/requests/r7/notify' }]);
});

test('an admin checks the payment screenshot, then starts the plan', async ({ page }) => {
  const screenshot = 'https://res.cloudinary.com/demo/image/upload/payment-proofs/receipt.png';
  await page.route(screenshot, route => route.fulfill({ contentType: 'image/png', body: PNG.buffer }));
  const calls = await prepare(page, 'superadmin', { planRequests: [{ _id: 'r9', user: { _id: 'u1', name: 'Sita Rai', email: 'sita@example.com' }, plan: '3-months', price: 2000, days: 90, status: 'pending', createdAt: '2026-11-20T00:00:00.000Z', payment: { method: 'bank', screenshot, reference: 'TX-778', note: 'From my Nabil account', submittedAt: '2026-11-21T00:00:00.000Z' } }] });
  await page.goto('/admin/subscriptions?view=plans');
  const row = page.getByRole('article', { name: 'Plan request from Sita Rai' });
  await expect(row).toContainText('Payment to check');
  await expect(row).toContainText('Bank transfer');
  await expect(row).toContainText('TX-778');
  await expect(row).toContainText('From my Nabil account');
  await expect(row.getByRole('img', { name: 'Payment screenshot' })).toHaveAttribute('src', screenshot);
  await expect(row.getByRole('link', { name: 'Open screenshot' })).toHaveAttribute('href', screenshot);
  await row.getByRole('button', { name: 'Payment checked, start plan' }).click();
  expect(calls).toEqual([{ method: 'PUT', path: '/plans/requests/r9/approve' }]);
});

test('a super admin replaces the sample payment details with real ones', async ({ page }) => {
  const calls = await prepare(page, 'superadmin');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/teachers');
  await page.locator('#super-admin-navigation').getByRole('button', { name: 'Payment details' }).click();
  await expect(page).toHaveURL(/\/admin\/payment-details$/);
  await expect(page.getByText('Students see sample details')).toHaveCount(2);
  await page.getByLabel('Bank', { exact: true }).fill('Nabil Bank');
  await page.getByLabel('Account name').fill('Xiao Ao Pvt. Ltd.');
  await page.getByLabel('Account number').fill('0123456789');
  await page.locator('.pay-settings-upload input').setInputFiles(PNG);
  await expect(page.getByRole('img', { name: 'Your merchant QR' })).toHaveAttribute('src', 'https://res.cloudinary.com/demo/image/upload/qr.png');
  await page.getByRole('button', { name: 'Save payment details' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Payment details and prices saved' })).toBeVisible();
  const saved = calls.find(call => call.method === 'PUT' && call.path === '/payment-settings');
  expect(saved.body.bank).toEqual({ bankName: 'Nabil Bank', accountName: 'Xiao Ao Pvt. Ltd.', accountNumber: '0123456789', branch: '' });
  expect(saved.body.qr.image).toBe('https://res.cloudinary.com/demo/image/upload/qr.png');
  await expect(page.getByText('Students see your details')).toHaveCount(2);
});

test('live classes can be added on the confirm step, and the total follows through checkout', async ({ page }) => {
  const calls = await prepare(page, 'student');
  await page.goto('/pricing');
  await page.getByRole('button', { name: /Pay for the 3 months plan/ }).click();
  await page.getByRole('radio', { name: /Bank transfer/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  const confirm = page.getByRole('dialog', { name: 'Confirm your plan' });
  const total = confirm.locator('.checkout-total');
  await expect(total).toContainText('Rs 2,000');
  const addon = confirm.getByRole('checkbox', { name: /Also pay for live classes: Rs 9,000 for 3 months/ });
  await expect(addon).not.toBeChecked();
  await addon.check();
  await expect(total).toContainText('3 months plan + live classes');
  await expect(total).toContainText('Rs 11,000');
  await expect(confirm.locator('.checkout-summary')).toContainText('Rs 9,000');
  await expect(confirm.locator('.checkout-summary-total')).toContainText('Rs 11,000');
  await confirm.getByRole('button', { name: 'Confirm and see payment details' }).click();
  const pay = page.getByRole('dialog', { name: 'Pay' });
  await expect(pay).toContainText('Pay Rs 11,000 (plan Rs 2,000 + live classes Rs 9,000)');
  await expect(pay.locator('.checkout-detail').filter({ hasText: 'Amount' })).toContainText('11000');
  await pay.getByRole('button', { name: 'I’ve paid, upload screenshot' }).click();
  await page.getByLabel(/Payment screenshot/).setInputFiles(PNG);
  await expect(page.getByText('receipt.png uploaded')).toBeVisible();
  await expect(page.locator('.checkout-total')).toContainText('Rs 11,000');
  await page.getByRole('button', { name: 'Send payment for checking' }).click();
  await expect(page.getByRole('dialog', { name: 'Thank you, we’ve got your payment' })).toContainText('arrange your live classes');
  expect(calls.find(call => call.path === '/plans/requests').body.liveClass).toBe(true);
});

test('prices a super admin set show on the pricing page and in checkout', async ({ page }) => {
  await prepare(page, 'student', { plans: [
    { id: '1-month', label: '1 month', months: 1, days: 30, price: 1500, liveClassPrice: 7500 },
    { id: '3-months', label: '3 months', months: 3, days: 90, price: 3000, liveClassPrice: 9900 },
    { id: '6-months', label: '6 months', months: 6, days: 180, price: 4500, liveClassPrice: 12900 },
  ] });
  await page.goto('/pricing');
  await expect(page.getByRole('article', { name: '1 month' })).toContainText('Rs 1,500');
  await expect(page.getByRole('article', { name: '6 months' })).toContainText('Rs 750 a month, save 50%');
  await page.getByRole('button', { name: /Pay for the 6 months plan, Rs 4,500/ }).click();
  await page.getByRole('radio', { name: /Merchant QR/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('checkbox', { name: /Rs 12,900 for 6 months/ }).check();
  await expect(page.locator('.checkout-total')).toContainText('Rs 17,400');
});

test('a super admin changes the subscription and live class prices', async ({ page }) => {
  const calls = await prepare(page, 'superadmin');
  await page.goto('/admin/payment-details');
  const subscription = page.getByLabel('3 months subscription price in rupees');
  const live = page.getByLabel('6 months live classes price in rupees');
  await expect(subscription).toHaveValue('2000');
  await expect(live).toHaveValue('12000');
  await subscription.fill('2500');
  await live.fill('13000');
  await page.getByLabel('1 month live classes price in rupees').fill('');
  await page.getByRole('button', { name: 'Save payment details' }).click();
  await expect(page.getByRole('alert')).toContainText('whole rupees');
  await page.getByLabel('1 month live classes price in rupees').fill('7000');
  await page.getByRole('button', { name: 'Save payment details' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'prices saved' })).toBeVisible();
  const saved = calls.find(call => call.method === 'PUT' && call.path === '/payment-settings');
  expect(saved.body.prices).toEqual({ '1-month': { plan: 1000, liveClass: 7000 }, '3-months': { plan: 2500, liveClass: 9000 }, '6-months': { plan: 3000, liveClass: 13000 } });
});

test('on a phone the plans run 6 months, 3 months, then 1 month', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, 'student');
  await page.goto('/pricing');
  const tops = await Promise.all(['6 months', '3 months', '1 month'].map(async name => (await page.getByRole('article', { name }).boundingBox()).y));
  expect(tops[0]).toBeLessThan(tops[1]);
  expect(tops[1]).toBeLessThan(tops[2]);
});
