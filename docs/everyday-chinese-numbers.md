# Everyday Chinese Numbers

Open **Practice Tools → Everyday Chinese Numbers**. Choose Prices, Time, Dates, Ages, or Phone numbers. Each round chooses 10 distinct prompts from that mode; missed questions can be retried. The bank contains 282 prompts: 60 prices, 60 times, 72 dates, 60 ages, and 30 sample phone-number digit sequences.

The trainer uses the browser/device's Mandarin speech voice through the Web Speech API. It does not call a paid AI service or use the sentence recording library. A Mandarin voice must be available on the student's device. The page discovers voices initially and on `voiceschanged`, prioritizes mainland Mandarin, offers a voice selector, and excludes Cantonese. If no Mandarin voice is available, the page explains how to add one in device speech settings and provides a refresh button. Unsupported browsers show an explanation. Voice availability and audio quality depend on the device/browser.

Selecting a mode attempts to speak the first prompt; subsequent questions also attempt playback automatically. **Listen** replays it and **Slow · 0.75×** changes its speaking rate. Students must hear playback before grading is enabled. If playback fails or never starts, students can retry or skip; skipped questions are excluded from the score. Leaving the page, submitting an answer, or advancing cancels the current speech.

The spoken Chinese and pinyin stay hidden until submission. Feedback shows a correct/wrong indicator, the expected numeric answer, character-level pinyin, and an explanation. Results summarize correct answers and list missed prompts with the student's answer and the correct value. Results are session-only.

Answer rules:

- Prices use yuan and jiao, stored as integer cents. Decimal equivalents and common currency labels are accepted; ambiguous decimal commas and extra decimal places are rejected.
- Times use separate hour and minute fields in 24-hour format, so AM/PM must be understood.
- Dates use separate month and day fields. Invalid month/day combinations are rejected. February 29 is a valid input because no year is dictated.
- Ages require an integer from 0 to 120.
- Phone answers preserve leading zeros. Digits can be grouped with spaces, hyphens, or parentheses. Practice phone strings are listening examples, not a contact directory. Digit one is spoken as 幺.

Prompts and grading are defined in `client/src/practice/numberQuiz.js`. Character readings accompany every prompt; sentence IDs, teacher recordings, and existing student progress are unaffected.

Validation:

- `node --test client/src/practice/numberQuiz.test.js client/src/practice/dictationQuiz.test.js client/src/practice/sentenceQuiz.test.js client/src/practice/listeningQuiz.test.js client/src/admin/sentenceRecording.test.js`
- `npm run build --prefix client`
- `npm run lint --prefix client`

Browser checks use simulated speech to verify all modes, completed rounds, validation, scoring, retry, playback rates, speech cancellation, unavailable voices, voice refresh, failed playback skips, and mobile layouts. Live checks verify the page and native voice availability; simulated speech tests do not establish a device voice's pronunciation quality.
