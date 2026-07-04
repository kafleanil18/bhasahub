import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';

function CoursePage({ course, onBack }) {
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/lessons/course/${course._id}`)
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [course._id]);

  const openLesson = (lesson) => {
    setActiveLesson(lesson);
    setWords([]);
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
        <p className="lesson-count">{words.length} words</p>

        <div className="vocab-grid">
          {words.map((w) => (
            <div className="vocab-card" key={w._id}>
              <span className="annotation">{w.pronunciation}</span>
              <span className={`word ${course.language === 'chinese' ? 'zh' : 'ne'}`}>
                {w.word}
              </span>
              <span className="meaning">{w.meaning}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ---------- Course overview ----------
  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>← Back to courses</button>
      <div className="course-head">
        <span className={`glyph ${course.language === 'chinese' ? 'zh' : 'ne'}`}>
          {course.glyph}
        </span>
        <div>
          <h1 className="section-title">{course.title}</h1>
          <p className="course-desc">{course.description}</p>
          <span className="tag">{course.level}</span>
        </div>
      </div>

      <h2 className="lessons-heading">Lessons</h2>
      {loading && <p className="courses-empty">Loading lessons...</p>}
      {!loading && lessons.length === 0 && (
        <p className="courses-empty">Lessons coming soon!</p>
      )}
      <div className="lesson-list">
        {lessons.map((l) => (
          <button className="lesson-row" key={l._id} onClick={() => openLesson(l)}>
            <span className="lesson-num">{l.order}</span>
            <span className="lesson-title">{l.title}</span>
            <span className="lesson-arrow">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default CoursePage;