// Ready-made practice reminders. Each fills the subject and message, which stay editable before sending.
// `audience` is the student group the template suits; choosing the template selects that group.
// The greeting ("Hi [name],"), a link to the student's courses and an unsubscribe link are added by the server.
export const reminderTemplates = [
  {
    id: 'daily',
    title: 'Daily practice',
    hint: 'A friendly everyday nudge',
    icon: 'bell',
    audience: 'all',
    subject: 'Don’t forget your Chinese practice today',
    message: 'A little Chinese practice every day makes a big difference. Take 10 minutes today to review your vocabulary, listen to a conversation, or practise speaking aloud.\n\nKeep going, one small step at a time. We look forward to seeing your progress!',
  },
  {
    id: 'comeback',
    title: 'We miss you',
    hint: 'For students who have gone quiet',
    icon: 'heart',
    audience: '7',
    subject: 'Your Chinese is waiting for you',
    message: 'It has been a little while since your last practice, and that is completely fine. Life gets busy.\n\nThe easiest way back is a short session: replay one conversation, or trace three characters. Five minutes is enough to pick up where you left off.\n\nWe would love to see you back in class.',
  },
  {
    id: 'mocktest',
    title: 'Mock test challenge',
    hint: 'Get ready for the HSK exam',
    icon: 'target',
    audience: 'all',
    subject: 'Try an HSK mock test this week',
    message: 'Ready to see how far you have come? Take one HSK mock test this week. It is timed like the real exam and shows exactly which questions to review.\n\nNot sure where to start? One HSK 1 paper is free for everyone with an account.\n\nEvery test you take makes exam day feel more familiar.',
  },
  {
    id: 'expiring',
    title: 'Access ending soon',
    hint: 'Make the most of the time left',
    icon: 'hourglass',
    audience: 'ending',
    subject: 'Make the most of your Chinese course access',
    message: 'Your course access ends soon, so this is a great week to finish the lessons you started and review your vocabulary.\n\nIf you would like to keep learning after that, you can choose a plan from the Pricing page. Every plan unlocks all of our HSK courses.\n\nThank you for learning with us!',
  },
];
