import { useState } from 'react';

const API = 'http://localhost:5001/api';

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

  const uploadPhoto = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) setPhoto(data.url);
    } catch {
      setError('Photo upload failed');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        {sent ? (
          <>
            <h1>Thank you! 🙏</h1>
            <p className="login-sub">Your testimonial has been submitted and will appear once approved.</p>
            <button onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h1>Share your experience</h1>
            <p className="login-sub">Tell others about your learning journey with us.</p>
            {error && <p className="login-error">{error}</p>}

            <label>Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label>Your experience
              <textarea rows="4" value={text} onChange={(e) => setText(e.target.value)}
                placeholder="What did you enjoy? What did you learn?"
                style={{ width: '100%', marginTop: 6, padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: 15, border: '1px solid #d8d2c4', borderRadius: 8, background: 'var(--paper)', color: 'var(--ink)', resize: 'vertical' }} />
            </label>
            <label>Rating
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                <option value={5}>★★★★★ (5)</option>
                <option value={4}>★★★★ (4)</option>
                <option value={3}>★★★ (3)</option>
                <option value={2}>★★ (2)</option>
                <option value={1}>★ (1)</option>
              </select>
            </label>
            <label>Photo (optional)
              <input type="file" accept="image/*" onChange={(e) => uploadPhoto(e.target.files[0])} />
            </label>
            {photo && <img src={`http://localhost:5001${photo}`} alt="you" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />}

            <label className="check-label">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              I agree to have my testimonial displayed publicly.
            </label>

            <button onClick={submit} disabled={sending}>
              {sending ? 'Submitting...' : 'Submit testimonial'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TestimonialModal;