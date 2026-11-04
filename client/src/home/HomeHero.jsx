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

export default function HomeHero({ goHome, isPlayingAudio, playNihaoAudio, setShowDashboard, setShowPinyinPage, user, onOpenPractice }) {
  return (
    <section className="hero">
            <div className="container hero-grid">
              <div className="hero-text">
                <div className="hero-badge">
                  <span className="hero-badge-dot" aria-hidden="true"></span>
                  <span className="hero-badge-text">Mandarin Chinese · English explanations</span>
                </div>
                <h1 className="hero-title">
                  {user ? (
                    <>Welcome back, <span className="hero-highlight">{user.name}</span>!</>
                  ) : (
                    <>
                      Learn Chinese,{' '}
                      <span className="hero-highlight">one clear step at a time.</span>
                    </>
                  )}
                </h1>
                <p className="hero-subtitle">
                  From your first nǐ hǎo to your next HSK milestone. Learn with English explanations, guided lessons, and pronunciation you can hear and practice.
                </p>
                <div className="hero-actions">
                  {!user ? (
                    <button className="btn-primary hero-btn-main pinyin-practice-btn" onClick={() => { goHome(); setShowPinyinPage(true); }}>
                      <span>Try Free Pinyin Practice</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  ) : (
                    <button className="btn-primary hero-btn-main continue-learning-btn" onClick={() => { goHome(); setShowDashboard(true); }}>Continue Learning <span className="continue-learning-icon" aria-hidden="true">↗</span></button>
                  )}
                  <a className="btn-secondary hero-btn-secondary" href="#courses">
                    <span>Explore Courses</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </a>
                </div>

                <p className="hero-access-note">Free pronunciation practice · Course access by request</p>
                <div className="hero-stats">
                  <div className="hero-stat-item">
                    <div className="stat-icon-wrap" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div className="stat-text-wrap">
                      <strong>English explanations</strong>
                      <span>Clear guidance at every step</span>
                    </div>
                  </div>

                  <div className="hero-stat-divider" aria-hidden="true"></div>

                  <div className="hero-stat-item">
                    <div className="stat-icon-wrap" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                    <div className="stat-text-wrap">
                      <strong>HSK 1 to 4</strong>
                      <span>Structured syllabus</span>
                    </div>
                  </div>

                  <div className="hero-stat-divider" aria-hidden="true"></div>

                  <div className="hero-stat-item">
                    <div className="stat-icon-wrap" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                      </svg>
                    </div>
                    <div className="stat-text-wrap">
                      <strong>Native Audio</strong>
                      <span>Real spoken practice</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-showcase">
                <section className="hero-practice-tools" aria-labelledby="hero-practice-title">
                  <p className="hero-practice-kicker">Your next step</p>
                  <h2 id="hero-practice-title">What will you practice today?</h2>
                  <p className="hero-practice-intro">New to Chinese? Start with pinyin, then choose a skill to build.</p>
                  <div className="hero-practice-list">
                    {practiceTools.map(([id, glyph, title, description]) => (
                      <button key={id} type="button" className="hero-practice-link" onClick={() => onOpenPractice(id)}>
                        <span className="hero-practice-glyph" lang="zh-CN" aria-hidden="true">{glyph}</span>
                        <span className="hero-practice-copy"><strong>{title}</strong><small>{description}</small></span>
                        <span className="hero-practice-arrow" aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="hero-interactive-card">
                  <div className="interactive-card-left">
                    <div className="card-pinyin-tag">
                      <span>nǐ hǎo</span>
                      <span className="tone-indicator">3rd tone ˇ</span>
                    </div>
                    <div className="card-characters zh">你好</div>
                    <div className="card-meaning-line">
                      <span className="card-translation en">Hello</span>
                      <span className="card-dot">•</span>
                      <span className="card-english">a friendly greeting</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`hero-audio-btn ${isPlayingAudio ? 'is-playing' : ''}`}
                    onClick={playNihaoAudio}
                    title="Click to hear native audio"
                    aria-label="Listen to Chinese pronunciation"
                  >
                    <div className="audio-icon-box" aria-hidden="true">
                      {isPlayingAudio ? (
                        <span className="sound-wave">
                          <span></span><span></span><span></span>
                        </span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                      )}
                    </div>
                    <span className="audio-btn-text">{isPlayingAudio ? 'Playing audio...' : 'Hear Pronunciation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
  );
}
