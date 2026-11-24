import { test, expect } from '@playwright/test';

// Fake speech engine: records what was spoken and with which voice.
async function prepare(page, voices, { natural = false } = {}) {
  await page.addInitScript(list => {
    localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify({ id: 's', name: 'S', role: 'student' }));
    window.__spoken = []; window.__audioPlays = 0;
    const fakeVoices = list.map(([name, lang]) => ({ name, lang, voiceURI: name }));
    window.__audioSrcs = [];
    HTMLMediaElement.prototype.play = function () { window.__audioPlays++; window.__audioSrcs.push(this.src); return Promise.resolve(); };
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { value: {
      getVoices: () => fakeVoices, addEventListener() {}, removeEventListener() {}, cancel() {},
      speak(u) { window.__spoken.push({ text: u.text, voice: u.voice?.name }); setTimeout(() => u.onstart?.(), 10); setTimeout(() => u.onend?.(), 120); },
    } });
  }, voices);
  await page.route('**/api/settings', r => r.fulfill({ json: { conversationLessons: [] } }));
  await page.route('**/api/**', r => r.fulfill({ json: {} }));
  await page.route('**/api/tts/status', r => r.fulfill({ json: { enabled: natural } }));
  await page.route('**/api/access-requests/my', r => r.fulfill({ json: [{ scope: 'tests', status: 'approved' }] }));
  await page.route('https://**/*', r => r.abort());
  await page.goto('/practice/conversations');
}
const spoken = page => page.evaluate(() => window.__spoken);

test('a lesson plays one line at a time with the Google voice and ends with word review', async ({ page }) => {
  await prepare(page, [['Tingting', 'zh-CN'], ['Google 普通话（中国大陆）', 'zh-CN']]);
  await expect(page.getByRole('heading', { name: /你好/ })).toBeVisible();
  await page.getByRole('button', { name: 'Start conversation' }).click();
  await expect(page.getByText('1 / 6')).toBeVisible();
  await expect.poll(() => spoken(page)).toEqual([{ text: '你好！', voice: 'Google 普通话（中国大陆）' }]);
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByText('2 / 6')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('3 / 6')).toBeVisible();
  await expect(page.locator('.cp-chinese')).toHaveText('您好！');
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(page.getByText('2 / 6')).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('.cp-english')).toHaveCount(0);
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /Next →|Finish/ }).click();
  await expect(page.getByRole('heading', { name: 'Nice work!' })).toBeVisible();
  await page.getByRole('button', { name: 'Listen to 你, nǐ: you (one person)' }).click();
  await expect.poll(async () => (await spoken(page)).at(-1)).toEqual({ text: '你', voice: 'Google 普通话（中国大陆）' });
  expect(new Set((await spoken(page)).map(item => item.voice))).toEqual(new Set(['Google 普通话（中国大陆）']));
  expect(await page.evaluate(() => window.__audioPlays)).toBe(0);
  await page.getByRole('button', { name: 'Next lesson →' }).click();
  await expect(page.getByRole('button', { name: 'Start conversation' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Choose lesson' })).toHaveValue(/./);
});

test('with the Azure voice set up, lines play natural audio with a voice per speaker', async ({ page }) => {
  await prepare(page, [['Google 普通话（中国大陆）', 'zh-CN']], { natural: true });
  // Registered after prepare's catch-all so it wins: clips stay loading, so no fallback.
  await page.route('**/api/tts?*', () => {});
  await expect(page.locator('.cp-voice-note')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start conversation' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  const srcs = await page.evaluate(() => window.__audioSrcs.map(src => Object.fromEntries(new URL(src).searchParams)));
  expect(srcs).toEqual([{ text: '你好！', speaker: 'A', speed: 'normal' }, { text: '你好！', speaker: 'B', speed: 'normal' }]);
  expect(await spoken(page)).toEqual([]);
});

test('if a natural clip fails to load, the browser voice reads the line instead', async ({ page }) => {
  await prepare(page, [['Google 普通话（中国大陆）', 'zh-CN']], { natural: true });
  await page.getByRole('button', { name: 'Start conversation' }).click();
  await expect.poll(() => spoken(page)).toEqual([{ text: '你好！', voice: 'Google 普通话（中国大陆）' }]);
});

test('without a Google voice the best Mandarin voice is used and explained', async ({ page }) => {
  await prepare(page, [['Tingting', 'zh-CN']]);
  await expect(page.getByText(/Google voice isn’t available here, so Tingting is used/)).toBeVisible();
  await page.getByRole('button', { name: 'Start conversation' }).click();
  await expect.poll(async () => (await spoken(page)).at(-1)?.voice).toBe('Tingting');
});

for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1280, 800]]) {
  test(`fits a ${width}px screen without scrolling sideways, controls visible`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await prepare(page, [['Google 普通话（中国大陆）', 'zh-CN']]);
    await page.getByRole('button', { name: 'Start conversation' }).click();
    const next = page.getByRole('button', { name: 'Next →' });
    await expect(next).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('the whole card fits on screen on desktop and phone, without page scrolling', async ({ page }) => {
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await prepare(page, [['Google 普通话（中国大陆）', 'zh-CN']]);
    await page.getByRole('button', { name: 'Start conversation' }).click();
    const box = await page.locator('.cp-card').boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    expect(box.width).toBeLessThanOrEqual(720);
  }
});

test('on a small phone the intro fits, so Start needs no scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await prepare(page, [['Google 普通话（中国大陆）', 'zh-CN']]);
  await expect(page.getByRole('button', { name: 'Start conversation' })).toBeInViewport({ ratio: 1 });
});
