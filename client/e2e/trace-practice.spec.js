import { test, expect } from '@playwright/test';

// One horizontal stroke through the middle of the character box (hanzi-writer data uses a 1024 grid, y flipped).
const YI = { strokes: ['M 150 360 L 874 360 L 874 416 L 150 416 Z'], medians: [[[150, 388], [874, 388]]], radStrokes: [] };

async function prepare(page) {
  const saved = [];
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'student', name: 'Student', role: 'student' }));
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    if (path === '/access-requests/my') return route.fulfill({ json: [{ scope: 'tests', status: 'approved' }] });
    if (path === '/hanzi-trace') return route.fulfill({ json: [
      { _id: 'yi', character: '一', pinyin: 'yī', meaning: 'one', category: 'HSK 1' },
      { _id: 'er', character: '二', pinyin: 'èr', meaning: 'two', category: 'HSK 1' },
    ] });
    if (path === '/studio-activity') { saved.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { saved: true } }); }
    await route.fulfill({ json: {} });
  });
  await page.route('https://cdn.jsdelivr.net/**', route => route.request().url().endsWith('/%E4%B8%80.json') || route.request().url().endsWith('/一.json') ? route.fulfill({ json: YI }) : route.abort());
  return saved;
}

async function draw(page, from, to) {
  await page.waitForTimeout(400); // the quiz starts listening just after the stroke data loads
  const stage = page.locator('.tracing-stage-box');
  // Clicking a button below the box scrolls the page, which can leave the box under the sticky header.
  await stage.scrollIntoViewIfNeeded();
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 12 });
  await page.mouse.up();
}

test('one stage switches between watch, trace and write from memory', async ({ page }) => {
  await prepare(page);
  await page.goto('/practice/characters');
  await page.getByText('一', { exact: true }).first().click();
  const modes = page.getByRole('radiogroup', { name: 'Practice mode' });
  await expect(modes.getByRole('radio', { name: 'Watch' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.tracing-stage-box')).toHaveCount(1);
  await expect(page.getByText('Watch the stroke order, then trace it yourself.')).toBeVisible();
  await page.getByRole('button', { name: 'Start tracing' }).click();
  await expect(modes.getByRole('radio', { name: 'Trace' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Stroke 1 of 1')).toBeVisible();
  await modes.getByRole('radio', { name: 'From memory' }).click();
  await expect(page.getByText('Write it without the outline.')).toBeVisible();
});

test('strokes are checked, and a character counts once it is written correctly', async ({ page }) => {
  const saved = await prepare(page);
  await page.goto('/practice/characters');
  await page.getByText('一', { exact: true }).first().click();
  await page.getByRole('radio', { name: 'Trace' }).click();
  await expect(page.getByText('Stroke 1 of 1')).toBeVisible();

  await draw(page, [0.5, 0.15], [0.5, 0.85]);
  await expect(page.getByText('Not quite. Try that stroke again.')).toBeVisible();
  expect(saved).toHaveLength(0);

  await draw(page, [0.18, 0.5], [0.82, 0.5]);
  await expect(page.getByText('Well done!')).toBeVisible();
  await expect(page.getByText('1 mistake.')).toBeVisible();
  await expect.poll(() => saved.length).toBe(1);
  expect(saved[0]).toMatchObject({ studio: 'trace', itemKey: '一' });

  await page.getByRole('button', { name: 'Write from memory' }).click();
  await expect(page.getByRole('radio', { name: 'From memory' })).toHaveAttribute('aria-checked', 'true');
  await draw(page, [0.18, 0.5], [0.82, 0.5]);
  await expect(page.getByText('No mistakes.')).toBeVisible();
  await page.waitForTimeout(300);
  expect(saved).toHaveLength(1);

  await page.getByRole('button', { name: 'Next character' }).click();
  await expect(page.getByText('2 of 2')).toBeVisible();
  await expect(page.getByText('Stroke checking isn\'t available for this entry.')).toBeVisible();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.getByText('1 of 2')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Watch' })).toHaveAttribute('aria-checked', 'true');
});

test('when stroke data cannot load, students can still draw freely', async ({ page }) => {
  const saved = await prepare(page);
  await page.goto('/practice/characters');
  await page.getByText('二', { exact: true }).first().click();
  await expect(page.getByText('Stroke checking isn\'t available for this entry.')).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Practice mode' })).toHaveCount(0);
  await draw(page, [0.2, 0.4], [0.8, 0.4]);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await expect.poll(() => saved.length).toBe(1);
});

test('in dark mode the character is drawn in white in every mode', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await prepare(page);
  await page.goto('/practice/characters');
  await page.getByText('一', { exact: true }).first().click();
  const strokeColors = () => page.locator('.stroke-demo-canvas path').evaluateAll(paths => paths.map(path => getComputedStyle(path).stroke).filter(stroke => stroke !== 'none'));
  await expect.poll(strokeColors).toContain('rgb(255, 255, 255)');
  for (const mode of ['Trace', 'From memory']) {
    await page.getByRole('radio', { name: mode }).click();
    await draw(page, [0.18, 0.5], [0.82, 0.5]);
    await expect(page.getByText('Well done!')).toBeVisible();
    await expect.poll(strokeColors).toContain('rgb(255, 255, 255)');
  }
  expect(errors).toEqual([]);
});
