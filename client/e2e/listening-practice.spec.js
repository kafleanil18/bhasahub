import { test, expect } from '@playwright/test';

const words = [['你好', 'nǐ hǎo', 'hello'], ['谢谢', 'xiè xie', 'thank you'], ['再见', 'zài jiàn', 'goodbye'], ['老师', 'lǎo shī', 'teacher']]
  .map(([word, pronunciation, meaning], i) => ({ _id: `w${i}`, word, pronunciation, meaning, audioUrl: `/word-${i}.wav` }));
function wav() {
  const b = Buffer.alloc(1644); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40); return b;
}
async function prepare(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('https://**/*', route => route.abort());
  await page.route('**/word-*.wav', route => route.fulfill({ body: wav(), contentType: 'audio/wav' }));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/courses') return route.fulfill({ json: [{ _id: 'c1', title: 'HSK 1 Chinese', language: 'chinese' }, { _id: 'c2', title: 'HSK 2 Chinese', language: 'chinese' }, { _id: 'c3', title: 'Spanish', language: 'spanish' }] });
    if (path === '/subscriptions/my') return route.fulfill({ json: [{ course: { _id: 'c1' } }, { course: { _id: 'c2' } }] });
    if (path === '/lessons/course/c1') return route.fulfill({ json: [{ _id: 'l1', title: 'Greetings', category: 'vocabulary' }, { _id: 'l2', title: 'One word only', category: 'vocabulary' }, { _id: 'l3', title: 'Grammar', category: 'grammar' }] });
    if (path === '/lessons/l1/vocabulary') return route.fulfill({ json: words });
    if (path === '/lessons/l2/vocabulary') return route.fulfill({ json: words.slice(0, 1) });
    return route.fulfill({ json: [] });
  });
}
const meaningOfCurrent = page => page.evaluate(() => document.querySelector('audio').getAttribute('src').match(/word-(\d)/)[1]);

test('students pick a course and lesson, then hear and match each word', async ({ page }) => {
  await prepare(page);
  await page.goto('/practice/listening');
  await expect(page.getByRole('heading', { name: 'Listening practice' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Spanish/ })).toHaveCount(0);
  await page.getByRole('button', { name: /HSK 1 Chinese/ }).click();
  await expect(page.getByRole('button', { name: /Grammar/ })).toHaveCount(0);
  await page.getByRole('button', { name: /One word only/ }).click();
  await expect(page.getByRole('button', { name: /One word only/ })).toContainText('Needs at least two recorded words');
  await page.getByRole('button', { name: /Greetings/ }).click();
  await expect(page.locator('.listening-chip')).toHaveText('Greetings');
  for (let question = 1; question <= 4; question++) {
    await expect(page.getByText(`${question} / 4`, { exact: true })).toBeVisible();
    const answer = words[Number(await meaningOfCurrent(page))].meaning;
    if (question === 1) {
      await page.locator(`.listening-option:not(:has(input[value="${answer}"]))`).first().click({ timeout: 15000 });
      await expect(page.locator('.listening-feedback')).toContainText('Not quite');
      await expect(page.locator('.listening-option.is-correct')).toHaveText(answer);
      await expect(page.getByRole('button', { name: 'Next →' })).toBeFocused();
      await page.getByRole('button', { name: 'Next →' }).click();
    } else {
      await page.locator(`.listening-option:has(input[value="${answer}"])`).click({ timeout: 15000 });
      await expect(page.locator('.listening-feedback')).toContainText('Correct!');
    }
  }
  await expect(page.getByRole('heading', { name: '3 of 4 correct' })).toBeVisible();
  await page.getByRole('button', { name: 'All lessons', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Listening practice' })).toBeVisible();
});
