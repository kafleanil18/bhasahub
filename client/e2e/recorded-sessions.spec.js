import { test, expect } from '@playwright/test';

const session = { _id: '555555555555555555555555', title: 'Greetings & People', description: 'Revisit introductions and practise the phrases from class.', sessionDate: '2026-11-28', videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk', allowedStudents: ['student-1'] };
const students = [{ _id: 'student-1', name: 'Sita', email: 'sita@example.com' }, { _id: 'student-2', name: 'Ram', email: 'ram@example.com' }];
// `inLiveClasses`: the student paid for live classes or was marked joined, so recordings are open.
async function prepare(page, role = 'student', { inLiveClasses = true } = {}) {
  const state = { sessions: [{ ...session }], failList: false, denied: false, calls: [] };
  await page.addInitScript(role => {
    if (window.top !== window.self) return;
    localStorage.setItem('token', 'fixture');
    localStorage.setItem('user', JSON.stringify({ id: 'student-1', name: 'Sita', role }));
  }, role);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()); const path = url.pathname; const method = route.request().method();
    if (path === '/api/recorded-sessions/access') return route.fulfill({ json: { allowed: inLiveClasses, granted: inLiveClasses, paidUntil: null } });
    if (path === '/api/recorded-sessions/students') return route.fulfill({ json: students });
    if (path === '/api/recorded-sessions/mine') {
      if (state.failList) return route.fulfill({ status: 500, json: { error: 'Could not load recordings' } });
      return route.fulfill({ json: state.sessions.filter(row => !url.searchParams.get('date') || row.sessionDate === url.searchParams.get('date')).map(({ videoUrl: _videoUrl, allowedStudents: _allowedStudents, ...row }) => row) });
    }
    if (path.endsWith('/watch')) return route.fulfill(state.denied ? { status: 404, json: { error: 'Recording not found or no longer shared with you' } } : { json: state.sessions.find(row => path === `/api/recorded-sessions/${row._id}/watch`) });
    if (path.startsWith('/api/recorded-sessions')) {
      if (method === 'POST' || method === 'PUT') {
        const body = route.request().postDataJSON(); state.calls.push({ method, body });
        const saved = { ...body, _id: session._id }; state.sessions = [saved];
        return route.fulfill({ json: saved, status: method === 'POST' ? 201 : 200 });
      }
      if (method === 'DELETE') { state.sessions = []; return route.fulfill({ json: { message: 'Removed' } }); }
      return route.fulfill({ json: state.sessions });
    }
    return route.fulfill({ json: [] });
  });
  return state;
}

test('student chooses a date and watches only a shared recording', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await prepare(page);
  await page.goto('/recorded-sessions?date=2026-11-28');
  await expect(page.getByRole('heading', { name: 'Recorded sessions', exact: true })).toBeVisible();
  await page.locator('[data-date="2026-11-27"]').click();
  await expect(page.getByText('No recordings for this date', { exact: true })).toBeVisible();
  await page.locator('[data-date="2026-11-28"]').click();
  await expect(page.getByRole('dialog', { name: 'Greetings & People', exact: true })).toBeVisible();
  await expect(page.getByTitle('Recording: Greetings & People')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: 'test-results/recordings-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.screenshot({ path: 'test-results/recordings-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('[data-date="2026-11-28"]')).toBeFocused();
  await page.locator('[data-date="2026-11-28"]').click();
  await expect(page.getByTitle('Recording: Greetings & People')).toBeVisible();
  expect(errors).toEqual([]);
});

test('recordings have retry and revoked-access states', async ({ page }) => {
  const state = await prepare(page); state.failList = true;
  await page.goto('/recorded-sessions?date=2026-11-28');
  await expect(page.getByRole('alert')).toContainText('Could not load recordings');
  state.failList = false; state.denied = true;
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: /Greetings & People/ }).click();
  await expect(page.getByRole('alert')).toContainText('no longer shared');
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('superadmin creates, changes recipients, and removes a recording', async ({ page }) => {
  const state = await prepare(page, 'superadmin'); state.sessions = [];
  await page.goto('/admin/recorded-sessions');
  const day = page.locator('.recording-calendar-day:not(:disabled)').filter({ hasText: /^15$/ }).first();
  const chosenDate = await day.getAttribute('data-date');
  await day.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Session title').fill('Greetings & People');
  await expect(dialog.getByLabel('Session date')).toHaveValue(chosenDate);
  await dialog.getByLabel('Video link').fill(session.videoUrl);
  await dialog.getByRole('checkbox', { name: /Sita/ }).check();
  await dialog.getByRole('button', { name: 'Save recording' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.calls[0].body.allowedStudents).toEqual(['student-1']);
  expect(state.calls[0].body.sessionDate).toBe(chosenDate);
  await expect(page.locator(`[data-date="${chosenDate}"]`)).toHaveAccessibleName(/1 recording$/);
  await page.getByRole('button', { name: 'Edit Greetings & People' }).click();
  await dialog.getByRole('checkbox', { name: /Sita/ }).uncheck();
  await dialog.getByRole('checkbox', { name: /Ram/ }).check();
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'test-results/recordings-admin-mobile.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Save recording' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.calls[1].body.allowedStudents).toEqual(['student-2']);
  await page.getByRole('button', { name: 'Remove Greetings & People' }).click();
  await dialog.getByRole('button', { name: 'Remove recording', exact: true }).click();
  await expect(page.getByText('No recordings for this date', { exact: true })).toBeVisible();
});

test('ordinary admins cannot open recorded session management', async ({ page }) => {
  await prepare(page, 'admin');
  await page.goto('/admin/recorded-sessions');
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add recording' })).toHaveCount(0);
});

test('calendar supports month navigation, keyboard movement, and several recordings on one day', async ({ page }) => {
  const state = await prepare(page);
  state.sessions.push({ ...session, _id: '666666666666666666666666', title: 'Evening revision' });
  await page.goto('/recorded-sessions?date=2026-11-27');
  await expect(page.locator('[data-date="2026-11-28"]')).toHaveAccessibleName(/2 recordings$/);
  await page.getByRole('button', { name: 'Previous month', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await page.locator('[data-date="2026-11-27"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-date="2026-11-28"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Recording for this day').locator('option')).toHaveCount(2);
  await expect(page.getByTitle('Recording: Greetings & People')).toBeVisible();
  await page.getByLabel('Recording for this day').selectOption('666666666666666666666666');
  await expect(page.getByTitle('Recording: Evening revision')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.locator('[data-date="2026-11-29"]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('students not in live classes have no Recorded sessions link, and the page says how to join', async ({ page }) => {
  await prepare(page, 'student', { inLiveClasses: false });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'About HSK', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Recorded sessions' })).toHaveCount(0);
  await page.goto('/recorded-sessions');
  await expect(page.getByRole('heading', { level: 1, name: 'Recorded sessions are for live class students' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add live classes to a plan' })).toHaveAttribute('href', '/pricing');
});

test('students in live classes see Recorded sessions in the header', async ({ page }) => {
  await prepare(page, 'student');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Recorded sessions' }).click();
  await expect(page).toHaveURL(/\/recorded-sessions$/);
});

test('a super admin marks a student as joined in live classes', async ({ page }) => {
  const calls = [];
  let joined = false;
  const student = () => ({ _id: 'student-1', name: 'Sita', email: 'sita@example.com', trial: { status: 'none' }, plan: null, subscriptions: [], liveClass: { allowed: joined, granted: joined, paidUntil: null } });
  await page.addInitScript(() => { localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'boss', name: 'Boss', role: 'superadmin' })); });
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 'boss', name: 'Boss', role: 'superadmin' } });
    if (path === '/api/students') return route.fulfill({ json: [student()] });
    if (path === '/api/students/student-1/live-class') { const body = route.request().postDataJSON(); calls.push(body); joined = body.joined; return route.fulfill({ json: student() }); }
    return route.fulfill({ json: [] });
  });
  await page.goto('/admin/students');
  await page.getByRole('button', { name: 'Manage access' }).click();
  const toggle = page.getByRole('checkbox', { name: 'Joined live classes, so can watch recorded sessions' });
  await expect(toggle).not.toBeChecked();
  // The tick follows the saved value, so it shows once the server answers.
  await toggle.click();
  await expect(toggle).toBeChecked();
  expect(calls).toEqual([{ joined: true }]);
  await expect(page.locator('.student-chip').filter({ hasText: 'Can watch recorded sessions' })).toBeVisible();
});
