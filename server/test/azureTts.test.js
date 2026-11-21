const { test } = require('node:test');
const assert = require('node:assert/strict');
const tts = require('../utils/azureTts');

test('only short Chinese text is accepted, with safe speaker and speed defaults', () => {
  assert.deepEqual(tts.normalizeRequest({ text: '  你好！ ', speaker: 'B', speed: 'slow' }), { text: '你好！', speaker: 'B', speed: 'slow' });
  assert.deepEqual(tts.normalizeRequest({ text: '谢谢', speaker: 'x', speed: 'fast' }), { text: '谢谢', speaker: 'A', speed: 'normal' });
  assert.equal(tts.normalizeRequest({ text: 'hello' }), null);
  assert.equal(tts.normalizeRequest({ text: '' }), null);
  assert.equal(tts.normalizeRequest({ text: ['你'] }), null);
  assert.equal(tts.normalizeRequest({ text: '你'.repeat(tts.MAX_LENGTH + 1) }), null);
});

test('SSML escapes text and uses a different voice per speaker', () => {
  const a = tts.buildSsml({ text: '我<b>&"好"', speaker: 'A', speed: 'normal' });
  assert.match(a, /我&lt;b&gt;&amp;&quot;好&quot;/);
  assert.match(a, new RegExp(`name="${tts.VOICES.A}"`));
  assert.match(tts.buildSsml({ text: '好', speaker: 'B', speed: 'slow' }), new RegExp(`name="${tts.VOICES.B}".*rate="-35%"`));
  assert.notEqual(tts.cacheKey({ text: '好', speaker: 'A', speed: 'normal' }), tts.cacheKey({ text: '好', speaker: 'B', speed: 'normal' }));
});

test('synthesize posts SSML to the configured region and returns MP3 bytes', async () => {
  process.env.AZURE_SPEECH_KEY = 'k'; process.env.AZURE_SPEECH_REGION = 'eastasia';
  let call;
  const audio = await tts.synthesize({ text: '你好', speaker: 'A', speed: 'normal' }, async (url, options) => {
    call = { url, options };
    return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  });
  assert.equal(call.url, 'https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1');
  assert.equal(call.options.headers['Ocp-Apim-Subscription-Key'], 'k');
  assert.match(call.options.body, /你好/);
  assert.deepEqual([...audio], [1, 2, 3]);
  await assert.rejects(tts.synthesize({ text: '你', speaker: 'A', speed: 'normal' }, async () => ({ ok: false, status: 401 })), /401/);
});
