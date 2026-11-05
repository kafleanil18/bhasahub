import PracticeStudio from './PracticeStudio';

export default function HomeHero({ goHome, setShowDashboard, setShowPinyinPage, user, onOpenPractice }) {
  return (
    <section className="hero">
            <div className="container hero-grid">
              <div className="hero-text">
                <img className="hero-ink-art" src="/images/chinese-ink-landscape.jpg" width="960" height="640" alt="" aria-hidden="true" decoding="async" fetchPriority="high" />
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
                <PracticeStudio user={user} onOpenPractice={onOpenPractice} />


              </div>
            </div>
          </section>
  );
}
