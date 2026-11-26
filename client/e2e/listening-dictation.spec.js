import { test, expect } from '@playwright/test';

const topics = [{ id: 'identity', title: 'People and identity' }, { id: 'family', title: 'Family and ages' }, { id: 'empty', title: 'No audio yet' }];
const sentences = [
  { id: 's1', topicId: 'identity', tokens: ['我', '是', '学生'], chinese: '我是学生。', english: 'I am a student.', tokenPinyin: [['wǒ'], ['shì'], ['xué', 'sheng']], audioUrl: '/dictation-test.wav' },
  { id: 's2', topicId: 'family', tokens: ['我', '有', '妈妈'], chinese: '我有妈妈。', english: 'I have a mother.', tokenPinyin: [['wǒ'], ['yǒu'], ['mā', 'ma']], audioUrl: '/dictation-test.wav' },
  { id: 's3', topicId: 'empty', tokens: ['你', '好'], chinese: '你好。', english: 'Hello.', tokenPinyin: [['nǐ'], ['hǎo']], audioUrl: '' },
];
function wav() {
  const b = Buffer.alloc(1644); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40); return b;
}
async function prepare(page, list = sentences) {
  await page.addInitScript(() => {
    Math.random = () => .99;
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('https://**/*', route => route.abort());
  await page.route('**/dictation-test.wav', route => route.fulfill({ body: wav(), contentType: 'audio/wav' }));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/access-requests/my') return route.fulfill({ json: [{ scope: 'tests', status: 'approved' }] });
    return route.fulfill({ json: path === '/api/sentences' ? { topics, sentences: list } : {} });
  });
}

test('mixed dictation grades characters, explains mistakes and shows results', async ({ page }) => {
  await prepare(page);
  await page.goto('/practice/dictation');
  await expect(page.getByRole('heading', { name: 'Listening dictation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'No audio yet' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'People and identity' })).toContainText('1 recording');
  await page.getByRole('button', { name: 'Mixed dictation' }).click();
  await expect(page.locator('.dictation-chip')).toHaveText('Mixed');
  const box = page.getByLabel('Your answer in Chinese characters');
  for (let question = 1; question <= 2; question++) {
    await expect(page.getByText(`${question} / 2`, { exact: true })).toBeVisible();
    const target = await page.evaluate(() => document.querySelector('audio').getAttribute('src'));
    expect(target).toContain('dictation-test.wav');
    if (question === 1) {
      await box.fill('我是');
      await page.getByRole('button', { name: 'Check answer' }).click({ timeout: 15000 });
      await expect(page.locator('.dictation-feedback')).toContainText('Not quite');
      await expect(page.getByRole('list', { name: 'Character feedback' })).toContainText('Missing');
    } else {
      await box.fill('我有妈妈');
      await page.getByRole('button', { name: 'Check answer' }).click({ timeout: 15000 });
      await expect(page.locator('.dictation-feedback')).toContainText(/Correct!|Not quite/);
    }
    const next = page.getByRole('button', { name: question === 2 ? 'See results' : 'Next', exact: true });
    await expect(next).toBeFocused();
    await next.click();
  }
  await expect(page.getByRole('heading', { name: /of 2 sentences correct/ })).toBeVisible();
  await page.getByRole('region').getByRole('button', { name: 'All topics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Listening dictation' })).toBeVisible();
});

test('with no recordings, students see that dictation is coming soon', async ({ page }) => {
  await prepare(page, sentences.map(sentence => ({ ...sentence, audioUrl: '' })));
  await page.goto('/practice/dictation');
  await expect(page.getByRole('heading', { name: 'Teacher recordings are coming soon' })).toBeVisible();
});
