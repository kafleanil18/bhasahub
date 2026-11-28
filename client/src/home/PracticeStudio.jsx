import { useNavigate } from 'react-router-dom';
import './HeroPracticeTools.css';
import PracticeToolIcon from './PracticeToolIcon';
import { practiceTools } from './practiceTools';
import { useShowsFreeMockTest } from '../tests/useShowsFreeMockTest';
import { useFreePaper } from '../tests/useFreePaper';

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
}


const practiceCharacters = { pinyin: '拼', tones: '声', trace: '字', listening: '听', sentences: '句', measures: '本', numbers: '数', dictation: '写', conversation: '聊', tests: '测' };

// The red bar is the HSK 1 free mock test, shown only to people who can't open every mock test
// (see useShowsFreeMockTest).
export default function PracticeStudio({ user, onOpenPractice }) {
  const navigate = useNavigate();
  const showFreeTest = useShowsFreeMockTest(user);
  // Everyone sees every tool on the home page.
  const available = practiceTools.filter(([id]) => id !== 'tests' || showFreeTest);
  const tools = available;
  // Guests are asked to sign in on the way and land on the free paper afterwards.
  const freePaper = useFreePaper();
  const open = id => id === 'tests' ? navigate(freePaper.path) : onOpenPractice(id);
  return (
<section className="hero-practice-tools" aria-label="Practice studio">
  <div className="hero-practice-heading"><h2 className="hero-practice-title">Your practice studio</h2></div>
  <div className="hero-practice-list">
    {tools.map(([id, title, description]) => {
      const locked = !user && id !== 'pinyin';
      return (
      <button key={id} type="button" className={`hero-practice-link hero-practice-${id}${locked ? ' is-locked' : ''}`} data-char={practiceCharacters[id]} onClick={() => open(id)} aria-label={locked ? `${id === 'tests' ? 'HSK 1 free mock test' : title}, sign in required` : undefined}>
        {id !== 'tests' && <span className="hero-practice-glyph" aria-hidden="true"><span className="practice-symbol-flip"><span className="practice-symbol-face"><PracticeToolIcon tool={id}/></span><span className="practice-symbol-face is-back" lang="zh-CN">{practiceCharacters[id]}</span></span></span>}
        <span className="hero-practice-copy">
          {id === 'tests' && <span className="studio-test-label">READY FOR YOUR HSK EXAM?</span>}
          <strong>{id === 'tests' ? 'HSK 1 free mock test' : title}</strong>
          <small>{id === 'tests' ? `The full ${freePaper.code} paper: 40 listening and reading questions, timed like the real exam.` : description}</small>
        </span>
        {id === 'tests' && <span className="studio-test-action" aria-hidden="true">{locked ? 'Sign in to start' : 'Start the free test'} <span>{locked && <LockIcon/>}</span></span>}
        {id !== 'tests' && <span className="hero-practice-arrow" aria-hidden="true">{locked && <LockIcon/>}</span>}
      </button>
      );
    })}
  </div>
</section>
  );
}
