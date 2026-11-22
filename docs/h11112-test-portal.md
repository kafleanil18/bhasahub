# HSK 1 · H11112

H11112 uses the shared authenticated HSK 1 portal, the same way as H11221. It has eight parts of five questions (20 listening, 20 reading), worked examples, pinyin, server grading, answer explanations and private attempt history. It opens at `/tests/h11112`.

**Status: hidden from students.** The paper sets `publishedByDefault: false`, so students don't see it until staff publish it under **Manage tests**. Staff can already open and preview it. It stays hidden until all 17 new illustrations are in place (see Pictures below).

## Sources

All four files were supplied by the user in `mock_test_pdf/`. They aren't committed and aren't served to students.

| File | SHA-256 |
|---|---|
| `H11112试题.pdf` (10 pages, question booklet) | `da97c4c7932ce4f16d80a32141d9eb98171bc3a7a68f9623499cd1e8692af7eb` |
| `H11112答案.pdf` (answer key) | `2d4384023ad66339e6daaaa0a2cc1e5036d14744c36aee59c5f2b1e903ef9350` |
| `H11112听力文本.pdf` (listening script) | `65308a05eb18dbdd432c2f450f7fd4830adc6b3a395543556c9ed978c710ea52` |
| `HSK1 - H11112.mp3` (recording) | `abb0680e126b15589a87e8108bc39f3870ffaf017c4626d73fdc93dc991c0478` |

- Questions and pinyin were transcribed from the booklet.
- `correctIndex` values come from the printed answer key. The tests also keep an independently typed copy of the key.
- `listeningText` comes from the listening script.

## Audio and timing

The recording is copied byte for byte to `client/public/hsk1/h11112/listening.mp3`. It's a real MP3 with an ID3 tag. Chromium's `decodeAudioData` measures 921.136 seconds, so listening lasts 922 seconds. The standard 180-second listening review and 1,020-second reading period follow.

## Pictures

The pictures follow the H11221/H11226 style. Original exam photos are not shipped.

- **Reused:** `l1-example`, `l2-example` and `r1-example`. The booklet's worked examples are identical to H11221's, so those files were copied.
- **New, done (2 of 17):** `l1-1` (man holding a basketball, ✕ 打电话) and `l1-2` (puppy and kitten, ✓ 猫和狗). They were generated with Canva and exported at 900×675.
- **New, still to make (15):** `l1-3` … `l1-5`, `l2-6` … `l2-10`, `l3-pictures`, `r1-21` … `r1-25` and `r2-pictures`. Q3's picture (blindfolded man) has been generated in Canva but not yet exported. Canva's credit quota ran out, so work stopped there.

Every prompt, with the answer it must preserve, is in `docs/h11112-artwork-prompts.json`. When adding the remaining pictures:

1. Check each one against its `answer` field.
2. Add an image-integrity check to the H11112 test, like the one H11221 has.
3. Publish the paper under **Manage tests**.

## Validation (November 22, 2026)

- All 184 server tests pass. This includes H11112's answer key, audio hash, timing and full-marks grading, and its hidden-by-default behaviour: students get a 404, staff can preview, and publishing makes it visible.
- Production build passes. Lint shows only the two existing warnings, in `ProgressAnalytics.jsx` and `ConversationManager.jsx`.
