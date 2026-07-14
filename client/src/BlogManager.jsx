import { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

const SIZE_MAP = { small: 800, medium: 1400, large: 2000 };

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
    <section className="bm-dashboard">
      {/* Dynamic Styling injected directly to keep it self-contained */}
      <style>{`
        .bm-dashboard {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1f2937;
          background-color: #f9fafb;
          min-height: 100vh;
        }
        .bm-back-btn {
          background: none;
          border: none;
          color: #4f46e5;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          margin-bottom: 1.5rem;
          transition: color 0.2s;
        }
        .bm-back-btn:hover { color: #3730a3; }
        .bm-header {
          margin-bottom: 2.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
        }
        .bm-title { font-size: 2.25rem; font-weight: 800; color: #111827; margin: 0; }
        .bm-error {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          color: #991b1b;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }
        .bm-workspace {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        @media (min-width: 1024px) {
          .bm-workspace { grid-template-columns: 7fr 5fr; align-items: start; }
        }
        .bm-panel {
          background: #f3fbee;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #e5e7eb;
        }
        .bm-panel h2 { font-size: 1.5rem; font-weight: 700; margin-top: 0; margin-bottom: 1.5rem; color: #111827; }
        .bm-form-group { margin-bottom: 1.25rem; }
        .bm-label { display: block; font-size: 0.875rem; font-weight: 600; color: #4b5563; margin-bottom: 0.5rem; }
        .bm-input, .bm-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .bm-input:focus, .bm-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }
        .bm-quill-container { margin-bottom: 1.5rem; }
        .bm-quill-container .ql-toolbar { border-top-left-radius: 8px; border-top-right-radius: 8px; border-color: #d1d5db; background: #f3f4f6; }
        .bm-quill-container .ql-container { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-color: #d1d5db; font-size: 1rem; min-height: 250px; }
        .bm-image-section {
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .bm-preview-wrapper { position: relative; margin-bottom: 1rem; border-radius: 6px; overflow: hidden; }
        .bm-preview-img { width: 100%; height: auto; display: block; max-height: 220px; object-fit: cover; }
        .bm-remove-img-btn {
          position: absolute; top: 8px; right: 8px; background: rgba(239, 68, 68, 0.9);
          color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: 500;
        }
        .bm-remove-img-btn:hover { background: #dc2626; }
        .bm-upload-controls { display: grid; grid-template-columns: 1fr 120px; gap: 0.75rem; align-items: center; margin-top: 0.5rem; }
        .bm-file-input { font-size: 0.875rem; color: #6b7280; }
        .bm-uploading-txt { font-size: 0.875rem; color: #4f46e5; font-weight: 500; margin-top: 0.5rem; }
        .bm-actions { display: flex; gap: 0.75rem; margin-top: 1.75rem; }
        .bm-btn-primary {
          background-color: #4f46e5; color: white; border: none; padding: 0.75rem 1.5rem;
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; font-size: 1rem;
        }
        .bm-btn-primary:hover { background-color: #4338ca; }
        .bm-btn-secondary {
          background-color: white; color: #4b5563; border: 1px solid #d1d5db; padding: 0.75rem 1.5rem;
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; font-size: 1rem;
        }
        .bm-btn-secondary:hover { background-color: #f3f4f6; border-color: #9ca3af; }
        .bm-post-list { display: flex; flex-direction: column; gap: 1rem; }
        .bm-post-card {
          border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; display: flex;
          justify-content: space-between; align-items: center; background: #ffffff; transition: box-shadow 0.2s;
        }
        .bm-post-card:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
        .bm-post-info { display: flex; flex-direction: column; gap: 0.25rem; max-width: 70%; }
        .bm-post-title { font-weight: 600; color: #111827; font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bm-post-meta { font-size: 0.85rem; color: #6b7280; }
        .bm-list-actions { display: flex; gap: 0.5rem; }
        .bm-btn-sm-edit {
          background: #f3f4f6; color: #374151; border: none; padding: 6px 12px; border-radius: 6px;
          font-size: 0.85rem; font-weight: 500; cursor: pointer;
        }
        .bm-btn-sm-edit:hover { background: #e5e7eb; color: #111827; }
        .bm-btn-sm-del {
          background: #fff5f5; color: #c53030; border: none; padding: 6px 12px; border-radius: 6px;
          font-size: 0.85rem; font-weight: 500; cursor: pointer;
        }
        .bm-btn-sm-del:hover { background: #fed7d7; }
        .bm-empty-state { text-align: center; color: #9ca3af; padding: 3rem 1rem; font-style: italic; }
      `}</style>

      <button className="bm-back-btn" onClick={onBack}>← Back to home</button>
      
      <div className="bm-header">
        <h1 className="bm-title">Blog Manager</h1>
      </div>

      {error && <div className="bm-error">{error}</div>}

      <div className="bm-workspace">
        {/* Left Side: Editor Panel */}
        <div className="bm-panel">
          <h2>{editingId ? 'Edit Post Workspace' : 'Create New Post'}</h2>
          
          <div className="bm-form-group">
            <label className="bm-label">Post Title</label>
            <input 
              className="bm-input" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. 10 Essential Design Rules" 
            />
          </div>

          <div className="bm-form-group">
            <label className="bm-label">Author Name</label>
            <input 
              className="bm-input" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)} 
              placeholder="Your name" 
            />
          </div>

          <div className="bm-form-group">
            <label className="bm-label">Content Body</label>
            <div className="bm-quill-container">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={body}
                onChange={setBody}
                modules={quillModules}
                placeholder="Share your insights here..."
              />
            </div>
          </div>

          <div className="bm-form-group">
            <label className="bm-label">Featured Cover Image</label>
            <div className="bm-image-section">
              {image && (
                <div className="bm-preview-wrapper">
                  <img src={`${SERVER}${image}`} alt="Featured preview" className="bm-preview-img" />
                  <button type="button" className="bm-remove-img-btn" onClick={() => setImage('')}>Remove</button>
                </div>
              )}
              
              <label className="bm-label" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {image ? 'Replace current image' : 'Upload an image asset'}
              </label>
              
              <div className="bm-upload-controls">
                <input
                  type="file"
                  accept="image/*"
                  className="bm-file-input"
                  onClick={(e) => { e.target.value = ''; }}
                  onChange={(e) => uploadImage(e.target.files[0])}
                />
                <select className="bm-select" value={size} onChange={(e) => setSize(e.target.value)}>
                  <option value="small">Small (800px)</option>
                  <option value="medium">Medium (1400px)</option>
                  <option value="large">Large (2000px)</option>
                </select>
              </div>
              {uploading && <p className="bm-uploading-txt">Optimizing & uploading canvas asset...</p>}
            </div>
          </div>

          <div className="bm-actions">
            <button className="bm-btn-primary" onClick={save}>
              {editingId ? 'Save Configuration' : 'Publish Article'}
            </button>
            {editingId && <button className="bm-btn-secondary" onClick={reset}>Cancel Edit</button>}
          </div>
        </div>

        {/* Right Side: Dashboard Archive */}
        <div className="bm-panel">
          <h2>All Posts ({blogs.length})</h2>
          <div className="bm-post-list">
            {blogs.length === 0 && <p className="bm-empty-state">No articles filed yet.</p>}
            {blogs.map((b) => (
              <div className="bm-post-card" key={b._id}>
                <div className="bm-post-info">
                  <span className="bm-post-title" title={b.title}>{b.title}</span>
                  <span className="bm-post-meta">{b.author || 'Anonymous'} · {new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="bm-list-actions">
                  <button className="bm-btn-sm-edit" onClick={() => startEdit(b)}>Edit</button>
                  <button className="bm-btn-sm-del" onClick={() => remove(b._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BlogManager;