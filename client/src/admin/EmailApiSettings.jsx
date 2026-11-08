import { useEffect, useState } from 'react';

const API = `${window.API_BASE_URL}/api/settings/email-api`;
async function request(path = '', body) {
  const response = await fetch(API + path, {
    method: body ? path ? 'POST' : 'PUT' : 'GET',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Could not reach the email API settings service. Please try again.');
  if (!data || Array.isArray(data) || typeof data.enabled !== 'boolean' && !data.message) throw new Error('Email API settings are unavailable. Please refresh.');
  return data;
}

export default function EmailApiSettings() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState('load');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy('load'); setError('');
    request().then(data => { if (active) { setSaved(data); setDraft(data); setError(data.connectionError || ''); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(''); });
    return () => { active = false; };
  }, [retry]);
  const update = (key, value) => { setDraft(current => ({ ...current, [key]: value })); setNotice(''); };
  const run = async action => {
    if (busy) return;
    setBusy(action); setError(''); setNotice('');
    try {
      const data = await request(action === 'check' ? '/check' : '', { provider: draft.provider, enabled: draft.enabled, senderEmail: draft.senderEmail, senderName: draft.senderName, apiKey });
      if (action === 'save') {
        setSaved(data); setDraft(data); setApiKey(''); setError(data.connectionError || '');
        setNotice(data.enabled ? `${data.provider === 'resend' ? 'Resend' : 'Brevo'} HTTPS email is enabled for account emails and practice reminders.` : 'Email API settings saved securely. Delivery is disabled.');
      } else setNotice(data.message);
    } catch (err) { setError(err.name === 'TimeoutError' ? 'The provider check took too long. Please try again.' : err.message); }
    finally { setBusy(''); }
  };

  return <section className="email-api-settings" aria-labelledby="email-api-title">
    <div className="email-heading"><div><h2 id="email-api-title">Email API for free hosting</h2><p>Send over HTTPS with Resend or Brevo. Your hosting plan stays unchanged.</p></div>{saved && <span className="email-status">{saved.enabled ? `${saved.provider === 'resend' ? 'Resend' : 'Brevo'} enabled` : 'Email API disabled'}</span>}</div>
    {error && <div className="email-message email-error" role="alert">{error}</div>}
    {notice && <div className="email-message" role="status">{notice}</div>}
    {busy === 'load' ? <p role="status">Loading email API settings…</p> : !draft ? <button className="email-button" onClick={() => setRetry(value => value + 1)}>Retry email API settings</button> : <div className="email-layout">
      <form className="email-form" onSubmit={event => { event.preventDefault(); run('save'); }}>
        <fieldset disabled={Boolean(busy)}><legend>HTTPS delivery</legend>
          <div className="email-field"><label htmlFor="email-api-provider">Email API provider</label><select id="email-api-provider" value={draft.provider} onChange={event => update('provider', event.target.value)}><option value="resend">Resend</option><option value="brevo">Brevo</option></select></div>
          <label className="email-toggle" htmlFor="email-api-enabled"><span><strong>Enable HTTPS email delivery</strong><small>When enabled, this service takes priority over Google SMTP.</small></span><input id="email-api-enabled" type="checkbox" role="switch" checked={draft.enabled} onChange={event => update('enabled', event.target.checked)} /></label>
          <div className="email-field"><label htmlFor="email-api-sender">Verified sender email</label><input id="email-api-sender" type="email" autoComplete="off" maxLength={254} required={draft.enabled} value={draft.senderEmail} placeholder="teacher@yourdomain.com" onChange={event => update('senderEmail', event.target.value)} /><small>{draft.provider === 'resend' ? 'Use an address on a domain you own and have verified in Resend. A Gmail address or Vercel subdomain will not work.' : 'Add and verify this exact sender in Brevo. Your account must be approved for sending.'}</small></div>
          <div className="email-field"><label htmlFor="email-api-name">API sender name</label><input id="email-api-name" maxLength={100} value={draft.senderName} onChange={event => update('senderName', event.target.value)} /></div>
          <div className="email-field"><label htmlFor="email-api-key">Provider API key</label><input id="email-api-key" type="password" autoComplete="new-password" aria-describedby="email-api-key-help" value={apiKey} placeholder={saved.hasApiKey ? 'Saved key — enter only to replace' : 'Paste the API key from your provider'} required={draft.enabled && (!saved.hasApiKey || draft.provider !== saved.provider)} onChange={event => setApiKey(event.target.value)} /><small id="email-api-key-help">{saved.hasApiKey ? 'An API key is saved. Leave blank to keep it for the same provider.' : 'Keys are encrypted on the server and never shown again.'}</small></div>
          <div className="email-actions"><button className="email-button email-primary" type="submit">{busy === 'save' ? 'Checking and saving…' : 'Save email API settings'}</button><button className="email-button" type="button" onClick={() => run('check')}>{busy === 'check' ? 'Checking provider…' : 'Check provider'}</button></div>
        </fieldset>
        <p className="email-footnote">Provider checks verify the API key and sender without sending email. Failed first-time verification saves a disabled draft. Saved Google SMTP credentials are preserved.</p>
      </form>
      <aside className="email-guide"><h3>Connect your email provider</h3><ol><li>Create an account with <a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a> or <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer">Brevo</a>.</li><li>{draft.provider === 'resend' ? <>Verify your own sending domain in Resend and create a Full access API key so the sender check can read domain status.</> : <>Add your sender email in Brevo and complete its verification. Create an API key in the SMTP & API settings.</>}</li><li>Enter the verified sender and API key here. Enable HTTPS delivery and save.</li><li>Open <a href="/admin/reminders">Practice reminders</a>, select students, and review before sending.</li></ol><p>Provider account approval and sending limits still apply. This feature does not upgrade hosting or purchase an email plan.</p></aside>
    </div>}
  </section>;
}
