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
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/access-requests/my') ? [{ scope: 'tests', status: 'approved' }] : [] }));
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

test('choosing the male voice reads numbers with the server male voice', async ({ page }) => {
  await prepare(page, [{ name: 'Google 普通话（中国大陆）', lang: 'zh-CN', voiceURI: 'google-zh' }]);
  const tts = [];
  await page.route('**/api/tts/status', route => route.fulfill({ json: { enabled: true } }));
  await page.route('**/api/tts?*', route => {
    tts.push(Object.fromEntries(new URL(route.request().url()).searchParams));
    const b = Buffer.alloc(1644); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40);
    return route.fulfill({ status: 200, contentType: 'audio/wav', body: b });
  });
  await page.goto('/practice/numbers');
  await page.getByRole('button', { name: /Male voice/ }).click();
  await page.getByRole('button', { name: 'Ages', exact: true }).click();
  await expect.poll(() => tts.length).toBeGreaterThanOrEqual(1);
  expect(tts[0].speaker).toBe('B');
  expect(tts[0].text).toMatch(/[一-鿿]/);
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled();
  expect(await page.evaluate(() => window.__spoken.length)).toBe(0);
});

// Answers the server voice requests with a short silent WAV and records what was asked for.
async function serverVoice(page) {
  const tts = [];
  await page.route('**/api/tts/status', route => route.fulfill({ json: { enabled: true } }));
  await page.route('**/api/tts?*', route => {
    tts.push(Object.fromEntries(new URL(route.request().url()).searchParams));
    const b = Buffer.alloc(1644); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40);
    return route.fulfill({ status: 200, contentType: 'audio/wav', body: b });
  });
  return tts;
}

test('when the server voice is set up, numbers use it even if the device has a Mandarin voice', async ({ page }) => {
  await prepare(page, [{ name: 'Google 普通话（中国大陆）', lang: 'zh-CN', voiceURI: 'google-zh' }]);
  const tts = await serverVoice(page);
  await page.goto('/practice/numbers');
  await page.getByRole('button', { name: 'Prices', exact: true }).click();
  await expect.poll(() => tts.length).toBeGreaterThanOrEqual(1);
  expect(tts[0]).toMatchObject({ speaker: 'A', speed: 'normal' });
  await page.getByRole('button', { name: 'Slow · 0.75×' }).click();
  await expect.poll(() => tts.at(-1)?.speed).toBe('slow');
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled();
  expect(await page.evaluate(() => window.__spoken.length)).toBe(0);
});

test('a device with no Mandarin voice (e.g. Brave or Firefox on Linux) still hears numbers from the server', async ({ page }) => {
  await prepare(page, [{ name: 'Samantha', lang: 'en-US', voiceURI: 'samantha' }]);
  const tts = await serverVoice(page);
  await page.goto('/practice/numbers');
  await page.getByRole('button', { name: 'Ages', exact: true }).click();
  await expect.poll(() => tts.length).toBeGreaterThanOrEqual(1);
  expect(tts[0].speaker).toBe('A');
  await expect(page.getByText('No Mandarin voice was found')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled();
});
