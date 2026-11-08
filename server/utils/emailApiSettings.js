const EmailApiSettings = require('../models/EmailApiSettings');
const google = require('./googleSmtpSettings');
const { SettingsValidationError } = google;

function readSettings() {
  return EmailApiSettings.findOne({ key: 'main' }).select('+apiKeyEncrypted').lean();
}

function publicSettings(settings) {
  return {
    provider: settings?.provider || 'resend', enabled: Boolean(settings?.enabled),
    senderEmail: settings?.senderEmail || '', senderName: settings?.senderName ?? 'Xiao Ao',
    hasApiKey: Boolean(settings?.apiKeyEncrypted), connectionError: settings?.connectionError || '',
  };
}

function prepareSettings(body, current) {
  if (!body || !['resend', 'brevo'].includes(body.provider) || typeof body.enabled !== 'boolean') throw new SettingsValidationError('Choose an email API provider and whether it is enabled.');
  if (typeof body.senderEmail !== 'string' || typeof body.senderName !== 'string') throw new SettingsValidationError('Enter your sender email and name.');
  const senderEmail = body.senderEmail.trim().toLowerCase();
  const senderName = body.senderName.trim();
  if (senderEmail.length > 254 || (senderEmail && !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(senderEmail))) throw new SettingsValidationError('Enter a valid sender email address.');
  if (senderName.length > 100 || /[\r\n<>]/.test(senderName)) throw new SettingsValidationError('Enter a sender name of up to 100 characters on one line.');
  if (body.apiKey !== undefined && typeof body.apiKey !== 'string') throw new SettingsValidationError('Enter a valid provider API key.');
  const apiKey = (body.apiKey || '').trim();
  if (apiKey && (apiKey.length < 10 || apiKey.length > 2048 || /\s/.test(apiKey))) throw new SettingsValidationError('Enter the API key issued by your email provider.');
  if (!apiKey && current?.apiKeyEncrypted && body.provider !== current.provider) throw new SettingsValidationError('Enter a new API key when changing providers.');
  const apiKeyEncrypted = apiKey ? google.encryptPassword(apiKey) : current?.apiKeyEncrypted || '';
  if (body.enabled && (!senderEmail || !apiKeyEncrypted)) throw new SettingsValidationError('Enter a sender email and API key before enabling delivery.');
  return { provider: body.provider, enabled: body.enabled, senderEmail, senderName, apiKeyEncrypted, connectionError: '' };
}

async function request(settings, path, body) {
  const resend = settings.provider === 'resend';
  const key = google.decryptPassword(settings.apiKeyEncrypted);
  let response;
  try {
    response = await fetch((resend ? 'https://api.resend.com' : 'https://api.brevo.com/v3') + path, {
      method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(resend ? { Authorization: `Bearer ${key}` } : { 'api-key': key }) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new Error('The email provider could not be reached over HTTPS. Please try again.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw new Error('The provider rejected this API key or its permissions. Check the key and sender verification.');
    if (response.status === 429) throw new Error('The provider sending or request limit has been reached. Try again later.');
    throw new Error('The email provider rejected the request. Check your verified sender and account status.');
  }
  if (!data || data.error) throw new Error('The email provider returned an invalid response.');
  return data;
}

async function verifySettings(settings) {
  if (!settings.senderEmail || !settings.apiKeyEncrypted) throw new SettingsValidationError('Enter your sender email and API key before checking.');
  if (settings.provider === 'resend') {
    const domain = settings.senderEmail.split('@')[1];
    if (['gmail.com', 'googlemail.com', 'resend.dev', 'vercel.app'].includes(domain) || domain.endsWith('.vercel.app')) throw new SettingsValidationError('Resend requires a sender on your own verified domain to email students. Gmail and resend.dev test addresses cannot be used for this.');
    let after;
    for (let page = 0; page < 10; page++) {
      const data = await request(settings, `/domains?limit=100${after ? `&after=${encodeURIComponent(after)}` : ''}`);
      if (data.data?.some(item => item.name?.toLowerCase() === domain && item.status === 'verified')) return;
      if (!data.has_more || !data.data?.length) break;
      after = data.data.at(-1).id;
    }
    throw new SettingsValidationError('Verify the sender domain in Resend first. Use a Full access API key for this sender check.');
  }
  const data = await request(settings, '/senders');
  if (!data.senders?.some(sender => sender.active === true && sender.email?.toLowerCase() === settings.senderEmail)) throw new SettingsValidationError('Add and verify this exact sender email in Brevo before enabling delivery.');
}

async function send(settings, message) {
  if (settings.provider === 'resend') {
    const from = settings.senderName ? `${JSON.stringify(settings.senderName)} <${settings.senderEmail}>` : settings.senderEmail;
    const data = await request(settings, '/emails', { from, to: message.to, subject: message.subject, ...(message.html ? { html: message.html } : {}), ...(message.text ? { text: message.text } : {}) });
    if (!data.id) throw new Error('The email provider did not confirm acceptance.');
    return;
  }
  const data = await request(settings, '/smtp/email', {
    sender: { email: settings.senderEmail, name: settings.senderName || 'Xiao Ao' },
    to: [{ email: message.to }], subject: message.subject,
    ...(message.html ? { htmlContent: message.html } : { textContent: message.text }),
  });
  if (!data.messageId) throw new Error('The email provider did not confirm acceptance.');
}

async function loadSavedEmailDelivery() {
  const settings = await readSettings();
  if (settings?.enabled) return { provider: settings.provider, send: message => send(settings, message) };
  return google.loadGoogleSmtpDelivery();
}

module.exports = { readSettings, publicSettings, prepareSettings, verifySettings, send, loadSavedEmailDelivery };
