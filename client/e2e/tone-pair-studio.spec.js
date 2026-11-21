import { test, expect } from '@playwright/test';

const builtIn = [{ id: 'ni-hao', hanzi: '你好', syllables: ['ni', 'hao'], english: 'hello', audioUrl: '', toneRule: true, pinyin: 'ní hǎo', writtenPinyin: 'nǐ hǎo', rule: 'third', custom: false }];

async function prepare(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'owner', name: 'Owner', role: 'superadmin' }));
  });
  await page.route('https://**/*', route => route.abort());
  const calls = [];
  let pairs = [...builtIn];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    const method = route.request().method();
    if (path === '/tone-practice/pairs' && method === 'GET') return route.fulfill({ json: { pairs } });
    if (path === '/tone-practice/pairs' && method === 'POST') {
      const body = route.request().postDataJSON(); calls.push({ method, path, body });
      if (body.hanzi === '你好') return route.fulfill({ status: 409, json: { error: '你好 is already in the tone pair list.' } });
      const pair = { id: 'w-507f1f77bcf86cd799439099', ...body, pinyin: 'lǚ yóu', audioUrl: '', toneRule: false, custom: true };
      pairs = [...pairs, pair];
      return route.fulfill({ status: 201, json: { pair } });
    }
    const audio = path.match(/^\/tone-practice\/pairs\/([^/]+)\/audio$/);
    if (audio && method === 'POST') {
      calls.push({ method, path, type: route.request().headers()['content-type'] });
      return route.fulfill({ status: 201, json: { pairId: audio[1], audioUrl: '/studio-test.mp3' } });
    }
    const word = path.match(/^\/tone-practice\/pairs\/([^/]+)$/);
    if (word && method === 'DELETE') { calls.push({ method, path }); pairs = pairs.filter(pair => pair.id !== word[1]); return route.fulfill({ json: { id: word[1] } }); }
    return route.fulfill({ json: [] });
  });
  return calls;
}

test('super admin adds a tone pair word with an audio file, then deletes it', async ({ page }) => {
  const calls = await prepare(page);
  await page.goto('/admin/tone-pair-audio');
  await expect(page.getByRole('heading', { name: 'Tone pair studio' })).toBeVisible();
  await page.getByRole('button', { name: 'Add word' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a tone pair word' });
  await dialog.getByLabel('Chinese (two characters)').fill('旅游');
  await dialog.getByLabel('Syllable 1 pinyin').fill('lv');
  await dialog.getByLabel('Spoken tone').first().selectOption('3');
  await dialog.getByLabel('Syllable 2 pinyin').fill('you');
  await dialog.getByLabel('Spoken tone').nth(1).selectOption('2');
  await dialog.getByLabel('English meaning').fill('travel');
  await expect(dialog).toContainText('lǚ yóu');
  await dialog.getByLabel('Audio file (optional)').setInputFiles({ name: 'lvyou.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('ID3fake') });
  await dialog.getByRole('button', { name: 'Add word & upload' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.access-feedback.is-success')).toContainText('旅游: recording saved');
  expect(calls[0].body).toEqual({ hanzi: '旅游', syllables: ['lü', 'you'], tones: [3, 2], writtenTones: [3, 2], rule: null, english: 'travel' });
  expect(calls[1].path).toBe('/tone-practice/pairs/w-507f1f77bcf86cd799439099/audio');
  const row = page.getByRole('article', { name: /旅游/ });
  await expect(row).toContainText('Added');
  await row.getByRole('button', { name: 'Delete word 旅游' }).click();
  await page.getByRole('dialog', { name: 'Delete this word?' }).getByRole('button', { name: 'Delete word' }).click();
  await expect(page.getByRole('article', { name: /旅游/ })).toHaveCount(0);
  expect(calls.at(-1)).toEqual({ method: 'DELETE', path: '/tone-practice/pairs/w-507f1f77bcf86cd799439099' });
  await expect(page.getByRole('button', { name: 'Delete word 你好' })).toHaveCount(0);
});

test('duplicate words show the server error inside the dialog', async ({ page }) => {
  await prepare(page);
  await page.goto('/admin/tone-pair-audio');
  await page.getByRole('button', { name: 'Add word' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a tone pair word' });
  await dialog.getByLabel('Chinese (two characters)').fill('你好');
  await dialog.getByLabel('Syllable 1 pinyin').fill('ni');
  await dialog.getByLabel('Syllable 2 pinyin').fill('hao');
  await dialog.getByLabel('English meaning').fill('hello');
  await dialog.getByRole('button', { name: 'Add word & record' }).click();
  await expect(dialog.getByRole('alert')).toContainText('already in the tone pair list');
});

test('an existing word can take an uploaded audio file', async ({ page }) => {
  const calls = await prepare(page);
  await page.goto('/admin/tone-pair-audio');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload audio file for 你好' }).click();
  await (await chooser).setFiles({ name: 'nihao.m4a', mimeType: 'audio/mp4', buffer: Buffer.from('fake') });
  await expect(page.locator('.access-feedback.is-success')).toContainText('你好: recording saved');
  expect(calls[0].path).toBe('/tone-practice/pairs/ni-hao/audio');
});
