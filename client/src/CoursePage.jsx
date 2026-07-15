import { useState, useEffect } from 'react';
import Quiz from './Quiz';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function CoursePage({ course, onBack, user }) {
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const token = localStorage.getItem('token');

  const [completedIds, setCompletedIds] = useState([]);
  const [flashMode, setFlashMode] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [catFilter, setCatFilter] = useState('all');

  // subscription access
  const [hasAccess, setHasAccess] = useState(false);
  const [accessExpiry, setAccessExpiry] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [showAccessMsg, setShowAccessMsg] = useState(false);

 const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  const loadProgress = () => {
    if (!token) return;
    fetch(`${API}/progress/course/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCompletedIds(data.completedLessonIds || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadProgress();
  }, [course._id, token]);

  // check subscription access for this course
  useEffect(() => {
    if (!token) { setAccessChecked(true); return; }
    fetch(`${API}/subscriptions/check/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setHasAccess(!!data.hasAccess);
        setAccessExpiry(data.expiresAt || null);
        setAccessChecked(true);
      })
      .catch(() => setAccessChecked(true));
  }, [course._id, token]);

  const toggleComplete = async (lessonId) => {
    if (!token) return;
    const isDone = completedIds.includes(lessonId);
    try {
      const res = await fetch(`${API}/progress/lesson/${lessonId}`, {
        method: isDone ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCompletedIds((prev) =>
          isDone ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
        );
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetch(`${API}/lessons/course/${course._id}`)
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [course._id]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/enrollments/status/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setEnrolled(data.enrolled))
      .catch(() => {});
  }, [course._id, token]);

  useEffect(() => {
    if (!flashMode || words.length === 0) return;
    const handleKeyDown = (e) => {
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flashMode, words.length]);

  const toggleEnroll = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/enrollments/${course._id}`, {
        method: enrolled ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEnrolled(!enrolled);
    } catch {
      // silently ignore
    }
  };

  const recordAndCompare = async (button) => {
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
      button.textContent = '🎤 Record';
      button.disabled = false;
    };

    recorder.start();
    button.textContent = '● Recording...';
    button.disabled = true;
    setTimeout(() => recorder.stop(), 2000);
  };

  // gate: admins always allowed; students need active access
  const canOpenLessons = isAdmin || hasAccess;

  const handleLessonClick = (lesson) => {
    if (canOpenLessons) {
      openLesson(lesson);
    } else {
      setShowAccessMsg(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openLesson = (lesson) => {
    setActiveLesson(lesson);
    setWords([]);
    setFlashMode(false);
    setFlashIndex(0);
    setFlipped(false);
    setQuizMode(false);
    fetch(`${API}/lessons/${lesson._id}/vocabulary`)
      .then(res => res.json())
      .then(data => setWords(data))
      .catch(() => setWords([]));
  };

  // ---------- Lesson view ----------
  if (activeLesson) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={() => setActiveLesson(null)}>
          ← Back to {course.title}
        </button>
        <p className="eyebrow">Lesson {activeLesson.order}</p>
        <h1 className="section-title">{activeLesson.title}</h1>

        {(activeLesson.dialogueImage || (activeLesson.dialogueLines && activeLesson.dialogueLines.length > 0)) && (
          <div className="lesson-dialogue">
            <h3 className="dialogue-heading">💬 Conversation</h3>
            {activeLesson.dialogueImage && (
              <img
                src={`${SERVER}${activeLesson.dialogueImage}`}
                alt=""
                className="dialogue-main-image"
              />
            )}
            {activeLesson.dialogueLines && activeLesson.dialogueLines.map((line, i) => (
              <div className="dialogue-line-block" key={i}>
                {line.audioUrl && (
                  <audio controls src={`${SERVER}${line.audioUrl}`} className="dialogue-line-audio" />
                )}
                {line.text && <p className="dialogue-line-caption">{line.text}</p>}
              </div>
            ))}
          </div>
        )}

        <p className="lesson-count">{words.length} words</p>

        {user && (
          <button
            className={completedIds.includes(activeLesson._id) ? 'nav-btn' : 'btn-primary'}
            onClick={() => toggleComplete(activeLesson._id)}
            style={{ marginBottom: 24 }}
          >
            {completedIds.includes(activeLesson._id) ? '✓ Completed' : 'Mark as complete'}
          </button>
        )}

        {words.length >= 4 && (
          <div className="flash-toggle">
            <button
              className="nav-btn"
              onClick={() => {
                setFlashMode(!flashMode);
                setQuizMode(false);
                setFlashIndex(0);
                setFlipped(false);
              }}
            >
              {flashMode ? '← Back to word list' : '🃏 Study flashcards'}
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                setQuizMode(!quizMode);
                setFlashMode(false);
              }}
            >
              {quizMode ? '← Back to word list' : '✏️ Take quiz'}
            </button>
          </div>
        )}

        {quizMode && words.length >= 4 ? (
          <Quiz words={words} language={course.language} onExit={() => setQuizMode(false)} />
        ) : flashMode && words.length > 0 ? (
          <div className="flashcard-area">
            {/* Progress indicators */}
            <div className="flash-progress-bar">
              <div className="flash-progress-fill" style={{ width: `${((flashIndex + 1) / words.length) * 100}%` }}></div>
            </div>
            
            <div
              className={`flashcard ${flipped ? 'flipped' : ''}`}
              onClick={() => setFlipped(!flipped)}
            >
              <div className="flash-front">
                <span className={`flash-word ${course.language === 'chinese' ? 'zh' : 'ne'}`}>
                  {words[flashIndex].word}
                </span>
                <span className="flash-hint">tap or press Space to flip</span>
              </div>
              <div className="flash-back">
                <span className="flash-pron">{words[flashIndex].pronunciation}</span>
                <span className="flash-meaning">{words[flashIndex].meaning}</span>
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
              💡 Keyboard controls: Use <strong>Left / Right Arrows</strong> to navigate, <strong>Spacebar</strong> to flip.
            </p>
          </div>
        ) : (
        <div className="vocab-grid">
          {words.map((w) => (
            <div className="vocab-card" key={w._id}>
              <span className="annotation">{w.pronunciation}</span>
              <span className={`word ${course.language === 'chinese' ? 'zh' : 'ne'}`}>
                {w.word}
              </span>
              <span className="meaning">{w.meaning}</span>
              {w.audioUrl && (
                <div className="audio-row">
                  <button
                    className="play-btn"
                    onClick={() => new Audio(`${SERVER}${w.audioUrl}`).play()}
                    title="Listen to the teacher"
                  >
                    ▶
                  </button>
                  <button
                    className="record-btn"
                    onClick={(e) => recordAndCompare(e.currentTarget)}
                    title="Record yourself and hear it back"
                  >
                    🎤 Record
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </section>
    );
  }

  // ---------- Course overview ----------
  const visibleLessons = lessons.filter(
    (l) => catFilter === 'all' || (l.category || 'vocabulary') === catFilter
  );

  const currentCourseCompleted = completedIds.filter(id => lessons.some(l => l._id === id)).length;
  const progressPercent = lessons.length ? Math.round((currentCourseCompleted / lessons.length) * 100) : 0;
  const isBeginner = course.level && (course.level.toLowerCase().includes('hsk 1') || course.level.toLowerCase().includes('beginner'));

  return (
    <section className="course-page container">

      <button className="back-btn" onClick={onBack}>← Back to courses</button>
      
      <div className="course-head" style={{ marginTop: 16 }}>
        <div>
          {isBeginner && (
            <div className="course-welcome-badge">
              👋 你好 (Nǐ hǎo) — Start Learning Chinese!
            </div>
          )}
          <h1 className="section-title">{course.title}</h1>
          <p className="course-desc">{course.description}</p>
          <span className="tag" style={{ background: 'var(--jade)', color: '#fff', border: 'none' }}>
            {course.level}
          </span>
          {user && (
            <div className="enroll-wrap" style={{ marginTop: 14 }}>
              <button
                className={enrolled ? 'nav-btn' : 'btn-primary'}
                onClick={toggleEnroll}
              >
                {enrolled ? '✓ Enrolled' : 'Enroll in this course'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Access banner */}
      {user && !isAdmin && accessChecked && (
        hasAccess ? (
          <div className="access-banner access-ok" style={{ margin: '16px 0 0' }}>
            ✓ Active Subscription Access {accessExpiry && `until ${new Date(accessExpiry).toLocaleDateString()}`}
          </div>
        ) : (
          <div className="access-banner access-locked" style={{ margin: '16px 0 0' }}>
            🔒 You don't have access to this course yet. Please message us to request access keys.
          </div>
        )
      )}

      {/* Message shown when a locked lesson is clicked */}
      {showAccessMsg && !canOpenLessons && (
        <div className="access-msg" style={{ margin: '20px 0 0' }}>
          <p>
            🔒 This lesson is locked. You need active access to open lessons.
            Please click <strong>Message us</strong> in the top header menu to request access.
          </p>
          <button className="nav-btn" onClick={() => setShowAccessMsg(false)}>Got it</button>
        </div>
      )}

      {/* Progress Dashboard */}
      {user && (
        <div className="course-progress-block">
          <div className="course-progress-header">
            <span className="course-progress-title">Your Course Progress</span>
            <span className="course-progress-value">{progressPercent}%</span>
          </div>
          <div className="course-progress-bar-bg">
            <div className="course-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="course-meta-grid">
            <div className="course-meta-item">
              <span className="course-meta-val">{currentCourseCompleted} of {lessons.length}</span>
              <span className="course-meta-lbl">Lessons Completed</span>
            </div>
            <div className="course-meta-item">
              <span className="course-meta-val">{(lessons.length * 15)} mins</span>
              <span className="course-meta-lbl">Estimated Study Time</span>
            </div>
            <div className="course-meta-item">
              <span className="course-meta-val">{enrolled ? 'Active Student' : 'Not Enrolled'}</span>
              <span className="course-meta-lbl">Enrolment Status</span>
            </div>
          </div>
        </div>
      )}

      <h2 className="lessons-heading" style={{ marginTop: 32 }}>Lessons</h2>

      <div className="category-tabs" style={{ marginBottom: 8 }}>
        <button className={`cat-tab ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
        <button className={`cat-tab ${catFilter === 'vocabulary' ? 'active' : ''}`} onClick={() => setCatFilter('vocabulary')}>📚 Vocabulary</button>
        <button className={`cat-tab ${catFilter === 'conversation' ? 'active' : ''}`} onClick={() => setCatFilter('conversation')}>💬 Conversation</button>
        <button className={`cat-tab ${catFilter === 'grammar' ? 'active' : ''}`} onClick={() => setCatFilter('grammar')}>✏️ Grammar</button>
      </div>

      {loading && <p className="courses-empty">Loading lessons...</p>}
      {!loading && visibleLessons.length === 0 && (
        <p className="courses-empty">No lessons in this category yet.</p>
      )}

      <div className="lesson-cards-grid">
        {visibleLessons.map((l) => {
          const isDone = completedIds.includes(l._id);
          const categoryLabel = l.category ? l.category : 'vocabulary';
          const icon = categoryLabel === 'grammar' ? '✏️' : categoryLabel === 'conversation' ? '💬' : '📚';

          return (
            <button
              className={`lesson-card-btn ${isDone ? 'completed-card' : ''} ${!canOpenLessons ? 'lesson-locked' : ''}`}
              key={l._id}
              onClick={() => handleLessonClick(l)}
            >
              <div className="lesson-card-top">
                <span className="lesson-card-badge">
                  {icon} {categoryLabel}
                </span>
                <div className="lesson-card-order-circle">
                  {l.order}
                </div>
              </div>
              <h3 className="lesson-card-title">{l.title}</h3>
              <div className="lesson-card-footer">
                <span className="lesson-card-status-text">
                  {!canOpenLessons ? 'Locked' : isDone ? '✓ Completed' : 'Start Lesson'}
                </span>
                <span className="lesson-card-arrow">
                  {!canOpenLessons ? '🔒' : isDone ? '✓' : '→'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default CoursePage;
