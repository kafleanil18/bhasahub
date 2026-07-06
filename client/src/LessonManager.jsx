import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function LessonManager({ course, onBack }) {
  const token = localStorage.getItem('token');

  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [error, setError] = useState('');

  // lesson form (create or edit)
  const [lessonTitle, setLessonTitle] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);

  // word form (create or edit)
  const [word, setWord] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [meaning, setMeaning] = useState('');
  const [editingWordId, setEditingWordId] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  // ---------- lessons ----------
  const loadLessons = async () => {
    try {
      const res = await fetch(`${API}/lessons/course/${course._id}/all`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setLessons(data);
      else setError(data.error || 'Could not load lessons');
    } catch {
      setError('Could not reach the server');
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonTitle('');
  };

  const saveLesson = async () => {
    setError('');
    if (!lessonTitle.trim()) return setError('Lesson title is required');

    const isEditing = editingLessonId !== null;
    const res = await fetch(
      isEditing ? `${API}/lessons/${editingLessonId}` : `${API}/lessons`,
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(
          isEditing
            ? { title: lessonTitle }
            : { course: course._id, title: lessonTitle, order: lessons.length + 1, published: true }
        ),
      }
    );
    if (res.ok) {
      resetLessonForm();
      loadLessons();
    } else {
      const data = await res.json();
      setError(data.error || 'Could not save lesson');
    }
  };

  const startEditLesson = (lesson) => {
    setEditingLessonId(lesson._id);
    setLessonTitle(lesson.title);
  };

  const deleteLesson = async (id) => {
    if (!confirm('Delete this lesson AND all its words?')) return;
    await fetch(`${API}/lessons/${id}`, { method: 'DELETE', headers: authHeaders });
    if (activeLesson && activeLesson._id === id) setActiveLesson(null);
    if (editingLessonId === id) resetLessonForm();
    loadLessons();
  };

  const toggleLesson = async (lesson) => {
    await fetch(`${API}/lessons/${lesson._id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ published: !lesson.published }),
    });
    loadLessons();
  };

  // ---------- words ----------
  const openLesson = async (lesson) => {
    setActiveLesson(lesson);
    setWords([]);
    resetWordForm();
    const res = await fetch(`${API}/lessons/${lesson._id}/vocabulary`);
    const data = await res.json();
    if (res.ok) setWords(data);
  };

  const resetWordForm = () => {
    setEditingWordId(null);
    setWord('');
    setPronunciation('');
    setMeaning('');
  };

  const saveWord = async () => {
    setError('');
    if (!word.trim() || !pronunciation.trim() || !meaning.trim()) {
      return setError('Word, pronunciation and meaning are all required');
    }
    const isEditing = editingWordId !== null;
    const res = await fetch(
      isEditing ? `${API}/lessons/vocabulary/${editingWordId}` : `${API}/lessons/${activeLesson._id}/vocabulary`,
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(
          isEditing
            ? { word, pronunciation, meaning }
            : { word, pronunciation, meaning, order: words.length + 1 }
        ),
      }
    );
    if (res.ok) {
      resetWordForm();
      openLesson(activeLesson);
    } else {
      const data = await res.json();
      setError(data.error || 'Could not save word');
    }
  };

  const startEditWord = (w) => {
    setEditingWordId(w._id);
    setWord(w.word);
    setPronunciation(w.pronunciation);
    setMeaning(w.meaning);
  };

  const deleteWord = async (vocabId) => {
    if (!confirm('Delete this word?')) return;
    await fetch(`${API}/lessons/vocabulary/${vocabId}`, { method: 'DELETE', headers: authHeaders });
    if (editingWordId === vocabId) resetWordForm();
    openLesson(activeLesson);
  };

  const uploadAudio = async (vocabItem, file) => {
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Upload failed');

      await fetch(`${API}/lessons/vocabulary/${vocabItem._id}/audio`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ audioUrl: data.url }),
      });
      openLesson(activeLesson);
    } catch {
      setError('Could not reach the server');
    }
  };

  // ---------- WORD VIEW ----------
  if (activeLesson) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={() => setActiveLesson(null)}>
          ← Back to {course.title}
        </button>
        <p className="eyebrow">Lesson {activeLesson.order}</p>
        <h1 className="section-title">{activeLesson.title}</h1>
        <p className="lesson-count">{words.length} words</p>
        {error && <p className="login-error">{error}</p>}

        <div className="admin-form" style={{ maxWidth: 640, marginBottom: 32 }}>
          <h2>{editingWordId ? 'Edit word' : 'Add a word'}</h2>
          <label>
            Word (script)
            <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="你好 or नमस्ते" />
          </label>
          <label>
            Pronunciation
            <input value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} placeholder="nǐ hǎo" />
          </label>
          <label>
            Meaning
            <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="hello" />
          </label>
          <button className="btn-primary" onClick={saveWord}>
            {editingWordId ? 'Save changes' : 'Add word'}
          </button>
          {editingWordId && (
            <button className="nav-btn cancel-edit" onClick={resetWordForm}>
              Cancel edit
            </button>
          )}
        </div>

        <div className="admin-list">
          <h2>Words ({words.length})</h2>
          {words.map((w) => (
            <div className="admin-row" key={w._id}>
              <span className={`row-glyph ${course.language === 'chinese' ? 'zh' : 'ne'}`}>{w.word}</span>
              <div className="row-info">
                <strong>{w.pronunciation}</strong>
                <span>{w.meaning}</span>
              </div>
              <button className="nav-btn" onClick={() => startEditWord(w)}>Edit</button>
              {w.audioUrl ? (
                <>
                  <audio controls src={`${SERVER}${w.audioUrl}`} className="row-audio" />
                  <label className="pill pill-draft upload-label">
                    Replace
                    <input type="file" accept="audio/*" hidden
                      onChange={(e) => e.target.files[0] && uploadAudio(w, e.target.files[0])} />
                  </label>
                </>
              ) : (
                <label className="pill pill-live upload-label">
                  + Audio
                  <input type="file" accept="audio/*" hidden
                    onChange={(e) => e.target.files[0] && uploadAudio(w, e.target.files[0])} />
                </label>
              )}
              <button className="row-delete" onClick={() => deleteWord(w._id)}>Delete</button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ---------- LESSON VIEW (styled like CoursePage) ----------
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

      {error && <p className="login-error">{error}</p>}

      {/* add / edit lesson */}
      <div className="lesson-add-bar">
        <input
          value={lessonTitle}
          onChange={(e) => setLessonTitle(e.target.value)}
          placeholder={editingLessonId ? 'Edit lesson title' : 'New lesson title'}
          onKeyDown={(e) => e.key === 'Enter' && saveLesson()}
        />
        <button className="btn-primary" onClick={saveLesson}>
          {editingLessonId ? 'Save' : 'Add lesson'}
        </button>
        {editingLessonId && (
          <button className="nav-btn" onClick={resetLessonForm}>Cancel</button>
        )}
      </div>

      <h2 className="lessons-heading">Lessons ({lessons.length})</h2>
      {lessons.length === 0 && <p className="courses-empty">No lessons yet — add one above.</p>}

      <div className="lesson-list">
        {lessons.map((l) => (
          <div className="lesson-row admin-lesson-row" key={l._id}>
            <span className="lesson-num">{l.order}</span>
            <span className="lesson-title">{l.title}</span>
            <button className="nav-btn" onClick={() => openLesson(l)}>Words</button>
            <button className="nav-btn" onClick={() => startEditLesson(l)}>Edit</button>
            <button
              className={l.published ? 'pill pill-live' : 'pill pill-draft'}
              onClick={() => toggleLesson(l)}
            >
              {l.published ? 'Published' : 'Draft'}
            </button>
            <button className="row-delete" onClick={() => deleteLesson(l._id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LessonManager;