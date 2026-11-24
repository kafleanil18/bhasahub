import { useState, useEffect } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import Icon from '../components/Icon';

const API = window.API_BASE_URL + '/api';

function TeacherManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [teachers, setTeachers] = useState([]);
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState({});
  const [savedFeedback, setSavedFeedback] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}/teachers`)
      .then(res => res.json())
      .then(data => { setTeachers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFieldChange = (id, field, value) => {
    setTeachers(prev => prev.map(t => t._id === id ? { ...t, [field]: value } : t));
  };

  const saveDetails = async (id) => {
    const teacher = teachers.find(t => t._id === id);
    if (!teacher) return;
    setError('');
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API}/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ name: teacher.name || '', title: teacher.title || '', bio: teacher.bio || '' }),
      });
      const saved = await res.json();
      if (res.ok) {
        setTeachers(prev => prev.map(t => t._id === id ? saved : t));
        setSavedFeedback(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setSavedFeedback(prev => ({ ...prev, [id]: false })), 2000);
      } else {
        setError(saved.error || 'Could not save details');
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setError('');
    setUploading(prev => ({ ...prev, [id]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { setError(uploadData.error || 'Image upload failed'); return; }
      const saveRes = await fetch(`${API}/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ photo: uploadData.url }),
      });
      const saved = await saveRes.json();
      if (saveRes.ok) setTeachers(prev => prev.map(t => t._id === id ? saved : t));
      else setError(saved.error || 'Could not save photo');
    } catch {
      setError('Could not reach the server');
    } finally {
      setUploading(prev => ({ ...prev, [id]: false }));
    }
  };

  const removePhoto = async (id) => {
    setError('');
    try {
      const res = await fetch(`${API}/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ photo: '' }),
      });
      const saved = await res.json();
      if (res.ok) setTeachers(prev => prev.map(t => t._id === id ? saved : t));
      else setError(saved.error || 'Could not remove photo');
    } catch {
      setError('Could not reach the server');
    }
  };

  const createTeacher = async () => {
    setError('');
    try {
      const res = await fetch(`${API}/teachers`, { method: 'POST', headers: authHeaders });
      const newTeacher = await res.json();
      if (res.ok) setTeachers(prev => [...prev, newTeacher]);
      else setError(newTeacher.error || 'Could not create teacher');
    } catch {
      setError('Could not reach the server');
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    setError('');
    try {
      const res = await fetch(`${API}/teachers/${id}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) setTeachers(prev => prev.filter(t => t._id !== id));
      else { const data = await res.json(); setError(data.error || 'Could not delete teacher'); }
    } catch {
      setError('Could not reach the server');
    }
  };

  return (
    <section className="tcm-dashboard">
      <style>{`
        .tcm-dashboard { max-width: 960px; margin: 0 auto; padding: 2.5rem 1.5rem; font-family: 'Inter', -apple-system, sans-serif; color: var(--ink); background-color: var(--paper); min-height: 100vh; }
        .tcm-back-btn { background: none; border: none; color: var(--jade); font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; margin-bottom: 1.5rem; border-radius: 8px; }
        .tcm-back-btn:hover { background: rgba(46, 107, 87, 0.08); }
        .tcm-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2.5rem; border-bottom: 1px solid var(--line); padding-bottom: 1.5rem; }
        .tcm-header h1 { font-family: var(--font-body); font-size: 2.25rem; font-weight: 800; margin: 0; }
        .tcm-header p { color: var(--mist); margin-top: 0.25rem; font-size: 0.95rem; }
        .tcm-add-btn { background: var(--jade); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
        .tcm-error { background: rgba(169, 35, 22, 0.06); color: var(--seal); border: 1px solid rgba(169, 35, 22, 0.15); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; }
        .tcm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
        .tcm-card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 1.75rem; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .tcm-avatar { width: 96px; height: 96px; border-radius: 50%; overflow: hidden; border: 3px solid var(--line); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--jade) 0%, var(--gold, #c99a3c) 100%); color: #fff; font-weight: 700; font-size: 1.75rem; }
        .tcm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .tcm-fields { width: 100%; display: flex; flex-direction: column; gap: 10px; text-align: left; margin-bottom: 1rem; }
        .tcm-fields label { font-size: 0.875rem; font-weight: 600; color: var(--mist); display: block; margin-bottom: 3px; }
        .tcm-fields input, .tcm-fields textarea { padding: 6px 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 0.875rem; width: 100%; background: var(--card); color: var(--ink); font-family: inherit; box-sizing: border-box; }
        .tcm-fields textarea { resize: vertical; }
        .tcm-save-btn { padding: 8px 16px; font-size: 0.875rem; font-weight: 600; width: 100%; margin-bottom: 0.75rem; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
        .tcm-upload-btn { background: var(--jade); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; position: relative; overflow: hidden; display: inline-block; margin-bottom: 0.5rem; }
        .tcm-upload-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .tcm-remove-btn { background: none; border: none; color: var(--seal); font-size: 0.8rem; font-weight: 600; cursor: pointer; margin-bottom: 0.75rem; }
        .tcm-delete-btn { background: none; border: 1px solid var(--line); color: var(--seal); padding: 8px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; width: 100%; }
      `}</style>

      <button className="tcm-back-btn" onClick={onBack}>← Back to home</button>

      <div className="tcm-header">
        <div>
          <h1>Teachers</h1>
          <p>Edit the teacher introductions shown on the live classes enquiry form</p>
        </div>
        <button className="tcm-add-btn" onClick={createTeacher}><Icon name="plus"/> Add Teacher</button>
      </div>

      {error && <p className="tcm-error">{error}</p>}

      {!loading && (
        <div className="tcm-grid">
          {teachers.map((teacher) => (
            <div className="tcm-card" key={teacher._id}>
              <div className="tcm-avatar">
                {teacher.photo ? <img src={mediaUrl(teacher.photo)} alt={teacher.name} /> : (teacher.name ? teacher.name.charAt(0) : 'T')}
              </div>

              <label className="tcm-upload-btn">
                {uploading[teacher._id] ? 'Uploading...' : teacher.photo ? 'Replace photo' : 'Upload photo'}
                <input type="file" accept="image/*" onChange={(e) => uploadPhoto(teacher._id, e.target.files[0])} />
              </label>
              {teacher.photo && <button className="tcm-remove-btn" onClick={() => removePhoto(teacher._id)}>Remove photo</button>}

              <div className="tcm-fields">
                <div>
                  <label>Name</label>
                  <input type="text" value={teacher.name || ''} onChange={(e) => handleFieldChange(teacher._id, 'name', e.target.value)} placeholder="Teacher's name" />
                </div>
                <div>
                  <label>Title</label>
                  <input type="text" value={teacher.title || ''} onChange={(e) => handleFieldChange(teacher._id, 'title', e.target.value)} placeholder="e.g. Chinese Teacher" />
                </div>
                <div>
                  <label>Bio</label>
                  <textarea rows="3" value={teacher.bio || ''} onChange={(e) => handleFieldChange(teacher._id, 'bio', e.target.value)} placeholder="Short introduction" />
                </div>
              </div>

              <button
                className="tcm-save-btn"
                onClick={() => saveDetails(teacher._id)}
                disabled={saving[teacher._id]}
                style={{ backgroundColor: savedFeedback[teacher._id] ? 'var(--jade)' : 'var(--ink)' }}
              >
                {saving[teacher._id] ? 'Saving...' : savedFeedback[teacher._id] ? '✓ Saved!' : 'Save Details'}
              </button>

              <button className="tcm-delete-btn" onClick={() => deleteTeacher(teacher._id)}><Icon name="trash"/> Delete Teacher</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TeacherManager;
