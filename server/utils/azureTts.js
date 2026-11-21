const crypto = require('node:crypto');

// Azure AI Speech neural Mandarin voices: speaker A is female, speaker B is male, so dialogues sound like two people.
const VOICES = {
  A: process.env.AZURE_SPEECH_VOICE_A || 'zh-CN-XiaoxiaoNeural',
  B: process.env.AZURE_SPEECH_VOICE_B || 'zh-CN-YunxiNeural',
};
// Slightly slower than native speed for learners; "slow" is for careful listening.
const RATES = { normal: '-10%', slow: '-35%' };
const MAX_LENGTH = 200;
const CHINESE = /[㐀-鿿]/;

function azureConfigured() {
  return Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
}

// Returns the cleaned request, or null when it is not short Chinese text we should synthesise.
function normalizeRequest({ text, speaker, speed }) {
  const clean = typeof text === 'string' ? text.normalize('NFC').replace(/\s+/g, ' ').trim() : '';
  if (!clean || clean.length > MAX_LENGTH || !CHINESE.test(clean)) return null;
  return { text: clean, speaker: speaker === 'B' ? 'B' : 'A', speed: speed === 'slow' ? 'slow' : 'normal' };
}

function cacheKey({ text, speaker, speed }) {
  return crypto.createHash('sha256').update(JSON.stringify([VOICES[speaker], RATES[speed], text])).digest('hex');
}

const escapeXml = value => value.replace(/[<>&'"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);

function buildSsml({ text, speaker, speed }) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="${VOICES[speaker]}"><prosody rate="${RATES[speed]}">${escapeXml(text)}</prosody></voice></speak>`;
}

async function synthesize(request, fetchImpl = fetch) {
  const response = await fetchImpl(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'bhashahub-tts',
    },
    body: buildSsml(request),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Azure speech request failed (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

module.exports = { VOICES, RATES, MAX_LENGTH, azureConfigured, normalizeRequest, cacheKey, buildSsml, synthesize };
