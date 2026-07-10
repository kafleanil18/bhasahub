import { useState } from 'react';

function ChangePassword({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!currentPassword || !newPassword) {
      return setError('Please fill in all fields');
    }
    if (newPassword.length < 6) {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h1>Change password</h1>
        <p className="login-sub">Enter your current password and choose a new one.</p>

        {error && <p className="login-error">{error}</p>}
        {message && <p className="login-success">{message}</p>}

        <label>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </label>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <label>
          Confirm new password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>

        <button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Change password'}
        </button>
      </div>
    </div>
  );
}

export default ChangePassword;