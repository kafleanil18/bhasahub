import { useState, useEffect } from 'react';
import './Login.css';
import GoogleAuthButton from './GoogleAuthButton';
import { loadRememberedEmail, saveRememberedEmail } from './rememberedEmail';

function Login({ onLogin, onBack, onSwitch, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // UX states
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e, resend = false) => {
    if (e) e.preventDefault();
    setError('');
    setNotice('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(window.API_BASE_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(verificationRequired && !resend ? { otp } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else if (data.verificationRequired) {
        setVerificationRequired(true);
        setOtp('');
        setNotice(data.message);
        setCooldown(data.retryAfter || 60);
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        saveRememberedEmail(localStorage, rememberMe ? email : '');

        onLogin(data.user);
      }
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  };

  // Remember only the email; passwords belong in the browser's password manager.
  useEffect(() => {
    const savedEmail = loadRememberedEmail(localStorage);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <section className="login signin-page" aria-labelledby={verificationRequired ? 'signin-title' : undefined} aria-label={verificationRequired ? undefined : 'Sign in'}>
      <div className="login-layout">
        
        {/* Left Column: Portrait & Heading */}
        <div className="login-welcome-panel">
          <button type="button" className="login-brand" onClick={onBack} aria-label="Xiao Ao home">
            <span className="login-brand-seal" aria-hidden="true">XA</span>
            <span>Xiao <span>Ao</span></span>
          </button>
          <div className="login-welcome-content">
            <h2 className="signin-welcome-title">We guarantee<br />your HSK exam.</h2>
            <div className="signin-pass-badge" aria-label="Pass with confidence">
              <span>PASS</span>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form */}
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

          {verificationRequired && (
            <div className="login-form-header">
              <h1 id="signin-title">Verify your email</h1>
              <p>{`Enter the code sent to ${email}. You only need to verify once.`}</p>
            </div>
          )}

          {!verificationRequired && <>
          <GoogleAuthButton
            mode="signin"
            onSuccess={onLogin}
            onError={(msg) => setError(msg)}
            setLoading={setLoading}
          />

          <div className="auth-divider">
            <span>or</span>
          </div>

          </>}

          <form onSubmit={handleSubmit} className="login-form" aria-busy={loading}>
            
            {!verificationRequired && <>
            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="password-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Actions: Remember Me & Forgot Password */}
            <div className="login-actions">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember my email</span>
              </label>
              <a href="#forgot" className="forgot-password-link" onClick={(e) => { e.preventDefault(); onForgotPassword?.(); }}>
                Forgot password?
              </a>
            </div>

            </>}

            {verificationRequired && <>
              <div className="form-group">
                <label htmlFor="email-verification-code">Six-digit verification code</label>
                <input id="email-verification-code" type="text" inputMode="numeric"
                  autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus required aria-describedby="verification-help" />
                <p id="verification-help">The code expires in 10 minutes. Check your spam folder too.</p>
              </div>
              <div className="login-actions">
                <button type="button" disabled={loading || cooldown > 0} onClick={() => handleSubmit(null, true)}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <button type="button" disabled={loading} onClick={() => { setVerificationRequired(false); setOtp(''); setError(''); setNotice(''); }}>Back to sign in</button>
              </div>
            </>}
            {notice && <div className="login-success-banner" role="status">{notice}</div>}

            {/* Error Banner */}
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

            {/* Submit Button */}
            <button 
              type="submit" 
              className="submit-login-btn" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>{verificationRequired ? 'Verifying...' : 'Signing In...'}</span>
                </>
              ) : (
                <span>{verificationRequired ? 'Verify and sign in' : 'Sign In'}</span>
              )}
            </button>

            {/* Switch view link */}
            {onSwitch && (
              <div className="login-switch-view">
                New here?{' '}
                <button type="button" onClick={onSwitch}>Create an account</button>
              </div>
            )}

          </form>
        </div>

      </div>
    </section>
  );
}

export default Login;
