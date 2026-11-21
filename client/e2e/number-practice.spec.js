import { test, expect } from '@playwright/test';

async function prepare(page, voices) {
  await page.addInitScript(voices => {
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
    window.__spoken = [];
    const synth = new EventTarget(); synth.getVoices = () => voices; synth.cancel = () => {};
    synth.speak = utterance => { window.__spoken.push(utterance.voice?.name); setTimeout(() => { utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 30); }, 10); };
    Object.defineProperty(window, 'speechSynthesis', { value: synth });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  }, voices);
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => route.fulfill({ json: [] }));
}

test('numbers prefer the Google Mandarin voice over other device voices', async ({ page }) => {
  await prepare(page, [{ name: 'Tingting', lang: 'zh-CN', voiceURI: 'tingting' }, { name: 'Google 普通话（中国大陆）', lang: 'zh-CN', voiceURI: 'google-zh' }]);
  await page.goto('/practice/numbers');
  await expect(page.getByRole('heading', { name: 'Everyday Chinese Numbers' })).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ages', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled();
  await page.getByRole('button', { name: 'Slow · 0.75×' }).click();
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThanOrEqual(2);
  expect(new Set(await page.evaluate(() => window.__spoken))).toEqual(new Set(['Google 普通话（中国大陆）']));
  await page.locator('#number-answer-value').fill('99');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.locator('.number-feedback')).toContainText('Not quite');
  await expect(page.getByRole('button', { name: 'Next →' })).toBeFocused();
});

test('without a Google voice, numbers fall back to the device’s female Mandarin voice', async ({ page }) => {
  await prepare(page, [{ name: 'Microsoft Kangkang - Chinese (Simplified, PRC)', lang: 'zh-CN', voiceURI: 'kangkang' }, { name: 'Tingting', lang: 'zh-CN', voiceURI: 'tingting' }]);
  await page.goto('/practice/numbers');
  await page.getByRole('button', { name: 'Prices', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  expect(new Set(await page.evaluate(() => window.__spoken))).toEqual(new Set(['Tingting']));
});

test('with no Mandarin voice at all, students are told how to add one', async ({ page }) => {
  await prepare(page, [{ name: 'Samantha', lang: 'en-US', voiceURI: 'samantha' }]);
  await page.goto('/practice/numbers');
  await expect(page.getByRole('status')).toContainText('No Mandarin voice was found', { timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Prices', exact: true })).toBeDisabled();
});
