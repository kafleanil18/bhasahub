import { test, expect } from '@playwright/test';

async function prepare(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
    const voice = { name: 'Google 普通话（中国大陆）', lang: 'zh-CN', voiceURI: 'google-zh' };
    const synth = new EventTarget(); synth.getVoices = () => [voice]; synth.cancel = () => {};
    synth.speak = utterance => setTimeout(() => { utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 30); }, 10);
    Object.defineProperty(window, 'speechSynthesis', { value: synth });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  });
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === '/api/access-requests/my' ? [{ scope: 'tests', status: 'approved' }] : [] });
  });
}

test('a mixed round fills the gap, explains each answer and ends with results', async ({ page }) => {
  await prepare(page);
  await page.goto('/practice/measure-words');
  await expect(page.getByRole('heading', { name: 'Measure word practice' })).toBeVisible();
  await page.getByRole('button', { name: 'Mixed practice' }).click();
  await expect(page.locator('.measure-chip')).toHaveText('Mixed');
  for (let question = 1; question <= 10; question++) {
    await expect(page.getByText(`${question} / 10`, { exact: true })).toBeVisible();
    await expect(page.getByLabel('Missing measure word', { exact: true })).toBeVisible();
    await page.getByRole('group', { name: 'Choose a measure word' }).getByRole('button').first().click();
    await expect(page.locator('.measure-feedback')).toContainText(/Correct!|Use .+ here/);
    await expect(page.locator('.measure-gap[aria-label^="Measure word "]')).toBeVisible();
    const next = page.getByRole('button', { name: question === 10 ? 'See results' : 'Next →' });
    await expect(next).toBeFocused();
    await next.click();
  }
  await expect(page.getByRole('heading', { name: /of 10 correct/ })).toBeVisible();
  await page.getByRole('button', { name: 'All topics', exact: true }).click();
  await page.getByRole('button', { name: 'Food & drinks' }).click();
  await expect(page.locator('.measure-chip')).toHaveText('Food & drinks');
});
