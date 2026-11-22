import { test, expect } from '@playwright/test';
const pairs = [
  { id: 'ni-hao', hanzi: '你好', syllables: ['ni', 'hao'], english: 'hello', audioUrl: '/pair-test.wav', toneRule: true },
  { id: 'jin-tian', hanzi: '今天', syllables: ['jin', 'tian'], english: 'today', audioUrl: '/pair-test.wav', toneRule: false },
];
const key = {
  'ni-hao': { pinyin: 'ní hǎo', writtenPinyin: 'nǐ hǎo', rule: 'third', toneChange: true, correctTones: [2, 3] },
  'jin-tian': { pinyin: 'jīn tiān', writtenPinyin: null, rule: null, toneChange: false, correctTones: [1, 1] },
};
function audio() {
  const b = Buffer.alloc(1644); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40); return b;
}
async function prepare(page, { failSave = false, pairList = pairs } = {}) {
  const saved = new Map(); let fail = failSave, posts = 0;
  await page.addInitScript(() => {
    Math.random = () => .99;
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('https://**/*', r => r.abort());
  await page.route('**/pair-test.wav', r => r.fulfill({ body: audio(), contentType: 'audio/wav' }));
  await page.route('**/api/**', async r => {
    const path = new URL(r.request().url()).pathname.replace('/api', ''); let data = [];
    if (path === '/tone-practice/questions') data = { questions: [] };
    if (path === '/tone-practice/pairs') data = { pairs: pairList };
    if (path === '/tone-practice/pairs/answer') {
      posts++;
      if (fail) { fail = false; return r.fulfill({ status: 503, json: { error: 'Save unavailable' } }); }
      const body = r.request().postDataJSON(); const pair = pairs.find(item => item.id === body.pairId);
      const correct = body.selectedTones.every((tone, index) => tone === key[pair.id].correctTones[index]);
      data = { pairId: pair.id, hanzi: pair.hanzi, english: pair.english, ...key[pair.id], selectedTones: body.selectedTones, correct };
      if (!saved.has(pair.id)) saved.set(pair.id, data);
    }
    if (path === '/analytics/me') data = { scoreTrend: [], weakestWords: [], totalAttempts: 0, completedLessons: 0, hasStudioActivity: saved.size > 0 };
    if (path === '/studio-activity/me') {
      const rows = [...saved.values()], changes = rows.filter(row => row.toneChange);
      const summary = items => ({ attempted: items.length, correct: items.filter(x => x.correct).length, accuracy: items.length ? Math.round(items.filter(x => x.correct).length / items.length * 100) : null });
      data = { studios: [{ studio: 'tones', activities: rows.length, total: pairs.length, graded: rows.length, correct: rows.filter(x => x.correct).length, accuracy: summary(rows).accuracy }], tonePerformance: [], tonePairPerformance: { ...summary(rows), toneChanges: summary(changes) }, hsk: [], otherTests: [] };
    }
    await r.fulfill({ json: data });
  });
  return { saved, posts: () => posts };
}
const choose = async (page, syllable, tone) => {
  const option = page.getByRole('radio', { name: `${syllable} tone ${tone}`, exact: true });
  await expect(option).toBeEnabled({ timeout: 15000 }); await option.check({ force: true });
};

test('both syllables are answered, tone changes are explained, and progress shows attempted words', async ({ page }) => {
  const context = await prepare(page);
  await page.goto('/practice/tones');
  await page.getByRole('button', { name: 'Tone pairs', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(8);
  const first = await page.locator('.tone-pair-word [lang="zh-CN"]').textContent();
  // Answer 你好 with its written tones (3 + 3) to see the third-tone rule; answer 今天 correctly.
  for (const word of [first, first === '你好' ? '今天' : '你好']) {
    await expect(page.locator('.tone-pair-word')).toContainText(word);
    if (word === '你好') {
      await choose(page, 'ni', 3); expect(context.posts()).toBe(0);
      await choose(page, 'hao', 3);
      await expect(page.getByRole('status')).toContainText('Keep practicing.');
      await expect(page.getByRole('status')).toContainText('When two 3rd tones meet');
      await expect(page.locator('.tone-choice.is-correct')).toHaveCount(2);
    } else {
      await choose(page, 'jin', 1); await choose(page, 'tian', 1);
      await expect(page.getByRole('status')).toContainText('Correct!');
    }
  }
  await expect(page.getByRole('heading', { name: '1 of 2 correct' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('table')).toContainText('tone change');
  expect(context.saved.size).toBe(2);
  await page.getByRole('link', { name: 'View My Progress' }).click();
  const card = page.locator('article').filter({ has: page.getByRole('link', { name: 'Tone listening', exact: true }) });
  await expect(card.getByRole('img', { name: `Tone listening: 2 of ${pairs.length} questions attempted, ${Math.round(2 / pairs.length * 100)}%` })).toBeVisible();
  await expect(card.locator('.studio-tone-pairs')).toHaveCount(0);
});

test('tone-change focus only uses rule words and save failures can be retried', async ({ page }) => {
  const context = await prepare(page, { failSave: true });
  await page.goto('/practice/tones');
  await page.getByText('Options').click();
  await page.getByRole('checkbox', { name: /Tone changes only \(1 word\)/ }).check();
  await page.getByRole('button', { name: 'Tone pairs', exact: true }).click();
  await expect(page.getByText('1 / 1', { exact: true })).toBeVisible();
  await choose(page, 'ni', 2); await choose(page, 'hao', 3);
  await expect(page.getByRole('alert')).toContainText('Save unavailable');
  await page.getByRole('button', { name: 'Retry answer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Correct!');
  expect(context.posts()).toBe(2);
  await expect(page.getByRole('heading', { name: '1 of 1 correct' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Tone pairs', exact: true })).toBeVisible();
});

test('without recordings or a Mandarin device voice, tone pairs explain what is needed', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined }); });
  await prepare(page, { pairList: pairs.map(pair => ({ ...pair, audioUrl: '' })) });
  await page.goto('/practice/tones');
  await expect(page.getByText('Tone pairs need a teacher recording or a Mandarin voice')).toBeVisible();
});

test('tone pair choices fit a phone screen', async ({ page }) => {
  await prepare(page); await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/practice/tones'); await page.getByRole('button', { name: 'Tone pairs', exact: true }).click();
  await expect(page.getByRole('radio').first()).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
