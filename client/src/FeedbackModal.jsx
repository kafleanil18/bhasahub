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
    <div className="fb-overlay" onClick={onClose}>
      {/* Self-contained styling module */}
      <style>{`
        .fb-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: fbFadeIn 0.2s ease-out;
        }
        .fb-card {
          background: var(--paper); width: 100%; max-width: 460px; padding: 2.25rem;
          border-radius: 14px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border: 1px solid rgba(229, 231, 235, 0.6); box-sizing: border-box;
          position: relative; animation: fbSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fb-close-btn {
          position: absolute; top: 20px; right: 20px; background: #f3f4f6;
          border: none; width: 28px; height: 28px; border-radius: 50%;
          cursor: pointer; color: #6b7280; font-size: 16px; font-weight: bold;
          display: flex; align-items: center; justify-content: center; transition: background 0.2s;
        }
        .fb-close-btn:hover { background: #e5e7eb; color: #111827; }
        .fb-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.35rem 0; letter-spacing: -0.02em; }
        .fb-sub { font-size: 0.925rem; color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.4; }
        .fb-error {
          background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b;
          padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1.25rem; font-size: 0.875rem;
        }
        .fb-group { margin-bottom: 1.25rem; }
        .fb-label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        .fb-input, .fb-textarea {
          width: 100%; padding: 0.75rem 0.875rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.95rem; box-sizing: border-box; background: var(--rice); color: var(--ink);
          transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
        }
        .fb-input:focus, .fb-textarea:focus {
          outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
        .fb-textarea { resize: vertical; min-height: 110px; }
        .fb-btn-submit {
          width: 100%; background: #4f46e5; color: white; border: none; padding: 0.875rem;
          border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer;
          transition: background 0.2s; display: flex; justify-content: center; align-items: center;
        }
        .fb-btn-submit:hover:not(:disabled) { background: #4338ca; }
        .fb-btn-submit:disabled { background: #9ca3af; cursor: not-allowed; }
        
        .fb-success { text-align: center; padding: 1.5rem 0 0.5rem 0; }
        .fb-success-icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .fb-btn-close {
          background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; padding: 0.75rem 2rem;
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 1.5rem;
        }
        .fb-btn-close:hover { background: #e5e7eb; }

        @keyframes fbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fbSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="fb-card" onClick={(e) => e.stopPropagation()}>
        <button className="fb-close-btn" onClick={onClose} aria-label="Close modal">×</button>

        {sent ? (
          <div className="fb-success">
            <span className="fb-success-icon">🙏</span>
            <h1 className="fb-title">Thank you!</h1>
            <p className="fb-sub" style={{ marginBottom: 0 }}>
              Your feedback has been successfully shared. We sincerely appreciate you taking the time to help us improve.
            </p>
            <button className="fb-btn-close" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h1 className="fb-title">Message us</h1>
            <p className="fb-sub">Questions, suggestions, or feedback — we'd love to hear from you.</p>

            {error && <div className="fb-error">{error}</div>}

            <div className="fb-group">
              <label className="fb-label">Name</label>
              <input 
                className="fb-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your name" 
              />
            </div>

            <div className="fb-group">
              <label className="fb-label">Email Address</label>
              <input 
                className="fb-input" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
              />
            </div>

            <div className="fb-group">
              <label className="fb-label">Message</label>
              <textarea 
                className="fb-textarea" 
                rows="4" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
              />
            </div>

            <button className="fb-btn-submit" onClick={handleSubmit} disabled={sending}>
              {sending ? 'Sending Message...' : 'Send message'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;