import { useState } from 'react';

function Login({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
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
        onLogin(data.user);
      }
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  };

  return (
    <section className="login">
      <div className="login-card">
        <button className="back-btn" onClick={onBack}>← Back to home</button>
        <h1>Welcome back</h1>
        <p className="login-sub">Sign in to continue learning</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </section>
  );
}

export default Login;