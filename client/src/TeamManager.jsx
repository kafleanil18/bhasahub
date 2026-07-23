import { useState, useEffect } from 'react';
import { mediaUrl } from './utils/mediaUrl';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

function TeamManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [teamList, setTeamList] = useState([]);
  const [uploading, setUploading] = useState({});
  const [savingDetails, setSavingDetails] = useState({});
  const [savedFeedback, setSavedFeedback] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}/team`)
      .then(res => res.json())
      .then(data => {
        setTeamList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const uploadPhoto = async (key, file) => {
    if (!file) return;
    setError('');
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch(`${window.API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error || 'Image upload failed');
        return;
      }
      const saveRes = await fetch(`${API}/team/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ photo: uploadData.url }),
      });
      const saved = await saveRes.json();
      if (saveRes.ok) {
        setTeamList(prev => prev.map(m => m.key === key ? saved : m));
      } else {
        setError(saved.error || 'Could not save photo');
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const removePhoto = async (key) => {
    setError('');
    try {
      const res = await fetch(`${API}/team/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ photo: '' }),
      });
      if (res.ok) {
        const saved = await res.json();
        setTeamList(prev => prev.map(m => m.key === key ? saved : m));
      } else {
        const data = await res.json();
        setError(data.error || 'Could not remove photo');
      }
    } catch {
      setError('Could not reach the server');
    }
  };

  const handleOffsetChange = (key, field, value) => {
    setTeamList(prev => prev.map(m => {
      if (m.key === key) {
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const saveOffset = async (key) => {
    const member = teamList.find(m => m.key === key);
    if (!member) return;
    try {
      const res = await fetch(`${API}/team/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ 
          offsetX: member.offsetX !== undefined ? member.offsetX : 50, 
          offsetY: member.offsetY !== undefined ? member.offsetY : 50,
          scale: member.scale !== undefined ? member.scale : 1
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not save offset');
      }
    } catch {
      setError('Could not save offset adjustment to server');
    }
  };

  const handleFieldChange = (key, field, value) => {
    setTeamList(prev => prev.map(m => {
      if (m.key === key) {
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const saveDetails = async (key) => {
    const member = teamList.find(m => m.key === key);
    if (!member) return;
    setError('');
    setSavingDetails(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`${API}/team/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ 
          name: member.name !== undefined ? member.name : '',
          role: member.role !== undefined ? member.role : '',
          bio: member.bio !== undefined ? member.bio : ''
        }),
      });
      const saved = await res.json();
      if (res.ok) {
        setTeamList(prev => prev.map(m => m.key === key ? saved : m));
        setSavedFeedback(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setSavedFeedback(prev => ({ ...prev, [key]: false }));
        }, 2000);
      } else {
        setError(saved.error || 'Could not save details');
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setSavingDetails(prev => ({ ...prev, [key]: false }));
    }
  };

  const createTeamMember = async () => {
    setError('');
    try {
      const res = await fetch(`${API}/team`, {
        method: 'POST',
        headers: authHeaders,
      });
      const newMember = await res.json();
      if (res.ok) {
        setTeamList(prev => [...prev, newMember]);
      } else {
        setError(newMember.error || 'Could not create team member');
      }
    } catch {
      setError('Could not reach the server');
    }
  };

  const deleteTeamMember = async (key) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    setError('');
    try {
      const res = await fetch(`${API}/team/${key}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        setTeamList(prev => prev.filter(m => m.key !== key));
      } else {
        const data = await res.json();
        setError(data.error || 'Could not delete team member');
      }
    } catch {
      setError('Could not reach the server');
    }
  };

  return (
    <section className="tmg-dashboard">
      <style>{`
        .tmg-dashboard {
          max-width: 960px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--ink, #2a2320);
          background-color: var(--paper, #faf6ec);
          min-height: 100vh;
        }

        .tmg-back-btn {
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
        .tmg-back-btn:hover {
          background: rgba(46, 107, 87, 0.08);
          border-color: var(--jade, #2e6b57);
        }

        .tmg-header {
          margin-bottom: 2.5rem;
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 1.5rem;
        }

        .tmg-header h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .tmg-header p {
          color: var(--mist, #7a7266);
          margin-top: 0.25rem;
          font-size: 0.95rem;
        }

        .tmg-error {
          background: rgba(200, 54, 42, 0.06);
          color: var(--seal, #c8362a);
          border: 1px solid rgba(200, 54, 42, 0.15);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .tmg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .tmg-card {
          background: var(--card, #fffdf8);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 16px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 4px 12px rgba(42, 35, 32, 0.02);
        }

        .tmg-avatar-wrap {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid var(--line, #e6dcc6);
          box-shadow: 0 4px 14px rgba(0,0,0,0.06);
          margin-bottom: 1rem;
          flex-shrink: 0;
        }

        .tmg-avatar-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .tmg-avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--jade, #2e6b57) 0%, var(--gold, #c99a3c) 100%);
          color: #fff;
          font-weight: 700;
          font-size: 2rem;
        }

        .tmg-name {
          font-family: 'Fraunces', serif;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .tmg-role {
          color: var(--mist, #7a7266);
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .tmg-upload-btn {
          background: var(--jade, #2e6b57);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          display: inline-block;
        }
        .tmg-upload-btn input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .tmg-remove-btn {
          background: none;
          border: none;
          color: var(--seal, #c8362a);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.6rem;
        }

        .tmg-hint {
          font-size: 0.75rem;
          color: var(--mist, #7a7266);
          margin-top: 0.75rem;
        }
      `}</style>

      <button className="tmg-back-btn" onClick={onBack}>← Back to home</button>

      <div className="tmg-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <h1>Team Photos</h1>
          <p>Upload the profile photo shown on the "Meet Our Team" section</p>
        </div>
        <button 
          onClick={createTeamMember}
          style={{
            background: 'var(--jade, #2e6b57)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(46,107,87,0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          ➕ Add Team Member
        </button>
      </div>

      {error && <p className="tmg-error">{error}</p>}

      {!loading && (
        <div className="tmg-grid">
          {teamList.map((slot) => {
            const photoUrl = slot.photo || '';
            return (
              <div className="tmg-card" key={slot.key}>
                <div style={{ display: 'flex', gap: '1.5rem', width: '100%', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                  
                  {/* Live Avatar Preview (how it looks on the website) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist, #7a7266)' }}>Live Site Preview</span>
                    <div className="tmg-avatar-wrap" style={{ borderRadius: '12px', width: '120px', height: '120px', border: '3px solid var(--jade, #2e6b57)', overflow: 'hidden', position: 'relative', margin: 0, background: 'var(--paper, #faf6ec)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {photoUrl ? (
                        <img 
                          src={mediaUrl(photoUrl)}
  alt={slot.name} 
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '12px',
                            objectFit: 'contain',
                            transform: `translate(${(slot.offsetX !== undefined ? slot.offsetX : 50) - 50}%, ${(slot.offsetY !== undefined ? slot.offsetY : 50) - 50}%) scale(${slot.scale !== undefined ? slot.scale : 1})`,
                            transformOrigin: 'center center'
                          }}
                        />
                      ) : (
                        <div className="tmg-avatar-fallback">{slot.name ? slot.name.charAt(0) : 'T'}</div>
                      )}
                    </div>
                  </div>

                  {/* Full Original Image (so they can see the whole photo they uploaded) */}
                  {photoUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: '1', minWidth: '150px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist, #7a7266)' }}>Uploaded Original Photo</span>
                      <div style={{ border: '1px solid var(--line, #e6dcc6)', borderRadius: '12px', padding: '4px', background: 'var(--card, #fffdf8)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px', maxHeight: '120px', overflow: 'hidden' }}>
                        <img 
                          src={mediaUrl(photoUrl)}
  alt="Original uploaded file" 
                          style={{
                            maxWidth: '100%',
                            maxHeight: '110px',
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ width: '100%', margin: '1rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist)' }}>Name</label>
                    <input 
                      type="text" 
                      value={slot.name || ''} 
                      onChange={(e) => handleFieldChange(slot.key, 'name', e.target.value)}
                      placeholder="Enter name..."
                      style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '0.85rem', width: '100%', background: 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist)' }}>Role</label>
                    <input 
                      type="text" 
                      value={slot.role || ''} 
                      onChange={(e) => handleFieldChange(slot.key, 'role', e.target.value)}
                      placeholder="Enter role..."
                      style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '0.85rem', width: '100%', background: 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist)' }}>Short Bio</label>
                    <textarea 
                      value={slot.bio || ''} 
                      onChange={(e) => handleFieldChange(slot.key, 'bio', e.target.value)}
                      placeholder="Enter biography..."
                      rows="3"
                      style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '0.8rem', width: '100%', resize: 'vertical', background: 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => saveDetails(slot.key)}
                  disabled={savingDetails[slot.key]}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    width: '100%',
                    marginBottom: '1rem',
                    backgroundColor: savedFeedback[slot.key] ? 'var(--jade)' : 'var(--ink)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {savingDetails[slot.key] ? 'Saving...' : savedFeedback[slot.key] ? '✓ Saved!' : 'Save Details'}
                </button>

                <label className="tmg-upload-btn">
                  {uploading[slot.key] ? 'Uploading...' : photoUrl ? 'Replace photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadPhoto(slot.key, e.target.files[0])}
                  />
                </label>

                {photoUrl && (
                  <button className="tmg-remove-btn" onClick={() => removePhoto(slot.key)}>
                    Remove photo
                  </button>
                )}

                {photoUrl && (
                  <div className="tmg-position-controls" style={{ width: '100%', margin: '1.25rem 0 0.5rem', borderTop: '1px dashed var(--line)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist)', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="11" y1="8" x2="11" y2="14"></line>
                          <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                        Zoom
                      </span>
                      <span>{Math.round((slot.scale !== undefined ? slot.scale : 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={slot.scale !== undefined ? slot.scale : 1}
                      onChange={(e) => handleOffsetChange(slot.key, 'scale', parseFloat(e.target.value))}
                      onMouseUp={() => saveOffset(slot.key)}
                      onTouchEnd={() => saveOffset(slot.key)}
                      style={{ width: '100%', accentColor: 'var(--jade)', cursor: 'pointer', marginBottom: '10px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist)', marginBottom: '4px' }}>
                      <span>Horizontal position</span>
                      <span>{slot.offsetX !== undefined ? slot.offsetX : 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={slot.offsetX !== undefined ? slot.offsetX : 50}
                      onChange={(e) => handleOffsetChange(slot.key, 'offsetX', parseInt(e.target.value))}
                      onMouseUp={() => saveOffset(slot.key)}
                      onTouchEnd={() => saveOffset(slot.key)}
                      style={{ width: '100%', accentColor: 'var(--jade)', cursor: 'pointer', marginBottom: '10px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--mist)', marginBottom: '4px' }}>
                      <span>Vertical position</span>
                      <span>{slot.offsetY !== undefined ? slot.offsetY : 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={slot.offsetY !== undefined ? slot.offsetY : 50}
                      onChange={(e) => handleOffsetChange(slot.key, 'offsetY', parseInt(e.target.value))}
                      onMouseUp={() => saveOffset(slot.key)}
                      onTouchEnd={() => saveOffset(slot.key)}
                      style={{ width: '100%', accentColor: 'var(--jade)', cursor: 'pointer' }}
                    />
                    <p style={{ fontSize: '0.65rem', color: 'var(--mist)', marginTop: '8px', fontStyle: 'italic' }}>
                      Drag sliders to adjust. Position is saved automatically on release.
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => deleteTeamMember(slot.key)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--line)',
                    color: 'var(--seal, #c8362a)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                >
                  🗑️ Delete Member
                </button>

                <p className="tmg-hint">Images display inside a consistent frame. Adjust zoom & position above to fit it perfectly.</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TeamManager;
