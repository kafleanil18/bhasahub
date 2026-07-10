import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function TestimonialManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}/testimonials/all`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await fetch(`${API}/testimonials/${id}/approve`, { method: 'PUT', headers: authHeaders });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    await fetch(`${API}/testimonials/${id}`, { method: 'DELETE', headers: authHeaders });
    load();
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Testimonials</h1>

      {loading && <p className="courses-empty">Loading...</p>}
      {!loading && items.length === 0 && <p className="courses-empty">No testimonials yet.</p>}

      <div className="feedback-list">
        {items.map((t) => (
          <div className={`feedback-item ${t.approved ? '' : 'unread'}`} key={t._id}>
            <div className="feedback-head">
              {t.photo && <img src={`${SERVER}${t.photo}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />}
              <strong>{t.name}</strong>
              <span className="feedback-email">{'★'.repeat(t.rating)}</span>
              <span className="feedback-date">
                {t.approved ? 'Approved' : 'Pending'} · {new Date(t.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="feedback-message">{t.text}</p>
            <div className="feedback-actions">
              {!t.approved && <button className="nav-btn" onClick={() => approve(t._id)}>Approve</button>}
              <button className="row-delete" onClick={() => remove(t._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TestimonialManager;