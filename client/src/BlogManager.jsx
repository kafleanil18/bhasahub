import { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

// max width (in pixels) for each size option
const SIZE_MAP = { small: 800, medium: 1400, large: 2000 };

// shrink an image File in the browser, return a smaller JPEG File
const resizeImage = (file, maxWidth) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load the image'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width); // only shrink, never enlarge
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
  const [size, setSize] = useState('medium');
  const [uploading, setUploading] = useState(false);

  const quillRef = useRef(null);

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
    setUploading(true);
    try {
      const maxWidth = SIZE_MAP[size] || 1400;
      const resized = await resizeImage(file, maxWidth);
      const fd = new FormData();
      fd.append('file', resized);
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (res.ok) setImage(data.url);
      else setError(data.error || 'Upload failed');
    } catch {
      setError('Could not process or upload the image');
    } finally {
      setUploading(false);
    }
  };

  // ----- inline image upload for the Quill editor (optimized to medium) -----
  const insertInlineImage = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const resized = await resizeImage(file, SIZE_MAP.medium);
        const fd = new FormData();
        fd.append('file', resized);
        const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Image upload failed'); return; }

        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', `${SERVER}${data.url}`);
        editor.setSelection(range.index + 1);
      } catch {
        setError('Could not process or upload the image');
      }
    };
  };

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: insertInlineImage,
      },
    },
  }), []);

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

        <label>Body</label>
        <div className="quill-wrap">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={body}
            onChange={setBody}
            modules={quillModules}
            placeholder="Write your post here..."
          />
        </div>

        <label>Cover image</label>

        {image && (
          <div style={{ marginBottom: 12 }}>
            <img
              src={`${SERVER}${image}`}
              alt="cover preview"
              style={{ width: '100%', borderRadius: 8, marginBottom: 8 }}
            />
            <button type="button" className="nav-btn" onClick={() => setImage('')}>
              Remove image
            </button>
          </div>
        )}

        <label style={{ display: 'block', marginBottom: 8 }}>
          Image size
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="small">Small — max 800px (smallest file)</option>
            <option value="medium">Medium — max 1400px</option>
            <option value="large">Large — max 2000px (best quality)</option>
          </select>
        </label>

        <input
          type="file"
          accept="image/*"
          onClick={(e) => { e.target.value = ''; }}
          onChange={(e) => uploadImage(e.target.files[0])}
        />
        {uploading && <p style={{ fontSize: 13, marginTop: 6 }}>Optimizing and uploading…</p>}

        <button className="btn-primary" onClick={save} style={{ marginTop: 16 }}>
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