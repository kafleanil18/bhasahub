// Facts for the "About HSK" page, from Chinese Testing International (chinesetest.cn) for HSK 1–6
// and the 2021 HSK 3.0 standard (GF 0025-2021) for the nine-level scale.
export const hskLevels = [
  { level: 1, words: 150, questions: 40, goodFor: 'A first milestone and a confidence boost', minutes: 40, score: 200, pass: 120, skills: ['listening', 'reading'], can: 'Greet people, count, and introduce yourself.' },
  { level: 2, words: 300, questions: 60, goodFor: 'Short trips and basic daily needs in China', minutes: 55, score: 200, pass: 120, skills: ['listening', 'reading'], can: 'Chat simply about everyday things.' },
  { level: 3, words: 600, questions: 80, goodFor: 'Many scholarships and Chinese language programmes', minutes: 90, score: 300, pass: 180, skills: ['listening', 'reading', 'writing'], can: 'Get by in daily life, study and travel in China.' },
  { level: 4, words: 1200, questions: 100, goodFor: 'Most bachelor’s degrees taught in Chinese', minutes: 105, score: 300, pass: 180, skills: ['listening', 'reading', 'writing'], can: 'Talk fluently with native speakers on many topics.' },
  { level: 5, words: 2500, questions: 100, goodFor: 'Master’s degrees and jobs that use Chinese', minutes: 125, score: 300, pass: 180, skills: ['listening', 'reading', 'writing'], can: 'Read newspapers, watch films and give a talk.' },
  { level: 6, words: 5000, questions: 101, goodFor: 'Translation work and the most demanding programmes', minutes: 140, score: 300, pass: 180, skills: ['listening', 'reading', 'writing'], can: 'Understand almost anything and express yourself with ease.' },
];

export const skills = {
  listening: { icon: 'headphones', name: 'Listening', zh: '听力', text: 'Hear short dialogues and talks, then choose the right picture or answer.' },
  reading: { icon: 'book', name: 'Reading', zh: '阅读', text: 'Match sentences, fill gaps and answer questions on passages. HSK 1–2 show pinyin.' },
  writing: { icon: 'brush', name: 'Writing', zh: '书写', text: 'From HSK 3: build sentences, then write short paragraphs. HSK 6 ends with a summary.' },
};

export const registerSteps = [
  ['target', 'Find your level', 'Take a mock test and aim for the level you can pass comfortably.'],
  ['pencil', 'Register online', 'Book at chinesetest.cn: choose paper or computer, a test centre and a date.'],
  ['file', 'Sit the exam', 'Bring your admission ticket and the ID you registered with.'],
  ['checkCircle', 'Get your results', 'About 2 weeks for computer tests, about a month for paper tests.'],
];
