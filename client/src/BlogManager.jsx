import { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import DOMPurify from 'dompurify';
import 'react-quill-new/dist/quill.snow.css';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

const resolveImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/images/')) return img;
  const base = window.API_BASE_URL || '';
  return img.startsWith('/') ? `${base}${img}` : `${base}/${img}`;
};

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
  const [category, setCategory] = useState('Language Tips');
  const [published, setPublished] = useState(true);
  const [size, setSize] = useState('medium');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'

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
    setCategory('Language Tips');
    setPublished(true);
    setActiveTab('write');
  };

  const startEdit = (b) => {
    setEditingId(b._id);
    setTitle(b.title);
    setBody(b.body || '');
    setImage(b.image || '');
    setAuthor(b.author || '');
    setCategory(b.category || 'Language Tips');
    setPublished(b.published !== false);
    setActiveTab('write');
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
    const bodyData = { title, body, image, author, category, published };
    const res = await fetch(
      editingId ? `${API}/blogs/${editingId}` : `${API}/blogs`,
      { method: editingId ? 'PUT' : 'POST', headers: jsonHeaders, body: JSON.stringify(bodyData) }
    );
    if (res.ok) { reset(); load(); }
    else { const d = await res.json(); setError(d.error || 'Could not save'); }
  };

  const togglePublish = async (b) => {
    try {
      const res = await fetch(`${API}/blogs/${b._id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ published: !b.published })
      });
      if (res.ok) load();
    } catch {
      setError('Could not update status');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`${API}/blogs/${id}`, { method: 'DELETE', headers: authHeaders });
    if (editingId === id) reset();
    load();
  };

  // Helper calculations
  const stripTags = (html) => (html || '').replace(/<[^>]+>/g, '');
  
  const wordCount = useMemo(() => {
    const raw = stripTags(body);
    return raw ? raw.trim().split(/\s+/).filter(Boolean).length : 0;
  }, [body]);

  const readTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const getCategory = (t, b) => {
    const text = `${t} ${b}`.toLowerCase();
    if (text.includes('pinyin') || text.includes('pronounce') || text.includes('tone')) return 'Pronunciation';
    if (text.includes('character') || text.includes('stroke') || text.includes('write')) return 'Characters';
    if (text.includes('nepali') || text.includes('nepal') || text.includes('devanagari')) return 'Nepali';
    if (text.includes('hsk') || text.includes('exam') || text.includes('test')) return 'HSK Prep';
    if (text.includes('grammar') || text.includes('sentence') || text.includes('structure')) return 'Grammar';
    if (text.includes('culture') || text.includes('festival') || text.includes('food') || text.includes('history')) return 'Culture';
    return 'Language Tips';
  };

  const currentCategory = useMemo(() => {
    return getCategory(title, body);
  }, [title, body]);

  const initials = useMemo(() => {
    if (!author) return 'E';
    return author[0].toUpperCase();
  }, [author]);

  if (user && user.role !== 'superadmin') {
    return (
      <section style={{ padding: '80px 20px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, marginBottom: 12 }}>Access Denied</h2>
        <p style={{ color: 'var(--mist)', fontSize: 15, marginBottom: 24 }}>
          Blog management (creating, editing, publishing, and deleting articles) is restricted exclusively to Super Administrators.
        </p>
        <button className="bm-back-btn" onClick={onBack}>← Return to Dashboard</button>
      </section>
    );
  }

  return (
    <section className="bm-dashboard">
      <style>{`
        .bm-dashboard {
          max-width: 1240px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--ink, #2a2320);
          background-color: var(--paper, #faf6ec);
          min-height: 100vh;
        }

        .bm-back-btn {
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
        .bm-back-btn:hover {
          background: rgba(46, 107, 87, 0.08);
          border-color: var(--jade, #2e6b57);
        }

        .bm-header {
          margin-bottom: 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 1.5rem;
        }

        .bm-title-container {
          text-align: left;
        }

        .bm-title-container h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--ink, #2a2320);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .bm-title-container p {
          color: var(--mist, #7a7266);
          margin-top: 0.25rem;
          font-size: 0.95rem;
        }

        /* Metrics Grid */
        .bm-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .bm-metric-card {
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
        .bm-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
        }

        .bm-metric-icon {
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

        .bm-metric-icon.gold {
          background: rgba(201, 154, 60, 0.08);
          color: var(--gold, #c99a3c);
        }

        .bm-metric-icon.seal {
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal, #c8362a);
        }

        .bm-metric-details {
          display: flex;
          flex-direction: column;
        }

        .bm-metric-value {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          line-height: 1.1;
        }

        .bm-metric-label {
          font-size: 0.8rem;
          color: var(--mist, #7a7266);
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .bm-error {
          background-color: rgba(200, 54, 42, 0.05);
          border-left: 4px solid var(--seal, #c8362a);
          color: var(--seal, #c8362a);
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .bm-workspace {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        @media (min-width: 1024px) {
          .bm-workspace {
            grid-template-columns: 7fr 5fr;
            align-items: start;
          }
        }

        .bm-panel {
          background: var(--card, #fffdf8);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(42, 35, 32, 0.03);
          border: 1px solid var(--line, #e6dcc6);
        }

        .bm-panel h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.6rem;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: var(--ink, #2a2320);
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 0.75rem;
        }

        /* Tabs Navigation */
        .bm-tabs-nav {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 0.5rem;
        }

        .bm-tab-btn {
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

        .bm-tab-btn:hover {
          background: rgba(42, 35, 32, 0.04);
          color: var(--ink, #2a2320);
        }

        .bm-tab-btn.active {
          background: var(--jade, #2e6b57);
          color: #ffffff;
        }

        /* Form styling */
        .bm-form-group {
          margin-bottom: 1.5rem;
        }

        .bm-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bm-input {
          width: 100%;
          padding: 0.85rem 1.2rem;
          border: 1px solid var(--line, #e6dcc6);
          background: var(--paper, #faf6ec);
          border-radius: 10px;
          font-size: 1rem;
          color: var(--ink, #2a2320);
          box-sizing: border-box;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .bm-input:focus {
          outline: none;
          border-color: var(--jade, #2e6b57);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        .bm-quill-container {
          margin-bottom: 1.5rem;
        }

        .bm-quill-container .ql-toolbar {
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          border-color: var(--line, #e6dcc6);
          background: var(--paper, #faf6ec);
          padding: 8px 12px;
        }

        .bm-quill-container .ql-container {
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          border-color: var(--line, #e6dcc6);
          background: #ffffff;
          font-size: 1rem;
          min-height: 320px;
          font-family: 'Inter', sans-serif;
        }

        /* Modern Image upload zone */
        .bm-image-dropzone {
          background: var(--paper, #faf6ec);
          border: 2px dashed var(--line, #e6dcc6);
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
        }

        .bm-image-dropzone:hover {
          border-color: var(--jade, #2e6b57);
          background: rgba(46, 107, 87, 0.02);
        }

        .bm-preview-wrapper {
          position: relative;
          margin-bottom: 1.25rem;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
          border: 1px solid var(--line, #e6dcc6);
        }

        .bm-preview-img {
          width: 100%;
          height: auto;
          display: block;
          max-height: 240px;
          object-fit: cover;
        }

        .bm-remove-img-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--seal, #c8362a);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
          box-shadow: 0 4px 10px rgba(200, 54, 42, 0.2);
        }
        .bm-remove-img-btn:hover {
          background: #a8271d;
        }

        .bm-upload-icon {
          font-size: 2.25rem;
          color: var(--mist, #7a7266);
          margin-bottom: 0.75rem;
        }

        .bm-upload-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          margin-top: 1rem;
        }

        .bm-file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
        }

        .bm-btn-upload-file {
          background: var(--rice, #f3ebd8);
          color: var(--ink, #2a2320);
          border: 1px solid var(--line, #e6dcc6);
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bm-file-input-wrapper:hover .bm-btn-upload-file {
          background: var(--line, #e6dcc6);
        }

        .bm-file-input-wrapper input[type=file] {
          font-size: 100px;
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          cursor: pointer;
        }

        .bm-select {
          padding: 0.6rem 1.2rem;
          border: 1px solid var(--line, #e6dcc6);
          background: #ffffff;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--ink, #2a2320);
          cursor: pointer;
          outline: none;
        }
        .bm-select:focus {
          border-color: var(--jade, #2e6b57);
        }

        .bm-uploading-txt {
          font-size: 0.85rem;
          color: var(--jade, #2e6b57);
          font-weight: 600;
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .bm-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .bm-btn-primary {
          background-color: var(--jade, #2e6b57);
          color: white;
          border: none;
          padding: 0.85rem 1.75rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
          box-shadow: 0 4px 14px rgba(46, 107, 87, 0.2);
        }
        .bm-btn-primary:hover {
          background-color: #245444;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(46, 107, 87, 0.3);
        }

        .bm-btn-secondary {
          background-color: transparent;
          color: var(--mist, #7a7266);
          border: 1px solid var(--line, #e6dcc6);
          padding: 0.85rem 1.75rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }
        .bm-btn-secondary:hover {
          background-color: var(--rice, #f3ebd8);
          color: var(--ink, #2a2320);
        }

        /* Live Preview Simulator */
        .bm-preview-simulator {
          padding: 1rem 0;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
          border: 1px solid var(--line, #e6dcc6);
          padding: 2rem;
        }

        .bm-sim-label {
          display: inline-block;
          background: var(--jade, #2e6b57);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1rem;
        }

        .bm-sim-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 750;
          color: var(--ink, #2a2320);
          line-height: 1.25;
          margin: 0.5rem 0 1.5rem;
        }

        .bm-sim-author-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-top: 1px solid var(--line, #e6dcc6);
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding: 0.85rem 0;
          margin-bottom: 1.5rem;
        }

        .bm-sim-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--jade, #2e6b57) 0%, var(--gold, #c99a3c) 100%);
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bm-sim-author-details {
          display: flex;
          flex-direction: column;
        }

        .bm-sim-author-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
        }

        .bm-sim-meta-date {
          font-size: 0.75rem;
          color: var(--mist, #7a7266);
        }

        .bm-sim-cover-wrapper {
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 1.75rem;
          max-height: 320px;
        }
        .bm-sim-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .bm-sim-body {
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--ink, #2a2320);
        }

        .bm-sim-body p {
          margin-bottom: 1.5rem;
        }

        .bm-sim-body h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.6rem;
          font-weight: 700;
          margin-top: 2.2rem;
          margin-bottom: 1rem;
        }

        .bm-sim-placeholder {
          text-align: center;
          color: var(--mist, #7a7266);
          padding: 4rem 1rem;
          font-style: italic;
          font-size: 1.05rem;
        }

        /* Post Cards in list */
        .bm-post-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .bm-post-card {
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          gap: 1rem;
          background: #ffffff;
          transition: all 0.2s ease;
          align-items: center;
        }

        .bm-post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(42, 35, 32, 0.03);
          border-color: var(--jade, #2e6b57);
        }

        .bm-post-thumbnail {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          background: var(--paper, #faf6ec);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          border: 1px solid var(--line, #e6dcc6);
        }

        .bm-post-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex-grow: 1;
          min-width: 0;
        }

        .bm-post-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          color: var(--ink, #2a2320);
          font-size: 1.05rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bm-post-meta {
          font-size: 0.8rem;
          color: var(--mist, #7a7266);
        }

        .bm-list-actions {
          display: flex;
          gap: 0.4rem;
          flex-shrink: 0;
        }

        .bm-btn-sm-edit {
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
        .bm-btn-sm-edit:hover {
          background: var(--rice, #f3ebd8);
        }

        .bm-btn-sm-del {
          background: rgba(200, 54, 42, 0.05);
          color: var(--seal, #c8362a);
          border: 1px solid rgba(200, 54, 42, 0.1);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bm-btn-sm-del:hover {
          background: rgba(200, 54, 42, 0.1);
        }

        .bm-empty-state {
          text-align: center;
          color: var(--mist, #7a7266);
          padding: 3rem 1rem;
          font-style: italic;
        }
      `}</style>

      <button className="bm-back-btn" onClick={onBack}>← Back to home</button>
      
      <div className="bm-header">
        <div className="bm-title-container">
          <h1>Insights Studio</h1>
          <p>Draft, design, and manage your BhashaHub articles</p>
        </div>
      </div>

      {error && <div className="bm-error">{error}</div>}

      {/* Statistics Section */}
      <div className="bm-metrics-grid">
        <div className="bm-metric-card">
          <div className="bm-metric-icon">📝</div>
          <div className="bm-metric-details">
            <span className="bm-metric-value">{blogs.length}</span>
            <span className="bm-metric-label">Total Articles</span>
          </div>
        </div>
        <div className="bm-metric-card">
          <div className="bm-metric-icon gold">🖋</div>
          <div className="bm-metric-details">
            <span className="bm-metric-value">{wordCount}</span>
            <span className="bm-metric-label">Words in Editor</span>
          </div>
        </div>
        <div className="bm-metric-card">
          <div className="bm-metric-icon seal">⏱</div>
          <div className="bm-metric-details">
            <span className="bm-metric-value">{readTime} min</span>
            <span className="bm-metric-label">Est. Read Time</span>
          </div>
        </div>
      </div>

      <div className="bm-workspace">
        {/* Left Side: Editor & Preview Tab Panel */}
        <div className="bm-panel">
          <div className="bm-tabs-nav">
            <button 
              className={`bm-tab-btn ${activeTab === 'write' ? 'active' : ''}`}
              onClick={() => setActiveTab('write')}
            >
              ✍️ Write Editor
            </button>
            <button 
              className={`bm-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              👁 Live Preview
            </button>
          </div>

          {activeTab === 'write' ? (
            <div className="bm-editor-pane">
              <div className="bm-form-group">
                <label className="bm-label">Post Title</label>
                <input 
                  className="bm-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Debunking Tones in Mandarin Chinese" 
                />
              </div>

              <div className="bm-form-group">
                <label className="bm-label">Author Name</label>
                <input 
                  className="bm-input" 
                  value={author} 
                  onChange={(e) => setAuthor(e.target.value)} 
                  placeholder="e.g. Anil" 
                />
              </div>

              <div className="bm-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="bm-label">Category</label>
                  <select 
                    className="bm-input" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Pronunciation">Pronunciation</option>
                    <option value="Characters">Characters</option>
                    <option value="Nepali">Nepali</option>
                    <option value="HSK Prep">HSK Prep</option>
                    <option value="Grammar">Grammar</option>
                    <option value="Culture">Culture</option>
                    <option value="Language Tips">Language Tips</option>
                  </select>
                </div>

                <div>
                  <label className="bm-label">Visibility Status</label>
                  <select 
                    className="bm-input" 
                    value={published ? 'published' : 'draft'} 
                    onChange={(e) => setPublished(e.target.value === 'published')}
                  >
                    <option value="published">🟢 Published (Live on Blog)</option>
                    <option value="draft">🟡 Draft (Hidden from Public)</option>
                  </select>
                </div>
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
                    placeholder="Share your insights here... Format headers with H2 or H3."
                  />
                </div>
              </div>

              <div className="bm-form-group">
                <label className="bm-label">Featured Cover Image</label>
                <div className="bm-image-dropzone">
                  {image ? (
                    <div className="bm-preview-wrapper">
                      <img src={resolveImageUrl(image)} alt="Featured preview" className="bm-preview-img" />
                      <button type="button" className="bm-remove-img-btn" onClick={() => setImage('')}>Remove Cover</button>
                    </div>
                  ) : (
                    <div className="bm-upload-icon">🖼</div>
                  )}
                  
                  <p style={{ fontSize: '0.85rem', color: 'var(--mist)', fontWeight: 600, margin: '0.5rem 0' }}>
                    {image ? 'Change cover image asset' : 'Drag & drop or browse to add an image'}
                  </p>
                  
                  <div className="bm-upload-controls">
                    <div className="bm-file-input-wrapper">
                      <button className="bm-btn-upload-file">Upload Image</button>
                      <input
                        type="file"
                        accept="image/*"
                        onClick={(e) => { e.target.value = ''; }}
                        onChange={(e) => uploadImage(e.target.files[0])}
                      />
                    </div>
                    <select className="bm-select" value={size} onChange={(e) => setSize(e.target.value)}>
                      <option value="small">Optimize: Small (800px)</option>
                      <option value="medium">Optimize: Medium (1400px)</option>
                      <option value="large">Optimize: Large (2000px)</option>
                    </select>
                  </div>
                  {uploading && (
                    <p className="bm-uploading-txt">
                      <span className="spinner">⏳</span> Resizing and processing asset...
                    </p>
                  )}
                </div>
              </div>

              <div className="bm-actions">
                <button className="bm-btn-primary" onClick={save}>
                  {editingId ? 'Save Changes' : 'Publish Article'}
                </button>
                {editingId && <button className="bm-btn-secondary" onClick={reset}>Cancel Edit</button>}
              </div>
            </div>
          ) : (
            <div className="bm-preview-simulator">
              {title.trim() || body.trim() || image ? (
                <div>
                  <span className="bm-sim-label">{currentCategory}</span>
                  <h1 className="bm-sim-title">{title || 'Untitled Post'}</h1>
                  
                  <div className="bm-sim-author-card">
                    <div className="bm-sim-avatar">
                      {initials}
                    </div>
                    <div className="bm-sim-author-details">
                      <span className="bm-sim-author-name">{author || 'Anonymous'}</span>
                      <span className="bm-sim-meta-date">
                        {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · ⏱ {readTime} min read
                      </span>
                    </div>
                  </div>

                  {image && (
                    <div className="bm-sim-cover-wrapper">
                      <img src={resolveImageUrl(image)} alt="Cover" className="bm-sim-cover-img" />
                    </div>
                  )}

                  <div className="bm-sim-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body || '<p><i>No content written yet.</i></p>') }} />
                </div>
              ) : (
                <div className="bm-sim-placeholder">
                  <p>Type a title, upload a cover, or start writing content to see a live visual mockup of your article here.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Dashboard Archive */}
        <div className="bm-panel">
          <h2>All Articles Archive ({blogs.length})</h2>
          <div className="bm-post-list">
            {blogs.length === 0 && <p className="bm-empty-state">No articles in archive.</p>}
            {blogs.map((b) => (
              <div className="bm-post-card" key={b._id}>
                {b.image ? (
                  <img src={resolveImageUrl(b.image)} alt="" className="bm-post-thumbnail" />
                ) : (
                  <div className="bm-post-thumbnail">📝</div>
                )}
                <div className="bm-post-info">
                  <span className="bm-post-title" title={b.title}>{b.title}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', margin: '4px 0' }}>
                    <span style={{ fontSize: '11px', background: 'var(--paper)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--line)' }}>{b.category || 'General'}</span>
                    <span style={{ fontSize: '11px', color: b.published !== false ? '#2e6b57' : '#d97706', fontWeight: 600 }}>
                      {b.published !== false ? '🟢 Published' : '🟡 Draft'}
                    </span>
                  </div>
                  <span className="bm-post-meta">{b.author || 'Anonymous'} · {new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="bm-list-actions" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button className="bm-btn-sm-edit" onClick={() => startEdit(b)}>Edit</button>
                  <button className="bm-btn-sm-edit" style={{ background: b.published !== false ? 'rgba(217, 119, 6, 0.1)' : 'rgba(46, 107, 87, 0.1)', color: b.published !== false ? '#d97706' : '#2e6b57' }} onClick={() => togglePublish(b)}>
                    {b.published !== false ? 'Unpublish' : 'Publish'}
                  </button>
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