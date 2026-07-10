import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function BlogManager({ user, onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState(user ? user.name : '');

  const load = async () => {
    try {
      const res = await fetch(`${API}/blogs/all`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setBlogs(data);
      else setError(data.error || 'Could not load posts');
    } catch {
      setError('Could not reach the server');
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setImage('');
    setAuthor(user ? user.name : '');
  };

  const startEdit = (b) => {
    setEditingId(b._id);
    setTitle(b.title);
    setBody(b.body || '');
    setImage(b.image || '');
    setAuthor(b.author || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (res.ok) setImage(data.url);
      else setError(data.error || 'Upload failed');
    } catch {
      setError('Could not reach the server');
    }
  };

  const save = async () => {
    setError('');
    if (!title.trim()) return setError('Title is required');
    const bodyData = { title, body, image, author };
    const res = await fetch(
      editingId ? `${API}/blogs/${editingId}` : `${API}/blogs`,
      { method: editingId ? 'PUT' : 'POST', headers: jsonHeaders, body: JSON.stringify(bodyData) }
    );
    if (res.ok) { reset(); load(); }
    else { const d = await res.json(); setError(d.error || 'Could not save'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`${API}/blogs/${id}`, { method: 'DELETE', headers: authHeaders });
    if (editingId === id) reset();
    load();
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Blog manager</h1>
      {error && <p className="login-error">{error}</p>}

      <div className="admin-form" style={{ maxWidth: 720, marginBottom: 32 }}>
        <h2>{editingId ? 'Edit post' : 'New post'}</h2>
        <label>Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
        </label>
        <label>Author
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
        </label>
        <label>Body
          <textarea rows="8" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your post here..." />
        </label>
        <label>Cover image
          <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files[0])} />
        </label>
        {image && <img src={`${SERVER}${image}`} alt="preview" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />}

        <button className="btn-primary" onClick={save}>
          {editingId ? 'Save changes' : 'Publish post'}
        </button>
        {editingId && <button className="nav-btn cancel-edit" onClick={reset}>Cancel edit</button>}
      </div>

      <div className="admin-list">
        <h2>All posts ({blogs.length})</h2>
        {blogs.length === 0 && <p className="admin-empty">No posts yet.</p>}
        {blogs.map((b) => (
          <div className="admin-row" key={b._id}>
            <div className="row-info">
              <strong>{b.title}</strong>
              <span>{b.author} · {new Date(b.createdAt).toLocaleDateString()}</span>
            </div>
            <button className="nav-btn" onClick={() => startEdit(b)}>Edit</button>
            <button className="row-delete" onClick={() => remove(b._id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BlogManager;