const fs = require('node:fs');
const path = require('node:path');
const { curriculum, renderUnit, validateCurriculum, title } = require('../utils/hsk1Grammar');
const stats = validateCurriculum();
const docs = path.join(__dirname, '../../docs');
fs.mkdirSync(docs, { recursive: true });
const lines = [
  `# ${curriculum.title}`, '',
  `Original BhashaHub course · ${stats.units} modules · ${stats.corePoints} core language points · ${stats.foundationPoints} supporting foundations · ${stats.exercises} self-check questions`, '',
  `Reference: **${curriculum.reference.title}**, ${curriculum.reference.author}, ISBN ${curriculum.reference.isbn}.`, '',
  curriculum.coverageNote, '',
  '## Teaching approach', '', curriculum.prerequisites, '', curriculum.studyPlan, '',
  'The explanations, example sentences, questions, and answer explanations below were independently written for this app. Learners complete open-ended self-checks and reveal model answers. These exercises are not automatically scored; the suggested thresholds guide self-review, and the app’s existing completion control remains available.', '',
  '## Module and coverage map', '',
  '| Module | Objective | Core references |', '| --- | --- | --- |',
  ...curriculum.units.map(unit => `| ${unit.number}. ${unit.title} | ${unit.objective} | ${unit.points.map(point => point.id).join(', ') || 'Supporting pronunciation and sentence foundations'} |`), '',
  'G01–G45 are course reference IDs, not official textbook page numbers. Modules 3–15 group the core points against the corresponding textbook lesson numbers; modules 1–2 provide the introductory foundation. Grammar is the existing app category for all 15 modules; no Conversation feature is required.', '',
  '## Instructor references', '', ...curriculum.sources.map(source => `- [${source.title}](${source.url}) — ${source.purpose}`), '',
];
function questions(items) {
  items.forEach((question, i) => {
    lines.push(`${i + 1}. ${question.prompt}`, '', `   **Model answer:** ${question.answer}`, '', `   **Why:** ${question.explanation}`, '');
    if (question.points) lines.push(`   Review: ${question.points.join(', ')}.`, '');
  });
}
for (const unit of curriculum.units) {
  lines.push(`## ${title(unit)}`, '', `**Objective:** ${unit.objective}`, '', `Suggested study time: ${unit.estimatedMinutes} minutes, plus review.`, '');
  for (const point of [...unit.foundations, ...unit.points]) {
    lines.push(`### ${point.id} · ${point.title}`, '', `**Pattern:** ${point.pattern}`, '', point.explanation, '');
    for (const example of point.examples) lines.push(`> ${example.chinese}`, `>`, `> ${example.pinyin}`, `>`, `> ${example.english}`, '');
    lines.push(`**Common mistake:** ${point.commonMistake}`, '', '**Self-check:**', '');
    questions(point.exercises);
  }
  const review = curriculum.reviews.find(review => review.afterUnit === unit.number);
  if (review) { lines.push(`### ${review.title}`, '', `One point per correct answer. Suggested readiness target: ${review.passMark}/${review.questions.length}.`, ''); questions(review.questions); }
}
lines.push(`## ${curriculum.finalAssessment.title}`, '', curriculum.finalAssessment.instructions, '');
questions(curriculum.finalAssessment.questions);
lines.push('## Installation', '', 'Run from the repository root. A dry run is the default:', '', '```sh', 'node server/scripts/installHsk1Grammar.js --target local', 'node server/scripts/installHsk1Grammar.js --target hosted', '```', '', 'To install the reviewed content:', '', '```sh', 'node server/scripts/installHsk1Grammar.js --target local --apply', 'node server/scripts/installHsk1Grammar.js --target hosted --apply', '```', '', 'The installer targets only HSK 1, appends published grammar modules, backs up existing lessons in the system temporary directory, and preserves existing lessons and vocabulary. Repeating it skips identical modules. If an existing module has been edited or a matching title already exists, it stops for manual review instead of overwriting it.', '');
fs.writeFileSync(path.join(docs, 'hsk1-grammar-course.md'), lines.join('\n'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(curriculum.title)}</title><style>
body{font-family:system-ui,sans-serif;background:#faf8f3;color:#222;line-height:1.7;margin:0}main{max-width:860px;margin:auto;padding:32px 20px}h1,h2,h3,h4{line-height:1.3}h1{font-size:36px}h2{font-size:28px}h4{font-size:20px}article{margin:40px 0;padding:28px;background:white;border:1px solid #ddd;border-radius:12px;scroll-margin-top:20px}a{color:#a52818}blockquote{margin:16px 0;padding:12px 20px;border-left:3px solid #bd210d;background:#f7f5f1}blockquote p{margin:4px 0}.zh{font-size:23px}.grammar-point{margin:28px 0}.grammar-pattern{padding:12px;background:#f4f1ea}details{border:1px solid #ddd;padding:12px;border-radius:8px;margin:16px 0}summary{cursor:pointer;font-weight:600;min-height:32px}summary:focus-visible,a:focus-visible{outline:2px solid #bd210d;outline-offset:3px}p,li{overflow-wrap:anywhere}nav ul{padding-left:24px}.grammar-course-meta{color:#666;font-size:14px}footer{border-top:1px solid #ddd;margin-top:40px;padding-top:20px;font-size:14px}@media(max-width:500px){main{padding:20px 12px}article{padding:20px 16px}h1{font-size:30px}}@media print{body{background:white}article{break-before:page;border:0}details{display:block}details>*{display:block}nav{display:none}}
</style></head><body><main><h1>${escape(curriculum.title)}</h1><p>${stats.units} modules · ${stats.corePoints} core language points · ${stats.exercises} self-check questions</p><p>${escape(curriculum.studyPlan)}</p><nav aria-label="Course modules"><ol>${curriculum.units.map(unit => `<li><a href="#module-${unit.number}">${escape(unit.title)}</a></li>`).join('')}</ol></nav>${curriculum.units.map(unit => `<article id="module-${unit.number}"><h2>${escape(title(unit))}</h2><h3>Grammar</h3>${renderUnit(unit)}</article>`).join('')}<footer><p>Original BhashaHub teaching material aligned with the reference textbook. Self-check answers are model answers, not automatically graded submissions.</p><ul>${curriculum.sources.map(source => `<li><a href="${escape(source.url)}">${escape(source.title)}</a></li>`).join('')}</ul><p>${escape(curriculum.coverageNote)}</p></footer></main></body></html>`;
fs.writeFileSync(path.join(docs, 'hsk1-grammar-course.html'), html);
console.log(JSON.stringify({ ...stats, exports: ['docs/hsk1-grammar-course.md', 'docs/hsk1-grammar-course.html'] }));
