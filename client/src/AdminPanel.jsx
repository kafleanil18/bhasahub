import { useState, useEffect, useMemo, useCallback } from 'react';

const API = window.API_BASE_URL + '/api/courses';

function AdminPanel({ onBack, onManageLessons }) {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // form fields
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('chinese');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [glyph, setGlyph] = useState('');
  const [image, setImage] = useState('');
  const [published, setPublished] = useState(false);

  const token = localStorage.getItem('token');

  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch(`${API}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load courses');
      } else {
        setCourses(data);
      }
    } catch {
      setError('Could not reach the server');
    }
  }, [token]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setLanguage('chinese');
    setLevel('');
    setDescription('');
    setGlyph('');
    setImage('');
    setPublished(false);
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setTitle(c.title);
    setLanguage(c.language);
    setLevel(c.level || '');
    setDescription(c.description || '');
    setGlyph(c.glyph || '');
    setImage(c.image || '');
    setPublished(c.published);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(window.API_BASE_URL + '/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setImage(data.url);
      } else {
        setError(data.error || 'Image upload failed');
      }
    } catch {
      setError('Could not reach the server');
    }
  };

  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    try {
      const isEditing = editingId !== null;
      const res = await fetch(isEditing ? `${API}/${editingId}` : API, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, language, level, description, glyph, image, published }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save course');
      } else {
        resetForm();
        loadCourses();
      }
    } catch {
      setError('Could not reach the server');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (editingId === id) resetForm();
        loadCourses();
      }
    } catch {
      setError('Could not reach the server');
    }
  };

  const togglePublished = async (course) => {
    try {
      const res = await fetch(`${API}/${course._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !course.published }),
      });
      if (res.ok) loadCourses();
    } catch {
      setError('Could not reach the server');
    }
  };

  // Metrics details
  const stats = useMemo(() => {
    const total = courses.length;
    const chinese = courses.filter((c) => c.language === 'chinese').length;
    const nepali = courses.filter((c) => c.language === 'nepali').length;
    return { total, chinese, nepali };
  }, [courses]);

  return (
    <section className="admin container">
      {/* Dynamic Styling injected directly to customize layout safely */}
      <style>{`
        /* Overriding standard styles with premium designs */
        .admin.container {
          padding-top: 40px;
          padding-bottom: 80px;
        }

        .admin-title-row {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--line);
          padding-bottom: 1.5rem;
        }

        .admin-title-row h1 {
          font-family: 'Fraunces', serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: var(--ink);
          margin: 0;
        }

        .admin-title-row p {
          color: var(--mist);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        /* Metrics cards */
        .admin-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .metric-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 12px rgba(42, 35, 32, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
        }

        .metric-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .metric-icon.gold {
          background: rgba(201, 154, 60, 0.08);
          color: var(--gold);
        }

        .metric-icon.seal {
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal);
        }

        .metric-details {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
        }

        .metric-label {
          font-size: 0.8rem;
          color: var(--mist);
          font-weight: 500;
          margin-top: 0.25rem;
        }

        /* Clean wrapper layout */
        .admin-form,
        .admin-list {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 6px 20px rgba(42, 35, 32, 0.02);
        }

        .admin-form h2,
        .admin-list h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--line);
          padding-bottom: 0.75rem;
        }

        .admin-form label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-form input,
        .admin-form select,
        .admin-form textarea {
          display: block;
          width: 100%;
          margin-top: 6px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          font-family: 'Inter', sans-serif;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--paper);
          color: var(--ink);
          transition: all 0.2s ease;
        }

        .admin-form input:focus,
        .admin-form select:focus,
        .admin-form textarea:focus {
          outline: none;
          border-color: var(--jade);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        /* Inline upload styles */
        .admin-upload-zone {
          background: var(--paper);
          border: 2px dashed var(--line);
          border-radius: 10px;
          padding: 1rem;
          text-align: center;
          margin-top: 6px;
          transition: border-color 0.2s;
          position: relative;
        }
        .admin-upload-zone:hover {
          border-color: var(--jade);
        }
        .admin-upload-btn-wrap {
          position: relative;
          overflow: hidden;
          display: inline-block;
          background: var(--rice);
          color: var(--ink);
          border: 1px solid var(--line);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .admin-upload-btn-wrap input[type=file] {
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          cursor: pointer;
          font-size: 100px;
        }

        .admin-img-preview-card {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--line);
          position: relative;
        }
        .admin-img-preview {
          width: 100%;
          height: auto;
          display: block;
          max-height: 150px;
          object-fit: cover;
        }
        .admin-img-remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--seal);
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          cursor: pointer;
          font-weight: 600;
        }

        .check-label {
          display: flex !important;
          align-items: center;
          gap: 8px;
          margin-top: 1.25rem;
          cursor: pointer;
          user-select: none;
        }
        .check-label input {
          width: 18px !important;
          height: 18px !important;
          accent-color: var(--jade);
          margin-top: 0 !important;
          cursor: pointer;
        }

        .admin-form button.btn-primary {
          width: 100%;
          background-color: var(--jade);
          color: white;
          border: none;
          padding: 0.85rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          box-shadow: 0 4px 14px rgba(46, 107, 87, 0.2);
        }
        .admin-form button.btn-primary:hover:not(:disabled) {
          background-color: #245444;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(46, 107, 87, 0.3);
        }
        .admin-form button.btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .cancel-edit {
          width: 100%;
          background-color: transparent;
          color: var(--mist);
          border: 1px solid var(--line);
          padding: 0.85rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
          margin-top: 0.75rem;
          text-align: center;
          display: block;
          box-sizing: border-box;
        }
        .cancel-edit:hover {
          background-color: var(--rice);
          color: var(--ink);
        }

        /* Course List Card Override */
        .admin-list-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .admin-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #ffffff;
          margin-bottom: 0px; /* Reset original margin */
          transition: all 0.2s ease;
        }

        .admin-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
          border-color: var(--jade);
        }

        .row-glyph {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          min-width: 52px;
          flex-shrink: 0;
          border: 1px solid var(--line);
        }

        .row-glyph.zh {
          background: linear-gradient(135deg, rgba(46, 107, 87, 0.08) 0%, rgba(201, 154, 60, 0.15) 100%);
          color: var(--jade);
          font-family: 'Noto Serif SC', serif;
        }

        .row-glyph.ne {
          background: linear-gradient(135deg, rgba(200, 54, 42, 0.08) 0%, rgba(122, 114, 102, 0.15) 100%);
          color: var(--seal);
          font-family: 'Noto Serif Devanagari', serif;
        }

        .row-info {
          flex-grow: 1;
          min-width: 0;
        }

        .row-info strong {
          font-family: 'Fraunces', serif;
          font-size: 1.1rem;
          font-weight: 750;
          color: var(--ink);
          display: block;
          margin-bottom: 0.15rem;
        }

        .row-info span {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--mist);
          text-transform: capitalize;
        }

        /* Status Pills */
        .pill {
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
        }

        .pill-live {
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade);
          border-color: rgba(46, 107, 87, 0.2);
        }
        .pill-live:hover {
          background: var(--jade);
          color: #ffffff;
        }

        .pill-draft {
          background: rgba(122, 114, 102, 0.08);
          color: var(--mist);
          border-color: rgba(122, 114, 102, 0.15);
        }
        .pill-draft:hover {
          background: var(--mist);
          color: #ffffff;
        }

        .nav-btn {
          background: var(--paper);
          color: var(--ink);
          border: 1px solid var(--line);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .nav-btn:hover {
          background: var(--rice);
          border-color: var(--mist);
        }

        .row-delete {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--seal);
          background: rgba(200, 54, 42, 0.04);
          border: 1px solid rgba(200, 54, 42, 0.08);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          text-align: center;
        }
        .row-delete:hover {
          background: rgba(200, 54, 42, 0.08);
          border-color: var(--seal);
          text-decoration: none;
        }
      `}</style>

      <button className="back-btn" onClick={onBack}>← Back to home</button>
      
      <div className="admin-title-row">
        <h1>Course Studio</h1>
        <p>Manage path tracks, curriculum targets, and status</p>
      </div>

      {error && <p className="login-error">{error}</p>}

      {/* Metrics Section */}
      <div className="admin-metrics">
        <div className="metric-card">
          <div className="metric-icon">📚</div>
          <div className="metric-details">
            <span className="metric-value">{stats.total}</span>
            <span className="metric-label">Total Paths</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon gold">语</div>
          <div className="metric-details">
            <span className="metric-value">{stats.chinese}</span>
            <span className="metric-label">Chinese Paths</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon seal">ने</div>
          <div className="metric-details">
            <span className="metric-value">{stats.nepali}</span>
            <span className="metric-label">Nepali Paths</span>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        {/* ----- Create / Edit form ----- */}
        <div className="admin-form">
          <h2>{editingId ? 'Edit path details' : 'New curriculum path'}</h2>

          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chinese for Beginners" />
          </label>

          <label>
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="chinese">Chinese</option>
              <option value="nepali">Nepali</option>
            </select>
          </label>

          <label>
            Level
            <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="HSK 1 · Beginner" />
          </label>

          <label>
            Description
            <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" />
          </label>

          <label>
            Card glyph
            <input value={glyph} onChange={(e) => setGlyph(e.target.value)} placeholder="你好 or नमस्ते" />
          </label>

          <label>
            Course image
            <div className="admin-upload-zone">
              <div className="admin-upload-btn-wrap">
                Upload Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadImage(e.target.files[0])}
                />
              </div>
            </div>
          </label>

          {image && (
            <div className="admin-img-preview-card">
              <img
                src={`${window.API_BASE_URL}${image}`}
                alt="Course preview"
                className="admin-img-preview"
              />
              <button type="button" className="admin-img-remove-btn" onClick={() => setImage('')}>Remove</button>
            </div>
          )}

          <label className="check-label">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            {editingId ? 'Published & Active' : 'Publish immediately'}
          </label>

          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create course'}
          </button>

          {editingId && (
            <button className="cancel-edit" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        {/* ----- Course list ----- */}
        <div className="admin-list">
          <h2>All Registry Paths ({courses.length})</h2>
          {courses.length === 0 && <p className="admin-empty">No courses yet — create your first one!</p>}
          
          <div className="admin-list-container">
            {courses.map((c) => (
              <div className="admin-row" key={c._id}>
                <span className={`row-glyph ${c.language === 'chinese' ? 'zh' : 'ne'}`}>
                  {c.glyph && c.glyph.trim().length > 0 && c.glyph.trim().length <= 2 
                    ? c.glyph 
                    : (c.language === 'chinese' ? '中' : 'ने')}
                </span>
                
                <div className="row-info">
                  <strong>{c.title}</strong>
                  <span>{c.language} · {c.level || 'no level'}</span>
                </div>
                
                <button className="nav-btn" onClick={() => startEdit(c)}>Edit</button>
                <button className="nav-btn" onClick={() => onManageLessons(c)}>Lessons</button>
                
                <button
                  className={c.published ? 'pill pill-live' : 'pill pill-draft'}
                  onClick={() => togglePublished(c)}
                  title="Click to toggle status"
                >
                  {c.published ? 'Live' : 'Draft'}
                </button>
                
                <button className="row-delete" onClick={() => handleDelete(c._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;