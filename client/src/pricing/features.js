// Everything the platform offers, shown below the plans on the pricing page.
export const FEATURE_GROUPS = [
  {
    id: 'courses', mark: '课', title: 'HSK courses', summary: 'Step-by-step lessons from your first word upward.',
    items: [
      ['Structured HSK courses', 'Lessons in order, so you always know what to learn next.'],
      ['Vocabulary with audio', 'Every word with characters, pinyin, meaning and pronunciation.'],
      ['Flashcards', 'Flip through a lesson’s words until they stick.'],
      ['Lesson quizzes', 'Check what you learned before moving on.'],
      ['Spaced-repetition review', 'Words come back for review just before you’d forget them.'],
      ['Grammar and dialogues', 'Clear grammar explanations and real conversations from each lesson.'],
      ['Lesson slides', 'Visual slides that walk you through new material.'],
      ['Continue learning', 'Jump straight back to your next unfinished lesson.'],
    ],
  },
  {
    id: 'tests', mark: '测', title: 'HSK mock tests', summary: 'Exam practice that feels like the real thing.',
    items: [
      ['One mock test', 'One full HSK 1 paper, with just a free account.', 'Free'],
      ['Full HSK 1 papers', '40 questions: 20 listening and 20 reading.'],
      ['Timed like the exam', 'Practise under real exam timing.'],
      ['Instant results', 'Your score with a listening and reading breakdown, saved to your account.'],
      ['Answer review', 'See the correct answers with explanations, then try the paper again.'],
    ],
  },
  {
    id: 'studio', mark: '练', title: 'Practice studio', summary: 'Nine focused tools for sounds, characters, listening and speaking. Every plan includes all of them.',
    items: [
      ['Pinyin chart', 'Tap any syllable to hear all four tones. No account needed.', 'Free'],
      ['Tone listening', 'Single syllables and two-syllable tone pairs, with teacher recordings.'],
      ['Trace characters', 'Follow the stroke order and write Chinese characters.'],
      ['Listening practice', 'Hear a word from your lessons and choose its meaning.'],
      ['Sentence builder', 'Put words in the right order across everyday topics.'],
      ['Measure words', 'Learn which measure word goes with which noun.'],
      ['Everyday numbers', 'Understand prices, times, dates, phone numbers and ages.'],
      ['Listening dictation', 'Listen to a sentence and write what you hear.'],
      ['Conversation practice', 'Build confidence with guided, line-by-line Chinese conversations.'],
    ],
  },
  {
    id: 'progress', mark: '进', title: 'Progress and habits', summary: 'See how far you’ve come and keep going.',
    items: [
      ['My Courses', 'Your saved courses and completed lessons in one place.'],
      ['My Progress', 'Course progress, mock test scores and practice across every studio.'],
      ['Daily practice reminder', 'One notification a day at your chosen time, skipped if you’ve already practised.'],
      ['Install on your phone', 'Add Xiao Ao to your home screen and open it like an app.'],
      ['Light and dark mode', 'Comfortable reading, day or night.'],
    ],
  },
  {
    id: 'teachers', mark: '师', title: 'Live classes', summary: 'Learn with a teacher as well.',
    items: [
      ['Live classes with a teacher', 'Message us on WhatsApp or Viber and we’ll tell you about upcoming classes.'],
    ],
    action: 'Message us about live classes',
  },
];
