import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function SlideManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  const [slides, setSlides] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`${API}/slides/all`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setSlides(data);
      else setError(data.error || 'Could not load slides');
    } catch {
      setError('Could not reach the server');
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPdfUrl('');
    setUploading(false);
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setTitle(s.title);
    setDescription(s.description || '');
    setPdfUrl(s.pdfUrl || s.embedUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadPdf = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'PDF upload failed');
        return;
      }
      setPdfUrl(data.url);
    } catch {
      setError('Could not reach the server');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError('');
    if (!title.trim() || !pdfUrl.trim()) {
      return setError('Title and PDF are required');
    }
    const body = { title, description, pdfUrl };
    const res = await fetch(
      editingId ? `${API}/slides/${editingId}` : `${API}/slides`,
      { method: editingId ? 'PUT' : 'POST', headers: jsonHeaders, body: JSON.stringify(body) }
    );
    if (res.ok) { reset(); load(); }
    else { const d = await res.json(); setError(d.error || 'Could not save'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this slide?')) return;
    await fetch(`${API}/slides/${id}`, { method: 'DELETE', headers: authHeaders });
    if (editingId === id) reset();
    load();
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Slide manager</h1>
      <p className="course-desc">Upload a PDF for each slide set. The PDF will be stored on the server and shown in the slide viewer.</p>
      {error && <p className="login-error">{error}</p>}

      <div className="admin-form" style={{ maxWidth: 720, marginBottom: 32 }}>
        <h2>{editingId ? 'Edit slide' : 'Add slide'}</h2>
        <label>Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HSK 1 — Lesson 1 Slides" />
        </label>
        <label>Description (optional)
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        </label>
        <label>PDF file
          <input type="file" accept="application/pdf" onChange={(e) => uploadPdf(e.target.files[0])} />
        </label>
        {pdfUrl && (
          <p className="pdf-ok">
            ✓ PDF ready {pdfUrl.startsWith('http') ? '' : <a href={`${SERVER}${pdfUrl}`} target="_blank" rel="noreferrer">preview</a>}
          </p>
        )}
        {uploading && <p className="pdf-ok">Uploading PDF...</p>}
        <button className="btn-primary" onClick={save}>
          {editingId ? 'Save changes' : 'Add slide'}
        </button>
        {editingId && <button className="nav-btn cancel-edit" onClick={reset}>Cancel edit</button>}
      </div>

      <div className="admin-list">
        <h2>All slides ({slides.length})</h2>
        {slides.length === 0 && <p className="admin-empty">No slides yet.</p>}
        {slides.map((s) => (
          <div className="admin-row" key={s._id}>
            <div className="row-info">
              <strong>{s.title}</strong>
              <span>{s.description || 'No description'}</span>
              <span>{s.pdfUrl || s.embedUrl ? 'PDF attached' : 'No PDF attached'}</span>
            </div>
            <button className="nav-btn" onClick={() => startEdit(s)}>Edit</button>
            <button className="row-delete" onClick={() => remove(s._id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SlideManager;
