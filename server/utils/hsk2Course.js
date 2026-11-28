const { createGrammarCourse } = require('./grammarCourse');
const vocabulary = require('../data/hsk2Vocabulary');

const grammar = createGrammarCourse(require('../data/hsk2GrammarCourse'), { corePoints: 44 });

const courseDefaults = {
  title: 'HSK 2 Chinese',
  language: 'chinese',
  level: 'HSK 2',
  description: 'Elementary Mandarin covering the HSK 2 vocabulary and grammar.',
  glyph: '文',
  image: '',
  published: true,
};

const sameWords = (existing, planned) => existing.length === planned.length
  && existing.every((item, i) => item.word === planned[i].word && item.pronunciation === planned[i].pronunciation && item.meaning === planned[i].meaning);

// Vocabulary lessons come first, then the grammar modules, all appended after any existing lessons.
// existingWords maps a lesson id to that lesson's vocabulary rows. Nothing existing is ever changed.
function planCourse(existingLessons, existingWords = new Map()) {
  let nextOrder = Math.max(0, ...existingLessons.map(lesson => lesson.order || 0));
  const vocabularyPlan = vocabulary.lessons.map((planned, index) => {
    const words = planned.words.map((item, i) => ({ word: item.word, pronunciation: item.pronunciation, meaning: item.meaning, audioUrl: '', order: i + 1 }));
    const matches = existingLessons.filter(lesson => lesson.title === planned.title);
    if (matches.length > 1) throw new Error(`Multiple existing lessons are titled ${planned.title}`);
    if (matches.length) {
      const lesson = matches[0];
      const current = [...(existingWords.get(String(lesson._id)) || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      if (lesson.category !== 'vocabulary' || !sameWords(current, words)) throw new Error(`Existing vocabulary lesson ${index + 1} differs; preserve it and review manually`);
      return { action: 'skip', kind: 'vocabulary', number: index + 1, id: String(lesson._id), title: lesson.title };
    }
    const lesson = { title: planned.title, category: 'vocabulary', grammarExplanation: '', grammarImage: '', dialogue: '', dialogueImage: '', dialogueLines: [], order: ++nextOrder, published: true };
    return { action: 'insert', kind: 'vocabulary', number: index + 1, lesson, words };
  });
  const inserted = vocabularyPlan.filter(item => item.action === 'insert').map(item => item.lesson);
  const grammarPlan = grammar.planInstallation([...existingLessons, ...inserted]).map(item => ({ ...item, kind: 'grammar' }));
  return [...vocabularyPlan, ...grammarPlan];
}

function validateCourse() {
  const words = vocabulary.lessons.flatMap(lesson => lesson.words);
  if (new Set(words.map(item => item.word)).size !== words.length) throw new Error('Duplicate HSK 2 vocabulary word');
  for (const item of words) if (!item.word || !item.pronunciation || !item.meaning || !(item.lesson >= 1 && item.lesson <= 15)) throw new Error(`Incomplete vocabulary entry: ${item.word}`);
  return { vocabularyLessons: vocabulary.lessons.length, words: words.length, ...grammar.validateCurriculum() };
}

module.exports = { ...grammar, vocabulary, courseDefaults, planCourse, validateCourse };
