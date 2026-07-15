import { useState, useEffect } from 'react';
import './Register.css';

const WIDGET_WORDS = {
  zh: [
    { word: '你好', phonetic: 'nǐ hǎo', meaning: 'Hello' },
    { word: '谢谢', phonetic: 'xiè xie', meaning: 'Thank you' },
    { word: '学习', phonetic: 'xué xí', meaning: 'To learn' },
    { word: '朋友', phonetic: 'péng you', meaning: 'Friend' },
    { word: '家', phonetic: 'jiā', meaning: 'Home / Family' },
    {word: '再见', phonetic: 'zài jiàn', meaning: 'Goodbye' },
    {word: '请', phonetic: 'qǐng', meaning: 'Please'},
    {word: '对不起', phonetic: 'duì bù qǐ', meaning: 'Sorry'},
    {word: '是', phonetic: 'shì', meaning: 'Yes / To be'},
    {word: '不是', phonetic: 'bù shì', meaning: 'No / Not to be'},
    {word: '我', phonetic: 'wǒ', meaning: 'I / Me'},
    {word: '你', phonetic: 'nǐ', meaning: 'You'},
    {word: '他', phonetic: 'tā', meaning: 'He / Him'},
    {word: '她', phonetic: 'tā', meaning: 'She / Her'},
    {word: '我们', phonetic: 'wǒ men', meaning: 'We / Us'},
    {word: '他们', phonetic: 'tā men', meaning: 'They / Them'},
    {word: '这', phonetic: 'zhè', meaning: 'This'},
    {word: '那', phonetic: 'nà', meaning: 'That'},
    {word: '哪里', phonetic: 'nǎ lǐ', meaning: 'Where'},
    {word: '什么', phonetic: 'shén me', meaning: 'What'},

  ],
  ne: [
    { word: 'नमस्ते', phonetic: 'na·mas·te', meaning: 'Hello' },
  
  ]
};

function Register({ onRegistered, onBack, onSwitch }) {
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

  // Interactive widget states
  const [widgetLang, setWidgetLang] = useState('zh');
  const [widgetIndex, setWidgetIndex] = useState(0);

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

  const nextWidgetWord = () => {
    const list = WIDGET_WORDS[widgetLang];
    setWidgetIndex((prev) => (prev + 1) % list.length);
  };

  const prevWidgetWord = () => {
    const list = WIDGET_WORDS[widgetLang];
    setWidgetIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const handleLangToggle = (lang) => {
    setWidgetLang(lang);
    setWidgetIndex(0);
  };

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
      const res = await fetch('http://localhost:5001/api/auth/register', {
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

  const currentWord = WIDGET_WORDS[widgetLang][widgetIndex];

  return (
    <section className="login" style={{ padding: '40px 16px' }}>
      <div className="register-layout">
        
        {/* Left Column: Welcome & Interactive vocabulary widget */}
        <div className="register-welcome-panel">
          <div className="welcome-header">
            <h2>Learn <span>中文</span></h2>
            <p className="welcome-subtitle">
              Learning Chinese can be fun and rewarding! Start your journey with our interactive lessons and exercises.
            </p>
          </div>

          {/* Interactive widget */}
          <div className="interactive-widget">
            <div className="widget-tabs">
              <button 
                type="button"
                className={`widget-tab zh-tab ${widgetLang === 'zh' ? 'active' : ''}`}
                onClick={() => handleLangToggle('zh')}
              >
                Chinese 中文
              </button>
              <button 
                type="button"
                className={`widget-tab ne-tab ${widgetLang === 'ne' ? 'active' : ''}`}
                onClick={() => handleLangToggle('ne')}
              >
                Nepali नेपाली
              </button>
            </div>

            <div className="widget-word-container">
              <div className={`word-main ${widgetLang === 'zh' ? 'zh' : 'ne'} ${widgetLang === 'zh' ? 'zh-color' : 'ne-color'}`}>
                {currentWord.word}
              </div>
              <div className="word-phonetic">{currentWord.phonetic}</div>
              <div className="word-meaning">{currentWord.meaning}</div>
            </div>

            <div className="widget-nav">
              <button type="button" onClick={prevWidgetWord}>← Prev</button>
              <button type="button" onClick={nextWidgetWord}>Next →</button>
            </div>
          </div>

          {/* Benefits Bullet Points */}
          <div className="benefits-list">
            <div className="benefit-item">
              <div className="benefit-icon">1</div>
              <div className="benefit-content">
                <h4>Teacher-Guided Lessons</h4>
                <p>Curriculums designed by native speakers.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">2</div>
              <div className="benefit-content">
                <h4>Interactive Exercises</h4>
                <p>Retain words longer through active quizing & slides.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">3</div>
              <div className="benefit-content">
                <h4>Progress Analytics</h4>
                <p>Track your score, unlock courses, and test your skills.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="register-form-panel">
          <div className="back-btn-container">
            <button type="button" className="register-back-link" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to home
            </button>
          </div>

          <div className="register-form-header">
            <h3>Sign Up</h3>
            <p>Start your language adventure today</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            
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
                onClick={() => setShowAdminCode(!showAdminCode)}
              >
                <span>{showAdminCode ? '−' : '+'}</span> Have an invite or instructor code?
              </button>
              <div className={`instructor-code-field ${showAdminCode ? 'expanded' : ''}`}>
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
                  />
                </div>
              </div>
            </div>

            {/* Terms and conditions Checkbox */}
            <div className="checkbox-group" onClick={() => setAgreedToTerms(!agreedToTerms)}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={() => {}} /* Handled by parent div click */
                id="agree-checkbox"
              />
              <span className="checkbox-label">
                I agree to the <a href="#terms" onClick={(e) => e.stopPropagation()}>Terms of Service</a> &{' '}
                <a href="#privacy" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
              </span>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="register-error-banner" role="alert">
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
              className="submit-register-btn" 
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
              <div className="register-switch-view">
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