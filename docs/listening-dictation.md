# Listening dictation

Open **Practice Tools → Listening Dictation**. The feature reuses `/api/sentences` and the teacher recordings saved in **Admin → Sentence audio**. Only sentences with a nonempty recording URL appear. Students can choose a recorded topic or a mixed session of up to 10 sentences. No new database schema, AI service, or sentence audio is required.

Each sentence attempts to play automatically. Students can replay at normal speed or 0.75× speed. If the browser blocks autoplay, tap **Play recording**. Students must hear playback before their answer can be checked. The source Chinese, pinyin, and English are hidden until submission; the student types into a textarea using their Chinese keyboard. Composition events prevent submitting an unfinished IME candidate.

The comparison normalizes Unicode compatibility forms and ignores punctuation and whitespace. It compares the exact recorded sentence, rather than accepting alternative word orders. Character alignment identifies correct, incorrect, missing, and extra characters; one omitted character does not shift all following characters into incorrect positions. Extra characters lower accuracy. Each expected character receives its stored pinyin, and the full correct sentence and English appear after checking.

Results show correct sentences and aggregate character accuracy. Students can retry missed sentences. Broken recordings can be skipped and are excluded from grading. Audio stops when advancing, changing topics, or leaving the page. Results are kept for the current session and are not synchronized to a student profile.

The empty state explains that teacher recordings are needed. Super admins receive a **Record sentence audio** shortcut to the existing microphone portal. Other users can refresh the list after their teacher adds recordings.

Validation:

- `node --test client/src/practice/dictationQuiz.test.js client/src/practice/sentenceQuiz.test.js client/src/practice/listeningQuiz.test.js client/src/admin/sentenceRecording.test.js`
- `npm run build --prefix client`
- `npm run lint --prefix client`

Browser checks cover recorded-only filtering, hidden answers, normal/slow playback, autoplay fallback, Chinese IME composition, all four character feedback types, results, retries, audio cleanup, unavailable recording skips, session size limits, empty states, the super admin shortcut, and mobile layouts.
