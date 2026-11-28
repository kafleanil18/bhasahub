const { createGrammarCourse } = require('./grammarCourse');

module.exports = createGrammarCourse(require('../data/hsk1GrammarCourse'), { corePoints: 45 });
