import { useState, useEffect, useMemo } from 'react';
import { mediaUrl } from './utils/mediaUrl';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

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

  // Metrics summary
  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter(t => !t.approved).length;
    const approved = items.filter(t => t.approved).length;
    
    const sumRatings = items.reduce((acc, t) => acc + t.rating, 0);
    const average = total > 0 ? (sumRatings / total).toFixed(1) : '0.0';
    
    return { total, pending, approved, average };
  }, [items]);

  return (
    <section className="tmm-dashboard">
      <style>{`
        .tmm-dashboard {
          max-width: 1240px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--ink, #2a2320);
          background-color: var(--paper, #faf6ec);
          min-height: 100vh;
        }

        .tmm-back-btn {
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
        .tmm-back-btn:hover {
          background: rgba(46, 107, 87, 0.08);
          border-color: var(--jade, #2e6b57);
        }

        .tmm-header {
          margin-bottom: 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line, #e6dcc6);
          padding-bottom: 1.5rem;
        }

        .tmm-title-container h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--ink, #2a2320);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .tmm-title-container p {
          color: var(--mist, #7a7266);
          margin-top: 0.25rem;
          font-size: 0.95rem;
        }

        /* Metrics Grid */
        .tmm-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .tmm-metric-card {
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
        .tmm-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
        }

        .tmm-metric-icon {
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

        .tmm-metric-icon.gold {
          background: rgba(201, 154, 60, 0.08);
          color: var(--gold, #c99a3c);
        }

        .tmm-metric-icon.seal {
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal, #c8362a);
        }

        .tmm-metric-details {
          display: flex;
          flex-direction: column;
        }

        .tmm-metric-value {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          line-height: 1.1;
        }

        .tmm-metric-label {
          font-size: 0.8rem;
          color: var(--mist, #7a7266);
          font-weight: 500;
          margin-top: 0.25rem;
        }

        /* Testimonials Feed */
        .tmm-feed {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .tmm-feed {
            grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          }
        }

        .tmm-card {
          background: var(--card, #fffdf8);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(42, 35, 32, 0.02);
          transition: all 0.2s ease;
          position: relative;
        }
        .tmm-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(42, 35, 32, 0.05);
          border-color: var(--jade, #2e6b57);
        }
        .tmm-card.pending {
          border-left: 4px solid var(--gold, #c99a3c);
          background: rgba(201, 154, 60, 0.02);
        }

        .tmm-card-head {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 1rem;
        }

        .tmm-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--line, #e6dcc6);
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          flex-shrink: 0;
        }

        .tmm-avatar-fallback {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--jade, #2e6b57) 0%, var(--gold, #c99a3c) 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          flex-shrink: 0;
        }

        .tmm-profile-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 0;
        }

        .tmm-name {
          font-family: 'Fraunces', serif;
          font-size: 1.15rem;
          font-weight: 750;
          color: var(--ink, #2a2320);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tmm-rating-stars {
          color: var(--gold, #c99a3c);
          font-size: 0.9rem;
          margin-top: 0.15rem;
          letter-spacing: 1px;
        }

        .tmm-status-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border-radius: 12px;
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
        }
        .tmm-status-badge.approved {
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade, #2e6b57);
        }
        .tmm-status-badge.pending {
          background: rgba(201, 154, 60, 0.08);
          color: var(--gold, #c99a3c);
        }

        .tmm-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--ink, #2a2320);
          margin-bottom: 1.5rem;
          flex-grow: 1;
          font-style: italic;
          position: relative;
        }
        
        .tmm-text::before {
          content: '"';
          font-family: Georgia, serif;
          font-size: 1.5rem;
          color: var(--line, #e6dcc6);
          position: absolute;
          left: -10px;
          top: -5px;
        }

        .tmm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--line, #e6dcc6);
          padding-top: 0.85rem;
          margin-top: auto;
        }

        .tmm-date {
          font-size: 0.8rem;
          color: var(--mist, #7a7266);
        }

        .tmm-actions {
          display: flex;
          gap: 0.5rem;
        }

        .tmm-btn-action {
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
        .tmm-btn-action:hover {
          background: var(--rice, #f3ebd8);
          border-color: var(--mist, #7a7266);
        }

        .tmm-btn-action.approve {
          background: rgba(46, 107, 87, 0.06);
          color: var(--jade, #2e6b57);
          border-color: rgba(46, 107, 87, 0.15);
        }
        .tmm-btn-action.approve:hover {
          background: var(--jade, #2e6b57);
          color: #ffffff;
          border-color: var(--jade, #2e6b57);
        }

        .tmm-btn-action.delete {
          background: rgba(200, 54, 42, 0.04);
          color: var(--seal, #c8362a);
          border-color: rgba(200, 54, 42, 0.08);
        }
        .tmm-btn-action.delete:hover {
          background: rgba(200, 54, 42, 0.08);
          border-color: var(--seal, #c8362a);
        }

        .tmm-empty-state {
          text-align: center;
          color: var(--mist, #7a7266);
          padding: 4rem 1rem;
          font-style: italic;
        }
      `}</style>

      <button className="tmm-back-btn" onClick={onBack}>← Back to home</button>
      
      <div className="tmm-header">
        <div className="tmm-title-container">
          <h1>Testimonials Gallery</h1>
          <p>Review, verify, and select student testimonials for the showcase</p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="tmm-metrics-grid">
        <div className="tmm-metric-card">
          <div className="tmm-metric-icon">💬</div>
          <div className="tmm-metric-details">
            <span className="tmm-metric-value">{stats.total}</span>
            <span className="tmm-metric-label">Total Reviews</span>
          </div>
        </div>
        <div className="tmm-metric-card">
          <div className="tmm-metric-icon gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="tmm-metric-details">
            <span className="tmm-metric-value">{stats.pending}</span>
            <span className="tmm-metric-label">Pending Approval</span>
          </div>
        </div>
        <div className="tmm-metric-card">
          <div className="tmm-metric-icon seal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="tmm-metric-details">
            <span className="tmm-metric-value">{stats.average} / 5</span>
            <span className="tmm-metric-label">Average Score</span>
          </div>
        </div>
      </div>

      {loading && <p className="tmm-empty-state">Loading testimonials feed...</p>}
      {!loading && items.length === 0 && <p className="tmm-empty-state">No testimonials filed in registry yet.</p>}

      {!loading && items.length > 0 && (
        <div className="tmm-feed">
          {items.map((t) => {
            const initials = t.name ? t.name.charAt(0).toUpperCase() : 'S';
            
            return (
              <div className={`tmm-card ${t.approved ? '' : 'pending'}`} key={t._id}>
                {/* Status Badge */}
                <span className={`tmm-status-badge ${t.approved ? 'approved' : 'pending'}`}>
                  {t.approved ? 'Live' : 'Pending'}
                </span>

                <div className="tmm-card-head">
                  {t.photo ? (
                    <img src={mediaUrl(t.photo)} alt={t.name} className="tmm-avatar" />
                  ) : (
                    <div className="tmm-avatar-fallback">{initials}</div>
                  )}
                  <div className="tmm-profile-info">
                    <strong className="tmm-name">{t.name}</strong>
                    <span className="tmm-rating-stars">{'★'.repeat(t.rating)}</span>
                  </div>
                </div>

                <p className="tmm-text">{t.text}</p>

                <div className="tmm-footer">
                  <span className="tmm-date">
                    Filed: {new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="tmm-actions">
                    {!t.approved && (
                      <button className="tmm-btn-action approve" onClick={() => approve(t._id)}>
                        Approve
                      </button>
                    )}
                    <button className="tmm-btn-action delete" onClick={() => remove(t._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TestimonialManager;