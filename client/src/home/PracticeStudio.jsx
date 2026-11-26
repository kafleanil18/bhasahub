import './HeroPracticeTools.css';
import PracticeToolIcon from './PracticeToolIcon';
import { practiceTools } from './practiceTools';

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
}

const practiceCharacters = { pinyin: '拼', tones: '声', trace: '字', listening: '听', sentences: '句', measures: '本', numbers: '数', dictation: '写', conversation: '聊', tests: '测' };

export default function PracticeStudio({ user, onOpenPractice }) {
  return (
<section className="hero-practice-tools" aria-label="Practice studio">
  <div className="hero-practice-heading"><div className="practice-kicker-glide"><div className="practice-kicker-track"><p className="hero-practice-kicker">Your practice studio</p></div></div><span className="hero-practice-count">{practiceTools.length} ways to learn</span></div>
  <div className="hero-practice-list">
    {practiceTools.map(([id, title, description]) => {
      const locked = !user && id !== 'pinyin';
      return (
      <button key={id} type="button" className={`hero-practice-link hero-practice-${id}${locked ? ' is-locked' : ''}`} onClick={() => onOpenPractice(id)} aria-label={locked ? `${id === 'tests' ? 'HSK mock tests' : title}, sign in required` : undefined}>
        {id !== 'tests' && <span className="hero-practice-glyph" aria-hidden="true"><span className="practice-symbol-flip"><span className="practice-symbol-face"><PracticeToolIcon tool={id}/></span><span className="practice-symbol-face is-back" lang="zh-CN">{practiceCharacters[id]}</span></span></span>}
        <span className="hero-practice-copy">
          {id === 'tests' && <span className="studio-test-label">READY FOR YOUR HSK EXAM?</span>}
          <strong>{id === 'tests' ? 'HSK mock tests' : title}</strong>
          <small>{description}</small>
        </span>
        {id === 'tests' && <span className="studio-test-action" aria-hidden="true">{locked ? 'Sign in to start' : 'Take a mock test'} <span>{locked && <LockIcon/>}</span></span>}
        {id !== 'tests' && <span className="hero-practice-arrow" aria-hidden="true">{locked && <LockIcon/>}</span>}
      </button>
      );
    })}
  </div>
</section>
  );
}
