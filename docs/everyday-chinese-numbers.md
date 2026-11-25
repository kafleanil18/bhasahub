# Everyday Chinese Numbers

Open **Practice Tools → Everyday Chinese Numbers**. Choose Prices, Time, Dates, Ages, or Phone numbers. Each round chooses 10 distinct prompts from that mode; missed questions can be retried. The bank contains 282 prompts: 60 prices, 60 times, 72 dates, 60 ages, and 30 sample phone-number digit sequences.

## Voice

The trainer speaks each prompt with the shared Mandarin speaker (`client/src/practice/useMandarinSpeaker.js`). Students pick **Female** or **Male** with the switch on the page, and the choice is remembered for every practice tool. There are no uploaded recordings for numbers, so the voice comes from one of these, in order:

1. **The server's Azure voice**, when `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are set on the API:
   - Female is `zh-CN-XiaoxiaoNeural` and male is `zh-CN-YunxiNeural`.
   - The browser plays an MP3 from `/api/tts`, so every browser and device hears the same voice, including ones with no Mandarin voice installed.
   - **Slow · 0.75×** asks for the server's slow reading.
   - Each phrase is generated once and then served from the `ttsaudios` collection. All 282 prompts in both voices and both speeds come to roughly 7,000 Azure characters in total. That's well inside Azure's free tier of 500,000 a month.
2. **The browser's own Mandarin voice**, when the server voice is off or a clip fails to load: Google's female Mandarin voice in Chrome, otherwise the device's best mainland Mandarin voice. Cantonese voices are skipped. For the male choice, a male device voice is used if there is one.

**Without the Azure voice, the page depends on the browser.**
- macOS, iOS, Windows Edge and Chrome all have a Mandarin voice.
- Brave and Firefox on Linux usually have none. There, the page says "No Mandarin voice was found" and the mode cards stay disabled.
- So the live site can work on one computer and not on another. Turning on the Azure voice fixes this for everyone.

The page waits up to 30 seconds for the API to say whether the server voice is available, because a sleeping Render server is slow to answer. If that check fails, the next visit asks again.

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
- `npm --prefix client run test:navigation -- e2e/number-practice.spec.js` (device voices, the male server voice, the server voice taking priority, and a device with no Mandarin voice)

Browser checks use simulated speech to verify all modes, completed rounds, validation, scoring, retry, playback rates, speech cancellation, unavailable voices, voice refresh, failed playback skips, and mobile layouts. Live checks verify the page and native voice availability; simulated speech tests do not establish a device voice's pronunciation quality.
