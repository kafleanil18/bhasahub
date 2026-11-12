import { test, expect } from '@playwright/test';

async function prepare(page, { fail = false, populated = true } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    let data = [];
    if (path === '/analytics/me') data = { streak: 0, totalAttempts: 0, completedLessons: 0, overallAccuracy: 0, scoreTrend: [], accuracyByCourse: [], accuracyByLesson: [], accuracyByTest: [], weakestWords: [] };
    if (path === '/studio-activity/me') {
      if (fail) return route.fulfill({ status: 500, json: { error: 'Unavailable' } });
      data = { studios: populated ? [{ studio: 'sentences', activities: 4, graded: 4, correct: 3, accuracy: 75, lastPracticed: '2026-11-12' }] : [], hsk: populated ? [{ paper: 'h11226', completed: 2, unfinished: 1, bestPercent: 90, averagePercent: 75, lastCompleted: '2026-11-12' }] : [], otherTests: [] };
    }
    await route.fulfill({ json: data });
  });
  await page.route('https://**/*', route => route.abort());
}

test('My Progress shows eight studios and HSK completion details', async ({ page }) => {
  await prepare(page);
  await page.goto('/progress');
  const section = page.getByRole('region', { name: 'Eight skills. Every practice counts.' });
  await expect(section.locator('article')).toHaveCount(9);
  const sentences = section.locator('article').filter({ has: page.getByRole('link', { name: 'Sentence builder', exact: true }) });
  await expect(sentences).toContainText('3 of 4 answers correct');
  await expect(sentences).toContainText('75%');
  await expect(section).toContainText('2 completed attempts · 1 papers completed · 1 unfinished attempts');
  await expect(section.getByRole('link', { name: /H11226/ })).toHaveAttribute('href', '/tests/h11226');
});

test('empty history shows all studios without invented accuracy', async ({ page }) => {
  await prepare(page, { populated: false });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/progress');
  const section = page.getByRole('region', { name: 'Eight skills. Every practice counts.' });
  await expect(section.locator('article')).toHaveCount(8);
  await expect(section).toContainText('No HSK attempts yet');
  await expect(section.locator('article').first()).toContainText('—');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('studio request errors show retry and preserve the rest of My Progress', async ({ page }) => {
  await prepare(page, { fail: true });
  await page.goto('/progress');
  await expect(page.getByRole('heading', { name: 'Your progress, at a glance' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry studio analytics' })).toBeVisible();
});


test('pinyin counts syllable selections rather than individual tone plays', async ({ page }) => {
  await prepare(page);
  const saved = [];
  await page.route('**/api/studio-activity', async route => {
    saved.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, json: { saved: true } });
  });
  await page.route('**/api/pinyin-table', route => route.fulfill({ json: { initials: ['m'], finals: ['a'], syllables: [{ initial: 'm', final: 'a', syllable: 'ma' }] } }));
  await page.goto('/practice/pinyin');
  await page.locator('.pinyin-syllable').filter({ hasText: /^ma$/ }).click();
  await expect.poll(() => saved.length).toBe(1);
  expect(saved[0]).toMatchObject({ studio: 'pinyin', itemKey: 'ma' });
  for (const tone of await page.locator('.pinyin-tone-btn').all()) await tone.click();
  expect(saved).toHaveLength(1);
});

test('drawing multiple strokes counts one character', async ({ page }) => {
  await prepare(page);
  const saved = [];
  await page.route('**/api/hanzi-trace', route => route.fulfill({ json: [{ _id: 'zhong', character: '中', pinyin: 'zhōng', meaning: 'middle', category: 'HSK 1' }] }));
  await page.route('**/api/studio-activity', async route => {
    saved.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, json: { saved: true } });
  });
  await page.goto('/practice/characters');
  await page.getByText('中', { exact: true }).first().click();
  const canvas = page.locator('canvas.tracing-canvas');
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(box.x + 40, box.y + 40 + i * 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 140, box.y + 40 + i * 30, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(() => saved.length).toBe(1);
  expect(saved[0]).toMatchObject({ studio: 'trace', itemKey: '中' });
});


test('reset warns first, cancel preserves data, and confirmation resets only that studio', async ({ page }) => {
  await prepare(page);
  let requests = 0;
  await page.route('**/api/studio-activity/sentences', async route => {
    expect(route.request().method()).toBe('DELETE');
    expect(route.request().postDataJSON()).toEqual({ confirmed: true });
    requests++;
    await route.fulfill({ json: { message: 'Reset' } });
  });
  await page.goto('/progress');
  const button = page.getByRole('button', { name: 'Reset Sentence builder count' });
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('This cannot be undone');
    expect(dialog.message()).toContain('HSK test results');
    await dialog.dismiss();
  });
  await button.click();
  expect(requests).toBe(0);
  const card = page.locator('article').filter({ has: page.getByRole('link', { name: 'Sentence builder', exact: true }) });
  await expect(card).toContainText('3 of 4 answers correct');
  page.once('dialog', dialog => dialog.accept());
  await button.click();
  await expect(page.getByRole('status')).toContainText('Sentence builder count reset');
  expect(requests).toBe(1);
  await expect(card).not.toContainText('3 of 4 answers correct');
  await expect(card).toContainText('Not yet');
  await expect(button).toBeDisabled();
  await expect(page.getByText('2 completed attempts · 1 papers completed · 1 unfinished attempts')).toBeVisible();
});

test('reset failure keeps the current count and reports the uncertainty', async ({ page }) => {
  await prepare(page);
  await page.route('**/api/studio-activity/sentences', route => route.fulfill({ status: 500, json: { error: 'Unavailable' } }));
  await page.goto('/progress');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset Sentence builder count' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not confirm the reset');
  await expect(page.getByText('3 of 4 answers correct')).toBeVisible();
});
