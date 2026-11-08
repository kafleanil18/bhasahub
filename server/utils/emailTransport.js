const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let smtp;
let resend;
let emailSettingsLoader = async () => null;

function setEmailSettingsLoader(loader) {
  emailSettingsLoader = loader;
}

async function isEmailConfigured() {
  return Boolean(await emailSettingsLoader() || process.env.SMTP_HOST || process.env.RESEND_API_KEY);
}

function booleanSetting(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be true or false`);
}

async function getDelivery() {
  const google = await emailSettingsLoader();
  if (google?.send) return google;
  if (google) return { provider: 'Google SMTP', from: google.from, smtp: nodemailer.createTransport(google.options) };
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (SMTP_HOST || SMTP_USER || SMTP_PASS) {
    if (!SMTP_HOST) throw new Error('SMTP_HOST is required for SMTP delivery');
    if (Boolean(SMTP_USER) !== Boolean(SMTP_PASS)) {
      throw new Error('Set both SMTP_USER and SMTP_PASS, or leave both empty for an unauthenticated relay');
    }
    const from = EMAIL_FROM || SMTP_USER;
    if (!from) throw new Error('EMAIL_FROM is required for SMTP delivery without SMTP_USER');
    if (!smtp) {
      const port = Number(process.env.SMTP_PORT || 587);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('SMTP_PORT must be an integer between 1 and 65535');
      }
      const secure = booleanSetting('SMTP_SECURE', port === 465);
      smtp = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        requireTLS: booleanSetting('SMTP_REQUIRE_TLS', !secure),
        ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      });
    }
    return { provider: 'SMTP', from, smtp };
  }
  if (process.env.RESEND_API_KEY) {
    resend ||= new Resend(process.env.RESEND_API_KEY);
    return { provider: 'Resend', from: EMAIL_FROM || 'onboarding@resend.dev', resend };
  }
  return null;
}

async function sendEmail(message, developmentMessage, { requireDelivery = false } = {}) {
  const delivery = await getDelivery();
  if (!delivery) {
    if (requireDelivery || process.env.NODE_ENV === 'production') throw new Error('Email delivery is not configured');
    console.warn(developmentMessage);
    return;
  }
  const payload = { ...message, from: delivery.from };
  if (delivery.send) return delivery.send(message);
  if (delivery.smtp) {
    const info = await delivery.smtp.sendMail(payload);
    if (info.rejected?.length) throw new Error('SMTP server rejected the email recipient');
    return;
  }
  const { error } = await delivery.resend.emails.send(payload);
  if (error) throw new Error('Email delivery failed');
}

async function verifyEmailConfiguration() {
  const delivery = await getDelivery();
  if (!delivery?.smtp) throw new Error('Configure SMTP_HOST before checking the SMTP connection');
  await delivery.smtp.verify();
  return { provider: delivery.provider, from: delivery.from };
}

module.exports = { sendEmail, isEmailConfigured, verifyEmailConfiguration, setEmailSettingsLoader };
