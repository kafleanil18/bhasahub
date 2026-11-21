const express = require('express');
const rateLimit = require('express-rate-limit');
const TtsAudio = require('../models/TtsAudio');
const tts = require('../utils/azureTts');

const router = express.Router();
const inFlight = new Map();
// Only new phrases cost Azure characters, so only cache misses have a tight limit.
const newPhraseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 120,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many new phrases. Please wait a moment.' },
});
const playLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1500, standardHeaders: true, legacyHeaders: false });

router.get('/status', (req, res) => res.json({ enabled: tts.azureConfigured() }));

function sendAudio(res, audio) {
  res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable' });
  res.send(audio);
}

// GET /api/tts?text=你好&speaker=A|B&speed=normal|slow → MP3 (public so <audio> can load it without headers).
router.get('/', playLimiter, async (req, res, next) => {
  if (!tts.azureConfigured()) return res.status(503).json({ error: 'Natural voice is not set up.' });
  const request = tts.normalizeRequest(req.query);
  if (!request) return res.status(400).json({ error: `Send Chinese text up to ${tts.MAX_LENGTH} characters.` });
  const key = tts.cacheKey(request);
  try {
    const cached = await TtsAudio.findOne({ key }).select('audio').lean();
    if (cached) return sendAudio(res, Buffer.isBuffer(cached.audio) ? cached.audio : Buffer.from(cached.audio.buffer));
  } catch (error) { return next(error); }
  newPhraseLimiter(req, res, async () => {
    try {
      // Two students asking for the same new phrase at once share one Azure call.
      if (!inFlight.has(key)) {
        inFlight.set(key, tts.synthesize(request).then(async audio => {
          await TtsAudio.updateOne({ key }, { $setOnInsert: { key, text: request.text, voice: tts.VOICES[request.speaker], rate: tts.RATES[request.speed], audio } }, { upsert: true });
          return audio;
        }).finally(() => inFlight.delete(key)));
      }
      sendAudio(res, await inFlight.get(key));
    } catch (error) {
      console.error('Azure TTS failed:', error.message);
      res.status(502).json({ error: 'Could not create the audio. Please try again.' });
    }
  });
});

module.exports = router;
