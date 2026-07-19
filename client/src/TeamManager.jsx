import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

const SLOTS = [
  { key: 'founder', name: 'Anil Kafle', role: 'Founder & Teacher' },
  { key: 'developer', name: 'Name Here', role: 'Developer' },
  { key: 'pm', name: 'Name Here', role: 'Project Manager' },
];

function TeamManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}/team`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        (Array.isArray(data) ? data : []).forEach(m => { map[m.key] = m.photo; });
        setPhotos(map);
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
        setPhotos(prev => ({ ...prev, [key]: saved.photo }));
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
        setPhotos(prev => ({ ...prev, [key]: '' }));
      } else {
        const data = await res.json();
        setError(data.error || 'Could not remove photo');
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

      <div className="tmg-header">
        <h1>Team Photos</h1>
        <p>Upload the profile photo shown on the "Meet Our Team" section</p>
      </div>

      {error && <p className="tmg-error">{error}</p>}

      {!loading && (
        <div className="tmg-grid">
          {SLOTS.map((slot) => {
            const photo = photos[slot.key];
            return (
              <div className="tmg-card" key={slot.key}>
                <div className="tmg-avatar-wrap">
                  {photo ? (
                    <img src={`${SERVER}${photo}`} alt={slot.name} />
                  ) : (
                    <div className="tmg-avatar-fallback">{slot.name.charAt(0)}</div>
                  )}
                </div>
                <strong className="tmg-name">{slot.name}</strong>
                <span className="tmg-role">{slot.role}</span>

                <label className="tmg-upload-btn">
                  {uploading[slot.key] ? 'Uploading...' : photo ? 'Replace photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadPhoto(slot.key, e.target.files[0])}
                  />
                </label>

                {photo && (
                  <button className="tmg-remove-btn" onClick={() => removePhoto(slot.key)}>
                    Remove photo
                  </button>
                )}

                <p className="tmg-hint">Square images work best — they're auto-cropped to fit the circle.</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TeamManager;
