const crypto = require('crypto');
const EmailSettings = require('../models/EmailSettings');

class SettingsValidationError extends Error {}

function encryptionKey() {
  const secret = process.env.EMAIL_SETTINGS_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error('Email settings encryption is not configured');
  return crypto.createHash('sha256').update(`google-smtp:${secret}`).digest();
}

function encryptPassword(password) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64')).join('.');
}

function decryptPassword(value) {
  const [iv, tag, ciphertext] = value.split('.').map(part => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function readSettings() {
  return EmailSettings.findOne({ key: 'google-smtp' }).select('+appPasswordEncrypted').lean();
}

function publicSettings(settings) {
  return {
    enabled: Boolean(settings?.enabled),
    email: settings?.email || '',
    senderName: settings?.senderName ?? 'Xiao Ao',
    port: settings?.port || 465,
    hasAppPassword: Boolean(settings?.appPasswordEncrypted),
  };
}

function prepareSettings(body, current) {
  if (!body || typeof body.enabled !== 'boolean') throw new SettingsValidationError('Choose whether Google SMTP is enabled.');
  if (typeof body.email !== 'string' || typeof body.senderName !== 'string') {
    throw new SettingsValidationError('Enter a Google email address and sender name.');
  }
  const email = body.email.trim().toLowerCase();
  const senderName = body.senderName.trim();
  if (email && (email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email))) {
    throw new SettingsValidationError('Enter a valid Google email address.');
  }
  if (senderName.length > 100 || /[\r\n]/.test(senderName)) throw new SettingsValidationError('Sender name must be at most 100 characters on one line.');
  if (![465, 587].includes(body.port)) throw new SettingsValidationError('Choose port 465 or 587.');
  if (body.appPassword !== undefined && typeof body.appPassword !== 'string') {
    throw new SettingsValidationError('Enter a valid Google app password.');
  }
  const password = (body.appPassword || '').replace(/\s/g, '');
  if (password && !/^[a-zA-Z0-9]{16}$/.test(password)) {
    throw new SettingsValidationError('Google app passwords contain 16 characters. Paste the app password from your Google account.');
  }
  if (!password && current?.appPasswordEncrypted && email !== current.email) {
    throw new SettingsValidationError('Enter a new app password when changing the Google email address.');
  }
  const appPasswordEncrypted = password ? encryptPassword(password) : current?.appPasswordEncrypted || '';
  if (body.enabled && (!email || !appPasswordEncrypted)) throw new SettingsValidationError('Enter a Google email address and app password before enabling SMTP.');
  return { enabled: body.enabled, email, senderName, port: body.port, appPasswordEncrypted };
}

function googleDelivery(settings) {
  if (!settings?.email || !settings?.appPasswordEncrypted) {
    throw new SettingsValidationError('Enter a Google email address and app password before testing.');
  }
  return {
    from: { name: settings.senderName, address: settings.email },
    options: {
      host: 'smtp.gmail.com',
      port: settings.port,
      secure: settings.port === 465,
      requireTLS: settings.port === 587,
      auth: { user: settings.email, pass: decryptPassword(settings.appPasswordEncrypted) },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    },
  };
}

async function loadGoogleSmtpDelivery() {
  const settings = await readSettings();
  return settings?.enabled ? googleDelivery(settings) : null;
}

module.exports = { SettingsValidationError, encryptPassword, decryptPassword, readSettings, publicSettings, prepareSettings, googleDelivery, loadGoogleSmtpDelivery };
