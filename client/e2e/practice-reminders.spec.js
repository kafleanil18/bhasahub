import { test, expect } from '@playwright/test';

async function prepare(page, { role = 'superadmin', count, emailConfigured = true, studentRows } = {}) {
  await page.addInitScript(role => {
    if (!role) return;
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'owner', name: 'Owner', role }));
  }, role);
  const base = studentRows || [
    { user: '507f1f77bcf86cd799439011', name: 'Student One', email: 'one@example.com', lastPracticeAt: '2026-10-31T12:00:00Z', inactiveDays: 7, lastReminderAt: null },
    { user: '507f1f77bcf86cd799439012', name: 'Student Two', email: 'two@example.com', lastPracticeAt: '2026-11-06T12:00:00Z', inactiveDays: 1, lastReminderAt: '2026-11-01T12:00:00Z' },
  ];
  let students = count === undefined ? base : base.slice(0, count);
  const requests = [];
  let campaigns = [];
  let failSend = false;
  let failStudents = false;
  let readAfterQueue = false;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    const method = route.request().method();
    if (path === '/practice-reminders/audience') return route.fulfill({ json: { count: students.length, students, emailConfigured } });
    if (path === '/practice-reminders/students') return failStudents ? route.fulfill({ status: 503, json: { error: 'Activity unavailable' } }) : route.fulfill({ json: { students, asOf: '2026-11-07T12:00:00Z' } });
    if (path === '/practice-reminders/preview') {
      const body = route.request().postDataJSON(); requests.push({ path, body });
      const selected = students.filter(student => body.studentIds.includes(student.user));
      return route.fulfill({ json: { ...body, audience: { count: selected.length, students: selected }, practiceUrl: 'https://learn.example.com/my-courses', previewToken: 'reviewed-token' } });
    }
    if (path === '/practice-reminders/campaigns' && method === 'POST') {
      const body = route.request().postDataJSON(); requests.push({ path, body });
      if (failSend) return route.fulfill({ status: 503, json: { error: 'Could not queue the reminder. Please retry.' } });
      const total = body.studentIds.length;
      const campaign = { id: 'campaign1', subject: body.subject, createdAt: new Date().toISOString(), total, counts: { pending: total, sending: 0, sent: 0, failed: 0, skipped: 0, uncertain: 0 }, complete: false };
      campaigns = [campaign]; readAfterQueue = false;
      return route.fulfill({ status: 202, json: campaign });
    }
    if (path === '/practice-reminders/campaigns') {
      if (campaigns.length && readAfterQueue) campaigns = [{ ...campaigns[0], counts: { pending: 0, sending: 0, sent: campaigns[0].total, failed: 0, skipped: 0, uncertain: 0 }, complete: true }];
      if (campaigns.length) readAfterQueue = true;
      return route.fulfill({ json: campaigns });
    }
    if (path === '/practice-reminders/unsubscribe') {
      requests.push({ path, body: route.request().postDataJSON() });
      return route.fulfill({ json: { message: 'Unsubscribed' } });
    }
    return route.fulfill({ json: path === '/health' ? { status: 'ok' } : [] });
  });
  await page.route('https://**/*', route => route.abort());
  return { requests, setSendFailure: value => { failSend = value; }, setStudentFailure: value => { failStudents = value; }, setStudents: value => { students = value; } };
}

test('superadmin reviews the exact message and recipient count before queuing a reminder', async ({ page }) => {
  const { requests } = await prepare(page);
  await page.goto('/admin/reminders');
  await expect(page.getByRole('heading', { name: 'Practice reminders', exact: true })).toBeVisible();
  await page.getByLabel('Subject', { exact: true }).fill('Your Chinese practice today');
  await page.getByLabel('Message', { exact: true }).fill('Take ten minutes to practice speaking Chinese today.');
  await page.getByRole('button', { name: 'Select all matching', exact: true }).click();
  await page.getByRole('button', { name: /^Review & send/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Your Chinese practice today');
  await expect(dialog).toContainText('Take ten minutes to practice speaking Chinese today.');
  await expect(dialog).toContainText('2 subscribed students');
  await dialog.getByText('Review recipients', { exact: true }).click();
  await expect(dialog).toContainText('one@example.com');
  expect(requests.filter(request => request.path.endsWith('/campaigns'))).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Send to 2 students', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Reminder queued' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your Chinese practice today' })).toBeVisible();
  await page.getByRole('button', { name: 'Refresh progress' }).click();
  await expect(page.getByText('Finished', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '2 sent' })).toBeVisible();
  expect(requests.filter(request => request.path.endsWith('/campaigns'))).toHaveLength(1);
});

test('failed confirmation remains in the dialog and retries keep the same request ID', async ({ page }) => {
  const { requests, setSendFailure } = await prepare(page);
  await page.goto('/admin/reminders');
  await page.getByRole('button', { name: 'Select all matching', exact: true }).click();
  await page.getByRole('button', { name: /^Review & send/ }).click();
  setSendFailure(true);
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Send to 2 students', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Please retry');
  setSendFailure(false);
  await dialog.getByRole('button', { name: 'Send to 2 students', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const sends = requests.filter(request => request.path.endsWith('/campaigns'));
  expect(sends).toHaveLength(2); expect(sends[0].body.requestId).toBe(sends[1].body.requestId);
});

test('review can be cancelled with the keyboard without sending and restores focus', async ({ page }) => {
  const { requests } = await prepare(page);
  await page.goto('/admin/reminders');
  await page.getByRole('button', { name: 'Select all matching', exact: true }).click();
  const button = page.getByRole('button', { name: /^Review & send/ });
  await button.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(button).toBeFocused();
  expect(requests.filter(request => request.path.endsWith('/campaigns'))).toHaveLength(0);
});

test('no active students or missing email configuration disables reminder sending', async ({ page }) => {
  await prepare(page, { count: 0 });
  await page.goto('/admin/reminders');
  await expect(page.locator('#reminder-review-help')).toContainText('No students have active Chinese course access right now.');
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
  await page.unroute('**/api/**');
  await prepare(page, { emailConfigured: false });
  await page.goto('/admin/reminders');
  await expect(page.getByRole('link', { name: 'Open Email settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
});

test('ordinary admins and students cannot open practice reminders', async ({ page }) => {
  await prepare(page, { role: 'admin' });
  await page.goto('/admin/reminders');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Practice reminders', exact: true })).toHaveCount(0);
});

test('unsubscribe is public and requires confirmation instead of acting on a page visit', async ({ page }) => {
  const { requests } = await prepare(page, { role: null });
  await page.goto('/email/reminders/unsubscribe?token=signed-preference-token');
  await expect(page.getByRole('heading', { name: 'Practice reminder emails' })).toBeVisible();
  expect(requests.filter(request => request.path.endsWith('/unsubscribe'))).toHaveLength(0);
  await page.getByRole('button', { name: 'Stop practice reminders' }).click();
  await expect(page.getByRole('status')).toContainText('Practice reminder emails are turned off');
  expect(requests.find(request => request.path.endsWith('/unsubscribe')).body.token).toBe('signed-preference-token');
});

test('compose and review fit mobile, tablet, and desktop screens without runtime errors', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await prepare(page);
  await page.goto('/admin/reminders');
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Select all matching', exact: true }).click();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if ([320, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`practice-reminders-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('button', { name: /^Review & send/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send to 2 students', exact: true })).toBeVisible();
  expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('practice-reminder-review-320.png'), fullPage: true });
  expect(errors).toEqual([]);
});

const activityStudents = [
  { user: '507f1f77bcf86cd799439011', name: 'Recent Student', email: 'recent@example.com', lastPracticeAt: '2026-11-07T11:00:00Z', inactiveDays: 0, lastReminderAt: null },
  { user: '507f1f77bcf86cd799439012', name: 'Three Day Student', email: 'three@example.com', lastPracticeAt: '2026-11-04T12:00:00Z', inactiveDays: 3, lastReminderAt: null },
  { user: '507f1f77bcf86cd799439013', name: 'Seven Day Student', email: 'seven@example.com', lastPracticeAt: '2026-10-31T12:00:00Z', inactiveDays: 7, lastReminderAt: '2026-11-01T12:00:00Z' },
  { user: '507f1f77bcf86cd799439014', name: 'Fourteen Day Student', email: 'fourteen@example.com', lastPracticeAt: '2026-10-24T12:00:00Z', inactiveDays: 14, lastReminderAt: null },
  { user: '507f1f77bcf86cd799439015', name: 'Unrecorded Student', email: 'unknown@example.com', lastPracticeAt: null, inactiveDays: null, lastReminderAt: null },
];

test('activity filters and search preserve explicit selections and preview only the chosen students', async ({ page }) => {
  const { requests } = await prepare(page, { studentRows: activityStudents });
  await page.goto('/admin/reminders');
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
  await page.getByRole('button', { name: /Inactive 7\+ days/ }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  await page.getByRole('button', { name: 'Select all matching', exact: true }).click();
  await page.getByRole('button', { name: /All students/ }).click();
  await page.getByRole('searchbox', { name: 'Search students' }).fill('recent@example.com');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await expect(page.getByText(/2 outside this view/)).toBeVisible();
  await page.getByRole('checkbox', { name: /Select Recent Student/ }).check();
  await page.getByRole('button', { name: 'Show selected', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(3);
  await page.getByRole('button', { name: /^Review & send/ }).click();
  await expect(page.getByRole('dialog')).toContainText('3 subscribed students');
  await page.getByRole('dialog').getByText('Review recipients', { exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('recent@example.com');
  await expect(page.getByRole('dialog')).not.toContainText('three@example.com');
  await page.getByRole('button', { name: 'Send to 3 students', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const sent = requests.find(request => request.path.endsWith('/campaigns'));
  expect([...sent.body.studentIds].sort()).toEqual([activityStudents[0].user, activityStudents[2].user, activityStudents[3].user]);
});

test('unrecorded activity is separate from inactivity and a row reminder targets just that student', async ({ page }) => {
  const { requests } = await prepare(page, { studentRows: activityStudents });
  await page.goto('/admin/reminders');
  await page.getByRole('button', { name: /No recorded practice/ }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('button', { name: 'Prepare reminder for Unrecorded Student', exact: true }).click();
  await expect(page.getByLabel('Subject', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: /^Review & send/ }).click();
  await expect(page.getByRole('dialog')).toContainText('1 subscribed student');
  expect(requests.find(request => request.path.endsWith('/preview')).body.studentIds).toEqual([activityStudents[4].user]);
  expect(requests.filter(request => request.path.endsWith('/campaigns'))).toHaveLength(0);
});

test('selection persists across pages and can be cleared without sending', async ({ page }) => {
  const studentRows = Array.from({ length: 30 }, (_, index) => ({ ...activityStudents[0], user: (index + 1).toString(16).padStart(24, '0'), name: `Learner ${String(index + 1).padStart(2, '0')}`, email: `learner${index + 1}@example.com` }));
  await prepare(page, { studentRows });
  await page.goto('/admin/reminders');
  await page.getByRole('checkbox', { name: /Select Learner 01 / }).check();
  await page.getByRole('button', { name: 'Next students', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(5);
  await page.getByRole('checkbox', { name: /Select Learner 26 / }).check();
  await page.getByRole('button', { name: 'Previous students', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Select Learner 01 / })).toBeChecked();
  await page.getByRole('button', { name: 'Show selected', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
});

test('activity outages block review and refreshing eligibility requires removing unavailable selections', async ({ page }) => {
  const { setStudentFailure, setStudents } = await prepare(page, { studentRows: activityStudents });
  await page.goto('/admin/reminders');
  await page.getByRole('checkbox', { name: /Select Recent Student/ }).check();
  setStudentFailure(true);
  await page.getByRole('button', { name: 'Refresh students', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not refresh student activity');
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
  setStudentFailure(false); setStudents(activityStudents.slice(1));
  await page.getByRole('button', { name: 'Refresh students', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('no longer eligible');
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Remove unavailable selections', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
});

test('review explains missing selections and remains available when only old reminder history fails', async ({ page }) => {
  await prepare(page);
  await page.route('**/api/practice-reminders/campaigns', route => route.fulfill({ status: 503, json: { error: 'History temporarily unavailable' } }));
  await page.goto('/admin/reminders');
  await expect(page.locator('#reminder-review-help')).toContainText('Choose who should receive this reminder.');
  await page.getByRole('button', { name: 'Select all matching', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeEnabled();
  await page.getByRole('button', { name: /^Review & send/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('review explains when the live email service has not been configured', async ({ page }) => {
  await prepare(page, { emailConfigured: false });
  await page.goto('/admin/reminders');
  await page.getByRole('button', { name: 'Select all matching', exact: true }).click();
  await expect(page.locator('#reminder-review-help')).toContainText('Turn on an email service in Email settings first.');
  await expect(page.getByRole('button', { name: /^Review & send/ })).toBeDisabled();
});

test('templates fill the message and pick the right students, and the reminder sits above the student list', async ({ page }) => {
  const rows = activityStudents.map((student, index) => ({ ...student, accessDaysLeft: [3, 40, 20, 10, 90][index], accessEndsAt: '2026-12-01T00:00:00Z' }));
  const { requests } = await prepare(page, { studentRows: rows });
  await page.goto('/admin/reminders');
  const templates = page.getByRole('radiogroup', { name: 'Reminder template' }).getByRole('radio');
  await expect(templates).toHaveCount(4);
  await expect(templates).toHaveText([/Daily practice/, /We miss you/, /Mock test challenge/, /Access ending soon/]);
  await expect(page.getByRole('radio', { name: /Daily practice/ })).toHaveAttribute('aria-checked', 'true');

  // "We miss you" selects students inactive 7+ days (seven and fourteen days).
  await page.getByRole('radio', { name: /We miss you/ }).click();
  await expect(page.getByLabel('Subject', { exact: true })).toHaveValue('Your Chinese is waiting for you');
  await expect(page.getByRole('radio', { name: /Inactive 7\+ days/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.reminder-selected')).toContainText('2 students will receive');

  // "Access ending soon" selects students whose access ends within 14 days (3 and 10 days left).
  await page.getByRole('radio', { name: /Access ending soon/ }).click();
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue(/Your course access ends soon/);
  await page.getByRole('button', { name: /^Review & send to 2/ }).click();
  await expect(page.getByRole('dialog')).toContainText('2 subscribed students');
  const ids = requests.find(request => request.path.endsWith('/preview')).body.studentIds;
  expect([...ids].sort()).toEqual([rows[0].user, rows[3].user]);
  await page.keyboard.press('Escape');

  // Edits can be undone with one click.
  await page.getByLabel('Subject', { exact: true }).fill('Custom subject');
  await page.getByRole('button', { name: 'Reset to template' }).click();
  await expect(page.getByLabel('Subject', { exact: true })).toHaveValue('Make the most of your Chinese course access');

  // The send card comes before the history and the student table.
  const top = async selector => (await page.locator(selector).boundingBox()).y;
  expect(await top('.reminder-send')).toBeLessThan(await top('.reminder-history'));
  expect(await top('.reminder-history')).toBeLessThan(await top('.reminder-student-picker'));
});
