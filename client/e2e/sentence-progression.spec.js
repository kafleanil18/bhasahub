import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync(new URL('../../server/data/hsk1Sentences.json', import.meta.url), 'utf8'));
const sentences = catalog.sentences.slice(0, 10).map(sentence => ({ ...sentence, audioUrl: '/unavailable-recording.mp3' }));

async function prepare(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
    Math.random = () => 0.99;
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/studio-activity') return route.fulfill({ status: 500, json: { error: 'Unavailable' } });
    await route.fulfill({ json: path === '/sentences' ? { ...catalog, sentences } : [] });
  });
  await page.route('https://**/*', route => route.abort());
  await page.goto('/practice/sentences');
  await page.getByRole('button', { name: 'Start mixed practice' }).click();
}

async function answer(page, sentence, correct = true) {
  const words = page.getByRole('group', { name: 'Available words' });
  const tokens = correct ? sentence.tokens : [...sentence.tokens].reverse();
  for (const token of tokens) {
    await words.getByRole('button', { name: token, exact: true }).and(page.locator(':enabled')).first().click();
  }
  await page.getByRole('button', { name: 'Check sentence', exact: true }).click();
}

test('ten sentences advance through feedback and finish despite audio and analytics outages', async ({ page }) => {
  await prepare(page);
  for (let index = 0; index < sentences.length; index++) {
    await expect(page.getByText(`Sentence ${index + 1} of 10`, { exact: true })).toBeVisible();
    await answer(page, sentences[index], index % 2 === 0);
    await expect(page.getByRole('button', { name: index === 9 ? 'See results' : 'Next sentence' })).toBeVisible();
    await page.getByRole('button', { name: index === 9 ? 'See results' : 'Next sentence' }).click();
  }
  await expect(page.getByText('Session complete', { exact: true })).toBeVisible();
});

test('analytics setup errors cannot lock a sentence after several answers', async ({ page }) => {
  await prepare(page);
  for (let index = 0; index < 3; index++) {
    await answer(page, sentences[index]);
    await page.getByRole('button', { name: 'Next sentence' }).click();
  }
  await page.evaluate(() => { crypto.randomUUID = () => { throw new Error('UUID unavailable'); }; });
  await answer(page, sentences[3]);
  await expect(page.getByRole('button', { name: 'Next sentence' })).toBeVisible();
  await page.getByRole('button', { name: 'Next sentence' }).click();
  await expect(page.getByText('Sentence 5 of 10', { exact: true })).toBeVisible();
});
