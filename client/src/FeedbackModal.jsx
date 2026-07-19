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
      const res = await fetch(window.API_BASE_URL + '/api/feedback', {
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
      {/* Self-contained styling module using standard BhasaHub theme variables */}
      <style>{`
        .fb-overlay {
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100vw; 
          height: 100vh;
          background: rgba(42, 35, 32, 0.45); 
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 1000;
          font-family: 'Inter', sans-serif;
          animation: fbFadeIn 0.2s ease-out;
        }
        
        .fb-card {
          background: var(--card); 
          width: 90%; 
          max-width: 460px; 
          padding: 2.25rem;
          border-radius: 16px; 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--line); 
          box-sizing: border-box;
          position: relative; 
          animation: fbSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .fb-close-btn {
          position: absolute; 
          top: 20px; 
          right: 20px; 
          background: var(--rice);
          border: none; 
          width: 30px; 
          height: 30px; 
          border-radius: 50%;
          cursor: pointer; 
          color: var(--mist); 
          font-size: 18px; 
          font-weight: bold;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: all 0.2s ease;
        }
        
        .fb-close-btn:hover { 
          background: var(--line); 
          color: var(--seal); 
        }
        
        .fb-title { 
          font-family: 'Fraunces', serif;
          font-size: 1.6rem; 
          font-weight: 700; 
          color: var(--ink); 
          margin: 0 0 0.35rem 0; 
          letter-spacing: -0.01em; 
        }
        
        .fb-sub { 
          font-size: 0.925rem; 
          color: var(--mist); 
          margin: 0 0 1.5rem 0; 
          line-height: 1.5; 
        }
        
        .fb-error {
          background-color: rgba(200, 54, 42, 0.08); 
          border-left: 4px solid var(--seal); 
          color: var(--seal);
          padding: 0.75rem 1rem; 
          border-radius: 6px; 
          margin-bottom: 1.25rem; 
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .fb-group { 
          margin-bottom: 1.25rem; 
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .fb-label { 
          display: block; 
          font-size: 0.875rem; 
          font-weight: 600; 
          color: var(--ink); 
        }
        
        .fb-input, .fb-textarea {
          width: 100%; 
          padding: 0.75rem 0.875rem; 
          border: 1px solid var(--line); 
          border-radius: 8px;
          font-size: 0.95rem; 
          box-sizing: border-box; 
          background: var(--paper); 
          color: var(--ink);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          font-family: inherit;
        }
        
        .fb-input:focus, .fb-textarea:focus {
          outline: none; 
          border-color: var(--jade); 
          box-shadow: 0 0 0 3px rgba(46, 107, 87, 0.15);
          background: var(--card);
        }
        
        .fb-textarea { 
          resize: vertical; 
          min-height: 110px; 
        }
        
        .fb-btn-submit {
          width: 100%; 
          background: var(--jade); 
          color: white !important; 
          border: none; 
          padding: 0.875rem;
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 1rem; 
          cursor: pointer;
          transition: all 0.2s ease; 
          display: flex; 
          justify-content: center; 
          align-items: center;
          box-shadow: 0 4px 12px rgba(46, 107, 87, 0.15);
        }
        
        .fb-btn-submit:hover:not(:disabled) { 
          background: #256e4e; 
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(46, 107, 87, 0.25);
        }
        
        .fb-btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .fb-btn-submit:disabled { 
          opacity: 0.6;
          cursor: not-allowed; 
          box-shadow: none;
        }
        
        .fb-success { 
          text-align: center; 
          padding: 1.5rem 0 0.5rem 0; 
        }
        
        .fb-success-icon { 
          font-size: 3rem; 
          margin-bottom: 1rem; 
          display: block; 
        }
        
        .fb-btn-close {
          background: var(--rice); 
          color: var(--ink); 
          border: 1px solid var(--line); 
          padding: 0.75rem 2rem;
          border-radius: 8px; 
          font-weight: 600; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          margin-top: 1.5rem;
        }
        
        .fb-btn-close:hover { 
          background: var(--line); 
          color: var(--seal);
        }

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

            {error && (
              <div className="fb-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

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