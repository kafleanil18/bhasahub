import { useState, useEffect, useCallback } from 'react';
import { useInitialLoad } from '../navigation/pageLoad';
import { apiFetch } from '../lib/apiClient';

const API = window.API_BASE_URL + '/api/feedback';

function FeedbackInbox({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useInitialLoad(loading, 'Loading feedback…');
  const token = localStorage.getItem('token');

  const load = useCallback(() => {
    apiFetch(API)
      .then(res => res.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await apiFetch(`${API}/${id}/read`, { method: 'PUT' });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this message?')) return;
    await apiFetch(`${API}/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>Back to home</button>
      <h1 className="section-title">Feedback inbox</h1>

      {loading && <p className="courses-empty">Loading...</p>}
      {!loading && items.length === 0 && <p className="courses-empty">No messages yet.</p>}

      <div className="feedback-list">
        {items.map((f) => (
          <div className={`feedback-item ${f.read ? '' : 'unread'}`} key={f._id}>
            <div className="feedback-head">
              <strong>{f.name || 'Anonymous'}</strong>
              {f.email && <span className="feedback-email">{f.email}</span>}
              <span className="feedback-date">{new Date(f.createdAt).toLocaleString()}</span>
            </div>
            <p className="feedback-message">{f.message}</p>
            <div className="feedback-actions">
              {!f.read && <button className="nav-btn" onClick={() => markRead(f._id)}>Mark read</button>}
              <button className="row-delete" onClick={() => remove(f._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeedbackInbox;