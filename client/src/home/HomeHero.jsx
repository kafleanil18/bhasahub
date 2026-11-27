import PracticeStudio from './PracticeStudio';
import './HomeHero.css';

export default function HomeHero({ onContinueLearning, onPinyinPractice, user, hasStartedCourse = false, onOpenPractice }) {
  const teaching = user?.role === 'admin';
  const firstStudentLogin = user?.role === 'student' && user.isFirstLogin === true;
  const scrollToCourses = () => requestAnimationFrame(() => document.getElementById('courses')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  // Students who have started a course pick up where they left off. New students with no course yet
  // choose one in the HSK courses section below. Admins don't get this button.
  const startLearning = () => {
    if (!user) onPinyinPractice();
    else if (hasStartedCourse) onContinueLearning();
    else scrollToCourses();
  };
  return <>
    <section className={`home-hero${!user ? ' is-logged-out' : ''}`} aria-labelledby="home-hero-title">
      <div className="container home-hero-grid">
        <div className="home-hero-intro">
          {teaching && <p className="home-hero-eyebrow">Welcome back, {user.name}.</p>}
          <h1 id="home-hero-title">{teaching ? <>Great lessons<br/>start <em>here.</em></> : user ? firstStudentLogin ? <>Your next step starts here,<br/><em>{user.name}.</em></> : <>Welcome back,<br/><em>{user.name}.</em></> : <>A Complete Mandarin<br/><em className="home-hero-platform">Platform.</em></>}</h1>
          <p className="home-hero-description">{teaching ? 'Explore your courses, try a practice activity, and get ready for your next class. A little preparation makes a difference.' : user ? hasStartedCourse ? 'Pick up where you left off, or choose a skill to practice. A little Chinese today goes a long way.' : 'Find your first course below, or explore a practice tool to get started.' : 'Learn Mandarin step by step, from pinyin to the HSK.'}</p>
          {/* The header links to the HSK courses and practice studio sections, so the hero doesn't repeat them. */}
          <div className="home-hero-actions">{!teaching && <button className="home-hero-primary" onClick={startLearning}>{user ? hasStartedCourse ? 'Continue learning' : 'Start learning' : 'Pinyin practice'}</button>}{user && <a className="home-hero-secondary" href="#practice-studio">Choose a practice</a>}</div>
          <p className="home-hero-note">{teaching ? 'Your courses. Your classroom. Your teaching studio.' : user ? 'Your courses. Your pace. Your next conversation.' : 'No account needed for pinyin practice.'}</p>
        </div>
        <div className="home-hero-artwork">
          <div className="home-hero-landscape"><img src="/images/chinese-ink-landscape.jpg" width="1200" height="800" alt="" aria-hidden="true" decoding="async" fetchPriority="high"/></div>
        </div>
      </div>
    </section>
    <div id="practice-studio" className="container home-practice-directory"><PracticeStudio user={user} onOpenPractice={onOpenPractice}/></div>
  </>;
}
