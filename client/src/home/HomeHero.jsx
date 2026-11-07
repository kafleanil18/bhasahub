import PracticeStudio from './PracticeStudio';
import './HomeHero.css';

export default function HomeHero({ onContinueLearning, onPinyinPractice, user, hasStartedCourse = false, onOpenPractice, onEnquireLiveClasses }) {
  const teaching = user?.role === 'admin';
  const firstStudentLogin = user?.role === 'student' && user.isFirstLogin === true;
  const startLearning = () => {
    if (!user) onPinyinPractice();
    else if (hasStartedCourse) onContinueLearning();
    else requestAnimationFrame(() => document.getElementById('courses')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  };
  return <>
    <section className={`home-hero${!user ? ' is-logged-out' : ''}`} aria-labelledby="home-hero-title">
      <div className="container home-hero-grid">
        <div className="home-hero-intro">
          <p className="home-hero-eyebrow"><span aria-hidden="true"/>{teaching ? `Welcome back, ${user.name}.` : user ? 'Your Chinese learning journey' : 'A new language. A new beginning.'}</p>
          <h1 id="home-hero-title">{teaching ? <>Great lessons<br/>start <em>here.</em></> : user ? firstStudentLogin ? <>Your next step starts here,<br/><em>{user.name}.</em></> : <>Welcome back,<br/><em>{user.name}.</em></> : <>A Complete Mandarin<br/><em className="home-hero-platform">Platform.</em></>}</h1>
          <p className="home-hero-description">{teaching ? 'Explore your courses, try a practice activity, and get ready for your next class. A little preparation makes a difference.' : user ? hasStartedCourse ? 'Pick up where you left off, or choose a skill to practice. A little Chinese today goes a long way.' : 'Find your first course below, or explore a practice tool to get started.' : <>HSK mock tests, pinyin, Chinese characters, listening practice, sentence building, conversations and <button type="button" className="home-hero-live-classes" onClick={onEnquireLiveClasses} aria-haspopup="dialog">Live classes</button></>}</p>
          <div className="home-hero-actions"><button className="home-hero-primary" onClick={startLearning}>{teaching ? 'HSK courses' : user ? hasStartedCourse ? 'Continue learning' : 'Start learning' : 'Pinyin practice'}<span aria-hidden="true">↗</span></button><a className="home-hero-secondary" href={user ? '#practice-studio' : '#courses'}>{user ? 'Choose a practice' : 'HSK courses'}<span aria-hidden="true">↓</span></a>{!user && <a className="home-hero-secondary" href="#practice-studio">Practice studio<span aria-hidden="true">↓</span></a>}</div>
          <p className="home-hero-note">{teaching ? 'Your courses. Your classroom. Your teaching studio.' : user ? 'Your courses. Your pace. Your next conversation.' : 'No account needed for pinyin practice.'}</p>
        </div>
        <div className="home-hero-artwork">
          <div className="home-hero-landscape"><img src="/images/chinese-ink-landscape.jpg" width="1200" height="800" alt="" aria-hidden="true" decoding="async" fetchPriority="high"/><span className="home-hero-stamp" lang="zh-CN" aria-hidden="true">学</span></div>
        </div>
      </div>
    </section>
    <div id="practice-studio" className="container home-practice-directory"><PracticeStudio user={user} onOpenPractice={onOpenPractice}/></div>
  </>;
}
