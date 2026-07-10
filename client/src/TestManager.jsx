import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function TestManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // form fields
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [questions, setQuestions] = useState([]);
  const [published, setPublished] = useState(false);

  const loadTests = async () => {
    try {
      const res = await fetch(`${API}/tests/all`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setTests(data);
      else setError(data.error || 'Could not load tests');
    } catch {
      setError('Could not reach the server');
    }
  };

  useEffect(() => { loadTests(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setLevel('');
    setDescription('');
    setAudioUrl('');
    setPdfUrl('');
    setQuestions([]);
    setPublished(false);
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setTitle(t.title);
    setLevel(t.level || '');
    setDescription(t.description || '');
    setAudioUrl(t.audioUrl || '');
    setPdfUrl(t.pdfUrl || '');
    setQuestions(t.questions || []);
    setPublished(t.published);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadFile = async (file, setter) => {
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (res.ok) setter(data.url);
      else setError(data.error || 'Upload failed');
    } catch {
      setError('Could not reach the server');
    }
  };

  // ----- questions -----
  const addQuestion = () => {
    setQuestions((prev) => [...prev, { questionText: '', options: ['', ''], correctIndex: 0 }]);
  };
  const updateQuestionText = (qi, text) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, questionText: text } : q)));
  };
  const updateOption = (qi, oi, text) => {
    setQuestions((prev) => prev.map((q, i) =>
      i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? text : o)) } : q
    ));
  };
  const addOption = (qi) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, ''] } : q)));
  };
  const removeOption = (qi, oi) => {
    setQuestions((prev) => prev.map((q, i) =>
      i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q
    ));
  };
  const setCorrect = (qi, oi) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, correctIndex: oi } : q)));
  };
  const removeQuestion = (qi) => {
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  };

  const save = async () => {
    setError('');
    if (!title.trim()) return setError('Title is required');
    const body = { title, level, description, audioUrl, pdfUrl, questions, published };
    const res = await fetch(
      editingId ? `${API}/tests/${editingId}` : `${API}/tests`,
      { method: editingId ? 'PUT' : 'POST', headers: jsonHeaders, body: JSON.stringify(body) }
    );
    if (res.ok) { resetForm(); loadTests(); }
    else { const d = await res.json(); setError(d.error || 'Could not save test'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this test?')) return;
    await fetch(`${API}/tests/${id}`, { method: 'DELETE', headers: authHeaders });
    if (editingId === id) resetForm();
    loadTests();
  };

  const togglePublish = async (t) => {
    await fetch(`${API}/tests/${t._id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ published: !t.published }),
    });
    loadTests();
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Test manager</h1>
      {error && <p className="login-error">{error}</p>}

      <div className="admin-form" style={{ maxWidth: 760, marginBottom: 32 }}>
        <h2>{editingId ? 'Edit test' : 'New test'}</h2>

        <label>Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="HSK 1 Mock Test 1" />
        </label>
        <label>Level
          <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="HSK 1" />
        </label>
        <label>Description
          <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full listening + reading mock test" />
        </label>

        <label>Listening audio (MP3)
          <input type="file" accept="audio/*" onChange={(e) => uploadFile(e.target.files[0], setAudioUrl)} />
        </label>
        {audioUrl && <audio controls src={`${SERVER}${audioUrl}`} style={{ width: '100%', marginBottom: 12 }} />}

        <label>Question paper (PDF)
          <input type="file" accept="application/pdf" onChange={(e) => uploadFile(e.target.files[0], setPdfUrl)} />
        </label>
        {pdfUrl && <p className="pdf-ok">✓ PDF uploaded</p>}

        {/* Questions */}
        <div className="questions-editor">
          <div className="dialogue-lines-head">
            <strong>Questions ({questions.length})</strong>
            <button className="nav-btn" type="button" onClick={addQuestion}>+ Add question</button>
          </div>

          {questions.map((q, qi) => (
            <div className="question-block" key={qi}>
              <div className="question-top">
                <span className="question-num">Q{qi + 1}</span>
                <input
                  className="dialogue-line-input"
                  value={q.questionText}
                  onChange={(e) => updateQuestionText(qi, e.target.value)}
                  placeholder="Question text (or 'Question 1' to match the PDF)"
                />
                <button className="row-delete" type="button" onClick={() => removeQuestion(qi)}>Remove</button>
              </div>

              {q.options.map((opt, oi) => (
                <div className="option-row" key={oi}>
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => setCorrect(qi, oi)}
                    title="Mark as correct answer"
                  />
                  <input
                    className="option-input"
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  />
                  {q.options.length > 2 && (
                    <button className="row-delete" type="button" onClick={() => removeOption(qi, oi)}>✕</button>
                  )}
                </div>
              ))}
              <button className="nav-btn" type="button" onClick={() => addOption(qi)} style={{ marginTop: 6 }}>+ Add option</button>
            </div>
          ))}
        </div>

        <label className="check-label" style={{ marginTop: 16 }}>
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          {editingId ? 'Published' : 'Publish immediately'}
        </label>

        <button className="btn-primary" onClick={save}>
          {editingId ? 'Save changes' : 'Create test'}
        </button>
        {editingId && <button className="nav-btn cancel-edit" onClick={resetForm}>Cancel edit</button>}
      </div>

      <div className="admin-list">
        <h2>All tests ({tests.length})</h2>
        {tests.length === 0 && <p className="admin-empty">No tests yet — create your first one!</p>}
        {tests.map((t) => (
          <div className="admin-row" key={t._id}>
            <div className="row-info">
              <strong>{t.title}</strong>
              <span>{t.level || 'no level'} · {t.questions?.length || 0} questions</span>
            </div>
            <button className="nav-btn" onClick={() => startEdit(t)}>Edit</button>
            <button className={t.published ? 'pill pill-live' : 'pill pill-draft'} onClick={() => togglePublish(t)}>
              {t.published ? 'Published' : 'Draft'}
            </button>
            <button className="row-delete" onClick={() => remove(t._id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TestManager;