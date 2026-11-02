
export default function HomeFeatures({ isPlayingFeatureAudio, playFeatureSample }) {
  return (
    <section className="features">
            <div className="container">
              <div className="features-intro">
                <span className="section-kicker">Built for Real Fluency</span>
                <h2 className="section-title">Everything you need to master Chinese</h2>
                <p className="section-sublead">
                  Designed specifically for Nepali learners with native audio, phonetic clarity, and logical step-by-step milestones.
                </p>
              </div>

              <div className="features-grid">
                {/* Feature 1 */}
                <div className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon-wrapper speak-bg" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                      </svg>
                    </div>
                    <span className="feature-pill-badge">Phonetics First</span>
                  </div>
                  <h3>Pronunciation & Script</h3>
                  <p>
                    Start from zero with Pinyin and Devanagari — every character introduced with tone pitch contours you can replicate accurately.
                  </p>
                  <div className="feature-visual tone-visual" aria-label="Chinese 4 tones pitch guide">
                    <div className="tone-pill"><span className="tone-mark">—</span> 1st: High</div>
                    <div className="tone-pill"><span className="tone-mark">/</span> 2nd: Rise</div>
                    <div className="tone-pill"><span className="tone-mark">∨</span> 3rd: Dip</div>
                    <div className="tone-pill"><span className="tone-mark">\</span> 4th: Fall</div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon-wrapper listen-bg" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                      </svg>
                    </div>
                    <span className="feature-pill-badge">Native Audio</span>
                  </div>
                  <h3>Hear it Spoken</h3>
                  <p>
                    Clear studio audio on every single word and dialogue line — listen, repeat, and compare until it sticks naturally.
                  </p>
                  <div className="feature-visual audio-sample-visual">
                    <button
                      type="button"
                      className={`feature-audio-sample-btn ${isPlayingFeatureAudio ? 'is-playing' : ''}`}
                      onClick={playFeatureSample}
                      title="Click to test sample audio"
                      aria-label="Listen to sample audio"
                    >
                      {isPlayingFeatureAudio ? (
                        <span className="sound-wave">
                          <span></span><span></span><span></span>
                        </span>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                      <span>{isPlayingFeatureAudio ? 'Playing "xiè xie"...' : 'Hear Sample: 谢谢 (xièxie)'}</span>
                    </button>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon-wrapper read-bg" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    </div>
                    <span className="feature-pill-badge">HSK Aligned</span>
                  </div>
                  <h3>Step-by-Step Mastery</h3>
                  <p>
                    Lessons build logically like a structured academy course — track what you've mastered and unlock what comes next.
                  </p>
                  <div className="feature-visual pathway-visual" aria-label="HSK progression milestone steps">
                    <div className="hsk-step active">HSK 1</div>
                    <span className="hsk-arrow" aria-hidden="true">➔</span>
                    <div className="hsk-step">HSK 2</div>
                    <span className="hsk-arrow" aria-hidden="true">➔</span>
                    <div className="hsk-step">HSK 3</div>
                    <span className="hsk-arrow" aria-hidden="true">➔</span>
                    <div className="hsk-step">HSK 4</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
  );
}
