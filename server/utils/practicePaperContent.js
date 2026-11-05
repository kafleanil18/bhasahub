const IDS = ['l1', 'l2', 'l3', 'l4', 'r1', 'r2', 'r3', 'r4'];
const text = (value, max = 5000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const url = value => {
  const result = text(value, 2000);
  if (result && !/^https?:\/\//i.test(result) && !/^\/(?!\/)/.test(result)) throw new Error('Media must use an uploaded file URL.');
  return result;
};
const option = value => ({ text: text(value?.text, 500), pinyin: text(value?.pinyin, 500) });
function cleanContent(input) {
  if (!input || !Array.isArray(input.groups) || input.groups.length !== 8) throw new Error('Use all eight parts, with five questions in each part.');
  const title = text(input.title, 150);
  if (!title) throw new Error('Enter a paper title.');
  const seconds = key => {
    const value = Number(input[key]);
    if (!Number.isInteger(value) || value < 30 || value > 7200) throw new Error('Section timers must be between 30 and 7200 seconds.');
    return value;
  };
  const groups = input.groups.map((group, gi) => {
    if (group.id !== IDS[gi] || !Array.isArray(group.questions) || group.questions.length !== 5) throw new Error('Keep the eight parts in order, with five questions in each.');
    const questions = group.questions.map((q, qi) => {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) throw new Error('Each question needs two to six answer choices.');
      const correctIndex = q.correctIndex === null ? null : q.correctIndex;
      if (correctIndex !== null && (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= q.options.length)) throw new Error('Select a valid correct answer.');
      return { number: gi * 5 + qi + 1, text: text(q.text), pinyin: text(q.pinyin), image: url(q.image), options: q.options.map(option), correctIndex, explanation: text(q.explanation), listeningText: text(q.listeningText) };
    });
    const choices = Array.isArray(group.choices) ? group.choices.slice(0, 6).map(option) : undefined;
    if ([6, 7].includes(gi) && choices?.length !== 6) throw new Error('Reading parts 3 and 4 need a shared bank of six choices.');
    return { id: IDS[gi], section: gi < 4 ? 'listening' : 'reading', title: text(group.title, 150), instruction: text(group.instruction), image: url(group.image), imageCaption: text(group.imageCaption, 500), example: text(group.example), ...(choices ? { choices } : {}), questions };
  });
  return { title, code: text(input.code, 60) || 'Custom paper', audioUrl: url(input.audioUrl), listeningSeconds: seconds('listeningSeconds'), transferSeconds: seconds('transferSeconds'), readingSeconds: seconds('readingSeconds'), groups };
}
function validateReady(content) {
  if (!content.audioUrl) throw new Error('Upload the full listening recording before making the paper live.');
  for (const group of content.groups) {
    if (!group.title || !group.instruction) throw new Error('Add a title and instructions for every part.');
    if (['l3', 'r2'].includes(group.id) && !group.image) throw new Error(`${group.title}: upload the shared A–F picture sheet.`);
    if (group.choices?.some(choice => !choice.text)) throw new Error(`${group.title}: fill in all shared answer choices.`);
    for (const q of group.questions) {
      if (q.correctIndex === null || q.options.some(o => !o.text) || !q.explanation) throw new Error(`Question ${q.number}: add answer choices, a correct answer, and an explanation.`);
      if (group.section === 'reading' && (!q.text || !q.pinyin)) throw new Error(`Question ${q.number}: add Chinese text and pinyin.`);
      if (['l1', 'l2', 'r1'].includes(group.id) && !q.image) throw new Error(`Question ${q.number}: upload a question picture.`);
    }
  }
}
module.exports = { cleanContent, validateReady };
