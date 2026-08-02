import { useState, useMemo } from 'react';
import './Login.css';

function ResetPassword({ token, onDone }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength = useMemo(() => newPassword.length >= 6, [newPassword]);
  const passwordsMatch = useMemo(() => newPassword === confirm && confirm.length > 0, [newPassword, confirm]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword || !confirm) {
      setError('Please fill in both password fields');
      return;
    }
    if (!hasMinLength) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(window.API_BASE_URL + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not reset password');
      } else {
        setMessage(data.message || 'Password reset successfully. You can now log in.');
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
          <div className="login-form-header">
            <h3>Reset Password</h3>
            <p>Choose a new password for your account</p>
          </div>

          {message ? (
            <>
              <div className="login-success-banner" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{message}</span>
              </div>
              <button type="button" className="submit-login-btn" style={{ marginTop: 20 }} onClick={onDone}>
                Go to sign in
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="reset-new-password">New Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="reset-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reset-confirm-password">Confirm New Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
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

              <button type="submit" className="submit-login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;
