import { test, expect } from '@playwright/test';

const today = () => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const shift = (date, days) => new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10) + days)).toISOString().slice(0, 10);

function summary({ minutes = 0, goal = 10, streak = 0, best = 0, practisedDaysBefore = 0 }) {
  const t = today();
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = shift(t, i - 6);
    const isToday = i === 6;
    const practised = isToday ? minutes >= 1 : 6 - i <= practisedDaysBefore;
    const dayMinutes = isToday ? minutes : practised ? 12 : 0;
    return { date, minutes: dayMinutes, practised, goalMet: dayMinutes >= goal };
  });
  return { today: { date: t, minutes, practised: minutes >= 1, goalMet: minutes >= goal }, goalMinutes: goal, goalChoices: [5, 10, 15, 20, 30], streak, bestStreak: best, week };
}

async function prepare(page, state) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Sita', role: 'student' }));
  });
  await page.route('https://**/*', route => route.abort());
  const calls = [];
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname.endsWith('/practice-time/me')) { calls.push({ method, path: 'me', today: url.searchParams.get('today') }); return route.fulfill({ json: summary(state) }); }
    if (url.pathname.endsWith('/practice-time/goal')) { const body = route.request().postDataJSON(); calls.push({ method, path: 'goal', body }); state.goal = body.minutes; return route.fulfill({ json: { goalMinutes: body.minutes } }); }
    if (url.pathname.endsWith('/practice-time')) { const body = route.request().postDataJSON(); calls.push({ method, path: 'time', body }); state.minutes = (state.minutes || 0) + 1; return route.fulfill({ json: { date: body.date } }); }
    if (url.pathname.includes('/access-requests/my')) return route.fulfill({ json: [{ scope: 'tests', status: 'approved' }] });
    return route.fulfill({ json: [] });
  });
  return calls;
}

test('a streak at risk asks the student to practise today, and the goal can be changed', async ({ page }) => {
  const calls = await prepare(page, { minutes: 0, streak: 4, best: 9, practisedDaysBefore: 4 });
  await page.goto('/my-courses');
  const card = page.getByRole('region', { name: /day streak/ });
  await expect(card.getByRole('heading', { name: '4-day streak' })).toBeVisible();
  await expect(card).toContainText('Practise today to keep your 4-day streak going.');
  await expect(card).toContainText('Best: 9 days');
  await expect(card.getByRole('img', { name: '0 of 10 minutes practised today' })).toBeVisible();
  await expect(card.getByRole('list', { name: 'Last 7 days' }).getByRole('listitem')).toHaveCount(7);
  await expect(card.getByRole('listitem').last()).toContainText('Today: no practice');
  expect(calls.find(call => call.path === 'me').today).toBe(today());
  await card.getByLabel('Daily goal').selectOption('15');
  await expect.poll(() => calls.find(call => call.path === 'goal')?.body).toEqual({ minutes: 15 });
  await expect(card.getByRole('img', { name: '0 of 15 minutes practised today' })).toBeVisible();
  await expect(card.getByRole('link', { name: 'Practise now' })).toHaveAttribute('href', '/continue');
});

test('a reached goal shows a check and hides the practise button', async ({ page }) => {
  await prepare(page, { minutes: 12, streak: 5, best: 5, practisedDaysBefore: 4 });
  await page.goto('/my-courses');
  const card = page.getByRole('region', { name: /day streak/ });
  await expect(card.getByRole('heading', { name: '5-day streak' })).toBeVisible();
  await expect(card).toContainText('Goal reached for today');
  await expect(card.getByRole('link', { name: 'Practise now' })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await card.screenshot({ path: 'test-results/daily-streak-phone.png' });
});

test('active time on a practice page is saved for today, idle time is not', async ({ page }) => {
  await page.clock.install();
  const calls = await prepare(page, { minutes: 0 });
  await page.goto('/practice/pinyin');
  await expect(page.getByRole('button', { name: /Account menu for Sita/ })).toBeVisible();
  await page.clock.runFor(2000);
  await page.mouse.click(5, 300);
  await page.clock.runFor('01:05');
  await expect.poll(() => calls.filter(call => call.path === 'time').length).toBe(1);
  const sent = calls.find(call => call.path === 'time').body;
  expect(sent.date).toBe(today());
  expect(sent.seconds).toBeGreaterThanOrEqual(60);
  // A click keeps the student counted as active for two minutes, so that minute after the first save
  // is counted too. Once those two minutes pass with no clicks, keys or scrolling, nothing more is.
  await page.clock.runFor('01:30');
  const saved = () => calls.filter(call => call.path === 'time');
  // Saves are sent from the page, so wait for the second one to arrive before checking for more.
  await expect.poll(() => saved().length).toBe(2);
  await page.clock.runFor('05:00');
  await page.waitForTimeout(500);
  expect(saved().length).toBe(2);
  const seconds = saved().reduce((total, call) => total + call.body.seconds, 0);
  expect(seconds).toBeGreaterThanOrEqual(120);
  expect(seconds).toBeLessThanOrEqual(135);
});

test('time on non-learning pages is not counted', async ({ page }) => {
  await page.clock.install();
  const calls = await prepare(page, { minutes: 0 });
  await page.goto('/about-hsk');
  await expect(page.getByRole('button', { name: /Account menu for Sita/ })).toBeVisible();
  await page.clock.runFor(2000);
  await page.mouse.click(5, 300);
  await page.clock.runFor('01:30');
  expect(calls.filter(call => call.path === 'time').length).toBe(0);
});
