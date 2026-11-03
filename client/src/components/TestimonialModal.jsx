import { useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';

const API = window.API_BASE_URL + '/api';

function TestimonialModal({ user, onClose }) {
  const token = localStorage.getItem('token');
  const [name, setName] = useState(user ? user.name : '');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [photo, setPhoto] = useState('');
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Images must be 5 MB or smaller.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setError('');
    setPhoto('');
    setPhotoUploading(true);
    try {
      const res = await fetch(`${API}/testimonials/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Photo upload failed');
      if (!data.url) throw new Error('The image was uploaded, but its link is missing. Please try again.');
      setPhoto(data.url);
    } catch (err) {
      setError(err.message || 'Photo upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const submit = async () => {
    setError('');
    if (!text.trim()) return setError('Please write your experience');
    if (!consent) return setError('Please agree to have your testimonial displayed');
    setSending(true);
    try {
      const res = await fetch(`${API}/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, text, rating, photo }),
      });
      if (res.ok) setSent(true);
      else { const d = await res.json(); setError(d.error || 'Could not submit'); }
    } catch {
      setError('Could not reach the server');
    }
    setSending(false);
  };

  return (
    <div className="tm-overlay" onClick={onClose}>
      {/* Self-contained styling module */}
      <style>{`
        .tm-overlay {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: tmFadeIn 0.25s ease-out;
        }
        .tm-card {
          background: #ffffff; width: 100%; max-width: 480px; padding: 2.25rem;
          border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border: 1px solid rgba(229, 231, 235, 0.5); box-sizing: border-box;
          position: relative; max-height: calc(100dvh - 2rem); overflow-y: auto;
          animation: tmSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tm-close-corner {
          position: absolute; top: 20px; right: 20px; background: #f3f4f6;
          border: none; width: 28px; height: 28px; border-radius: 50%;
          cursor: pointer; color: #6b7280; font-size: 16px; font-weight: bold;
          display: flex; align-items: center; justify-content: center; transition: background 0.2s;
        }
        .tm-close-corner:hover { background: #e5e7eb; color: #111827; }
        .tm-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.35rem 0; letter-spacing: -0.02em; }
        .tm-sub { font-size: 0.925rem; color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.4; }
        .tm-error {
          background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b;
          padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1.25rem; font-size: 0.875rem;
        }
        .tm-group { margin-bottom: 1.25rem; }
        .tm-label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        .tm-input, .tm-textarea {
          width: 100%; padding: 0.75rem 0.875rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.95rem; box-sizing: border-box; background: #ffffff; color: #1f2937;
          transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
        }
        .tm-input:focus, .tm-textarea:focus {
          outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
        .tm-star-row { display: flex; gap: 0.25rem; align-items: center; margin-top: 0.25rem; }
        .tm-star-btn {
          background: none; border: none; font-size: 1.75rem; cursor: pointer; padding: 0;
          color: #e5e7eb; transition: transform 0.1s, color 0.1s;
        }
        .tm-star-btn.active { color: #f59e0b; }
        .tm-star-btn:hover { transform: scale(1.1); }
        .tm-upload-box {
          border: 1px dashed #d1d5db; padding: 0.75rem; border-radius: 8px; background: #f9fafb;
          display: flex; align-items: center; gap: 1rem;
        }
        .tm-file-input { font-size: 0.85rem; color: #4b5563; }
        .tm-photo-status { color: #4b5563; font-size: 0.8rem; }
        .tm-photo-remove { border: 0; background: none; color: #b42318; padding: 0; cursor: pointer; font: inherit; font-size: 0.8rem; }
        .tm-avatar-frame {
          width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
          border: 2px solid #4f46e5; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        .tm-preview { margin: 0 0 1.25rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
        .tm-preview-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; margin-bottom: 0.75rem; }
        .tm-preview-heading strong { color: #374151; font-size: 0.8rem; }
        .tm-preview-heading span { color: #9ca3af; font-size: 0.72rem; }
        .tm-preview-card { padding: 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
        .tm-preview-stars { margin-bottom: 0.45rem; color: #f59e0b; letter-spacing: 0.08em; }
        .tm-preview-quote { min-height: 2.8rem; margin: 0 0 0.9rem; color: #4b5563; font-size: 0.88rem; line-height: 1.55; overflow-wrap: anywhere; }
        .tm-preview-person { display: flex; align-items: center; gap: 0.65rem; color: #111827; font-size: 0.84rem; font-weight: 600; }
        .tm-preview-avatar { display: flex; width: 36px; height: 36px; flex: 0 0 36px; align-items: center; justify-content: center; border-radius: 50%; background: #eef2ff; color: #4f46e5; font-size: 0.85rem; }
        .tm-preview-photo { width: 36px; height: 36px; flex: 0 0 36px; border-radius: 50%; object-fit: cover; }
        .tm-check-label {
          display: flex; align-items: flex-start; gap: 0.65rem; font-size: 0.875rem;
          color: #4b5563; line-height: 1.4; cursor: pointer; margin: 1.5rem 0;
        }
        .tm-checkbox { width: 16px; height: 16px; border-radius: 4px; margin-top: 2px; cursor: pointer; }
        .tm-btn-submit {
          width: 100%; background: #4f46e5; color: white; border: none; padding: 0.875rem;
          border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer;
          transition: background 0.2s; display: flex; justify-content: center; align-items: center;
        }
        .tm-btn-submit:hover:not(:disabled) { background: #4338ca; }
        .tm-btn-submit:disabled { background: #9ca3af; cursor: not-allowed; }
        
        /* Success State Details */
        .tm-success-state { text-align: center; padding: 1.5rem 0 0.5rem 0; }
        .tm-success-icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .tm-btn-close {
          background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; padding: 0.75rem 2rem;
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 1.5rem;
        }
        .tm-btn-close:hover { background: #e5e7eb; }

        @keyframes tmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tmSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="tm-card" onClick={(e) => e.stopPropagation()}>
        <button className="tm-close-corner" onClick={onClose} aria-label="Close modal">×</button>

        {sent ? (
          <div className="tm-success-state">
            <span className="tm-success-icon">🙏</span>
            <h1 className="tm-title">Thank you!</h1>
            <p className="tm-sub" style={{ marginBottom: 0 }}>
              Your testimonial has been safely submitted and will appear live once approved by management.
            </p>
            <button className="tm-btn-close" onClick={onClose}>Dismiss</button>
          </div>
        ) : (
          <>
            <h1 className="tm-title">Share your experience</h1>
            <p className="tm-sub">Tell others about your learning journey with us.</p>
            
            {error && <div className="tm-error">{error}</div>}

            <div className="tm-group">
              <label className="tm-label">Name</label>
              <input 
                className="tm-input"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Alex Johnson" 
              />
            </div>

            <div className="tm-group">
              <label className="tm-label">Your experience</label>
              <textarea 
                className="tm-textarea"
                rows="4" 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder="What did you enjoy most? What did you achieve?"
              />
            </div>

            <div className="tm-group">
              <label className="tm-label">Rating</label>
              <div className="tm-star-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`tm-star-btn ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="tm-group">
              <label className="tm-label" htmlFor="testimonial-photo">Profile photo <span style={{ fontWeight: 400, color: '#9ca3af' }}>(Optional)</span></label>
              <div className="tm-upload-box">
                {photo && (
                  <img src={mediaUrl(photo)} alt="User identity avatar" className="tm-avatar-frame" />
                )}
                <input
                  id="testimonial-photo"
                  type="file" 
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                  className="tm-file-input"
                  onChange={(e) => {
                    uploadPhoto(e.target.files[0]);
                    e.target.value = '';
                  }}
                  disabled={photoUploading || sending}
                />
                {photoUploading && <span className="tm-photo-status" role="status">Uploading…</span>}
                {photo && !photoUploading && (
                  <button className="tm-photo-remove" type="button" onClick={() => setPhoto('')}>Remove photo</button>
                )}
              </div>
            </div>

            <section className="tm-preview" aria-label="Live testimonial preview">
              <div className="tm-preview-heading">
                <strong>Homepage preview</strong>
                <span>Updates as you type</span>
              </div>
              <div className="tm-preview-card">
                <div className="tm-preview-stars" role="img" aria-label={`${rating} out of 5 stars`}>
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </div>
                <p className="tm-preview-quote">
                  {text.trim() ? `“${text.trim()}”` : 'Your testimonial will appear here as you write it.'}
                </p>
                <div className="tm-preview-person">
                  {photo ? (
                    <img src={mediaUrl(photo)} alt="" className="tm-preview-photo" />
                  ) : (
                    <span className="tm-preview-avatar" aria-hidden="true">
                      {name.trim().charAt(0).toUpperCase() || 'Y'}
                    </span>
                  )}
                  <span>{name.trim() || 'Your name'}</span>
                </div>
              </div>
            </section>

            <label className="tm-check-label">
              <input 
                type="checkbox" 
                className="tm-checkbox"
                checked={consent} 
                onChange={(e) => setConsent(e.target.checked)} 
              />
              <span>I give explicit permission to have this profile feedback review displayed publicly across matching channels.</span>
            </label>

            <button className="tm-btn-submit" onClick={submit} disabled={sending || photoUploading}>
              {sending ? 'Submitting…' : photoUploading ? 'Uploading photo…' : 'Submit Testimonial'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TestimonialModal;
