import './HeroPracticeTools.css';

const practiceTools = [
  ['pinyin', '拼', 'Pinyin Chart', 'Start here: learn sounds and tones.'],
  ['trace', '字', 'Trace Characters', 'Follow the strokes and write Chinese.'],
  ['listening', '听', 'Listening Practice', 'Hear a word and choose its meaning.'],
  ['sentences', '句', 'Sentence Builder', 'Arrange words into a sentence.'],
  ['measures', '本', 'Measure Word Practice', 'Choose the word for counting things.'],
  ['numbers', '数', 'Everyday Chinese Numbers', 'Practice prices, times, and dates.'],
  ['dictation', '写', 'Listening Dictation', 'Listen to recordings and write what you hear.'],
  ['tests', '测', 'Mock Tests', 'Check what you know with a practice test.'],
];

export default function PracticeStudio({ user, onOpenPractice, standalone = false }) {
  const Heading = standalone ? 'h1' : 'h2';
  return (
<section className="hero-practice-tools" aria-labelledby="hero-practice-title">
  <div className="hero-practice-heading"><p className="hero-practice-kicker">Your practice studio</p><span className="hero-practice-count">8 ways to learn</span></div>
  <Heading id="hero-practice-title">What will you practice today?</Heading>
  <p className="hero-practice-intro">{user ? 'Choose a skill and keep building your Chinese.' : 'Explore pinyin for free. Sign in to unlock the other practice tools.'}</p>
  <div className="hero-practice-list">
    {practiceTools.map(([id, glyph, title, description]) => (
      <button key={id} type="button" className={`hero-practice-link hero-practice-${id}`} onClick={() => onOpenPractice(id)}>
        <span className="hero-practice-glyph" lang={id === 'tests' ? undefined : 'zh-CN'} aria-hidden="true">{id === 'tests' ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10l2 2 4-4M9 16h6"/></svg> : glyph}</span>
        <span className="hero-practice-copy">{id === 'pinyin' && <span className="hero-practice-start">START HERE · PRONUNCIATION</span>}{id === 'tests' && <span className="mock-test-kicker">READY FOR YOUR NEXT MILESTONE?</span>}<strong>{id === 'tests' ? 'HSK 1 Mock Test' : title}</strong><small>{id === 'tests' ? 'Explore HSK mock tests, check your score, and discover what to practice next.' : description}</small>{id === 'tests' && <span className="mock-test-cta">{user ? 'Explore mock tests' : 'Sign in to try mock tests'} <span aria-hidden="true">→</span></span>}</span>
        {id !== 'tests' && <span className="hero-practice-arrow" aria-hidden="true">↗</span>}
      </button>
    ))}
  </div>
</section>
  );
}
