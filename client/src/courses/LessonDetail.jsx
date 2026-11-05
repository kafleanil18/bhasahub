import { supportsConversation } from '../utils/courseFeatures';
import { useState, useEffect, useCallback, useRef } from 'react';
import GrammarLesson from './GrammarLesson';
import Quiz from './Quiz';
import SrsReview from './SrsReview';
import { mediaUrl } from '../utils/mediaUrl';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

function LessonDetail({ course, lesson, nextLesson, user, token, isCompleted, completeError, onBack, onToggleComplete, onNextLesson }) {
  const [words, setWords] = useState([]);
  const [wordsError, setWordsError] = useState(null);
  const [mode, setMode] = useState('list'); // 'list' | 'flashcards' | 'quiz' | 'srs'
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashMuted, setFlashMuted] = useState(() => localStorage.getItem('flashMuted') === 'true');
  const studyAreaRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, [lesson._id]);

  useEffect(() => {
    fetch(`${API}/lessons/${lesson._id}/vocabulary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => setWords(data))
      .catch(() => {
        setWords([]);
        setWordsError('Could not load vocabulary for this lesson.');
      });
  }, [lesson._id, token]);

  const playCurrentWordAudio = useCallback((indexToPlay = flashIndex) => {
    const currentWord = words[indexToPlay];
    if (!currentWord) return;
    const url = currentWord.audioUrl;
    if (url) {
      const fullUrl = (url.startsWith('http://') || url.startsWith('https://')) ? url : `${SERVER || ''}${url.startsWith('/') ? '' : '/'}${url}`;
      new Audio(fullUrl).play().catch(() => {});
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      if (course?.language === 'chinese') {
        utterance.lang = 'zh-CN';
      } else {
        utterance.lang = 'en-US';
      }
      window.speechSynthesis.speak(utterance);
    }
  }, [words, flashIndex, course?.language]);

  useEffect(() => {
    if (mode !== 'flashcards' || words.length === 0) return;
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        setFlipped(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setFlashIndex((i) => (i - 1 + words.length) % words.length);
        setFlipped(false);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setFlashIndex((i) => (i + 1) % words.length);
        setFlipped(false);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        playCurrentWordAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, words.length, playCurrentWordAudio]);

  useEffect(() => {
    if (mode !== 'flashcards' || words.length === 0 || flashMuted) return;
    playCurrentWordAudio(flashIndex);
  }, [mode, flashIndex, words, flashMuted, playCurrentWordAudio]);

  useEffect(() => {
    if (mode !== 'flashcards' && mode !== 'quiz') return;
    // Quiz builds its questions in its own effect, so it renders empty on the
    // first pass — wait a tick so the section has real content before scrolling.
    const id = setTimeout(() => {
      studyAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => clearTimeout(id);
  }, [mode]);

  const toggleFlashMuted = () => {
    setFlashMuted((prev) => {
      const next = !prev;
      localStorage.setItem('flashMuted', String(next));
      return next;
    });
  };

  const [recordingIds, setRecordingIds] = useState(new Set());

  const recordAndCompare = async (wordId) => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert('Microphone access is needed to record. Please allow it and try again.');
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      new Audio(url).play();
      setRecordingIds((prev) => {
        const next = new Set(prev);
        next.delete(wordId);
        return next;
      });
    };

    setRecordingIds((prev) => new Set(prev).add(wordId));
    recorder.start();
    setTimeout(() => recorder.stop(), 2000);
  };

  return (
    <section className={`course-page container lesson-study-page${lesson.category === 'grammar' ? ' grammar-course-page' : ''}`}>
      <div className="lesson-study-nav">
        <button className="back-btn" onClick={onBack}>
          ← Back to {course.title}
        </button>
      </div>
      <header className="lesson-study-heading">
        <p className="eyebrow">{lesson.category === 'grammar' ? 'Grammar studio' : `Lesson ${lesson.order}`}</p>
        <h1 className="section-title">{lesson.title}</h1>
      </header>

      {lesson.category === 'grammar' && (lesson.grammarExplanation || lesson.grammarImage) && (
        <div className="grammar-lesson-wrapper">
          {lesson.grammarImage && <img src={mediaUrl(lesson.grammarImage)} alt="Grammar reference" className="dialogue-main-image" />}
          {lesson.grammarExplanation && <GrammarLesson html={lesson.grammarExplanation} lessonId={lesson._id} userId={user?.id || user?._id} />}
        </div>
      )}

      {supportsConversation(course) && (lesson.dialogueImage || (lesson.dialogueLines && lesson.dialogueLines.length > 0)) && (
        <div className="lesson-dialogue">
          <h3 className="dialogue-heading">💬 Conversation</h3>
          {lesson.dialogueImage && (
            <img
              src={mediaUrl(lesson.dialogueImage)}
              alt=""
              className="dialogue-main-image"
            />
          )}
          {lesson.dialogueLines && lesson.dialogueLines.map((line, i) => (
            <div className="dialogue-line-block" key={i}>
              {line.audioUrl && (
                <button
                  type="button"
                  className="play-btn"
                  onClick={() => new Audio(mediaUrl(line.audioUrl)).play()}
                  title="Play audio"
                >
                  ▶
                </button>
              )}
              {line.text && (
                <p className="dialogue-line-caption">
                  {line.speaker && <strong>{line.speaker}: </strong>}
                  {line.text}
                  {line.pinyin && <span className="dialogue-line-pinyin"> ({line.pinyin})</span>}
                </p>
              )}
              {line.meaning && <p className="dialogue-line-meaning">{line.meaning}</p>}
            </div>
          ))}
        </div>
      )}

      {(lesson.category !== 'grammar' || words.length > 0) && <p className="lesson-count">{words.length} words</p>}
      {wordsError && <p className="login-error">{wordsError}</p>}

      <div className="lesson-study-actions">
        {user && (
          <button
            className={isCompleted ? 'nav-btn' : 'btn-primary'}
            onClick={onToggleComplete}
          >
            {isCompleted ? '✓ Completed' : 'Mark as complete'}
          </button>
        )}
        {completeError && <p className="login-error lesson-complete-error">{completeError}</p>}
        {nextLesson && (
          <button
            className="btn-primary"
            onClick={onNextLesson}
          >
            Next Lesson →
          </button>
        )}
      </div>

      {words.length >= 4 && (
        <div className="flash-toggle">
          <button
            className="nav-btn flash-toggle-btn flash-toggle-flashcards"
            onClick={() => {
              setMode((m) => (m === 'flashcards' ? 'list' : 'flashcards'));
              setFlashIndex(0);
              setFlipped(false);
            }}
          >
            {mode === 'flashcards' ? '← Back to word list' : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 3H4a2 2 0 0 0-2 2v10"></path>
                </svg>
                Study flashcards
              </>
            )}
          </button>
          <button
            className="nav-btn flash-toggle-btn flash-toggle-quiz"
            onClick={() => setMode((m) => (m === 'quiz' ? 'list' : 'quiz'))}
          >
            {mode === 'quiz' ? '← Back to word list' : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
                Take quiz
              </>
            )}
          </button>
          {token && (
            <button
              className="nav-btn flash-toggle-btn flash-toggle-srs"
              onClick={() => setMode((m) => (m === 'srs' ? 'list' : 'srs'))}
            >
              {mode === 'srs' ? '← Back to word list' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Review due cards
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div ref={studyAreaRef}>
      {mode === 'srs' ? (
        <SrsReview lessonId={lesson._id} language={course.language} token={token} onExit={() => setMode('list')} />
      ) : mode === 'quiz' && words.length >= 4 ? (
        <Quiz words={words} language={course.language} lessonId={lesson._id} token={token} onExit={() => setMode('list')} muted={flashMuted} onToggleMute={toggleFlashMuted} />
      ) : mode === 'flashcards' && words.length > 0 ? (
        <div className="flashcard-area">
          {/* Progress indicators */}
          <div className="flash-progress-bar">
            <div className="flash-progress-fill" style={{ width: `${((flashIndex + 1) / words.length) * 100}%` }}></div>
          </div>

          <button
            type="button"
            className="nav-btn flash-mute-btn"
            onClick={toggleFlashMuted}
            title={flashMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {flashMuted ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                </svg>
                Unmute
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                Mute
              </>
            )}
          </button>

          <div
            className={`flashcard ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="flash-front">
              <span className={`flash-word ${course.language === 'chinese' ? 'zh' : 'en'}`}>
                {words[flashIndex].word}
              </span>
              <button
                type="button"
                className="flash-repeat-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  playCurrentWordAudio();
                }}
                title="Repeat word audio (Key: R)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                Listen again
              </button>
              <span className="flash-hint">tap or press Space to flip</span>
            </div>
            <div className="flash-back">
              <span className="flash-pron">{words[flashIndex].pronunciation}</span>
              <span className="flash-meaning">{words[flashIndex].meaning}</span>
              <button
                type="button"
                className="flash-repeat-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  playCurrentWordAudio();
                }}
                title="Repeat word audio (Key: R)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                Listen again
              </button>
            </div>
          </div>

          <div className="flash-controls">
            <button
              className="nav-btn"
              onClick={() => {
                setFlashIndex((i) => (i - 1 + words.length) % words.length);
                setFlipped(false);
              }}
            >
              ← Prev
            </button>

            <button
              className="nav-btn flash-repeat-word-btn"
              onClick={() => playCurrentWordAudio()}
              title="Repeat audio pronunciation for this word (Key: R)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              Repeat Word
            </button>

            <span className="flash-count">{flashIndex + 1} / {words.length}</span>

            <button
              className="nav-btn"
              onClick={() => {
                setFlashIndex((i) => (i + 1) % words.length);
                setFlipped(false);
              }}
            >
              Next →
            </button>
          </div>

          <p className="keyboard-shortcut-hint">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: '-2px' }}>
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
              <path d="M9 18h6"></path>
              <path d="M10 22h4"></path>
            </svg>
            Keyboard controls: Use <strong>Left / Right Arrows</strong> to navigate, <strong>Spacebar</strong> to flip, <strong>R</strong> to repeat audio.
          </p>
        </div>
      ) : (
      <div className="vocab-grid">
        {words.map((w) => (
          <div className="vocab-card" key={w._id}>
            <span className="annotation">{w.pronunciation}</span>
            <span className={`word ${course.language === 'chinese' ? 'zh' : 'en'}`}>
              {w.word}
            </span>
            <span className="meaning">{w.meaning}</span>
            {w.audioUrl && (
              <div className="audio-row">
                <button
                  className="play-btn"
                  onClick={() => new Audio(mediaUrl(w.audioUrl)).play()}
                  title="Listen to the teacher"
                >
                  ▶
                </button>
                <button
                  className="record-btn"
                  onClick={() => recordAndCompare(w._id)}
                  disabled={recordingIds.has(w._id)}
                  title="Record yourself and hear it back"
                >
                  {recordingIds.has(w._id) ? '● Recording...' : '🎤 Record'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
      </div>
    </section>
  );
}

export default LessonDetail;
