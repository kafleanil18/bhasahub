// Shared renderer and installer planner for the HSK grammar curricula in server/data.
// The HTML shape is parsed by client/src/courses/grammarContent.js, so keep the class names stable.
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pointId = number => `G${String(number).padStart(2, '0')}`;

function createGrammarCourse(curriculum, { corePoints, reviewAfter = [5, 10, 15] }) {
  const unitCount = curriculum.units.length;
  const marker = number => `<!-- ${curriculum.key}:unit-${number} -->`;
  const title = unit => `Grammar ${String(unit.number).padStart(2, '0')} · ${unit.title}`;

  function validateCurriculum() {
    const core = curriculum.units.flatMap(unit => unit.points);
    if (unitCount !== 15 || core.length !== corePoints) throw new Error(`Expected 15 units and ${corePoints} core language points`);
    if (new Set(core.map(point => point.id)).size !== corePoints) throw new Error('Duplicate core language-point IDs');
    for (let i = 1; i <= corePoints; i++) if (!core.some(point => point.id === pointId(i))) throw new Error(`Missing core language point ${i}`);
    const allPoints = curriculum.units.flatMap(unit => [...unit.foundations, ...unit.points]);
    if (new Set(allPoints.map(point => point.id)).size !== allPoints.length) throw new Error('Duplicate language-point IDs');
    for (const point of allPoints) {
      if (!point.title || !point.pattern || !point.explanation || !point.commonMistake || point.examples.length < 2 || point.exercises.length < 2) throw new Error(`Incomplete teaching content: ${point.id}`);
      for (const example of point.examples) if (!example.chinese || !example.pinyin || !example.english) throw new Error(`Incomplete example: ${point.id}`);
    }
    const questions = [...allPoints.flatMap(point => point.exercises), ...curriculum.reviews.flatMap(review => review.questions), ...curriculum.finalAssessment.questions];
    for (const question of questions) if (!question.prompt || !question.answer || !question.explanation) throw new Error('An exercise is missing its answer or explanation');
    for (const question of curriculum.finalAssessment.questions) for (const id of question.points) if (!core.some(point => point.id === id)) throw new Error(`Unknown assessment reference: ${id}`);
    if (curriculum.reviews.map(review => review.afterUnit).join(',') !== reviewAfter.join(',')) throw new Error(`Review checkpoints must follow modules ${reviewAfter.join(', ')}`);
    return { units: unitCount, corePoints: core.length, foundationPoints: allPoints.length - core.length, exercises: questions.length };
  }

  function renderQuestions(questions, heading, instructions, headingLevel = 4) {
    return `<section class="grammar-self-check"><h${headingLevel}>${escape(heading)}</h${headingLevel}>${instructions ? `<p>${escape(instructions)}</p>` : ''}<ol>${questions.map(question => `<li><p>${escape(question.prompt)}</p></li>`).join('')}</ol><details><summary>Show model answers and explanations</summary><ol>${questions.map(question => `<li><p><strong>${escape(question.answer)}</strong></p><p>${escape(question.explanation)}</p>${question.points ? `<p>Review: ${escape(question.points.join(', '))}</p>` : ''}</li>`).join('')}</ol></details></section>`;
  }

  function renderUnit(unit) {
    const points = [...unit.foundations, ...unit.points];
    const review = curriculum.reviews.find(review => review.afterUnit === unit.number);
    return `${marker(unit.number)}<p class="grammar-course-meta">Module ${unit.number} of ${unitCount} · About ${unit.estimatedMinutes} minutes</p><p><strong>Learning objective:</strong> ${escape(unit.objective)}</p><p>Read each pattern, say the examples aloud, then write your own answers before opening the model-answer key. Equivalent grammatically correct answers are welcome.</p><nav aria-label="Module contents"><ul>${points.map(point => `<li>${escape(point.id)} · ${escape(point.title)}</li>`).join('')}</ul></nav>${points.map(point => `<section class="grammar-point"><h4>${escape(point.id)} · ${escape(point.title)}</h4><p class="grammar-pattern"><strong>Pattern:</strong> ${escape(point.pattern)}</p><p>${escape(point.explanation)}</p>${point.examples.map(example => `<blockquote><p class="zh">${escape(example.chinese)}</p><p><em>${escape(example.pinyin)}</em></p><p>${escape(example.english)}</p></blockquote>`).join('')}<p><strong>Common mistake:</strong> ${escape(point.commonMistake)}</p>${renderQuestions(point.exercises, 'Practice this point', null, 5)}</section>`).join('')}${review ? renderQuestions(review.questions, review.title, `Self-check: one point per complete correct answer. Suggested target: ${review.passMark} out of ${review.questions.length}. Review any missed patterns before moving on.`) : ''}${unit.number === unitCount ? renderQuestions(curriculum.finalAssessment.questions, curriculum.finalAssessment.title, curriculum.finalAssessment.instructions) : ''}<p><strong>Before marking complete:</strong> explain each pattern in your own words, make one new example per point, and revisit any exercise you missed.</p>`;
  }

  // Only append new lessons. Refuse conflicting names or teacher-edited content.
  function planInstallation(existingLessons) {
    validateCurriculum();
    const maxOrder = Math.max(0, ...existingLessons.map(lesson => lesson.order || 0));
    let nextOrder = maxOrder;
    return curriculum.units.map(unit => {
      const html = renderUnit(unit);
      const matches = existingLessons.filter(lesson => lesson.title === title(unit) || (lesson.grammarExplanation || '').includes(marker(unit.number)));
      if (matches.length > 1) throw new Error(`Multiple existing lessons match module ${unit.number}`);
      if (matches.length) {
        const lesson = matches[0];
        if (lesson.category !== 'grammar' || lesson.grammarExplanation !== html || lesson.title !== title(unit)) throw new Error(`Existing module ${unit.number} differs; preserve it and review manually`);
        return { action: 'skip', number: unit.number, id: String(lesson._id), title: lesson.title };
      }
      return { action: 'insert', number: unit.number, lesson: { title: title(unit), category: 'grammar', grammarExplanation: html, grammarImage: '', dialogue: '', dialogueImage: '', dialogueLines: [], order: ++nextOrder, published: true } };
    });
  }

  return { curriculum, marker, title, validateCurriculum, renderUnit, planInstallation };
}

module.exports = { createGrammarCourse, escape };
