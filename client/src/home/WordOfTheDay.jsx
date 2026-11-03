
export default function WordOfTheDay({ isPlayingWotd, playWotdAudio, wotd }) {
  return (
    <section className="wotd">
            <div className="container">
              <div className="wotd-container-inner">
                <div className="wotd-header">
                  <div className="wotd-badge">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>Daily Vocabulary Spotlight</span>
                  </div>
                  <p className="wotd-subheading">One essential word every single day to expand your vocabulary effortlessly.</p>
                </div>

                <div className="wotd-cards-container">
                  <div className="wotd-card zh-card">
                    <div className="wotd-card-top">
                      <span className="wotd-lang-tag">Mandarin Chinese</span>
                      <button
                        type="button"
                        className={`wotd-audio-trigger ${isPlayingWotd ? 'is-playing' : ''}`}
                        onClick={() => playWotdAudio(wotd.zh)}
                        title="Click to hear native pronunciation"
                        aria-label="Listen to Chinese pronunciation"
                      >
                        {isPlayingWotd ? (
                          <span className="sound-wave">
                            <span></span><span></span><span></span>
                          </span>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          </svg>
                        )}
                        <span>{isPlayingWotd ? 'Speaking...' : 'Listen'}</span>
                      </button>
                    </div>

                    <span className="wotd-word zh">{wotd.zh}</span>
                    <div className="wotd-pinyin">{wotd.zhP}</div>
                  </div>

                  <div className="wotd-card-divider" aria-hidden="true">
                    <div className="divider-line"></div>
                    <div className="divider-icon">⇄</div>
                    <div className="divider-line"></div>
                  </div>

                  <div className="wotd-card en-card">
                    <div className="wotd-card-top">
                      <span className="wotd-lang-tag">English Translation</span>
                      <span className="wotd-english-badge">English meaning</span>
                    </div>

                    <span className="wotd-word en">{wotd.meaning}</span>
                    <div className="wotd-meaning">The meaning of {wotd.zh}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
  );
}
