import BrandLogo from '../components/BrandLogo';
import { useState, useEffect } from 'react';
import './Register.css';
import './Login.css';
import GoogleAuthButton from './GoogleAuthButton';

function Register({ onRegistered, onBack, onSwitch, onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // UX states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Password strength calculation
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: 'Very Weak' });

  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, text: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let text = 'Weak';
    if (score === 3) text = 'Medium';
    if (score >= 4) text = 'Strong';

    setPasswordStrength({ score, text });
  }, [password]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(window.API_BASE_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          adminCode: showAdminCode ? adminCode : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        onRegistered();
      }
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  };


  return (
    <section className="login signin-page signup-page" aria-labelledby="signup-title">
      <div className="login-layout">

        <div className="login-welcome-panel">
          <button type="button" className="login-brand" onClick={onBack} aria-label="Xiao Ao home">
            <BrandLogo tone="light" decorative />
          </button>
          <div className="login-welcome-content">
            <h2 className="signin-welcome-title">Your Chinese<br />journey starts here.</h2>
            <p className="signin-welcome-description">Learn at your own pace, one lesson at a time.</p>
          </div>
        </div>

        {/* Right Column: Interactive Form */}
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
            <h1 id="signup-title">Create an account</h1>
            <p>Start learning Chinese with Xiao Ao.</p>
          </div>

          <GoogleAuthButton
            mode="signup"
            onSuccess={(u) => (onLogin ? onLogin(u) : onRegistered())}
            onError={(msg) => setError(msg)}
            setLoading={setLoading}
          />

          <div className="auth-divider">
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>

            {/* Name Input */}
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="password-field"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="password-strength-container">
                  <div className="strength-bar-wrapper">
                    <div className={`strength-segment ${passwordStrength.score >= 1 ? (passwordStrength.score <= 2 ? 'active-weak' : passwordStrength.score === 3 ? 'active-medium' : 'active-strong') : ''}`}></div>
                    <div className={`strength-segment ${passwordStrength.score >= 2 ? (passwordStrength.score <= 2 ? 'active-weak' : passwordStrength.score === 3 ? 'active-medium' : 'active-strong') : ''}`}></div>
                    <div className={`strength-segment ${passwordStrength.score >= 3 ? (passwordStrength.score === 3 ? 'active-medium' : 'active-strong') : ''}`}></div>
                    <div className={`strength-segment ${passwordStrength.score >= 4 ? 'active-strong' : ''}`}></div>
                  </div>
                  <div className="strength-label">
                    <span>Strength:</span>
                    <span className={`strength-text ${passwordStrength.text.toLowerCase()}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="password-field"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
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

            {/* Instructor Secret Code Toggle */}
            <div className="form-group" style={{ gap: '0px' }}>
              <button
                type="button"
                className="instructor-code-toggle"
                aria-expanded={showAdminCode}
                aria-controls="signup-instructor-code"
                onClick={() => setShowAdminCode(!showAdminCode)}
              >
                <span>{showAdminCode ? '−' : '+'}</span> Have an invite or instructor code?
              </button>
              <div id="signup-instructor-code" inert={!showAdminCode} className={`instructor-code-field ${showAdminCode ? 'expanded' : ''}`}>
                <div className="input-wrapper" style={{ marginTop: '6px' }}>
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type="text"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter teacher/admin invitation code"
                    aria-label="Instructor invitation code"
                  />
                </div>
              </div>
            </div>

            {/* Terms and conditions Checkbox */}
            <div className="checkbox-group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                id="agree-checkbox"
              />
              <label htmlFor="agree-checkbox" className="checkbox-label">
                I agree to the <a href="#terms" onClick={(e) => e.stopPropagation()}>Terms of Service</a> &{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" aria-label="Privacy Policy (opens in a new tab)" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
              </label>
            </div>

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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            {onSwitch && (
              <div className="login-switch-view">
                Already have an account?{' '}
                <button type="button" onClick={onSwitch}>Sign in</button>
              </div>
            )}

          </form>
        </div>

      </div>
    </section>
  );
}

export default Register;
