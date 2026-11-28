# Adding a new HSK 1 mock test

Use this checklist for every new paper so it matches the existing bundled tests (H11226, H10901, H11556, H11221, H11112, H11009, H11332, H11440, H11552). Use H11112 as the template: copy its files and change the content.

Replace `HXXXXX` and `hxxxxx` below with the paper code, for example `H11112` and `h11112`.

## 1. Put the source files in `mock_test_pdf/`

A complete set has four files:

| File | Content |
|---|---|
| `HXXXXX试题.pdf` | Question booklet |
| `HXXXXX答案.pdf` | Answer key |
| `HXXXXX听力文本.pdf` | Listening script |
| `HSK1 - HXXXXX.mp3` | Listening recording |

If the key or script is missing, find a published copy and cite it in the paper's doc, as `docs/h11221-test-portal.md` does.

Record the SHA-256 hash of each file: `sha256sum mock_test_pdf/*`.

## 2. Read the paper

- Text and pinyin: `pdftotext -layout mock_test_pdf/HXXXXX试题.pdf -`. Pinyin lines sit above the characters; join them by hand.
- Pictures: `pdftoppm -r 80 -png mock_test_pdf/HXXXXX试题.pdf <scratch dir>/p`, then look at each page.
- Answer key and listening script: `pdftotext -layout` on the other two PDFs.

## 3. Write `server/data/hskxxxxx.js`

Copy `server/data/hsk11112.js`. Keep the eight groups in this order, five questions each:

| Group | Section | Question type | Pictures |
|---|---|---|---|
| `l1` | Listening | Phrase vs. picture, ✓/✕ | One per question: `l1-1` … `l1-5` |
| `l2` | Listening | Choose A/B/C picture | One A/B/C strip per question: `l2-6` … `l2-10` |
| `l3` | Listening | Dialogue → picture A–F | One shared board: `l3-pictures` |
| `l4` | Listening | Passage → word choice A/B/C | None; options are `word(text, pinyin)` |
| `r1` | Reading | Word vs. picture, ✓/✕ | One per question: `r1-21` … `r1-25` |
| `r2` | Reading | Sentence → picture A–F | One shared board: `r2-pictures` |
| `r3` | Reading | Question → reply A–F | None; `choices` list the replies |
| `r4` | Reading | Fill the blank from A–F | None; `choices` list the words |

For each question:

- `correctIndex` comes from the printed key. ✓ = 0, ✕ = 1. A = 0, B = 1, C = 2, and so on.
- `listeningText` is copied from the listening script (listening groups only).
- `text` and `pinyin` are copied from the booklet (reading groups only).
- `explanation` is one short English sentence. It must describe the *new* picture, not the original photo.

Each group also has an `example`, copied from the booklet's worked example. Examples are usually identical across papers, so check H11221 and H11112 before writing a new one.

Timing:

- `addedAt` is the date the paper is added (ISO 8601). Manage tests sorts papers by it (latest or oldest uploaded) as well as by paper number.
- `listeningSeconds` is the decoded audio length rounded up. There's no `ffprobe` here, so measure it in Chromium with `decodeAudioData`. The H11112 doc shows how.
- `transferSeconds` is 180 and `readingSeconds` is 1020 for every paper.

To ship a paper before it's finished, add `publishedByDefault: false` to its export. Students won't see it, staff can preview it, and staff publish it under **Manage tests** when it's ready. Remove the flag once every picture is done.

## 4. Register the paper

- `server/data/hskPapers.js`: add `require('./hskxxxxx')` at the end of the list.
- `client/src/navigation/AppRoutes.jsx`: add `'hxxxxx'` to the bundled paper list.
- `server/test/hsk1.test.js`: the two catalogue-order assertions list every bundled paper id. Add the new id there.

## 5. Assets in `client/public/hsk1/hxxxxx/`

- `listening.mp3`: copy the recording byte for byte; don't re-encode it. If it's actually AAC, name it `.m4a`, as H11226 does.
- Example pictures (`l1-example`, `l2-example`, `r1-example`): if the booklet's examples match an existing paper's, copy those files. H11221 and H11112 share them.
- Question pictures: see step 6.

## 6. Make the pictures

Each picture is redrawn as a new illustration in the shared style. The original exam photos are never shipped.

1. Copy `docs/h11112-artwork-prompts.json` to `docs/hxxxxx-artwork-prompts.json`. Keep `style`, and write one `scene` per picture from the original photo.
2. **The picture must keep the printed answer correct.** For ✕ questions, the picture must clearly show something other than the word. For example, H11112 Q22 *中午* shows a clock at 10:10, not noon. Add an `answer` field to each asset so this is easy to check.
3. Strips and boards are one image each. Strips have three framed panels labelled A B C beneath. Boards have six panels in two columns and three rows, labelled A B / C D / E F. Keep the original paper's panel order.
4. No Chinese text, no question numbers, and no ✓ or ✕ marks in scored pictures.
5. Generate with Canva in four steps:
   - `generate-image` with style + scene. The result is only a 200 px preview.
   - `create-design` with the media id and the brief "single full-bleed image, no text".
   - `export-design` as JPG, quality 90. Use 900 px wide for singles, 1400 for strips and 1200 for boards.
   - Download the export URL with `curl`.

   Each picture uses Canva credits. A paper needs about 17 pictures, plus redos.
6. Look at every result before saving it. Check the action, the count of people or objects, the panel order and letters, and that there are no stray marks. Regenerate any picture that's wrong.
7. Save each picture as `client/public/hsk1/hxxxxx/<name>.jpg`, using the names in step 3's table.

**Use small image files.** Compress every picture to a low file size: a paper's pictures should total about 1 MB. Raw AI images are often 2–3 MB each.

| Picture | Size | Target |
|---|---|---|
| Single question picture | 960 × 720 (4:3) | under 60 KB |
| A/B/C strip | 1500 × 640 | under 100 KB |
| A–F sheet | 1200 × 1600 (portrait) | under 150 KB |

Use WebP at quality about 80 for uploads through Test Studio. For bundled files, use JPG, since the tests check bundled pictures for the JPEG signature. H11112's 15 pictures went from 37 MB to 780 KB this way. Test Studio shows the same targets under each upload field and warns about any picture over 300 KB.

## 7. Tests

Add a block to `server/test/hsk1.test.js` modelled on the H11112 one:

- A printed answer key typed separately from the data file, compared with `correctIndex`.
- 8 groups × 5 questions, each group with an example.
- Every image path exists and is a real JPEG.
- The audio hash and `listeningSeconds`.
- Full marks with the key: `createPaperTools(paper).grade(key)`.
- An API test that starts, submits and re-reads an attempt.

Then run `npm test`, `npm run build` and `npm run lint`.

## 8. Check it in the browser

Start the app (`bhasahub`), sign in, and open `/tests/hxxxxx`. Check that:

- the audio plays;
- every picture loads, at desktop and phone widths;
- submitting the printed key scores 40/40.

## 9. Write `docs/hxxxxx-test-portal.md`

Copy `docs/h11112-test-portal.md`. Record the source hashes, the audio length, which pictures are new or reused, and the date of the checks.
