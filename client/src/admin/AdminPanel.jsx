import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import ControlIcon from './ControlIcon';
import CourseEditor from './CourseEditor';
import './CourseStudio.css';

const API = window.API_BASE_URL + '/api/courses';
const emptyDraft = () => ({ title: '', language: 'chinese', level: '', description: '', glyph: '', image: '', published: false });
const courseDraft = course => Object.fromEntries(Object.entries(emptyDraft()).map(([key, fallback]) => [key, course[key] ?? fallback]));
async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request failed. Please try again.');
  return data;
}

export default function AdminPanel({ onBack, onManageLessons }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [baseline, setBaseline] = useState(emptyDraft);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const titleRef = useRef(null);
  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const locked = busy !== null;

  const loadCourses = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { setCourses(await fetch(`${API}/all`, { headers }).then(readResponse)); }
    catch (err) { setLoadError(err.message || 'Could not reach the server.'); }
    finally { setLoading(false); }
  }, [headers]);
  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const canLeave = () => !dirty || window.confirm('Discard your unsaved course changes?');
  const resetForm = () => { setDraft(emptyDraft()); setBaseline(emptyDraft()); setEditingId(null); };
  const openEditor = course => {
    if (!canLeave()) return;
    const next = course ? courseDraft(course) : emptyDraft();
    setDraft(next); setBaseline(next); setEditingId(course?._id || null); setError('');
    requestAnimationFrame(() => { titleRef.current?.focus(); titleRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); });
  };
  const uploadImage = async file => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    setUploading(true); setError(''); setNotice('');
    const body = new FormData(); body.append('file', file);
    try {
      const data = await fetch(window.API_BASE_URL + '/api/upload', { method: 'POST', headers, body }).then(readResponse);
      setDraft(current => ({ ...current, image: data.url }));
    } catch (err) { setError(err.message || 'Could not upload the image.'); }
    finally { setUploading(false); }
  };
  const handleSave = async event => {
    event.preventDefault();
    if (locked || uploading) return;
    if (!draft.title.trim()) { setError('Enter a course title.'); titleRef.current?.focus(); return; }
    setBusy('save'); setError(''); setNotice('');
    try {
      await fetch(editingId ? `${API}/${editingId}` : API, { method: editingId ? 'PUT' : 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, title: draft.title.trim() }) }).then(readResponse);
      setNotice(`“${draft.title.trim()}” ${editingId ? 'updated' : 'created'} successfully.`);
      resetForm(); await loadCourses();
    } catch (err) { setError(err.message || 'Could not save the course.'); }
    finally { setBusy(null); }
  };
  const updateCourse = async (course, remove = false) => {
    if (locked || uploading) return;
    if (course._id === editingId && !canLeave()) return;
    if (remove && !window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return;
    setBusy(course._id); setError(''); setNotice('');
    try {
      await fetch(`${API}/${course._id}`, { method: remove ? 'DELETE' : 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, ...(remove ? {} : { body: JSON.stringify({ published: !course.published }) }) }).then(readResponse);
      if (course._id === editingId) resetForm();
      setNotice(`“${course.title}” ${remove ? 'deleted' : course.published ? 'moved to drafts' : 'published'}.`);
      await loadCourses();
    } catch (err) { setError(err.message || 'Could not update the course.'); }
    finally { setBusy(null); }
  };
  const published = courses.filter(course => course.published).length;
  const visible = courses.filter(course => (filter === 'all' || (filter === 'published' ? course.published : !course.published)) && `${course.title} ${course.level || ''} ${course.description || ''}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <section className="container course-studio" aria-labelledby="studio-title">
    <button className="studio-back" onClick={() => { if (!locked && !uploading && canLeave()) onBack(); }} disabled={locked || uploading}>← Back to control center</button>
    <div className="studio-hero"><div><p className="studio-eyebrow">Content workspace</p><h1 id="studio-title">Course Studio</h1><p>Build your courses. Organize your lessons. Help your students take the next step.</p></div><button className="studio-button studio-button-gold" onClick={() => openEditor()} disabled={locked || uploading}><span aria-hidden="true">＋</span> New course</button></div>
    <div className="studio-summary" aria-label="Course summary">{[['Total courses', courses.length], ['Published', published], ['Drafts', courses.length - published]].map(([label, count]) => <div key={label}><span>{label}</span><strong>{loading || loadError ? '—' : count}</strong></div>)}</div>
    {error && <div className="studio-message studio-message-error" role="alert">{error}</div>}
    {notice && <div className="studio-message studio-message-success" role="status">{notice}</div>}
    <div className="studio-layout">
      <section className="studio-library" aria-labelledby="studio-library-title" aria-busy={loading}>
        <div className="studio-library-heading"><div><p className="studio-eyebrow">Your content</p><h2 id="studio-library-title">Course library</h2></div><span>{visible.length} {visible.length === 1 ? 'course' : 'courses'}</span></div>
        <label className="studio-search"><ControlIcon name="search"/><input type="search" aria-label="Search courses by title, level, or description" placeholder="Search courses…" value={query} onChange={e => setQuery(e.target.value)}/></label>
        <div className="studio-filters" role="group" aria-label="Filter courses by status">{[['all', 'All courses', courses.length], ['published', 'Published', published], ['draft', 'Drafts', courses.length - published]].map(([value, label, count]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{loading || loadError ? '—' : count}</span></button>)}</div>
        {loadError ? <div className="studio-empty" role="alert"><h3>Could not load the course library</h3><p>{loadError}</p><button className="studio-button" onClick={loadCourses}>Try again</button></div> : loading ? <div className="studio-skeleton" role="status" aria-label="Loading courses">{[0, 1, 2].map(i => <div key={i}/>)}</div> : visible.length ? <ul className="studio-course-list">{visible.map(course => <li key={course._id} className={editingId === course._id ? 'is-editing' : ''}>
          <div className="studio-course-main">{course.image ? <img className="studio-course-cover" src={mediaUrl(course.image)} alt=""/> : <span className="studio-course-symbol" aria-hidden="true">{course.glyph?.trim().length <= 2 && course.glyph.trim() ? course.glyph : '中'}</span>}<div className="studio-course-info"><span className={`studio-status ${course.published ? 'is-published' : ''}`}><i aria-hidden="true"/>{course.published ? 'Published' : 'Draft'}</span><h3>{course.title}</h3><p>Chinese · {course.level || 'Level not set'}</p></div></div>
          {course.description && <p className="studio-course-description">{course.description}</p>}
          <div className="studio-course-actions"><button className="studio-button studio-button-primary" onClick={() => { if (canLeave()) onManageLessons(course); }} disabled={locked || uploading}>Manage lessons <span aria-hidden="true">→</span></button><button className="studio-button" onClick={() => openEditor(course)} disabled={locked || uploading} aria-label={`Edit ${course.title}`}>{editingId === course._id ? 'Editing' : 'Edit details'}</button><details className="studio-more"><summary aria-label={`More actions for ${course.title}`}>•••</summary><div><button onClick={() => updateCourse(course)} disabled={locked || uploading}>{course.published ? 'Move to draft' : 'Publish course'}</button><button className="studio-delete" onClick={() => updateCourse(course, true)} disabled={locked || uploading}>Delete course</button></div></details>{busy === course._id && <span className="studio-hint" role="status">Updating…</span>}</div>
        </li>)}</ul> : <div className="studio-empty"><ControlIcon name="courses"/><h3>{courses.length ? 'No matching courses' : 'Your first course starts here'}</h3><p>{courses.length ? 'Try another search or choose a different status.' : 'Create a draft, then add lessons at your own pace.'}</p><button className="studio-button" onClick={() => { if (courses.length) { setQuery(''); setFilter('all'); } else openEditor(); }} disabled={locked || uploading}>{courses.length ? 'Clear filters' : 'Create your first course'}</button></div>}
      </section>
      <CourseEditor draft={draft} setDraft={setDraft} editingId={editingId} titleRef={titleRef} saving={busy === 'save'} uploading={uploading} locked={locked} onUpload={uploadImage} onSave={handleSave} onCancel={() => { if (canLeave()) { resetForm(); setError(''); } }}/>
    </div>
  </section>;
}
