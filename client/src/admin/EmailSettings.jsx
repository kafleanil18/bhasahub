import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './EmailSettings.css';

const API = `${window.API_BASE_URL}/api/settings/email`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
async function readResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 401 ? 'Your session expired or is invalid. Sign in again to load email settings.'
      : response.status === 403 ? 'This account does not have super admin access. Sign in with your super admin account.'
        : data?.error || `Could not load email settings (HTTP ${response.status}). Please try again.`;
    throw Object.assign(new Error(message), { status: response.status });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('The email settings service returned an unexpected response. Please try again.');
  return data;
}

export default function EmailSettings({ onBack }) {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setAuthError(false);
    fetch(API, { headers: headers(), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]) })
      .then(readResponse)
      .then(data => { if (!controller.signal.aborted) { setSaved(data); setDraft(data); } })
      .catch(err => {
        if (controller.signal.aborted) return;
        setAuthError(err.status === 401 || err.status === 403);
        setError(err.name === 'TimeoutError' ? 'The email settings service took too long to respond. It may be starting up. Please try again.' : err instanceof TypeError ? 'Could not reach the email settings service. Check your connection and try again.' : err.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  const update = (key, value) => { setDraft(current => ({ ...current, [key]: value })); setNotice(''); };
  const dirty = saved && (JSON.stringify(saved) !== JSON.stringify(draft) || Boolean(appPassword));
  const run = async action => {
    if (busy) return;
    setBusy(action); setError(''); setNotice('');
    try {
      const data = await fetch(action === 'save' ? API : `${API}/test-connection`, {
        method: action === 'save' ? 'PUT' : 'POST', headers: headers(),
        body: JSON.stringify({ enabled: draft.enabled, email: draft.email, senderName: draft.senderName, port: draft.port, appPassword }),
        signal: AbortSignal.timeout(45000),
      }).then(readResponse);
      if (action === 'save') {
        setSaved(data); setDraft(data); setAppPassword('');
        setNotice(data.enabled ? 'Google SMTP is enabled. Verification and password-reset emails will use this account.' : 'Settings saved. Google SMTP is disabled.');
      } else setNotice(data.message);
    } catch (err) { setError(err.name === 'TimeoutError' ? 'The connection took too long. Please try again.' : err.message || 'Could not reach the server. Please try again.'); }
    finally { setBusy(''); }
  };

  return <section className="container email-settings" aria-labelledby="email-settings-title">
    <button className="email-back" disabled={Boolean(busy)} onClick={onBack}>← Back to control center</button>
    <div className="email-heading"><div><h1 id="email-settings-title">Email settings</h1><p>Connect Google to send account emails and Chinese practice reminders.</p></div>{saved && <span className="email-status">{saved.enabled ? 'Google SMTP enabled' : 'Google SMTP disabled'}</span>}</div>
    {error && <div className="email-message email-error" role="alert">{error}{authError && <p><button className="email-button" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.assign('/sign-in?next=%2Fadmin%2Fsettings%2Femail'); }}>Sign in again</button></p>}</div>}
    {notice && <div className="email-message" role="status">{notice}</div>}
    {loading ? <p role="status" className="email-loading">Loading email settings…</p> : !draft ? <button className="email-button" onClick={() => setRetry(value => value + 1)}>Try again</button> : <div className="email-layout">
      <form className="email-form" onSubmit={event => { event.preventDefault(); run('save'); }}>
        <fieldset disabled={Boolean(busy)}>
          <legend>Google SMTP</legend>
          <label className="email-toggle" htmlFor="google-smtp-enabled"><span><strong>Enable Google SMTP</strong><small>Use this account for all system emails after saving.</small></span><input id="google-smtp-enabled" type="checkbox" role="switch" checked={draft.enabled} onChange={event => update('enabled', event.target.checked)} /></label>
          <div className="email-field"><label htmlFor="smtp-email">Google email address</label><input id="smtp-email" type="email" autoComplete="off" placeholder="you@gmail.com" maxLength={254} value={draft.email} required={draft.enabled} onChange={event => update('email', event.target.value)} /><small>Gmail or a Google Workspace account with app passwords available.</small></div>
          <div className="email-field"><label htmlFor="smtp-sender">Sender name</label><input id="smtp-sender" maxLength={100} placeholder="Xiao Ao" value={draft.senderName} onChange={event => update('senderName', event.target.value)} /><small>Recipients see this name alongside your Google email address.</small></div>
          <div className="email-field"><label htmlFor="smtp-app-password">Google app password</label><input id="smtp-app-password" type="password" autoComplete="new-password" aria-describedby="smtp-password-help" value={appPassword} placeholder={saved.hasAppPassword ? 'Saved password — enter only to replace' : '16-character app password'} required={draft.enabled && (!saved.hasAppPassword || draft.email.trim().toLowerCase() !== saved.email)} onChange={event => { setAppPassword(event.target.value); setNotice(''); }} /><small id="smtp-password-help">{saved.hasAppPassword ? 'A password is saved. Leave this blank to keep it, or enter a replacement.' : 'Create an app password in your Google account. Use it here instead of your regular Google password.'}</small></div>
          <div className="email-field"><label htmlFor="smtp-port">Secure connection</label><select id="smtp-port" value={draft.port} onChange={event => update('port', Number(event.target.value))}><option value={465}>SSL/TLS · Port 465</option><option value={587}>STARTTLS · Port 587</option></select><small>Server: smtp.gmail.com. Both options use encryption.</small></div>
          <div className="email-actions"><button className="email-button email-primary" type="submit">{busy === 'save' ? draft.enabled ? 'Verifying and saving…' : 'Saving…' : 'Save settings'}</button><button className="email-button" type="button" onClick={() => run('test')}>{busy === 'test' ? 'Testing connection…' : 'Test connection'}</button>{dirty && <span className="email-unsaved">Unsaved changes</span>}</div>
        </fieldset>
        <p className="email-footnote">Connection tests do not send email or save changes. Enabling Google SMTP verifies your credentials before saving.</p>
        <p className="email-footnote"><Link to="/admin/reminders">Send practice reminders to subscribed students →</Link></p>
      </form>
      <aside className="email-guide" aria-labelledby="google-setup-title"><h2 id="google-setup-title">Set up your Google account</h2><ol><li>Turn on 2-Step Verification for the Google account you want to send from.</li><li><a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">Create an app password</a> for this system.</li><li>Enter the email address and app password here, enable Google SMTP, and save.</li></ol><p>Your app password is encrypted when saved and is never shown again.</p><p>If app passwords are unavailable, check your Google account or Workspace policies.</p><a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer">Google’s app password guide ↗</a><hr /><p>Changes apply immediately. Turning Google SMTP off restores the server’s default email service, if configured.</p></aside>
    </div>}
  </section>;
}
