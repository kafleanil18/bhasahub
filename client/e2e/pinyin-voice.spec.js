import { test, expect } from '@playwright/test';

const table = {
  initials: ['', 'm', 'l', 'zh'],
  finals: ['a', 'ü', 'ong'],
  syllables: [
    { initial: 'm', final: 'a', syllable: 'ma' },
    { initial: 'l', final: 'ü', syllable: 'lü' },
    { initial: 'zh', final: 'ong', syllable: 'zhong' },
  ],
};

function wav() {
  const b = Buffer.alloc(1644); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40); return b;
}

async function prepare(page, recordings = [], { serverMale = false, deviceMale = false, gender } = {}) {
  await page.addInitScript(({ deviceMale, gender }) => {
    if (gender) localStorage.setItem('mandarinVoiceGender', gender);
    const voices = [
      ...(deviceMale ? [{ name: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)', lang: 'zh-CN', voiceURI: 'yunxi', localService: false, default: false }] : []),
      { name: 'Tingting', lang: 'zh-CN', voiceURI: 'tingting', localService: true, default: true },
      { name: 'Google 普通话（中国大陆）', lang: 'zh-CN', voiceURI: 'google-zh', localService: false, default: false },
    ];
    window.__spoken = [];
    window.__beeps = 0;
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => voices, speak: utterance => window.__spoken.push({ text: utterance.text, voice: utterance.voice?.name }), cancel() {}, addEventListener() {}, removeEventListener() {} } });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    // Count the pitch-beep fallback instead of playing it.
    window.AudioContext = class { constructor() { window.__beeps++; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } close() {} };
  }, { deviceMale, gender });
  const ttsRequests = [];
  await page.route('https://**/*', r => r.abort());
  await page.route('**/api/**', r => {
    const path = new URL(r.request().url()).pathname;
    if (path.endsWith('/pinyin-table')) return r.fulfill({ json: table });
    if (path.endsWith('/pinyin-recordings')) return r.fulfill({ json: recordings });
    if (path.endsWith('/tts/status')) return r.fulfill({ json: { enabled: serverMale } });
    if (path.endsWith('/api/tts')) { ttsRequests.push(Object.fromEntries(new URL(r.request().url()).searchParams)); return r.fulfill({ status: 200, contentType: 'audio/wav', body: wav() }); }
    return r.fulfill({ json: [] });
  });
  await page.goto('/practice/pinyin');
  return { ttsRequests };
}

test('every tone in the pinyin chart is spoken with the Google Mandarin voice', async ({ page }) => {
  await prepare(page);
  await page.locator('td.pinyin-syllable', { hasText: /^ma$/ }).click();
  for (const [mark, character] of [['mā', '妈'], ['má', '麻'], ['mǎ', '马'], ['mà', '骂']]) {
    const button = page.locator('.pinyin-tone-btn', { hasText: mark });
    await expect(button).toContainText(character);
    await button.click();
  }
  await expect.poll(() => page.evaluate(() => window.__spoken)).toEqual(['妈', '麻', '马', '骂'].map(text => ({ text, voice: 'Google 普通话（中国大陆）' })));
  expect(await page.evaluate(() => window.__beeps)).toBe(0);

  // ü syllables are found too.
  await page.locator('td.pinyin-syllable', { hasText: /^lü$/ }).click();
  await page.locator('.pinyin-tone-btn', { hasText: 'lǚ' }).click();
  await expect.poll(() => page.evaluate(() => window.__spoken.at(-1).text)).toBe('吕');
});

test('a sound with no Chinese character keeps the pitch beep, and teacher recordings still come first', async ({ page }) => {
  await prepare(page, [{ _id: 'r1', syllable: 'ma', tone: 1, audioUrl: '/teacher-ma1.webm' }]);
  await page.locator('td.pinyin-syllable', { hasText: /^zhong$/ }).click();
  await page.locator('.pinyin-tone-btn', { hasText: 'zhóng' }).click();
  await expect.poll(() => page.evaluate(() => window.__beeps)).toBe(1);
  expect(await page.evaluate(() => window.__spoken.length)).toBe(0);

  let requested = false;
  await page.route('**/teacher-ma1.webm', r => { requested = true; return r.fulfill({ status: 404 }); });
  await page.locator('td.pinyin-syllable', { hasText: /^ma$/ }).click();
  await page.locator('.pinyin-tone-btn', { hasText: 'mā' }).click();
  await expect.poll(() => requested).toBe(true);
});

test('the male voice uses the server voice when it is set up, and the choice is remembered', async ({ page }) => {
  const { ttsRequests } = await prepare(page, [], { serverMale: true });
  await page.locator('td.pinyin-syllable', { hasText: /^ma$/ }).click();
  await page.getByRole('button', { name: /Male voice/ }).click();
  await page.locator('.pinyin-tone-btn', { hasText: 'mǎ' }).click();
  await expect.poll(() => ttsRequests.length).toBe(1);
  expect(ttsRequests[0]).toMatchObject({ text: '马', speaker: 'B' });
  expect(await page.evaluate(() => window.__spoken.length)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('mandarinVoiceGender'))).toBe('male');
  await page.reload();
  await page.locator('td.pinyin-syllable', { hasText: /^ma$/ }).click();
  await expect(page.getByRole('button', { name: /Male voice/ })).toHaveAttribute('aria-pressed', 'true');
});

test('without the server voice, a male device voice is used, otherwise the page says so', async ({ page }) => {
  await prepare(page, [], { deviceMale: true, gender: 'male' });
  await page.locator('td.pinyin-syllable', { hasText: /^ma$/ }).click();
  await page.locator('.pinyin-tone-btn', { hasText: 'mà' }).click();
  await expect.poll(() => page.evaluate(() => window.__spoken.at(-1))).toEqual({ text: '骂', voice: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)' });
  await expect(page.getByText('A male Mandarin voice isn’t available yet')).toHaveCount(0);
});

test('when no male voice exists the female voice plays and a note explains why', async ({ page }) => {
  await prepare(page, [], { gender: 'male' });
  await page.locator('td.pinyin-syllable', { hasText: /^ma$/ }).click();
  await expect(page.getByText('A male Mandarin voice isn’t available yet, so you’ll hear the female voice.')).toBeVisible();
  await page.locator('.pinyin-tone-btn', { hasText: 'mā' }).click();
  await expect.poll(() => page.evaluate(() => window.__spoken.at(-1))).toEqual({ text: '妈', voice: 'Google 普通话（中国大陆）' });
});
