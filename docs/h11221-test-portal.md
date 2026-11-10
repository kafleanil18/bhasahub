# HSK 1 · H11221

H11221 uses the existing authenticated HSK 1 portal: eight parts of five questions, 20 listening questions, 20 reading questions, worked examples, pinyin, private attempt history, server grading, answer explanations, browser recovery, and staff visibility controls. It is registered alongside H11226, H10901, and H11556 and opens at `/tests/h11221`.

Questions and picture meanings were transcribed from the user-supplied ten-page `H11221.pdf`. The original PDF and its answer key are not served to students. The supplied `HSK1 - H11221.mp3` is copied byte-for-byte to `client/public/hsk1/h11221/listening.mp3`. macOS `afinfo` reports 928.130612 seconds; the countdown rounds up to 929 seconds, followed by the existing 180-second listening review and 1,020-second reading period.

Source hashes (SHA-256):

- PDF: `d7c4f646ac9d327bbdc3e36ca7b72f5210c789c48e05cc19614f9e37f85ce515`
- Audio: `2775c6ab3dea70c63b995e3d1ffcc2084c11baf01c5d3f471c8faa397f9b7c46`

The supplied PDF has no answer sheet or listening script. Grading was independently checked against the [H11221 answer sheet transcription](https://www.studocu.vn/vn/document/international-university-vnu-hcm/thi-danh-gia-nang-luc/h11221%E7%AD%94%E6%A1%88-vvvv/125801929) and the [matching original H11221 listening transcript](https://hoctiengtrungquoc.online/HSK/HSK1/H11221c.pdf). The original Chinese reading prompts and option order were checked against pages 7–10 of the supplied PDF.

All 20 picture assets are new AI-generated illustrations created with the built-in image generation tool. Optimized JPEGs are stored in `client/public/hsk1/h11221/`; originals remain in the generated-image library. The prompt set is recorded in `docs/h11221-artwork-prompts.json`. A final edit changed panel C of the reading picture board to a girl to match 她 in question 30. The A–F order and every pictured action were checked against the supplied PDF. No answer marks appear in scored question images; checkmarks and crosses occur only in worked examples.

The paper uses the shared scoring implementation and keeps answer indices, explanations, and listening scripts private until submission. Frontend and backend deployments are both required for production availability. Like the existing bundled papers, the new paper is visible by default and can be hidden using Manage tests.

Validation on November 10, 2026:

- All 121 server tests passed, including independent H11221 answer-key, audio hash, asset integrity, authenticated access, paper isolation, grading, immutable retry, and visibility checks.
- Production frontend build passed. Lint completed with two existing warnings in `ProgressAnalytics.jsx` and `ConversationManager.jsx`.
- A headless Chromium check with simulated API responses loaded `/tests/h11221`, decoded the supplied audio (928.101587 seconds in Chromium), started listening, answered all 40 questions, recovered selections after reload, advanced through review and reading, and submitted a 40/40 result.
- A/B/C strips and the A–F reading board were inspected at 320px and 1440px. Every referenced image loaded, no horizontal overflow occurred, and no browser JavaScript errors were reported. No real student attempts were created by the browser check.
