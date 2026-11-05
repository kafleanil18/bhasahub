# HSK 1 · H10901

H10901 appears alongside H11226 under **Mock Tests** and **Manage tests**. It uses the same portal, question navigation, browser recovery, listening/reading transitions, private results, and server grading. Staff can hide or publish each reference paper independently; reference content remains fixed.

The source is the user-provided `H10901_1.pdf` (14 pages) and `HSK1 - H10901.mp3`. All forty questions, pinyin, shared A–F answer banks, private listening transcripts, and the printed answer key were transcribed into `server/data/hsk10901.js`. Questions and examples retain the source's original color photographs and choice order. Seventeen question/shared images and five example images are cropped from pages 2–8 into `client/public/hsk1/h10901/`. The complete paper, listening transcript pages, and answer-key page are not served to students.

The recording is copied without conversion to `listening.mp3`. Its duration is approximately 873.953 seconds, so listening is timed at 874 seconds, followed by the paper's three-minute answer review and seventeen-minute reading section. The timer begins when playback starts. All eight parts include worked examples; example answers do not count toward the score.

`server/data/hskPapers.js` registers both bundled reference papers. H10901 uses `/api/hsk1/h10901`; attempts, result history, publication, and browser drafts use its own paper ID. Answers, explanations, and private listening scripts remain server-side until grading; demonstrated example answers remain visible as in the source paper. Scores use the same practice scale as H11226: listening /20, reading /20, total /40, with no official score conversion.

Validation: `npm test` verifies all forty answers against an independently transcribed printed key, asset existence, example coverage, recording size, answer-key secrecy, authenticated access, isolation from H11226, submission retries, staff visibility, and immutable reference content. `npm run build` and `npm run lint` validate the client. Deploy both frontend assets and backend code to make the new reference paper available in production.

A headless Chrome check using simulated API responses verified recording playback (873.958 seconds), all eight parts, every question and example image, working answer controls, and no horizontal overflow or page errors at 320, 768, 1024, and 1440 pixels. No real student attempts were created.
