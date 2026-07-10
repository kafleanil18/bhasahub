import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api/feedback';

function FeedbackInbox({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const load = () => {
    fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await fetch(`${API}/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this message?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
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