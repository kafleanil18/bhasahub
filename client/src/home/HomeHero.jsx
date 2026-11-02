import { mediaUrl } from '../utils/mediaUrl';

export default function HomeHero({ goHome, handleVideoToggle, heroVideoRef, isPlayingAudio, isVideoPlaying, playNihaoAudio, setIsVideoPlaying, setShowDashboard, setShowPinyinPage, user, welcomeVideoUrl }) {
  return (
    <section className="hero">
            <div className="container hero-grid">
              <div className="hero-text">
                <div className="hero-badge">
                  <span className="hero-badge-dot" aria-hidden="true"></span>
                  <span className="hero-badge-text">नेपालीहरूको लागि विशेष चिनियाँ कक्षा · HSK 1–4</span>
                </div>
                <h1 className="hero-title">
                  {user ? (
                    <>Welcome back, <span className="hero-highlight">{user.name}</span>!</>
                  ) : (
                    <>
                      चिनियाँ भाषा सिक्नुहोस्,{' '}
                      <span className="hero-highlight">सजिलै र प्रभावकारी रूपमा।</span>
                    </>
                  )}
                </h1>
                <p className="hero-subtitle">
                  From your first nǐ hǎo to your next HSK milestone. Learn with Nepali explanations, guided lessons, and pronunciation you can hear and practice.
                </p>
                <div className="hero-actions">
                  {!user ? (
                    <button className="btn-primary hero-btn-main" onClick={() => { goHome(); setShowPinyinPage(true); }}>
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
                      <strong>Made for Nepal</strong>
                      <span>Learn with Nepali support</span>
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
                <div className="hero-video-card">
                  <div className="video-card-header">
                    <div className="video-card-badge">
                      <span className="live-pulse" aria-hidden="true"></span>
                      <span>Teacher Intro Video</span>
                    </div>
                    <span className="video-card-duration">1-min overview</span>
                  </div>

                  <div
                    className={`video-wrap ${isVideoPlaying ? 'is-playing' : ''}`}
                    onClick={handleVideoToggle}
                  >
                    <video
                      ref={heroVideoRef}
                      key={welcomeVideoUrl || 'default'}
                      preload="metadata"
                      poster="/images/teacher_portrait.jpg"
                      playsInline
                      controls={isVideoPlaying}
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onEnded={() => setIsVideoPlaying(false)}
                    >
                      <source src={welcomeVideoUrl ? mediaUrl(welcomeVideoUrl) : '/video/intro.mp4'} type="video/mp4" />
                      Your browser doesn't support the video tag.
                    </video>

                    {!isVideoPlaying && (
                      <button className="big-play-btn" aria-label="Play welcome video">
                        <div className="play-btn-circle" aria-hidden="true">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <span className="play-btn-label">Watch Introduction</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="hero-interactive-card">
                  <div className="interactive-card-left">
                    <div className="card-pinyin-tag">
                      <span>nǐ hǎo</span>
                      <span className="tone-indicator">3rd tone ˇ</span>
                    </div>
                    <div className="card-characters zh">你好</div>
                    <div className="card-meaning-line">
                      <span className="card-nepali ne">नमस्ते</span>
                      <span className="card-dot">•</span>
                      <span className="card-english">hello · greeting</span>
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
