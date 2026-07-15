import { useState, useEffect, useMemo } from 'react';

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

  // Tab state inside the test editor
  const [editorTab, setEditorTab] = useState('details'); // 'details' or 'questions'
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

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
    setEditorTab('details');
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
    setEditorTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadFile = async (file, setter, setUploading) => {
    if (!file) return;
    setError('');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (res.ok) setter(data.url);
      else setError(data.error || 'Upload failed');
    } catch {
      setError('Could not reach the server');
    } finally {
      setUploading(false);
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

  // Metrics details
  const stats = useMemo(() => {
    const total = tests.length;
    const totalQuestions = tests.reduce((acc, t) => acc + (t.questions?.length || 0), 0);
    const publishedCount = tests.filter((t) => t.published).length;
    return { total, totalQuestions, publishedCount };
  }, [tests]);

  return (
    <section className="tm-dashboard">
      <style>{`
        .tm-dashboard {
          max-width: 1240px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--ink, #2a2320);
          background-color: var(--paper, #faf6ec);
          min-height: 100vh;
        }

        .tm-back-btn {
          background: none;
          border: none;
          color: var(--jade, #2e6b57);
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          margin-bottom: 1.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          border: 1px dashed transparent;
        }
        .tm-back-btn:hover {
          background: rgba(46, 107, 87, 0.08);
          border-color: var(--jade, #2e6b57);
        }

        .tm-header {
          margin-bottom: 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 1.5rem;
        }

        .tm-title-container h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--ink, #2a2320);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .tm-title-container p {
          color: var(--mist, #7a7266);
          margin-top: 0.25rem;
          font-size: 0.95rem;
        }

        /* Metrics cards */
        .tm-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .tm-metric-card {
          background: var(--card, #fffdf8);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 12px rgba(42, 35, 32, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .tm-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
        }

        .tm-metric-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade, #2e6b57);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        .tm-metric-icon.gold {
          background: rgba(201, 154, 60, 0.08);
          color: var(--gold, #c99a3c);
        }
        .tm-metric-icon.seal {
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal, #c8362a);
        }

        .tm-metric-details {
          display: flex;
          flex-direction: column;
        }

        .tm-metric-value {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          line-height: 1.1;
        }

        .tm-metric-label {
          font-size: 0.8rem;
          color: var(--mist, #7a7266);
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .tm-error {
          background-color: rgba(200, 54, 42, 0.05);
          border-left: 4px solid var(--seal, #c8362a);
          color: var(--seal, #c8362a);
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .tm-workspace {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        @media (min-width: 1024px) {
          .tm-workspace {
            grid-template-columns: 7fr 5fr;
            align-items: start;
          }
        }

        .tm-panel {
          background: var(--card, #fffdf8);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(42, 35, 32, 0.03);
          border: 1px solid var(--line, #e6dcc6);
        }

        .tm-panel h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.6rem;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: var(--ink, #2a2320);
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 0.75rem;
        }

        /* Tabs inside editor */
        .tm-tabs-nav {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 0.5rem;
        }

        .tm-tab-btn {
          background: none;
          border: none;
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--mist, #7a7266);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .tm-tab-btn:hover {
          background: rgba(42, 35, 32, 0.04);
          color: var(--ink, #2a2320);
        }

        .tm-tab-btn.active {
          background: var(--jade, #2e6b57);
          color: #ffffff;
        }

        /* Form elements */
        .tm-form-group {
          margin-bottom: 1.25rem;
        }

        .tm-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .tm-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tm-input, .tm-textarea {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid var(--line, #e6dcc6);
          background: var(--paper, #faf6ec);
          border-radius: 10px;
          font-size: 0.95rem;
          color: var(--ink, #2a2320);
          box-sizing: border-box;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .tm-input:focus, .tm-textarea:focus {
          outline: none;
          border-color: var(--jade, #2e6b57);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        /* Modern Upload Zone */
        .tm-upload-zone {
          background: var(--paper, #faf6ec);
          border: 2px dashed var(--line, #e6dcc6);
          border-radius: 12px;
          padding: 1.25rem;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
        }
        .tm-upload-zone:hover {
          border-color: var(--jade, #2e6b57);
        }

        .tm-file-input-btn {
          position: relative;
          overflow: hidden;
          display: inline-block;
          background: var(--rice, #f3ebd8);
          color: var(--ink, #2a2320);
          border: 1px solid var(--line, #e6dcc6);
          padding: 0.5rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .tm-file-input-btn input[type=file] {
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          cursor: pointer;
          font-size: 100px;
        }

        .tm-upload-status {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--jade, #2e6b57);
          margin-top: 0.5rem;
        }

        .tm-asset-card {
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--line, #e6dcc6);
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .tm-asset-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--ink, #2a2320);
        }

        .tm-btn-asset-remove {
          background: none;
          border: none;
          color: var(--seal, #c8362a);
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .tm-btn-asset-remove:hover {
          text-decoration: underline;
        }

        /* Question Builder Cards */
        .tm-questions-editor {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .tm-question-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .tm-question-card {
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 12px;
          padding: 1.25rem;
          background: var(--paper, #faf6ec);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);
          margin-bottom: 0.5rem;
        }

        .tm-question-top {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .tm-question-num {
          background: var(--jade, #2e6b57);
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .tm-option-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
          background: #ffffff;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--line, #e6dcc6);
          transition: all 0.2s;
        }
        .tm-option-row.correct {
          background: rgba(46, 107, 87, 0.04);
          border-color: var(--jade, #2e6b57);
        }

        .tm-option-row input[type=radio] {
          width: 18px;
          height: 18px;
          accent-color: var(--jade, #2e6b57);
          cursor: pointer;
        }

        .tm-option-input {
          flex-grow: 1;
          border: none;
          outline: none;
          font-size: 0.9rem;
          color: var(--ink, #2a2320);
          background: transparent;
          font-family: inherit;
        }

        .tm-btn-row-del {
          background: none;
          border: none;
          color: var(--seal, #c8362a);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .tm-btn-row-del:hover {
          text-decoration: underline;
        }

        /* Checkbox published */
        .tm-checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 1.25rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--ink, #2a2320);
          cursor: pointer;
          user-select: none;
        }
        .tm-checkbox-wrap input {
          width: 18px;
          height: 18px;
          accent-color: var(--jade, #2e6b57);
          cursor: pointer;
        }

        /* Action buttons */
        .tm-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.75rem;
        }

        .tm-btn-primary {
          background-color: var(--jade, #2e6b57);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          box-shadow: 0 4px 14px rgba(46, 107, 87, 0.2);
        }
        .tm-btn-primary:hover {
          background-color: #245444;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(46, 107, 87, 0.3);
        }

        .tm-btn-secondary {
          background-color: transparent;
          color: var(--mist, #7a7266);
          border: 1px solid var(--line, #e6dcc6);
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
          text-align: center;
        }
        .tm-btn-secondary:hover {
          background-color: var(--rice, #f3ebd8);
          color: var(--ink, #2a2320);
        }

        /* Test items cards in list */
        .tm-test-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tm-test-card {
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 12px;
          padding: 1.2rem;
          display: flex;
          gap: 1.25rem;
          background: #ffffff;
          align-items: center;
          transition: all 0.2s ease;
        }
        .tm-test-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(42, 35, 32, 0.03);
          border-color: var(--jade, #2e6b57);
        }

        .tm-test-icon-badge {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(46, 107, 87, 0.08) 0%, rgba(201, 154, 60, 0.15) 100%);
          color: var(--jade, #2e6b57);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid var(--line, #e6dcc6);
        }

        .tm-test-info {
          flex-grow: 1;
          min-width: 0;
        }

        .tm-test-title {
          font-family: 'Fraunces', serif;
          font-weight: 750;
          color: var(--ink, #2a2320);
          font-size: 1.1rem;
          margin-bottom: 0.15rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-test-meta {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--mist, #7a7266);
        }

        /* Status pills */
        .tm-status-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          text-align: center;
        }

        .tm-status-pill.published {
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade, #2e6b57);
          border-color: rgba(46, 107, 87, 0.2);
        }
        .tm-status-pill.published:hover {
          background: var(--jade, #2e6b57);
          color: #ffffff;
        }

        .tm-status-pill.draft {
          background: rgba(122, 114, 102, 0.08);
          color: var(--mist, #7a7266);
          border-color: rgba(122, 114, 102, 0.15);
        }
        .tm-status-pill.draft:hover {
          background: var(--mist, #7a7266);
          color: #ffffff;
        }

        .tm-btn-action {
          background: var(--paper, #faf6ec);
          color: var(--ink, #2a2320);
          border: 1px solid var(--line, #e6dcc6);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tm-btn-action:hover {
          background: var(--rice, #f3ebd8);
        }

        .tm-btn-action.delete {
          background: rgba(200, 54, 42, 0.04);
          color: var(--seal, #c8362a);
          border-color: rgba(200, 54, 42, 0.08);
        }
        .tm-btn-action.delete:hover {
          background: rgba(200, 54, 42, 0.08);
          border-color: var(--seal, #c8362a);
        }

        .tm-empty-state {
          text-align: center;
          color: var(--mist, #7a7266);
          padding: 3rem 1rem;
          font-style: italic;
        }
      `}</style>

      <button className="tm-back-btn" onClick={onBack}>← Back to home</button>
      
      <div className="tm-header">
        <div className="tm-title-container">
          <h1>Test Studio</h1>
          <p>Compose, edit, and organize assessment mock tests</p>
        </div>
      </div>

      {error && <div className="tm-error">{error}</div>}

      {/* Metrics Cards */}
      <div className="tm-metrics-grid">
        <div className="tm-metric-card">
          <div className="tm-metric-icon">📑</div>
          <div className="tm-metric-details">
            <span className="tm-metric-value">{stats.total}</span>
            <span className="tm-metric-label">Total Tests</span>
          </div>
        </div>
        <div className="tm-metric-card">
          <div className="tm-metric-icon gold">❓</div>
          <div className="tm-metric-details">
            <span className="tm-metric-value">{stats.totalQuestions}</span>
            <span className="tm-metric-label">Questions Pool</span>
          </div>
        </div>
        <div className="tm-metric-card">
          <div className="tm-metric-icon seal">✅</div>
          <div className="tm-metric-details">
            <span className="tm-metric-value">{stats.publishedCount}</span>
            <span className="tm-metric-label">Published Live</span>
          </div>
        </div>
      </div>

      <div className="tm-workspace">
        {/* Left Side: Test Builder Panel */}
        <div className="tm-panel">
          <h2>{editingId ? 'Configure Test Sheet' : 'New Assessment Builder'}</h2>

          <div className="tm-tabs-nav">
            <button 
              className={`tm-tab-btn ${editorTab === 'details' ? 'active' : ''}`}
              onClick={() => setEditorTab('details')}
            >
              📋 details & assets
            </button>
            <button 
              className={`tm-tab-btn ${editorTab === 'questions' ? 'active' : ''}`}
              onClick={() => setEditorTab('questions')}
            >
              ❓ questions editor ({questions.length})
            </button>
          </div>

          {editorTab === 'details' ? (
            <div className="tm-tab-pane">
              <div className="tm-form-group">
                <label className="tm-label">Test Title</label>
                <input 
                  className="tm-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. HSK 1 Mock Test 1" 
                />
              </div>

              <div className="tm-form-group">
                <label className="tm-label">Target Level</label>
                <input 
                  className="tm-input" 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)} 
                  placeholder="e.g. HSK 1" 
                />
              </div>

              <div className="tm-form-group">
                <label className="tm-label">Description summary</label>
                <textarea 
                  className="tm-textarea"
                  rows="2" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="e.g. Full listening + reading mock test" 
                />
              </div>

              <div className="tm-form-row">
                <div className="tm-form-group">
                  <label className="tm-label">Listening Audio (MP3)</label>
                  <div className="tm-upload-zone">
                    <div className="tm-file-input-btn">
                      Upload Audio
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={(e) => uploadFile(e.target.files[0], setAudioUrl, setUploadingAudio)} 
                      />
                    </div>
                    {uploadingAudio && <div className="tm-upload-status">Uploading MP3...</div>}
                  </div>
                  {audioUrl && (
                    <div className="tm-asset-card">
                      <div className="tm-asset-info">🎵 MP3 Audio Loaded</div>
                      <button type="button" className="tm-btn-asset-remove" onClick={() => setAudioUrl('')}>Delete</button>
                    </div>
                  )}
                  {audioUrl && <audio controls src={`${SERVER}${audioUrl}`} style={{ width: '100%', marginTop: 8 }} />}
                </div>

                <div className="tm-form-group">
                  <label className="tm-label">Question Paper (PDF)</label>
                  <div className="tm-upload-zone">
                    <div className="tm-file-input-btn">
                      Upload PDF
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={(e) => uploadFile(e.target.files[0], setPdfUrl, setUploadingPdf)} 
                      />
                    </div>
                    {uploadingPdf && <div className="tm-upload-status">Uploading PDF...</div>}
                  </div>
                  {pdfUrl && (
                    <div className="tm-asset-card">
                      <div className="tm-asset-info">📄 PDF Document Attached</div>
                      <button type="button" className="tm-btn-asset-remove" onClick={() => setPdfUrl('')}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="tm-tab-pane">
              <div className="tm-questions-editor">
                <div className="tm-question-header-row">
                  <strong>Question Pool Editor ({questions.length} total)</strong>
                  <button className="tm-btn-action" type="button" onClick={addQuestion}>+ Add Question</button>
                </div>

                {questions.length === 0 && (
                  <p className="tm-empty-state">No questions defined. Click '+ Add Question' to write choice answers.</p>
                )}

                {questions.map((q, qi) => (
                  <div className="tm-question-card" key={qi}>
                    <div className="tm-question-top">
                      <span className="tm-question-num">Q{qi + 1}</span>
                      <input
                        className="tm-input"
                        value={q.questionText}
                        onChange={(e) => updateQuestionText(qi, e.target.value)}
                        placeholder="Question text (or e.g. 'Question 1' to match the PDF)"
                      />
                      <button className="tm-btn-row-del" type="button" onClick={() => removeQuestion(qi)}>Remove</button>
                    </div>

                    {q.options.map((opt, oi) => (
                      <div className={`tm-option-row ${q.correctIndex === oi ? 'correct' : ''}`} key={oi}>
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() => setCorrect(qi, oi)}
                          title="Mark as correct answer"
                        />
                        <input
                          className="tm-option-input"
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        />
                        {q.options.length > 2 && (
                          <button className="tm-btn-row-del" type="button" onClick={() => removeOption(qi, oi)}>✕</button>
                        )}
                      </div>
                    ))}
                    <button className="tm-btn-action" type="button" onClick={() => addOption(qi)} style={{ marginTop: 8 }}>+ Add Option</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="tm-checkbox-wrap">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span>{editingId ? 'Keep test live & published' : 'Publish test immediately'}</span>
          </label>

          <div className="tm-actions">
            <button className="tm-btn-primary" onClick={save}>
              {editingId ? 'Save Changes' : 'Create Test'}
            </button>
            {editingId && <button className="tm-btn-secondary" onClick={resetForm}>Cancel Edit</button>}
          </div>
        </div>

        {/* Right Side: Assessments Archive */}
        <div className="tm-panel">
          <h2>All Tests Registry ({tests.length})</h2>
          <div className="tm-test-list">
            {tests.length === 0 && <p className="tm-empty-state">No mock tests available in registry.</p>}
            
            {tests.map((t) => (
              <div className="tm-test-card" key={t._id}>
                <div className="tm-test-icon-badge">📑</div>
                
                <div className="tm-test-info">
                  <h3 className="tm-test-title" title={t.title}>{t.title}</h3>
                  <span className="tm-test-meta">{t.level || 'General'} · {t.questions?.length || 0} questions</span>
                </div>

                <button 
                  className={`tm-status-pill ${t.published ? 'published' : 'draft'}`} 
                  onClick={() => togglePublish(t)}
                  title="Click to toggle status"
                >
                  {t.published ? 'Live' : 'Draft'}
                </button>
                
                <button className="tm-btn-action" onClick={() => startEdit(t)}>Edit</button>
                <button className="tm-btn-action delete" onClick={() => remove(t._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestManager;