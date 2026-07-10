import { useState } from 'react';

function FeedbackModal({ user, onClose }) {
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!message.trim()) return setError('Please write a message');
    setSending(true);
    try {
      const res = await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Could not send');
      }
    } catch {
      setError('Could not reach the server');
    }
    setSending(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {sent ? (
          <>
            <h1>Thank you! 🙏</h1>
            <p className="login-sub">Your feedback has been sent. We appreciate you taking the time.</p>
            <button onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h1>Message us</h1>
            <p className="login-sub">Questions, suggestions, or feedback — we'd love to hear from you.</p>

            {error && <p className="login-error">{error}</p>}

            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              Message
              <textarea rows="4" value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                style={{ width: '100%', marginTop: 6, padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: 15, border: '1px solid #d8d2c4', borderRadius: 8, background: 'var(--paper)', color: 'var(--ink)', resize: 'vertical' }} />
            </label>

            <button onClick={handleSubmit} disabled={sending}>
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;