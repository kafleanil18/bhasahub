import { useState } from 'react';
import './Login.css';

function ForgotPassword({ onBack, onSwitch }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(window.API_BASE_URL + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send reset link');
      } else {
        setMessage(data.message || 'If an account with that email exists, a reset link has been sent.');
      }
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  };

  return (
    <section className="login" style={{ padding: '40px 16px' }}>
      <div className="login-layout">
        <div className="login-welcome-panel">
          <div className="login-welcome-content">
            <h1 className="hsk-mock-title">Learn Chinese with <span style={{ color: 'var(--seal)' }}>Anil</span> now</h1>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="back-btn-container">
            <button type="button" className="login-back-link" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to home
            </button>
          </div>

          <div className="login-form-header">
            <h3>Forgot Password</h3>
            <p>Enter your email and we'll send you a link to reset your password</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="forgot-email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="login-error-banner" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="login-success-banner" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="submit-login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            {onSwitch && (
              <div className="login-switch-view">
                Remembered your password?{' '}
                <button type="button" onClick={onSwitch}>Back to sign in</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
