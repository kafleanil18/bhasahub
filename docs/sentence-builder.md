# Sentence builder

Students open **Practice Tools → Sentence Builder**. The bank contains 300 original beginner sentences, organized into 20 topics with 15 sentences each. Students can practice a topic or a mixed set of 10 sentences, build an answer by selecting word tiles, remove or clear selected tiles, and check their answer. Results show Chinese, pinyin, an English meaning, and the topic's grammar explanation. Missed sentences can be retried. Progress is stored in the current browser, separated by account ID (or guest); it is not synchronized across devices.

The content follows the classic HSK 1 beginner scope: everyday phrases and basic grammar, with proper names and useful measure words. It is original teaching content, not an official exam question bank. Reference: [Chinese Testing International's HSK 1 description](https://www.chinesetest.cn/HSK/1?type=2). Sentence IDs are stable (`hsk1-001` through `hsk1-300`); preserve them when editing content because audio and browser progress use those IDs.

## Super admin audio portal

Open **Admin → Sentence audio**. Search by number, ID, Chinese, pinyin, or English; filter by topic and missing/available audio. Each sentence can have one recording. Upload or replace a recording and preview it with the audio player. Removing audio leaves the sentence available for practice.

Accepted files: MP3, M4A, WAV, OGG, or WebM, up to 15 MB per file. The existing `CLOUDINARY_URL` server configuration is required. Audio uploads stream from server memory into the `bhashahub/sentences` Cloudinary folder. The `sentenceaudios` MongoDB collection stores the URL, sentence ID, uploader, and timestamps. No sentence seeding or migration is required; the content bank ships in `server/data/hsk1Sentences.json`.

Only super admins may upload, replace, or remove audio. The server checks the current database role before parsing files. Uploads validate the sentence ID, extension, MIME type, and size. Uploads are limited to 100 per 15 minutes per IP. Failed uploads preserve the existing recording. Replacing or removing a recording does not delete the old Cloudinary asset; it removes it from the sentence catalog. There are no bundled recordings: the super admin supplies them through this portal.

The sentence bank and recording URLs are public practice content. Students do not need a subscription to use this tool, matching the public pinyin and tone practice tools. No audio plays automatically; students may listen before or after checking an answer.

## API

- `GET /api/sentences`: all topics and sentences with their saved recording URLs.
- `POST /api/sentences/:id/audio`: super admin multipart upload, file field `file`.
- `DELETE /api/sentences/:id/audio`: super admin removes the recording reference.

Deploy both the client and API so the catalog and upload endpoints are available together.

## Validation

- `node --test client/src/practice/sentenceQuiz.test.js client/src/practice/listeningQuiz.test.js`
- `npm test --prefix server` (integration tests open an ephemeral localhost HTTP server; uploads are mocked, never sent to Cloudinary).
- `npm run build --prefix client`
- `npm run lint --prefix client`

The data tests check the 300 unique IDs and sentences, topic counts, complete content, valid alternative orders, and repeated-word grading. API integration tests cover role restrictions, upload/replace/remove, invalid or oversized files, and upload failures.
