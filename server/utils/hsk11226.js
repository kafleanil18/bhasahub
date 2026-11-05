const paper = require('../data/hsk11226');
const questions = paper.groups.flatMap(group => group.questions);
function publicPaper() {
  return { ...paper, groups: paper.groups.map(group => ({ ...group, questions: group.questions.map(({ correctIndex, explanation, ...question }) => question) })) };
}
function grade(answers) {
  if (!Array.isArray(answers) || answers.length !== questions.length || answers.some((answer, index) => answer !== null && (!Number.isInteger(answer) || answer < 0 || answer >= questions[index].options.length))) {
    throw new Error('Submit exactly 40 valid answers. Use null for unanswered questions.');
  }
  const correct = questions.map((question, i) => answers[i] === question.correctIndex);
  const listening = correct.slice(0, 20).filter(Boolean).length;
  const reading = correct.slice(20).filter(Boolean).length;
  return { listening, reading, score: listening + reading };
}
function result(attempt) {
  const value = attempt.toObject ? attempt.toObject() : attempt;
  const { user, __v, ...safe } = value;
  if (value.status !== 'submitted') return safe;
  return { ...safe, total: 40, percent: Math.round(value.score / 40 * 100), review: questions.map((question, index) => ({ number: question.number, answer: value.answers[index], correctIndex: question.correctIndex, explanation: question.explanation })) };
}
module.exports = { publicPaper, grade, result };
