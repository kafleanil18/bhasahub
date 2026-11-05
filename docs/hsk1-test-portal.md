# HSK 1 H11226 portal

Open HanziGo → sign in → HSK 1 Mock Test / Practice Tools → Mock Tests → Enter test portal.

The bundled H11226 paper has 40 questions, in eight parts of five. Questions, pinyin, pictures, listening transcripts used for explanations, and the answer key were transcribed from the user-provided `11226试题及答案.pdf` (14 pages). The original scan crops are retained as source references. The student portal now uses seventeen optimized full-color illustrations in `client/public/hsk1/h11226/color/`, generated with the built-in image generation tool. Every subject and A/B/C or A–F choice order is checked against the original paper, preserving the printed answer key. The complete paper and answer-key page are not shipped to the browser. The user-provided `H11226.mp3` is actually AAC in an M4A container, so the unchanged audio bytes are shipped as `client/public/hsk1/h11226/listening.m4a`. Its decoded duration is 909.819 seconds.

## Timing and recovery

The countdown starts on the first playback of the exam audio. Listening lasts 910 seconds, followed by 180 seconds to review listening answers and 1,020 seconds for reading. Students may finish listening/review early. Playback can be paused or sought for practice, but the countdown continues. Listening answers lock when reading begins. Reading expiry locks the answers and attempts automatic submission; a failed request leaves a retry button and preserves the answers.

Section deadlines and answers are saved per account to localStorage on the same browser. Reloading/reopening the portal restores the attempt and audio position; elapsed deadlines continue through later sections. Browser storage failure is explicitly reported. The timer is a client-side practice aid, not a proctoring or anti-cheating control.

## Results

`/api/hsk1/h11226` requires the existing authenticated session and returns questions without answer indices or explanations. `/attempts` creates an attempt or lists up to twenty completed attempts owned by the student. `/attempts/:id` retrieves only that student's attempt; `/attempts/:id/submit` validates exactly forty integer-or-null answers, grades on the server, and atomically finalizes the `HskAttempt` document. Retried submissions return the original saved result. Responses use `Cache-Control: no-store`.

Each correct answer earns one point. The result reports listening /20, reading /20, total /40, percentage, unanswered count, and answer explanations. It is labelled a practice score, with no official HSK scale conversion or pass/fail claim. Results appear privately after submission, can be reopened from portal history, and can be printed/saved as PDF. This paper is built in; the existing test manager and other mock tests are unchanged.

## Validation

`npm test` includes independent verification against the printed key, grading and malformed-input tests, asset/container checks, and authenticated API tests covering ownership, answer-key secrecy, and immutable submission retries. `npm run build` and `npm run lint` cover the client.

A headless Chrome check with simulated API responses exercised audio decoding, all forty answer inputs, refresh recovery, section transitions, failed submission retry, result review, expired-attempt automatic submission, and layouts at 320, 768, 1024, and 1440 pixels. No real student attempts are created by that browser check.

Both frontend and backend changes must be deployed to make the portal available in production. Assets are served by the frontend so the existing Vercel/Render separation is supported.

## Color artwork

The replacement artwork uses a consistent warm editorial illustration style, with ivory backgrounds and coral, teal, and mustard accents. Five listening picture questions, five listening choice strips, five reading picture questions, and both six-choice matching boards have dedicated images. Generated PNG originals remain in the tool’s image library; resized JPEG copies are stored in the project to keep download sizes small. The final prompt set is recorded in `docs/h11226-artwork-prompts.json`.

## Reading comfort and navigation

All eight parts include worked examples, separate from the forty scored questions. Original example images from the supplied PDF appear in listening parts 1–3 and reading parts 1–2, including demonstrated answers and the example-only pictures from the shared banks. Listening part 4 includes the Chinese passage, pinyin, choices, and its demonstrated answer. Images are stored in `client/public/hsk1/h11226/examples/` and use the same example layout as H10901.

Resumed attempts for bundled reference papers receive the latest unscored example guidance, even if the attempt snapshot predates those examples. Saved questions, answer choices, grading, section durations, and browser deadlines remain unchanged; custom paper snapshots retain their authored examples.

The portal uses its original 1,200-pixel desktop maximum width and original text, picture, spacing, and control sizes. The timer remains visible while scrolling. Desktop has a scrollable question navigation panel; mobile uses compact part tabs and an expandable question map. Part buttons show answered counts. The next-unanswered shortcut focuses the target question, and the explicit Start listening button starts playback and unlocks answers. Image dimensions reserve space while pictures load.

## Manually authored complete papers

Super admins can open **Manage tests → Create complete practice paper**. The editor starts with the same eight parts as H11226: four listening parts and four reading parts, with five questions per part. Teachers enter Chinese text, pinyin, answer choices, correct answers, explanations, and optional private listening scripts. Uploads support pictures for individual questions, A/B/C strips, shared A–F sheets, and a full listening recording. Each upload has a preview and can be replaced or removed before saving.

New papers save as hidden drafts. Super admins can reopen **Edit questions & pictures** to continue. The **Make live** control validates the recording, picture-dependent questions, shared answer banks, reading text and pinyin, correct answers, and explanations. Admins and super admins can manage visibility and preview; creating or editing content requires a current super admin role. Saving edits hides the paper again until it is ready to publish.

Custom papers use a `paper-` ID and are stored in `PracticePaper.content`. The authenticated `/api/hsk1` catalogue returns only metadata and hides unpublished papers from students. Content editing uses `POST /api/hsk1` and `GET /api/hsk1/:paperId/editor` / `PUT /api/hsk1/:paperId/content`. The original H11226 remains available as a fixed reference. The generated HG1002 paper and its assets have been removed.

Each new attempt stores a private snapshot of its question version. Grading and answer review use that snapshot even after edits. Public responses strip answer keys and teacher listening scripts; snapshot definitions returned for resuming attempts are sanitized in the same way. Results and local drafts remain scoped to the paper and student.
