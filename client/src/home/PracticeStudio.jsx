import './HeroPracticeTools.css';
import PracticeToolIcon from './PracticeToolIcon';

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
}

const practiceTools = [
  ['tests', 'Mock Tests', 'Check what you know with a practice test.'],
  ['pinyin', 'Pinyin & tones', 'Build a clear foundation in Chinese sounds.'],
  ['trace', 'Trace characters', 'Follow the strokes and write Chinese.'],
  ['listening', 'Listening practice', 'Hear a word and choose its meaning.'],
  ['sentences', 'Sentence builder', 'Arrange words into a sentence.'],
  ['measures', 'Measure words', 'Choose the word for counting things.'],
  ['numbers', 'Everyday numbers', 'Use numbers for prices, times, and dates.'],
  ['dictation', 'Listening dictation', 'Listen to recordings and write what you hear.'],
  ['conversation', 'Conversation', 'Build confidence with guided Chinese conversations.'],
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
    {practiceTools.map(([id, title, description]) => {
      const locked = !user && id !== 'pinyin';
      return (
      <button key={id} type="button" className={`hero-practice-link hero-practice-${id}${locked ? ' is-locked' : ''}`} onClick={() => onOpenPractice(id)} aria-label={locked ? `${id === 'tests' ? 'HSK mock tests' : title} — sign in required` : undefined}>
        {id !== 'tests' && <span className="hero-practice-glyph" aria-hidden="true"><span className="practice-symbol-flip"><span className="practice-symbol-face"><PracticeToolIcon tool={id}/></span><span className="practice-symbol-face is-back" lang="zh-CN">{practiceCharacters[id]}</span></span></span>}
        <span className="hero-practice-copy">
          {id === 'tests' && <span className="studio-test-label">READY FOR YOUR HSK EXAM?</span>}
          <strong>{id === 'tests' ? 'HSK mock tests' : title}</strong>
          <small>{description}</small>
        </span>
        {id === 'tests' && <span className="studio-test-action" aria-hidden="true">{locked ? 'Sign in to start' : 'Take a mock test'} <span>{locked ? <LockIcon/> : '→'}</span></span>}
        {id !== 'tests' && <span className="hero-practice-arrow" aria-hidden="true">{locked ? <LockIcon/> : '↗'}</span>}
      </button>
      );
    })}
  </div>
</section>
  );
}
