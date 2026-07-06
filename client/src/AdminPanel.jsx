import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api/courses';

function AdminPanel({ onBack, onManageLessons }) {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating, an id = editing

  // form fields
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('chinese');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [glyph, setGlyph] = useState('');
  const [published, setPublished] = useState(false);

  const token = localStorage.getItem('token');

  const loadCourses = async () => {
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
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setLanguage('chinese');
    setLevel('');
    setDescription('');
    setGlyph('');
    setPublished(false);
  };

  // fill the form with a course's details for editing
  const startEdit = (c) => {
    setEditingId(c._id);
    setTitle(c.title);
    setLanguage(c.language);
    setLevel(c.level || '');
    setDescription(c.description || '');
    setGlyph(c.glyph || '');
    setPublished(c.published);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        body: JSON.stringify({ title, language, level, description, glyph, published }),
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

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Course manager</h1>

      {error && <p className="login-error">{error}</p>}

      <div className="admin-grid">
        {/* ----- Create / Edit form ----- */}
        <div className="admin-form">
          <h2>{editingId ? 'Edit course' : 'New course'}</h2>

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

          <label className="check-label">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            {editingId ? 'Published' : 'Publish immediately'}
          </label>

          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create course'}
          </button>

          {editingId && (
            <button className="nav-btn cancel-edit" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        {/* ----- Course list ----- */}
        <div className="admin-list">
          <h2>All courses ({courses.length})</h2>
          {courses.length === 0 && <p className="admin-empty">No courses yet — create your first one!</p>}
          {courses.map((c) => (
            <div className="admin-row" key={c._id}>
              <span className={`row-glyph ${c.language === 'chinese' ? 'zh' : 'ne'}`}>{c.glyph || '—'}</span>
              <div className="row-info">
                <strong>{c.title}</strong>
                <span>{c.language} · {c.level || 'no level'}</span>
              </div>
              <button className="nav-btn" onClick={() => startEdit(c)}>Edit</button>
              <button className="nav-btn" onClick={() => onManageLessons(c)}>Lessons</button>
              <button
                className={c.published ? 'pill pill-live' : 'pill pill-draft'}
                onClick={() => togglePublished(c)}
                title="Click to toggle"
              >
                {c.published ? 'Published' : 'Draft'}
              </button>
              <button className="row-delete" onClick={() => handleDelete(c._id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;