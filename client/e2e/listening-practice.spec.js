import { test, expect } from '@playwright/test';

const words = [['你好', 'nǐ hǎo', 'hello'], ['谢谢', 'xiè xie', 'thank you'], ['再见', 'zài jiàn', 'goodbye'], ['老师', 'lǎo shī', 'teacher']]
  .map(([word, pronunciation, meaning], i) => ({ _id: `w${i}`, word, pronunciation, meaning, audioUrl: i === 0 ? '/teacher.mp3' : '' }));
const female = { name: 'Google 普通话（中国大陆）', lang: 'zh-CN', voiceURI: 'google-zh-cn' };
async function prepare(page, voices = [{ name: 'Tingting', lang: 'zh-CN', voiceURI: 'tingting' }, { name: 'Google 國語（臺灣）', lang: 'zh-TW', voiceURI: 'google-zh-tw' }, female]) {
  await page.addInitScript(voices => {
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
    window.__spoken = [];
    const synth = new EventTarget(); synth.getVoices = () => voices; synth.cancel = () => {};
    synth.speak = utterance => { window.__spoken.push({ text: utterance.text, voice: utterance.voice?.name }); setTimeout(() => { utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 30); }, 10); };
    Object.defineProperty(window, 'speechSynthesis', { value: synth });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  }, voices);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/teacher.mp3', route => route.abort());
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
const lastSpoken = page => page.evaluate(() => window.__spoken.at(-1)?.text);

test('every word is read by the female Google Mandarin voice when available, even unrecorded ones', async ({ page }) => {
  await prepare(page);
  await page.goto('/practice/listening');
  await expect(page.getByRole('heading', { name: 'Listening practice' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Spanish/ })).toHaveCount(0);
  await page.getByRole('button', { name: /HSK 1 Chinese/ }).click();
  await expect(page.getByRole('button', { name: /Grammar/ })).toHaveCount(0);
  await page.getByRole('button', { name: /One word only/ }).click();
  await expect(page.getByRole('button', { name: /One word only/ })).toContainText('Needs at least two words');
  await page.getByRole('button', { name: /Greetings/ }).click();
  await expect(page.locator('.listening-chip')).toHaveText('Greetings');
  for (let question = 1; question <= 4; question++) {
    await expect(page.getByText(`${question} / 4`, { exact: true })).toBeVisible();
    await expect.poll(() => lastSpoken(page)).toBeTruthy();
    const current = await lastSpoken(page);
    const answer = words.find(word => word.word === current).meaning;
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
  const spoken = await page.evaluate(() => window.__spoken);
  expect(new Set(spoken.map(item => item.voice))).toEqual(new Set([female.name]));
  expect(new Set(spoken.map(item => item.text))).toEqual(new Set(words.map(word => word.word)));
  await page.getByRole('button', { name: 'All lessons', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Listening practice' })).toBeVisible();
});

test('on Safari, iPhone or Edge without Google voices, words use the device’s female Mandarin voice', async ({ page }) => {
  await prepare(page, [{ name: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)', lang: 'zh-CN', voiceURI: 'yunxi' }, { name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', lang: 'zh-CN', voiceURI: 'xiaoxiao' }]);
  await page.goto('/practice/listening');
  await page.getByRole('button', { name: /HSK 1 Chinese/ }).click();
  await page.getByRole('button', { name: /Greetings/ }).click();
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  expect(new Set(await page.evaluate(() => window.__spoken.map(item => item.voice)))).toEqual(new Set(['Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)']));
});

test('with no Mandarin voice at all, lessons explain how to add one', async ({ page }) => {
  await prepare(page, [{ name: 'Samantha', lang: 'en-US', voiceURI: 'samantha' }]);
  await page.goto('/practice/listening');
  await page.getByRole('button', { name: /HSK 1 Chinese/ }).click();
  await expect(page.locator('.listening-voice-warning')).toContainText('No Mandarin voice was found', { timeout: 5000 });
  await expect(page.getByRole('button', { name: /Greetings/ })).toBeDisabled();
});
