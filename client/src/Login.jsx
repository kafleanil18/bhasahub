import { useState, useEffect } from 'react';
import './Login.css';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What is the English translation for the Nepali word 'धन्यवाद' (dhan·ya·bād)?",
    options: ["Hello", "Thank you", "Goodbye", "Friend"],
    correctAnswer: "Thank you",
    explanation: "Correct! 'धन्यवाद' translates directly to 'Thank you' in English."
  },
  {
    id: 2,
    question: "What is the Pinyin pronunciation for the Chinese word '朋友'?",
    options: ["nǐ hǎo", "xiè xie", "zài jiàn", "péng you"],
    correctAnswer: "péng you",
    explanation: "Correct! '朋友' (péng you) means 'Friend' in Chinese."
  },
  {
    id: 3,
    question: "What does the Chinese word '家' (jiā) mean?",
    options: ["Water", "Friend", "Home / Family", "To eat"],
    correctAnswer: "Home / Family",
    explanation: "Correct! '家' (jiā) represents family, home, or house."
  },
  {
    id: 4,
    question: "What is the English translation for the Nepali greeting 'नमस्ते' (na·mas·te)?",
    options: ["Thank you", "Friend", "Hello", "Goodbye"],
    correctAnswer: "Hello",
    explanation: "Correct! 'नमस्ते' is the standard respectful greeting for 'Hello' in Nepali."
  }
];

function Login({ onLogin, onBack, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // UX states
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizStatus, setQuizStatus] = useState(null); // 'correct' or 'incorrect'

  useEffect(() => {
    // Select a random quiz to start
    setQuizIndex(Math.floor(Math.random() * QUIZ_QUESTIONS.length));
  }, []);

  const handleOptionClick = (option) => {
    if (quizStatus === 'correct') return; // Locked once correct
    setSelectedOption(option);
    const quiz = QUIZ_QUESTIONS[quizIndex];
    if (option === quiz.correctAnswer) {
      setQuizStatus('correct');
    } else {
      setQuizStatus('incorrect');
    }
  };

  const nextQuizQuestion = () => {
    setSelectedOption(null);
    setQuizStatus(null);
    setQuizIndex((prev) => (prev + 1) % QUIZ_QUESTIONS.length);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        onLogin(data.user);
      }
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  };

  // Pre-fill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const currentQuiz = QUIZ_QUESTIONS[quizIndex] || QUIZ_QUESTIONS[0];

  return (
    <section className="login" style={{ padding: '40px 16px' }}>
      <div className="login-layout">
        
        {/* Left Column: Interactive Welcome Panel */}
        <div className="login-welcome-panel">
          <div className="login-welcome-header">
            <h2>Welcome <span>Back</span></h2>
            <p className="login-welcome-subtitle">
              Sign in to continue your path towards Chinese and Nepali language fluency.
            </p>
          </div>

          {/* Interactive Quiz Widget */}
          <div className="quiz-widget">
            <span className="quiz-badge">Language Challenge</span>
            <div className="quiz-question">{currentQuiz.question}</div>
            
            <div className="quiz-options">
              {currentQuiz.options.map((option, idx) => {
                let btnClass = '';
                if (selectedOption === option) {
                  btnClass = quizStatus === 'correct' ? 'selected-correct' : 'selected-incorrect';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`quiz-option-btn ${btnClass}`}
                    onClick={() => handleOptionClick(option)}
                    disabled={quizStatus === 'correct' && option !== selectedOption}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {quizStatus && (
              <div className={`quiz-feedback ${quizStatus}`}>
                {quizStatus === 'correct' ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{currentQuiz.explanation}</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Incorrect. Give it another try!</span>
                  </>
                )}
              </div>
            )}

            {(quizStatus === 'correct' || quizStatus === 'incorrect') && (
              <button type="button" className="quiz-reset-btn" onClick={nextQuizQuestion}>
                {quizStatus === 'correct' ? 'Next Challenge →' : 'Skip / Try another'}
              </button>
            )}
          </div>

          {/* Cultural Proverb */}
          <div className="login-quote">
            <p>“To learn a language is to have one more window from which to look at the world.”</p>
            <span>— Chinese Proverb</span>
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

          <div className="login-form-header">
            <h3>Sign In</h3>
            <p>Access your courses and track your progress</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                  className="password-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
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
            </div>

            {/* Actions: Remember Me & Forgot Password */}
            <div className="login-actions">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-password-link" onClick={(e) => { e.preventDefault(); alert("Please contact your instructor or admin to reset password."); }}>
                Forgot password?
              </a>
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
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
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