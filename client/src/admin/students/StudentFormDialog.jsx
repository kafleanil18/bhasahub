import { useState } from 'react';
import AccessDialog from '../subscriptions/AccessDialog';

// Add a student, or edit one (name, email, optional new password).
export default function StudentFormDialog({ student, busy, error, onSave, onClose }) {
  const editing = !!student;
  const [name, setName] = useState(student?.name || '');
  const [email, setEmail] = useState(student?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const google = student?.authProvider === 'google';
  const passwordOk = editing ? !password || password.length >= 8 : password.length >= 8;
  const canSave = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && passwordOk && !busy;
  return <AccessDialog title={editing ? `Edit ${student.name}` : 'Add a student'} description={editing ? 'Update their details. Leave the password empty to keep the current one.' : 'They can sign in straight away with this email and password. Share the password with them privately.'} busy={busy} onClose={onClose}>
    <form className="student-form" onSubmit={event => { event.preventDefault(); if (canSave) onSave({ name: name.trim(), email: email.trim(), ...(password ? { password } : {}) }); }}>
      <fieldset disabled={busy}>
        <label>Full name<input autoFocus value={name} onChange={event => setName(event.target.value)} autoComplete="off" required/></label>
        <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" required/></label>
        <div className="student-field">
          <label htmlFor="student-password">{editing ? 'New password (optional)' : 'Password'}</label>
          <span className="student-password"><input id="student-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" aria-describedby="student-password-help" required={!editing}/><button type="button" className="access-link" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button></span>
          <small id="student-password-help" className="access-help">{password && password.length < 8 ? `${8 - password.length} more characters needed.` : 'At least 8 characters.'}{editing && google ? ' This student signs in with Google; a password adds email sign-in too.' : ''}</small>
        </div>
      </fieldset>
      {error && <p className="access-feedback is-error" role="alert">{error}</p>}
      <div className="access-dialog-actions"><button type="button" className="access-button" disabled={busy} onClick={onClose}>Cancel</button><button className="access-button is-primary" disabled={!canSave}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create student'}</button></div>
    </form>
  </AccessDialog>;
}
