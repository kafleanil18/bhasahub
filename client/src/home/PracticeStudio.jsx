import './HeroPracticeTools.css';
import PracticeToolIcon from './PracticeToolIcon';

const practiceTools = [
  ['pinyin', 'Pinyin Chart', 'Start here: learn sounds and tones.'],
  ['trace', 'Trace Characters', 'Follow the strokes and write Chinese.'],
  ['listening', 'Listening Practice', 'Hear a word and choose its meaning.'],
  ['sentences', 'Sentence Builder', 'Arrange words into a sentence.'],
  ['measures', 'Measure Word Practice', 'Choose the word for counting things.'],
  ['numbers', 'Everyday Chinese Numbers', 'Practice prices, times, and dates.'],
  ['dictation', 'Listening Dictation', 'Listen to recordings and write what you hear.'],
  ['conversation', 'Conversation', 'Build confidence with guided Chinese conversations.'],
  ['tests', 'Mock Tests', 'Check what you know with a practice test.'],
];
const practiceCharacters = { pinyin: '拼', trace: '字', listening: '听', sentences: '句', measures: '本', numbers: '数', dictation: '写', conversation: '聊', tests: '测' };

export default function PracticeStudio({ user, onOpenPractice, standalone = false }) {
  const Heading = standalone ? 'h1' : 'h2';
  return (
<section className="hero-practice-tools" aria-labelledby="hero-practice-title">
  <div className="hero-practice-heading"><p className="hero-practice-kicker">Your practice studio</p><span className="hero-practice-count">9 ways to learn</span></div>
  <Heading id="hero-practice-title">What will you practice today?</Heading>
  <p className="hero-practice-intro">{user ? 'Choose a skill and keep building your Chinese.' : 'Explore pinyin for free. Sign in to unlock the other practice tools.'}</p>
  <div className="hero-practice-list">
    {practiceTools.map(([id, title, description]) => (
      <button key={id} type="button" className={`hero-practice-link hero-practice-${id}`} onClick={() => onOpenPractice(id)}>
        <span className="hero-practice-glyph" aria-hidden="true"><span className="practice-symbol-flip"><span className="practice-symbol-face"><PracticeToolIcon tool={id}/></span><span className="practice-symbol-face is-back" lang="zh-CN">{practiceCharacters[id]}</span></span></span>
        <span className="hero-practice-copy">{id === 'pinyin' && <span className="hero-practice-start">START HERE · PRONUNCIATION</span>}{id === 'tests' && <span className="mock-test-kicker">READY FOR YOUR NEXT MILESTONE?</span>}<strong>{id === 'tests' ? 'HSK 1 Mock Test' : title}</strong><small>{id === 'tests' ? 'Explore HSK mock tests, check your score, and discover what to practice next.' : description}</small>{id === 'tests' && <span className="mock-test-cta">{user ? 'Explore mock tests' : 'Sign in to try mock tests'} <span aria-hidden="true">→</span></span>}</span>
        {id !== 'tests' && <span className="hero-practice-arrow" aria-hidden="true">↗</span>}
      </button>
    ))}
  </div>
</section>
  );
}
