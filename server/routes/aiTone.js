const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post('/evaluate-tone', upload.single('audio'), async (req, res) => {
  try {
    const { targetWord, targetPinyin, targetTone, targetMeaning } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: 'Tone evaluation is currently unavailable. Please try again later.' });
    }

    const base64Audio = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'audio/webm';

    const prompt = `You are a native Mandarin Chinese phonetics & tone evaluation professor.
The student recorded themselves pronouncing the Mandarin character: "${targetWord || '妈'}" (${targetPinyin || 'mā'}, Tone ${targetTone || 1}, Meaning: "${targetMeaning || 'Mother'}").

Evaluate the recorded audio for:
1. Mandarin Tone Accuracy (Is it Tone ${targetTone}?)
2. Pitch Contour Accuracy (Does pitch rise/fall correctly for Tone ${targetTone}?)
3. Syllable Clarity & Rhythm.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "overallScore": <integer between 0 and 100>,
  "pitchMatch": <integer between 0 and 100>,
  "rhythmScore": <integer between 0 and 100>,
  "detectedTone": <integer 1 to 4>,
  "feedbackText": "<2-3 sentence constructive feedback for the student>"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Audio } }
              ]
            }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    if (!geminiRes.ok) {
      return res.status(502).json({ error: 'Tone evaluation failed. Please try again.' });
    }

    const geminiData = await geminiRes.json();
    const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedJSON = JSON.parse(textOutput);

    if (!['overallScore', 'pitchMatch', 'rhythmScore'].every(key => Number.isInteger(parsedJSON[key]) && parsedJSON[key] >= 0 && parsedJSON[key] <= 100)) {
      throw new Error('Invalid evaluation response');
    }
    res.json({
      overallScore: parsedJSON.overallScore,
      pitchMatch: parsedJSON.pitchMatch,
      rhythmScore: parsedJSON.rhythmScore,
      detectedTone: parsedJSON.detectedTone || parseInt(targetTone || 1),
      feedbackText: parsedJSON.feedbackText || 'Great pronunciation practice!',
      aiUsed: true,
    });
  } catch (err) {
    console.error('AI Tone Evaluation Error:', err);
    res.status(502).json({ error: 'Tone evaluation failed. Please try again.' });
  }
});

module.exports = router;
