import { useState, useEffect, useCallback } from 'react';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

const resizeImage = (file, maxWidth) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load the image'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Could not resize the image'));
            const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            resolve(new File([blob], name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

function LessonManager({ course, onBack }) {
  const token = localStorage.getItem('token');

  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [error, setError] = useState('');

  // lesson form (create or edit)
  const [lessonTitle, setLessonTitle] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonDialogue, setLessonDialogue] = useState('');
  const [dialogueImage, setDialogueImage] = useState('');
  const [dialogueLines, setDialogueLines] = useState([]);
  const [lessonCategory, setLessonCategory] = useState('vocabulary');
  const [uploadSize, setUploadSize] = useState('small');

  // word form (create or edit)
  const [word, setWord] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [meaning, setMeaning] = useState('');
  const [editingWordId, setEditingWordId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  // ---------- lessons ----------
  const loadLessons = useCallback(async () => {
    try {
      const res = await fetch(`${API}/lessons/course/${course._id}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setLessons(data);
      else setError(data.error || 'Could not load lessons');
    } catch {
      setError('Could not reach the server');
    }
  }, [course._id, token]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDialogue('');
    setDialogueImage('');
    setDialogueLines([]);
    setLessonCategory('vocabulary');
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
            ? { title: lessonTitle, category: lessonCategory, dialogue: lessonDialogue, dialogueImage, dialogueLines }
            : { course: course._id, title: lessonTitle, category: lessonCategory, dialogue: lessonDialogue, dialogueImage, dialogueLines, order: lessons.length + 1, published: true }
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
    setLessonDialogue(lesson.dialogue || '');
    setDialogueImage(lesson.dialogueImage || '');
    setDialogueLines(lesson.dialogueLines || []);
    setLessonCategory(lesson.category || 'vocabulary');
  };

  // ---------- dialogue ----------
  const uploadDialogueImage = async (file) => {
    if (!file) return;
    setError('');
    let fileToUpload = file;
    if (uploadSize !== 'original') {
      try {
        const maxWidth = uploadSize === 'xsmall' ? 300 : 600;
        fileToUpload = await resizeImage(file, maxWidth);
      } catch (err) {
        setError(err.message || 'Image resize failed');
        return;
      }
    }
    const fd = new FormData();
    fd.append('file', fileToUpload);
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Upload failed');
      setDialogueImage(data.url);
    } catch {
      setError('Could not reach the server');
    }
  };

  const addDialogueLine = () => {
    setDialogueLines((prev) => [...prev, { text: '', audioUrl: '' }]);
  };

  const updateLineText = (index, text) => {
    setDialogueLines((prev) => prev.map((l, i) => (i === index ? { ...l, text } : l)));
  };

  const removeDialogueLine = (index) => {
    setDialogueLines((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadLineAudio = async (index, file) => {
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Upload failed');
      setDialogueLines((prev) =>
        prev.map((l, i) => (i === index ? { ...l, audioUrl: data.url } : l))
      );
    } catch {
      setError('Could not reach the server');
    }
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

  // ---------- drag to reorder ----------
  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setWords((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(index);
  };

  const handleDrop = async () => {
    setDragIndex(null);
    const orderedIds = words.map((w) => w._id);
    try {
      await fetch(`${API}/lessons/${activeLesson._id}/vocabulary/reorder`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ orderedIds }),
      });
    } catch {
      setError('Could not save the new order');
    }
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
          <p className="reorder-hint">Tip: drag the ⠿ handle to reorder words.</p>
          {words.map((w, index) => (
            <div
              className="admin-row draggable-row"
              key={w._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
            >
              <span className="drag-handle" title="Drag to reorder">⠿</span>
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

  // ---------- LESSON VIEW ----------
  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>← Back to courses</button>

      <div className="course-head">
        <span className={`glyph ${course.language === 'chinese' ? 'zh' : 'ne'}`}>
          {course.glyph && course.glyph.trim().length > 0 && course.glyph.trim().length <= 2 
            ? course.glyph 
            : (course.language === 'chinese' ? '中' : 'ने')}
        </span>
        <div>
          <h1 className="section-title">{course.title}</h1>
          <p className="course-desc">{course.description}</p>
          <span className="tag">{course.level}</span>
        </div>
      </div>

      {error && <p className="login-error">{error}</p>}

      {/* add / edit lesson */}
      <div className="lesson-add-form">
        <div className="lesson-add-bar">
          <input
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            placeholder={editingLessonId ? 'Edit lesson title' : 'New lesson title'}
          />
          <select
            value={lessonCategory}
            onChange={(e) => setLessonCategory(e.target.value)}
            className="category-select"
          >
            <option value="vocabulary">Vocabulary</option>
            <option value="conversation">Conversation</option>
            <option value="grammar">Grammar</option>
          </select>
          <button className="btn-primary" onClick={saveLesson}>
            {editingLessonId ? 'Save' : 'Add lesson'}
          </button>
          {editingLessonId && (
            <button className="nav-btn" onClick={resetLessonForm}>Cancel</button>
          )}
        </div>
        <textarea
          className="dialogue-input"
          rows="4"
          value={lessonDialogue}
          onChange={(e) => setLessonDialogue(e.target.value)}
          placeholder="Optional plain dialogue text (or use the per-line editor below for audio)."
        />

        <div className="dialogue-lines-editor">
          <div className="dialogue-lines-head">
            <strong>Conversation image (one for the whole dialogue)</strong>
            <div className="dialogue-image-size-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--mist)' }}>Upload size:</span>
              <select
                className="category-select"
                value={uploadSize}
                onChange={(e) => setUploadSize(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '13px', minWidth: '120px' }}
              >
                <option value="xsmall">Extra Small (300px)</option>
                <option value="small">Small (600px)</option>
                <option value="original">Original</option>
              </select>
            </div>
          </div>
          {dialogueImage ? (
            <div className="dialogue-image-preview-wrap">
              <img src={`${SERVER}${dialogueImage}`} alt="dialogue" className="dialogue-image-admin" />
              <label className="pill pill-draft upload-label">
                Change image
                <input type="file" accept="image/*" hidden
                  onChange={(e) => e.target.files[0] && uploadDialogueImage(e.target.files[0])} />
              </label>
              <button className="row-delete" type="button" onClick={() => setDialogueImage('')}>Remove image</button>
            </div>
          ) : (
            <label className="pill pill-live upload-label">
              + Add dialogue image
              <input type="file" accept="image/*" hidden
                onChange={(e) => e.target.files[0] && uploadDialogueImage(e.target.files[0])} />
            </label>
          )}

          <div className="dialogue-lines-head" style={{ marginTop: 20 }}>
            <strong>Conversation lines (with audio)</strong>
            <button className="nav-btn" onClick={addDialogueLine} type="button">+ Add line</button>
          </div>
          {dialogueLines.map((line, i) => (
            <div className="dialogue-line-row" key={i}>
              <input
                className="dialogue-line-input"
                value={line.text}
                onChange={(e) => updateLineText(i, e.target.value)}
                placeholder="A: 你好！ (Nǐ hǎo!) — Hello!"
              />
              {line.audioUrl ? (
                <>
                  <audio controls src={`${SERVER}${line.audioUrl}`} className="row-audio" />
                  <label className="pill pill-draft upload-label">
                    Replace audio
                    <input type="file" accept="audio/*" hidden
                      onChange={(e) => e.target.files[0] && uploadLineAudio(i, e.target.files[0])} />
                  </label>
                </>
              ) : (
                <label className="pill pill-live upload-label">
                  + Audio
                  <input type="file" accept="audio/*" hidden
                    onChange={(e) => e.target.files[0] && uploadLineAudio(i, e.target.files[0])} />
                </label>
              )}
              <button className="row-delete" onClick={() => removeDialogueLine(i)} type="button">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <h2 className="lessons-heading">Lessons ({lessons.length})</h2>
      {lessons.length === 0 && <p className="courses-empty">No lessons yet — add one above.</p>}

      <div className="lesson-list">
        {lessons.map((l) => (
          <div className="lesson-row admin-lesson-row" key={l._id}>
            <span className="lesson-num">{l.order}</span>
            <span className="lesson-title">{l.title}</span>
            <span className="lesson-cat-tag">{l.category || 'vocabulary'}</span>
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