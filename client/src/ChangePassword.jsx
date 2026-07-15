import { useState, useMemo } from 'react';

function ChangePassword({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // States to toggle password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = localStorage.getItem('token');

  // Password Validation
  const hasMinLength = useMemo(() => newPassword.length >= 6, [newPassword]);
  const passwordsMatch = useMemo(() => newPassword === confirm && confirm.length > 0, [newPassword, confirm]);

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!currentPassword || !newPassword) {
      return setError('Please fill in all fields');
    }
    if (!hasMinLength) {
      return setError('New password must be at least 6 characters');
    }
    if (newPassword !== confirm) {
      return setError('New passwords do not match');
    }
    
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not change password');
      } else {
        setMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirm('');
      }
    } catch {
      setError('Could not reach the server');
    }
    setSaving(false);
  };

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <style>{`
        .cp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(42, 35, 32, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
          animation: cp-fade-in 0.2s ease-out;
        }

        .cp-card {
          background: var(--card, #fffdf8);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 20px;
          padding: 2.25rem 2rem;
          width: 100%;
          max-width: 440px;
          position: relative;
          box-shadow: 0 20px 40px rgba(42, 35, 32, 0.12);
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          animation: cp-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cp-slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .cp-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--paper, #faf6ec);
          border: 1px solid var(--line, #e6dcc6);
          color: var(--mist, #7a7266);
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cp-close-btn:hover {
          background: var(--line, #e6dcc6);
          color: var(--seal, #c8362a);
          transform: rotate(90deg);
        }

        .cp-icon-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.75rem;
          text-align: center;
        }

        .cp-lock-badge {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal, #c8362a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          margin-bottom: 1rem;
          box-shadow: 0 4px 12px rgba(200, 54, 42, 0.05);
        }

        .cp-card h1 {
          font-family: 'Fraunces', serif;
          font-size: 1.6rem;
          font-weight: 750;
          color: var(--ink, #2a2320);
          margin: 0;
        }

        .cp-sub {
          color: var(--mist, #7a7266);
          font-size: 0.9rem;
          margin-top: 0.35rem;
          line-height: 1.4;
        }

        .cp-alert {
          padding: 0.85rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          line-height: 1.4;
        }

        .cp-alert-error {
          background: rgba(200, 54, 42, 0.05);
          border-left: 3px solid var(--seal, #c8362a);
          color: var(--seal, #c8362a);
        }

        .cp-alert-success {
          background: rgba(46, 107, 87, 0.05);
          border-left: 3px solid var(--jade, #2e6b57);
          color: var(--jade, #2e6b57);
        }

        .cp-form-group {
          margin-bottom: 1.25rem;
          position: relative;
        }

        .cp-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cp-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .cp-input {
          width: 100%;
          padding: 0.8rem 2.75rem 0.8rem 1rem;
          border: 1px solid var(--line, #e6dcc6);
          background: var(--paper, #faf6ec);
          border-radius: 10px;
          font-size: 0.95rem;
          color: var(--ink, #2a2320);
          box-sizing: border-box;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .cp-input:focus {
          outline: none;
          border-color: var(--jade, #2e6b57);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        .cp-toggle-pwd {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--mist, #7a7266);
          cursor: pointer;
          font-size: 1.1rem;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .cp-toggle-pwd:hover {
          color: var(--ink, #2a2320);
        }

        /* Password rules list */
        .cp-validation-list {
          margin-top: 0.5rem;
          padding-left: 0.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .cp-val-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--mist, #7a7266);
          transition: color 0.2s;
        }

        .cp-val-item.checked {
          color: var(--jade, #2e6b57);
        }

        .cp-val-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--line, #e6dcc6);
          transition: background-color 0.2s;
        }

        .cp-val-item.checked .cp-val-dot {
          background: var(--jade, #2e6b57);
        }

        .cp-btn-submit {
          width: 100%;
          background-color: var(--jade, #2e6b57);
          color: white;
          border: none;
          padding: 0.85rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          margin-top: 1.5rem;
          box-shadow: 0 4px 14px rgba(46, 107, 87, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .cp-btn-submit:hover:not(:disabled) {
          background-color: #245444;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(46, 107, 87, 0.3);
        }

        .cp-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>

      <div className="cp-card" onClick={(e) => e.stopPropagation()}>
        <button className="cp-close-btn" onClick={onClose} aria-label="Close">✕</button>
        
        <div className="cp-icon-header">
          <div className="cp-lock-badge">🔒</div>
          <h1>Change Password</h1>
          <p className="cp-sub">Protect your account with a secure credentials update.</p>
        </div>

        {error && (
          <div className="cp-alert cp-alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {message && (
          <div className="cp-alert cp-alert-success">
            <span>✅</span>
            <span>{message}</span>
          </div>
        )}

        <div className="cp-form-group">
          <label className="cp-label">Current Password</label>
          <div className="cp-input-container">
            <input 
              type={showCurrent ? 'text' : 'password'} 
              className="cp-input" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder="••••••••"
            />
            <button 
              type="button" 
              className="cp-toggle-pwd" 
              onClick={() => setShowCurrent(!showCurrent)}
              title={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? '👁️' : '🙈'}
            </button>
          </div>
        </div>

        <div className="cp-form-group">
          <label className="cp-label">New Password</label>
          <div className="cp-input-container">
            <input 
              type={showNew ? 'text' : 'password'} 
              className="cp-input" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="••••••••"
            />
            <button 
              type="button" 
              className="cp-toggle-pwd" 
              onClick={() => setShowNew(!showNew)}
              title={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? '👁️' : '🙈'}
            </button>
          </div>
          
          <div className="cp-validation-list">
            <div className={`cp-val-item ${hasMinLength ? 'checked' : ''}`}>
              <div className="cp-val-dot"></div>
              <span>At least 6 characters</span>
            </div>
          </div>
        </div>

        <div className="cp-form-group">
          <label className="cp-label">Confirm New Password</label>
          <div className="cp-input-container">
            <input 
              type={showConfirm ? 'text' : 'password'} 
              className="cp-input" 
              value={confirm} 
              onChange={(e) => setConfirm(e.target.value)} 
              placeholder="••••••••"
            />
            <button 
              type="button" 
              className="cp-toggle-pwd" 
              onClick={() => setShowConfirm(!showConfirm)}
              title={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? '👁️' : '🙈'}
            </button>
          </div>

          <div className="cp-validation-list">
            <div className={`cp-val-item ${passwordsMatch ? 'checked' : ''}`}>
              <div className="cp-val-dot"></div>
              <span>Passwords match</span>
            </div>
          </div>
        </div>

        <button 
          className="cp-btn-submit" 
          onClick={handleSubmit} 
          disabled={saving || !currentPassword || !newPassword || !confirm || !hasMinLength || newPassword !== confirm}
        >
          {saving ? 'Updating Credentials...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}

export default ChangePassword;