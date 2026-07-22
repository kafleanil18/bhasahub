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
          padding-top: 32px;
          padding-bottom: 80px;
        }

        .admin-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 20px;
        }

        .admin-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(42, 35, 32, 0.02);
        }
        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(42, 35, 32, 0.06);
          border-color: var(--mist);
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(46, 107, 87, 0.1);
          color: var(--jade);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .metric-icon.gold {
          background: rgba(201, 154, 60, 0.1);
          color: var(--gold);
        }
        .metric-icon.seal {
          background: rgba(200, 54, 42, 0.1);
          color: var(--seal);
        }

        .metric-details {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
        }

        .metric-label {
          font-size: 12px;
          color: var(--mist);
          font-weight: 600;
          margin-top: 4px;
        }

        /* Form styling */
        .admin-form {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(42, 35, 32, 0.02);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-form h2 {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink);
          border-bottom: 1px solid var(--line);
          padding-bottom: 12px;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-form-group label {
          font-size: 12px;
          font-weight: 700;
          color: var(--ink);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-form-group input,
        .admin-form-group select,
        .admin-form-group textarea {
          width: 100%;
          padding: 10px 14px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--paper);
          color: var(--ink);
          transition: all 0.2s ease;
        }

        .admin-form-group input:focus,
        .admin-form-group select:focus,
        .admin-form-group textarea:focus {
          outline: none;
          border-color: var(--jade);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        /* Upload zone */
        .admin-upload-zone {
          background: var(--paper);
          border: 2px dashed var(--line);
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          transition: border-color 0.2s ease;
          position: relative;
          cursor: pointer;
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
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .admin-upload-btn-wrap:hover {
          background: var(--line);
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
          margin-top: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .admin-img-preview {
          width: 100%;
          height: auto;
          display: block;
          max-height: 160px;
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
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: background 0.2s ease;
        }
        .admin-img-remove-btn:hover {
          background: #a6281e;
        }

        .check-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
        }
        .check-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--jade);
          cursor: pointer;
        }

        .btn-primary-studio {
          width: 100%;
          background-color: var(--jade);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          box-shadow: 0 4px 14px rgba(46, 107, 87, 0.2);
        }
        .btn-primary-studio:hover:not(:disabled) {
          background-color: #245444;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(46, 107, 87, 0.3);
        }
        .btn-primary-studio:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .cancel-edit {
          width: 100%;
          background-color: transparent;
          color: var(--mist);
          border: 1px solid var(--line);
          padding: 11px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          text-align: center;
          display: block;
          box-sizing: border-box;
          margin-top: 8px;
        }
        .cancel-edit:hover {
          background-color: var(--rice);
          color: var(--ink);
        }

        /* Course List Card Override */
        .admin-list {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(42, 35, 32, 0.02);
        }

        .admin-list h2 {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink);
          border-bottom: 1px solid var(--line);
          padding-bottom: 12px;
          margin: 0 0 16px;
        }

        .admin-list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .admin-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
          border-color: var(--jade);
        }

        .row-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .row-glyph {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          min-width: 48px;
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
          min-width: 0;
        }

        .row-info strong {
          font-family: 'Fraunces', serif;
          font-size: 15px;
          font-weight: 750;
          color: var(--ink);
          display: block;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .row-info span {
          font-size: 12px;
          font-weight: 600;
          color: var(--mist);
          text-transform: capitalize;
        }

        .row-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Status Pills */
        .pill {
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pill-live {
          background: rgba(46, 107, 87, 0.1);
          color: var(--jade);
          border-color: rgba(46, 107, 87, 0.2);
        }
        .pill-live:hover {
          background: var(--jade);
          color: #ffffff;
        }

        .pill-draft {
          background: rgba(122, 114, 102, 0.1);
          color: var(--mist);
          border-color: rgba(122, 114, 102, 0.15);
        }
        .pill-draft:hover {
          background: var(--mist);
          color: #ffffff;
        }

        .nav-btn-studio {
          background: var(--card);
          color: var(--ink);
          border: 1px solid var(--line);
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-btn-studio:hover {
          background: var(--rice);
          border-color: var(--mist);
        }

        .row-delete-studio {
          font-size: 12px;
          font-weight: 600;
          color: var(--seal);
          background: rgba(200, 54, 42, 0.05);
          border: 1px solid rgba(200, 54, 42, 0.1);
          padding: 6px 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .row-delete-studio:hover {
          background: var(--seal);
          color: #ffffff;
          border-color: var(--seal);
        }

        .admin-empty {
          color: var(--mist);
          font-size: 13px;
          font-style: italic;
          text-align: center;
          padding: 24px 0;
        }
      `}</style>

      <button className="btn-back-pill" onClick={onBack}>← Back to control panel</button>
      
      <div className="admin-title-row">
        <h1 style={{ margin: 0, marginTop: 12 }}>Course Studio</h1>
        <p className="um-subtitle">Manage path tracks, curriculum targets, and status.</p>
      </div>

      {error && <p className="login-error" style={{ marginBottom: 20 }}>{error}</p>}

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

          <div className="admin-form-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chinese for Beginners" />
          </div>

          <div className="admin-form-group">
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="chinese">Chinese</option>
              <option value="nepali">Nepali</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>Level</label>
            <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="HSK 1 · Beginner" />
          </div>

          <div className="admin-form-group">
            <label>Description</label>
            <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" />
          </div>

          <div className="admin-form-group">
            <label>Card glyph</label>
            <input value={glyph} onChange={(e) => setGlyph(e.target.value)} placeholder="你好 or नमस्ते" />
          </div>

          <div className="admin-form-group">
            <label>Course cover image</label>
            <div className="admin-upload-zone">
              <div className="admin-upload-btn-wrap">
                📤 Upload Cover Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadImage(e.target.files[0])}
                />
              </div>
            </div>
          </div>

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

          <label className="check-label" style={{ margin: '8px 0' }}>
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            {editingId ? 'Published & Active' : 'Publish immediately'}
          </label>

          <button className="btn-primary-studio" onClick={handleSave} disabled={saving}>
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
                <div className="row-left-group">
                  <span className={`row-glyph ${c.language === 'chinese' ? 'zh' : 'ne'}`}>
                    {c.glyph && c.glyph.trim().length > 0 && c.glyph.trim().length <= 2 
                      ? c.glyph 
                      : (c.language === 'chinese' ? '中' : 'ने')}
                  </span>
                  
                  <div className="row-info">
                    <strong>{c.title}</strong>
                    <span>{c.language} · {c.level || 'no level'}</span>
                  </div>
                </div>
                
                <div className="row-actions-group">
                  <button className="nav-btn-studio" onClick={() => startEdit(c)}>Edit</button>
                  <button className="nav-btn-studio" onClick={() => onManageLessons(c)}>Lessons</button>
                  
                  <button
                    className={c.published ? 'pill pill-live' : 'pill pill-draft'}
                    onClick={() => togglePublished(c)}
                    title="Click to toggle status"
                  >
                    {c.published ? 'Live' : 'Draft'}
                  </button>
                  
                  <button className="row-delete-studio" onClick={() => handleDelete(c._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    
  );
}

export default AdminPanel;