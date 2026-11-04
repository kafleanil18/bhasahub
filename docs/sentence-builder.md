# Sentence builder

Students open **Practice Tools → Sentence Builder**. The bank contains 1,300 original beginner sentences across 60 topics: the original 20 topics have 15 sentences each, and 40 additional topics have 25 sentences each. Students can practice a topic or a mixed set of 10 sentences, build an answer by selecting word tiles, remove or clear selected tiles, and check their answer. Every Chinese character has its own pinyin annotation, including the word bank, selected answer, feedback, review, and admin recording script. Results show an English meaning and the topic's grammar explanation. Multi-character words remain intact as tiles. Missed sentences can be retried. Progress is stored in the current browser, separated by account ID (or guest); it is not synchronized across devices.

The content follows the classic HSK 1 beginner scope: everyday phrases and basic grammar, with proper names and useful measure words. It is original teaching content, not an official exam question bank. Reference: [Chinese Testing International's HSK 1 description](https://www.chinesetest.cn/HSK/1?type=2). Sentence IDs are stable (`hsk1-001` through `hsk1-1300`); preserve them when editing content because audio and browser progress use those IDs.

## Super admin audio portal

Open **Admin → Sentence audio**. Search by number, ID, Chinese, pinyin, or English; filter by topic and missing/available audio. Each sentence can have one saved recording. Click **Record audio**, allow microphone access, and read the sentence. Click **Stop recording** to listen to the local preview. Use **Re-record** to try again, **Save recording** to publish it, or **Discard recording** to cancel. Re-recording an existing sentence leaves the saved audio unchanged until the new recording is saved. Removing audio leaves the sentence available for practice. There is no file-picker upload feature.

Microphone recording requires HTTPS (or localhost), browser permission, and MediaRecorder support. Recording automatically stops at 60 seconds. The browser selects a supported WebM, MP4/M4A, or OGG format. Drafts stay local until saved and can be retried if saving fails. Closing the recorder stops microphone tracks and clears the local preview. Permission denial, missing devices, unsupported browsers, and recording failures show a useful error. The existing `CLOUDINARY_URL` server configuration is required. Saved microphone recordings stream from server memory into the `bhashahub/sentences` Cloudinary folder. The `sentenceaudios` MongoDB collection stores the URL, sentence ID, uploader, and timestamps. No sentence seeding or migration is required; the content bank ships in `server/data/hsk1Sentences.json`.

Only super admins may record, replace, or remove audio. The server checks the current database role before parsing files. Saving validates the sentence ID, extension, MIME type, and size. Saves are limited to 100 per 15 minutes per IP. Failed saves preserve the existing recording. Replacing or removing a recording does not delete the old Cloudinary asset; it removes it from the sentence catalog. There are no bundled recordings: the super admin supplies them through this portal.

The sentence bank and recording URLs are public practice content. Students do not need a subscription to use this tool, matching the public pinyin and tone practice tools. Sentence audio plays automatically when a student checks a completed answer, whether correct or incorrect. No audio or playback controls are offered before answering. Students may replay the recording after checking. Advancing to the next sentence stops the previous recording.

## API

- `GET /api/sentences`: all topics and sentences with their saved recording URLs.
- `POST /api/sentences/:id/audio`: super admin saves a microphone Blob using multipart field `recording`. The old `file` field is rejected.
- `DELETE /api/sentences/:id/audio`: super admin removes the recording reference.

Deploy both the client and API so the catalog and upload endpoints are available together.

## Validation

- `node --test client/src/practice/sentenceQuiz.test.js client/src/admin/sentenceRecording.test.js client/src/practice/listeningQuiz.test.js`
- `node server/scripts/annotateSentencePinyin.js --check`
- `npm test --prefix server` (integration tests open an ephemeral localhost HTTP server; uploads are mocked, never sent to Cloudinary).
- `npm run build --prefix client`
- `npm run lint --prefix client`

The data tests check the 1,300 unique IDs and sentences, topic counts, complete content, valid alternative orders, and repeated-word grading. API integration tests cover role restrictions, save/replace/remove, WebM/MP4/OGG compatibility, invalid or oversized recordings, and save failures.

Character annotations are stored as `tokenPinyin`: one array per word tile and one reading per Chinese character. `scripts/annotateSentencePinyin.js` aligns the sentence's existing pinyin using the bank's vocabulary and verifies every character; the app does not guess pronunciations at runtime. The 儿 in erhua words such as 这儿 is annotated `r`, preserving the spoken reading zhèr.

The additional 1,000 sentences are authored using curated, compatible grammar patterns and vocabulary in `server/scripts/expandHsk1Sentences.js`. Run it with `--check` to verify the stored expansion, or without arguments to rebuild it deterministically. It preserves the original 300 sentence records and IDs. All additional sentences include character pinyin, explanations, and safe alternative orders where applicable; the admin recording portal discovers their IDs automatically.
