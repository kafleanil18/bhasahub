# Tone listening practice

Open **Pinyin & tones → Practice identifying tones** on the pinyin chart. Tone listening is not a separate homepage card. Sign-in is required so checked answers can be saved.

Questions use the existing teacher pinyin recordings. Only recordings with an audio URL and tone 1–4 are included; synthesized speech is not used as a substitute. A round contains up to ten different recordings. The student plays a recording, chooses one of four tones, and selects **Check tone**. Feedback identifies the recorded tone, highlights a correct answer in green, and plays a distinct correct/wrong chime. Correct answers advance after 1.2 seconds; incorrect answers stay for review until the student selects Next recording. Answer sounds can be muted for the current round. The results screen lists each checked answer and the round's accuracy. Skips are ungraded.

`GET /api/tone-practice/questions` returns recording IDs, base syllables, and audio URLs without the answer key. `POST /api/tone-practice/answer` accepts a recording ID and selected tone; the backend looks up the recorded tone, grades the answer, and saves it before returning feedback. A failed save leaves the current question and choice available for retry.

My Progress has a separate **Tone listening** card showing unique recordings answered, first-answer accuracy, last practiced, and correct/attempted counts and accuracy for each of the four tones. The deterministic per-user recording key prevents retries, repeated rounds, and concurrent answers from increasing the unique count or overwriting the first answer. **Reset count** uses the existing confirmation and clears this studio's history and tone breakdown only. Studio practice contributes to the learning streak.

If the bank is empty, add recordings through the pinyin chart's teacher recording controls. The cloud-to-local content importer includes pinyin recordings, once its source connection is configured.
