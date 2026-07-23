import { useState, useEffect, useRef } from 'react';
import { mediaUrl } from './utils/mediaUrl';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

function formatElapsed(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Audio player with native play/pause and a seek bar for rewinding.
function AudioPlayer({ src, style, onPlay, onPlayStateChange }) {
  const audioRef = useRef(null);

  // If the component unmounts mid-playback (e.g. user confirmed leaving the exam), clear the guard.
  useEffect(() => () => { if (onPlayStateChange) onPlayStateChange(false); }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      <audio
        ref={audioRef}
        src={src}
        controls
        style={{ width: '100%', maxWidth: '420px' }}
        onPlay={() => {
          if (onPlay) onPlay();
          if (onPlayStateChange) onPlayStateChange(true);
        }}
        onPause={() => { if (onPlayStateChange) onPlayStateChange(false); }}
        onEnded={() => { if (onPlayStateChange) onPlayStateChange(false); }}
      />
    </div>
  );
}

function TestTaker({ testId, onBack }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [playingAudios, setPlayingAudios] = useState(() => new Set());
  const [leaveWarning, setLeaveWarning] = useState(null);
  const [mobileTab, setMobileTab] = useState('pdf');
  const containerRef = useRef(null);
  const bypassNextClick = useRef(false);
  const audioPlaying = playingAudios.size > 0;

  const setAudioPlaying = (key, isPlaying) => {
    setPlayingAudios((prev) => {
      const next = new Set(prev);
      if (isPlaying) next.add(key); else next.delete(key);
      return next;
    });
  };

  useEffect(() => {
    fetch(`${API}/tests/${testId}`)
      .then(res => res.json())
      .then(data => { setTest(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [testId]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!test) return;
    const hasAudio = (test.testType === 'listening' && test.audioUrl) || test.questions.some((q) => q.audioUrl);
    if (!hasAudio) setTimerStarted(true);
  }, [test]);

  useEffect(() => {
    if (!test || submitted || !timerStarted) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [test, submitted, timerStarted]);

  // Warn before leaving the exam (clicking other links/nav) while audio is playing.
  useEffect(() => {
    if (!audioPlaying || submitted) return;
    const handleDocumentClick = (e) => {
      if (bypassNextClick.current) {
        bypassNextClick.current = false;
        return;
      }
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const target = e.target;
        setLeaveWarning(() => () => {
          bypassNextClick.current = true;
          target.click();
        });
      }
    };
    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [audioPlaying, submitted]);

  // Warn before an actual browser navigation/refresh/close while audio is playing.
  useEffect(() => {
    if (!audioPlaying || submitted) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [audioPlaying, submitted]);

  const handleBackClick = () => {
    if (audioPlaying) {
      setLeaveWarning(() => onBack);
    } else {
      onBack();
    }
  };

  const selectAnswer = (qi, oi) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

  const submit = () => {
    let correct = 0;
    test.questions.forEach((q, qi) => {
      if (answers[qi] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API}/attempts/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testId: test._id, score: correct, total: test.questions.length }),
      }).catch(() => {});
    }
  };

  const retake = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={onBack}>Back to tests</button>
        <p className="courses-empty">Loading test...</p>
      </section>
    );
  }

  if (!test || !test._id) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={onBack}>Back to tests</button>
        <p className="courses-empty">Test not found.</p>
      </section>
    );
  }

  const total = test.questions.length;
  const percent = total ? Math.round((score / total) * 100) : 0;

  return (
    <section className={`course-page container ${test.pdfUrl ? 'test-pdf-layout' : ''}`} ref={containerRef}>
      <button className="back-btn" onClick={handleBackClick}>Back to tests</button>
      <p className="eyebrow">{test.level}</p>
      <h1 className="section-title">{test.title}</h1>
      {test.description && <p className="course-desc">{test.description}</p>}

      {submitted && (
        <div className="test-result">
          <span className="quiz-result-emoji">
            {percent >= 60 ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--seal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            )}
          </span>
          <h2>You scored {score} / {total}</h2>
          <p className="quiz-result-percent">{percent}%</p>
          <button className="nav-btn" onClick={retake}>Retake test</button>
        </div>
      )}

      {test.testType === 'listening' && test.audioUrl && (
        <div className="test-media">
          <h3 className="dialogue-heading">🎧 Listening Audio</h3>
          <AudioPlayer
            src={mediaUrl(test.audioUrl)}
            onPlay={() => setTimerStarted(true)}
            onPlayStateChange={(p) => setAudioPlaying('main', p)}
          />
        </div>
      )}

      {test.pdfUrl ? (
        <div className="test-pdf-container">
          <h3 className="dialogue-heading">📄 Question paper</h3>
          <div className="pdf-iframe-container" onContextMenu={(e) => e.preventDefault()}>
            <iframe
              src={`${mediaUrl(test.pdfUrl)}#toolbar=0`}
              title="Question paper"
              className="test-pdf-iframe"
            ></iframe>
            <div className="pdf-overlay"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="test-questions">
            <h3 className="dialogue-heading">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: '-2px' }}>
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
              Answers
            </h3>
            {test.questions.map((q, qi) => {
              const chosen = answers[qi];
              return (
                <div className="test-question" key={qi}>
                  <p className="test-question-text" style={{ marginBottom: q.questionPinyin ? '6px' : '16px' }}>
                    <strong>Q{qi + 1}.</strong> {q.questionText}
                  </p>
                  {q.questionPinyin && (
                    <p className="test-question-pinyin" style={{ color: 'var(--mist)', fontSize: '0.9rem', marginTop: '-4px', marginBottom: '16px', paddingLeft: '32px' }}>
                      {q.questionPinyin}
                    </p>
                  )}
                  {q.audioUrl && (
                    <div className="test-question-audio" style={{ paddingLeft: '32px', marginBottom: '16px' }}>
                      <AudioPlayer
                        src={mediaUrl(q.audioUrl)}
                        onPlay={() => setTimerStarted(true)}
                        onPlayStateChange={(p) => setAudioPlaying(`q-${qi}`, p)}
                      />
                    </div>
                  )}
                  {q.image && (
                    <div className="test-question-image" style={{ paddingLeft: '32px', marginBottom: '16px' }}>
                      <img src={mediaUrl(q.image)} alt={`Question ${qi + 1}`} style={{ maxWidth: '100%', width: '320px', borderRadius: '10px', display: 'block' }} />
                    </div>
                  )}
                  <div className="test-options">
                    {q.options.map((opt, oi) => {
                      let cls = 'test-option';
                      if (submitted) {
                        if (oi === q.correctIndex) cls += ' correct';
                        else if (chosen === oi) cls += ' wrong';
                      } else if (chosen === oi) {
                        cls += ' selected';
                      }

                      const optionText = opt && typeof opt === 'object' ? opt.text : opt;
                      const optionPinyin = opt && typeof opt === 'object' ? opt.pinyin : '';

                      return (
                        <button
                          key={oi}
                          className={cls}
                          onClick={() => selectAnswer(qi, oi)}
                          disabled={submitted}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: optionPinyin ? '10px 16px' : '14px 16px', gap: '2px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                            <span className="option-letter" style={{ flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</span>
                            <span style={{ fontWeight: 600, textAlign: 'left' }}>{optionText}</span>
                          </div>
                          {optionPinyin && (
                            <span className="option-pinyin" style={{ fontSize: '0.85rem', color: 'var(--mist)', marginLeft: '32px', textAlign: 'left' }}>
                              {optionPinyin}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {!submitted && total > 0 && (
            <button className="btn-primary" onClick={submit} style={{ marginTop: 24 }}>
              Submit test
            </button>
          )}
        </>
      )}

      {!submitted && timerStarted && !test.pdfUrl && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--jade, #2e6b57)',
            color: '#ffffff',
            borderRadius: '999px',
            padding: '14px 32px',
            fontSize: '1.6rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            boxShadow: '0 4px 16px rgba(42, 35, 32, 0.2)',
            zIndex: 1000,
          }}
          title="Time elapsed"
        >
          ⏱ {formatElapsed(elapsed)}
        </div>
      )}

      {showScrollTop && (
        <>
          <style>{`
            .scroll-to-top-btn:hover {
              background-color: #204b3d !important;
              transform: translateY(-3px);
            }
          `}</style>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            style={{
              position: 'fixed',
              bottom: '2.5rem',
              right: '2.5rem',
              backgroundColor: 'var(--jade, #2e6b57)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              fontSize: '1.4rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(42, 35, 32, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              transition: 'transform 0.2s ease, background-color 0.2s ease',
            }}
            className="scroll-to-top-btn"
            title="Scroll to top"
          >
            ↑
          </button>
        </>
      )}

      {leaveWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 20, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '28px 32px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ marginRight: 6, verticalAlign: '-2px' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Audio is still playing
            </h3>
            <p style={{ color: 'var(--mist)', marginBottom: 24, lineHeight: 1.5 }}>
              You're in the middle of the exam and the audio hasn't finished. Do you want to continue the exam, or quit now?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => setLeaveWarning(null)}>
                Continue exam
              </button>
              <button
                className="back-btn"
                onClick={() => {
                  const proceed = leaveWarning;
                  setLeaveWarning(null);
                  proceed();
                }}
              >
                Quit exam
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TestTaker;