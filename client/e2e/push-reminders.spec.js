import { test, expect } from '@playwright/test';
const endpoint = 'https://push.example.com/device-1';

// Fakes the browser push stack: permission prompt, service worker registration and push subscription.
async function prepare(page, { configured = true, permission = 'granted', ios = false, setting = { enabled: false, time: '19:00', timezone: '' } } = {}) {
  const calls = [];
  await page.addInitScript(({ endpoint, permission, ios }) => {
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
    if (ios) {
      Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' });
      delete window.PushManager;
      return;
    }
    let current = null;
    const subscription = { endpoint, toJSON: () => ({ endpoint, keys: { p256dh: 'BOr1x2y3z4abcdefghij', auth: 'abcdefghijkl' } }), unsubscribe: async () => { current = null; window.__unsubscribed = true; return true; } };
    const registration = { pushManager: { getSubscription: async () => current, subscribe: async options => { window.__subscribeOptions = { userVisibleOnly: options.userVisibleOnly, keyLength: options.applicationServerKey.length }; current = subscription; return subscription; } } };
    Object.defineProperty(navigator.serviceWorker, 'getRegistration', { value: async () => registration });
    let state = 'default';
    Object.defineProperty(Notification, 'permission', { get: () => state });
    Notification.requestPermission = async () => { state = permission; return permission; };
  }, { endpoint, permission, ios });
  await page.route('https://**/*', r => r.abort());
  await page.route('**/api/**', async r => {
    const url = new URL(r.request().url()); const path = url.pathname.replace('/api', ''); const method = r.request().method();
    let data = [];
    if (path.startsWith('/push')) calls.push({ method, path, body: r.request().postDataJSON?.() ?? null });
    if (path === '/push/public-key') data = configured ? { configured: true, publicKey: 'BN0KQQfenjJUuwRVa7ORR4eZmkE3QdFPWPMcId5-YJ-JV0td5FzBgxMcHPfB5ERt0HLHgR41FaW3_Xdd5ZySQ8o' } : { configured: false, publicKey: '' };
    // A free week: My Progress is open.
    if (path === '/access-requests/my') data = [{ scope: 'tests', status: 'approved' }];
    if (path === '/push/me') data = { ...setting, devices: setting.enabled ? 1 : 0, thisDevice: false };
    if (path === '/push/subscriptions' && method === 'POST') { const body = r.request().postDataJSON(); data = { enabled: true, time: body.time, timezone: body.timezone, thisDevice: true }; }
    if (path === '/push/subscriptions' && method === 'DELETE') data = { enabled: false, devices: 0, thisDevice: false };
    if (path === '/push/settings') { const body = r.request().postDataJSON(); data = { enabled: true, time: body.time, timezone: body.timezone }; }
    if (path === '/push/test') data = { devices: 1, sent: 1 };
    if (path === '/analytics/me') data = { scoreTrend: [], weakestWords: [], totalAttempts: 0, completedLessons: 0, hasStudioActivity: false };
    if (path === '/studio-activity/me') data = { studios: [], tonePerformance: [], hsk: [], otherTests: [] };
    await r.fulfill({ json: data });
  });
  return calls;
}
const card = page => page.locator('.daily-reminder');

test('turning reminders on subscribes this device, then test, time change and turning off work', async ({ page }) => {
  const calls = await prepare(page);
  await page.goto('/progress');
  await card(page).getByLabel('Remind me at').selectOption('07:30');
  await card(page).getByRole('button', { name: 'Turn on reminders' }).click();
  await expect(card(page).getByRole('status')).toContainText('Reminders are on');
  const subscribe = calls.find(call => call.method === 'POST' && call.path === '/push/subscriptions');
  expect(subscribe.body.subscription.endpoint).toBe(endpoint);
  expect(subscribe.body.time).toBe('07:30');
  expect(subscribe.body.timezone).toBeTruthy();
  expect(await page.evaluate(() => window.__subscribeOptions)).toEqual({ userVisibleOnly: true, keyLength: 65 });

  await card(page).getByRole('button', { name: 'Send test notification' }).click();
  await expect(card(page).getByRole('status')).toContainText('Test sent');
  await card(page).getByLabel('Remind me at').selectOption('20:00');
  await expect(card(page).getByRole('status')).toContainText('Reminder time saved');
  expect(calls.find(call => call.path === '/push/settings').body.time).toBe('20:00');

  await card(page).getByRole('button', { name: 'Turn off' }).click();
  await expect(card(page).getByRole('status')).toContainText('Reminders are off on this device');
  expect(calls.find(call => call.method === 'DELETE').body).toEqual({ endpoint });
  expect(await page.evaluate(() => window.__unsubscribed)).toBe(true);
  await expect(card(page).getByRole('button', { name: 'Turn on reminders' })).toBeVisible();
});

test('blocked notifications explain how to allow them and save nothing', async ({ page }) => {
  const calls = await prepare(page, { permission: 'denied' });
  await page.goto('/progress');
  await card(page).getByRole('button', { name: 'Turn on reminders' }).click();
  await expect(card(page).getByRole('alert')).toContainText('Notifications are blocked');
  await expect(card(page).getByRole('button', { name: 'Turn on reminders' })).toBeDisabled();
  expect(calls.some(call => call.path === '/push/subscriptions')).toBe(false);
});

test('iPhone browsers are told to add the app to the Home Screen first', async ({ page }) => {
  await prepare(page, { ios: true });
  await page.goto('/progress');
  await expect(card(page)).toContainText('Add to Home Screen');
  await expect(card(page).getByRole('button', { name: 'Turn on reminders' })).toHaveCount(0);
});

test('the card stays hidden when the server has no push keys', async ({ page }) => {
  await prepare(page, { configured: false });
  await page.goto('/progress');
  await expect(page.getByText(/at a glance/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Daily practice reminder' })).toHaveCount(0);
});

test('signing out removes this device so the next person does not get reminders', async ({ page }) => {
  const calls = await prepare(page);
  await page.goto('/progress');
  await card(page).getByRole('button', { name: 'Turn on reminders' }).click();
  await expect(card(page).getByRole('status')).toContainText('Reminders are on');
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.locator('.logout-item').first().click();
  await expect.poll(() => calls.filter(call => call.method === 'DELETE').length).toBe(1);
  expect(calls.find(call => call.method === 'DELETE').body).toEqual({ endpoint });
});
