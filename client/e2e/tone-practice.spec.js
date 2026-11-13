import { test, expect } from '@playwright/test';
const questions = [
  { _id: '507f1f77bcf86cd799439012', syllable: 'ma', audioUrl: '/tone-test.wav' },
  { _id: '507f1f77bcf86cd799439013', syllable: 'ba', audioUrl: '/tone-test.wav' },
];
const key = { [questions[0]._id]: 2, [questions[1]._id]: 4 };
function audio() {
  const b = Buffer.alloc(1644); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40); return b;
}
async function prepare(page, { empty = false, broken = false, failSave = false, signedIn = true } = {}) {
  const saved = new Map(); let fail = failSave, posts = 0;
  await page.addInitScript(signedIn => {
    Math.random = () => .99;
    if (signedIn) { localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' })); }
  }, signedIn);
  await page.route('https://**/*', r => r.abort());
  await page.route('**/tone-test.wav', r => broken ? r.abort() : r.fulfill({ body: audio(), contentType: 'audio/wav' }));
  await page.route('**/api/**', async r => {
    const path = new URL(r.request().url()).pathname.replace('/api', ''); let data = [];
    if (path === '/pinyin-table') data = { initials: ['m'], finals: ['a'], syllables: [{ initial: 'm', final: 'a', syllable: 'ma' }] };
    if (path === '/tone-practice/questions') data = { questions: empty ? [] : questions };
    if (path === '/tone-practice/answer') {
      posts++;
      if (fail) { fail = false; return r.fulfill({ status: 503, json: { error: 'Save unavailable' } }); }
      const body = r.request().postDataJSON();
      data = { recordingId: body.recordingId, syllable: questions.find(q => q._id === body.recordingId).syllable, selectedTone: body.selectedTone, correctTone: key[body.recordingId], correct: body.selectedTone === key[body.recordingId] };
      if (!saved.has(body.recordingId)) saved.set(body.recordingId, data);
    }
    if (path === '/analytics/me') data = { scoreTrend: [], weakestWords: [], totalAttempts: 0, completedLessons: 0, hasStudioActivity: saved.size > 0 };
    if (path === '/studio-activity/me') {
      const rows = [...saved.values()];
      data = { studios: [{ studio: 'tones', activities: rows.length, graded: rows.length, correct: rows.filter(x => x.correct).length, accuracy: rows.length ? Math.round(rows.filter(x => x.correct).length / rows.length * 100) : null }], tonePerformance: [1, 2, 3, 4].map(tone => {
        const items = rows.filter(x => x.correctTone === tone), correct = items.filter(x => x.correct).length;
        return { tone, attempted: items.length, correct, accuracy: items.length ? Math.round(correct / items.length * 100) : null };
      }), hsk: [], otherTests: [] };
    }
    if (path === '/studio-activity/tones' && r.request().method() === 'DELETE') { saved.clear(); data = { message: 'Reset' }; }
    await r.fulfill({ json: data });
  });
  return { saved, posts: () => posts };
}
async function start(page) {
  await page.goto('/practice/tones'); await page.getByRole('button', { name: 'Start tone practice' }).click();
}
async function answer(page, tone) {
  await page.getByRole('button', { name: 'Play recording', exact: true }).click();
  const option = page.getByRole('radio', { name: new RegExp(`Tone ${tone}`) });
  await expect(option).toBeEnabled(); await option.check(); await page.getByRole('button', { name: 'Check tone', exact: true }).click();
}

test('audio unlocks four choices, a full round shows correct/wrong results and progress analytics', async ({ page }) => {
  const context = await prepare(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Tone listening/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Pinyin & tones Build a clear foundation/ }).click();
  await page.getByRole('link', { name: 'Practice identifying tones' }).click();
  await page.getByRole('button', { name: 'Start tone practice' }).click();
  await expect(page.getByRole('radio')).toHaveCount(4); await expect(page.getByRole('radio').first()).toBeDisabled();
  await answer(page, 2); await expect(page.getByRole('status')).toContainText('Correct!');
  await page.getByRole('button', { name: 'Next recording' }).click();
  await expect(page.getByRole('radio').first()).toBeDisabled();
  await answer(page, 1); await expect(page.getByRole('status')).toContainText('Tone 4');
  await page.getByRole('button', { name: 'See results' }).click();
  await expect(page.getByRole('heading', { name: '1 of 2 correct' })).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Review');
  await page.getByRole('link', { name: 'View My Progress' }).click();
  const card = page.locator('article').filter({ has: page.getByRole('link', { name: 'Tone listening', exact: true }) });
  await expect(card).toContainText('1 of 2 answers correct'); await expect(card).toContainText('50%');
  await expect(card.locator('.studio-tone-breakdown')).toContainText('Tone 4'); expect(context.saved.size).toBe(2);
});

test('repeats preserve first-answer counts and tone reset requires confirmation', async ({ page }) => {
  const { saved } = await prepare(page);
  await start(page); await answer(page, 1); await page.getByRole('button', { name: 'Next recording' }).click();
  await answer(page, 4); await page.getByRole('button', { name: 'See results' }).click();
  await page.getByRole('button', { name: 'Start another round' }).click(); await answer(page, 2);
  expect(saved.size).toBe(2); expect(saved.get(questions[0]._id).correct).toBe(false);
  await page.goto('/progress');
  const card = page.locator('article').filter({ has: page.getByRole('link', { name: 'Tone listening', exact: true }) });
  await expect(card).toContainText('1 of 2 answers correct');
  page.once('dialog', d => d.accept()); await card.getByRole('button', { name: 'Reset Tone listening count' }).click();
  await expect(card.getByRole('button', { name: 'Reset Tone listening count' })).toBeDisabled();
  await expect(card.locator('.studio-tone-breakdown')).not.toContainText('100%'); expect(saved.size).toBe(0);
});

test('save failure preserves the question and choice for a successful retry', async ({ page }) => {
  const context = await prepare(page, { failSave: true }); await start(page); await answer(page, 2);
  await expect(page.getByRole('alert')).toContainText('Save unavailable');
  await expect(page.getByText('Question 1 of 2')).toBeVisible(); await expect(page.getByRole('radio', { name: /Tone 2/ })).toBeChecked();
  await page.getByRole('button', { name: 'Check tone', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Correct!'); expect(context.posts()).toBe(2); expect(context.saved.size).toBe(1);
});

test('broken audio can be skipped without grading or counting', async ({ page }) => {
  const context = await prepare(page, { broken: true }); await start(page);
  await page.getByRole('button', { name: 'Play recording', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByRole('radio').first()).toBeDisabled();
  await page.getByRole('button', { name: 'Skip recording' }).click(); await page.getByRole('button', { name: 'Skip recording' }).click();
  await expect(page.getByRole('heading', { name: 'No answers checked' })).toBeVisible(); expect(context.posts()).toBe(0);
});

test('empty bank is explained', async ({ page }) => {
  await prepare(page, { empty: true }); await page.goto('/practice/tones');
  await expect(page.getByRole('heading', { name: 'No recorded pinyin yet' })).toBeVisible();
});

test('tone practice requires sign-in on direct visits', async ({ page }) => {
  await prepare(page, { signedIn: false }); await page.goto('/practice/tones');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fpractice%2Ftones/);
});

test('phone layout and keyboard tone selection work', async ({ page }) => {
  await prepare(page); await page.setViewportSize({ width: 375, height: 812 }); await start(page);
  await page.getByRole('button', { name: 'Play recording', exact: true }).click();
  const first = page.getByRole('radio').first(); await expect(first).toBeEnabled(); await first.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /Tone 2/ })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
