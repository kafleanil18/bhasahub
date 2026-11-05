import { useEffect, useRef, useState } from 'react';
import PracticeStudio from './PracticeStudio';
import './HomeHero.css';

export default function HomeHero({ goHome, setShowDashboard, setShowPinyinPage, user, hasStartedCourse = false, onOpenPractice }) {
  const teaching = user?.role === 'admin';
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');
  useEffect(() => {
    const audio = audioRef.current;
    return () => { audio?.pause(); };
  }, []);
  const startLearning = () => {
    goHome();
    if (!user) setShowPinyinPage(true);
    else if (hasStartedCourse) setShowDashboard(true);
    else requestAnimationFrame(() => document.getElementById('courses')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  };
  const toggleGreeting = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); audio.currentTime = 0; return; }
    setAudioError('');
    if (audio.error) audio.load();
    try { await audio.play(); }
    catch { setAudioError('The greeting couldn’t play. Try again or explore pinyin practice below.'); }
  };
  return <>
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="container home-hero-grid">
        <div className="home-hero-intro">
          <p className="home-hero-eyebrow"><span aria-hidden="true"/>{user ? `Welcome back, ${user.name}.` : 'A new language. A new beginning.'}</p>
          <h1 id="home-hero-title">{teaching ? <>Great lessons<br/>start <em>here.</em></> : user ? <>Your next step<br/>starts <em>here.</em></> : <>Chinese starts<br/>with a <em>hello.</em></>}</h1>
          <p className="home-hero-description">{teaching ? 'Explore your courses, try a practice activity, and get ready for your next class. A little preparation makes a difference.' : user ? hasStartedCourse ? 'Pick up where you left off, or choose a skill to practice. A little Chinese today goes a long way.' : 'Find your first course below, or explore a practice tool to get started.' : 'From your first words to everyday conversations. Find your voice in Chinese with guided lessons and practice at your own pace.'}</p>
          <div className="home-hero-actions"><button className="home-hero-primary" onClick={startLearning}>{teaching ? 'Explore courses' : user ? hasStartedCourse ? 'Continue learning' : 'Start learning' : 'Try free pinyin practice'}<span aria-hidden="true">↗</span></button><a className="home-hero-secondary" href={user ? '#practice-studio' : '#courses'}>{user ? 'Choose a practice' : 'Explore courses'}<span aria-hidden="true">↓</span></a></div>
          <p className="home-hero-note">{teaching ? 'Your courses. Your classroom. Your teaching studio.' : user ? 'Your courses. Your pace. Your next conversation.' : 'No account needed for pinyin practice.'}</p>
        </div>
        <div className="home-hero-artwork">
          <div className="home-hero-landscape"><img src="/images/chinese-ink-landscape.jpg" width="1200" height="800" alt="" aria-hidden="true" decoding="async" fetchPriority="high"/><span className="home-hero-stamp" lang="zh-CN" aria-hidden="true">学</span><span className="home-hero-art-caption">A little practice. A world of possibility.</span></div>
          <section className="home-hero-greeting" aria-labelledby="hero-greeting-title"><div className="home-hero-greeting-top"><h2 id="hero-greeting-title">Your first conversation</h2><span>01 / HELLO</span></div><div className="home-hero-greeting-body"><div><p className="home-hero-hanzi" lang="zh-CN">你好<span>。</span></p><p className="home-hero-translation"><span lang="zh-Latn">nǐ hǎo</span><span aria-hidden="true">/</span>Hello.</p></div><button className={`home-hero-listen ${playing ? 'is-playing' : ''}`} aria-label={playing ? 'Stop Chinese greeting' : 'Listen to Chinese greeting'} aria-pressed={playing} onClick={toggleGreeting}><span className="home-hero-sound" aria-hidden="true">{[10,20,28,16,24].map((height,index)=><i key={index} style={{'--bar-height': `${height}px`, '--bar-delay': `${index * -0.15}s`}}/>)}</span><span>{playing ? 'Stop' : 'Listen'}</span></button></div><p className="home-hero-listen-note">Press listen. Say it out loud. You’ve already begun.</p>{audioError && <p className="home-hero-audio-error" role="alert">{audioError}</p>}<audio ref={audioRef} src="/nihao.mp3" preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('The greeting couldn’t load. Try again or explore pinyin practice below.'); }}/></section>
        </div>
      </div>
    </section>
    <div id="practice-studio" className="container home-practice-directory"><PracticeStudio user={user} onOpenPractice={onOpenPractice}/></div>
  </>;
}
