const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const envKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_REQUIRE_TLS', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'RESEND_API_KEY', 'NODE_ENV'];
let originalEnv;

beforeEach(() => {
  originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  envKeys.forEach(key => { delete process.env[key]; });
  delete require.cache[require.resolve('../utils/emailTransport')];
  delete require.cache[require.resolve('../utils/email')];
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  mock.restoreAll();
});

function smtpEnv(extra = {}) {
  Object.assign(process.env, {
    SMTP_HOST: 'smtp.example.com', SMTP_USER: 'smtp-user', SMTP_PASS: 'smtp-password',
    EMAIL_FROM: 'Xiao Ao <sender@example.com>', ...extra,
  });
}

test('all email flows use SMTP, share a transport, and take precedence over Resend', async () => {
  smtpEnv({ RESEND_API_KEY: 're_test' });
  const sent = [];
  const transport = mock.method(nodemailer, 'createTransport', options => {
    assert.equal(options.host, 'smtp.example.com');
    assert.equal(options.port, 587);
    assert.equal(options.secure, false);
    assert.equal(options.requireTLS, true);
    assert.deepEqual(options.auth, { user: 'smtp-user', pass: 'smtp-password' });
    return { sendMail: async payload => { sent.push(payload); return { rejected: [] }; } };
  });
  mock.method(Resend.prototype, 'post', async () => { assert.fail('Resend should not be used'); });
  const email = require('../utils/email');
  await email.sendEmailVerificationOtp('student@example.com', '123456');
  await email.sendPasswordResetOtpEmail('student@example.com', '654321');
  await email.sendPasswordResetEmail('student@example.com', 'https://example.com/?reset=token');
  assert.equal(transport.mock.callCount(), 1);
  assert.equal(sent.length, 3);
  for (const payload of sent) {
    assert.equal(payload.to, 'student@example.com');
    assert.equal(payload.from, process.env.EMAIL_FROM);
  }
  assert.match(sent[0].text, /123456/);
  assert.match(sent[1].html, /654321/);
  assert.match(sent[2].text, /https:\/\/example.com\/\?reset=token/);
});

test('port 465 infers implicit TLS and can use the SMTP user as sender', async () => {
  smtpEnv({ SMTP_PORT: '465' });
  delete process.env.EMAIL_FROM;
  mock.method(nodemailer, 'createTransport', options => {
    assert.equal(options.secure, true);
    assert.equal(options.requireTLS, false);
    return { sendMail: async payload => {
      assert.equal(payload.from, 'smtp-user');
      return {};
    } };
  });
  await require('../utils/email').sendEmailVerificationOtp('student@example.com', '123456');
});

test('an unauthenticated relay requires a sender and supports explicitly disabled STARTTLS', async () => {
  Object.assign(process.env, { SMTP_HOST: 'localhost', EMAIL_FROM: 'local@example.com', SMTP_REQUIRE_TLS: 'false' });
  mock.method(nodemailer, 'createTransport', options => {
    assert.equal(options.auth, undefined);
    assert.equal(options.requireTLS, false);
    return { sendMail: async () => ({}) };
  });
  await require('../utils/email').sendEmailVerificationOtp('student@example.com', '123456');
});

test('invalid SMTP settings fail instead of falling back to Resend or logging codes', async () => {
  const warn = mock.method(console, 'warn', () => {});
  const cases = [
    [{ SMTP_USER: 'user' }, /SMTP_HOST/],
    [{ SMTP_HOST: 'host', SMTP_USER: 'user' }, /both SMTP_USER and SMTP_PASS/],
    [{ SMTP_HOST: 'host' }, /EMAIL_FROM/],
    [{ SMTP_HOST: 'host', EMAIL_FROM: 'sender@example.com', SMTP_PORT: 'bad' }, /SMTP_PORT/],
    [{ SMTP_HOST: 'host', EMAIL_FROM: 'sender@example.com', SMTP_PORT: '0' }, /SMTP_PORT/],
    [{ SMTP_HOST: 'host', EMAIL_FROM: 'sender@example.com', SMTP_SECURE: 'yes' }, /SMTP_SECURE/],
    [{ SMTP_HOST: 'host', EMAIL_FROM: 'sender@example.com', SMTP_REQUIRE_TLS: 'yes' }, /SMTP_REQUIRE_TLS/],
  ];
  for (const [env, error] of cases) {
    envKeys.forEach(key => { delete process.env[key]; });
    Object.assign(process.env, { RESEND_API_KEY: 're_test', ...env });
    await assert.rejects(require('../utils/email').sendEmailVerificationOtp('student@example.com', '123456'), error);
  }
  assert.equal(warn.mock.callCount(), 0);
});

test('SMTP connection failures and rejected recipients propagate to callers', async () => {
  smtpEnv();
  let rejection = false;
  mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => {
    if (rejection) return { rejected: ['student@example.com'] };
    throw new Error('connection failed');
  } }));
  const email = require('../utils/email');
  await assert.rejects(email.sendEmailVerificationOtp('student@example.com', '123456'), /connection failed/);
  rejection = true;
  await assert.rejects(email.sendPasswordResetOtpEmail('student@example.com', '123456'), /rejected/);
});

test('Resend remains available and provider errors propagate for every email flow', async () => {
  process.env.RESEND_API_KEY = 're_test';
  let fail = false;
  const requests = [];
  mock.method(Resend.prototype, 'post', async (path, payload) => {
    requests.push({ path, payload });
    return fail ? { error: { message: 'provider failure' } } : { data: { id: 'sent' }, error: null };
  });
  const email = require('../utils/email');
  await email.sendEmailVerificationOtp('student@example.com', '123456');
  assert.equal(requests[0].payload.from, 'onboarding@resend.dev');
  fail = true;
  await assert.rejects(email.sendEmailVerificationOtp('student@example.com', '123456'), /Email delivery failed/);
  await assert.rejects(email.sendPasswordResetOtpEmail('student@example.com', '123456'), /Email delivery failed/);
  await assert.rejects(email.sendPasswordResetEmail('student@example.com', 'https://example.com/reset'), /Email delivery failed/);
});

test('missing configuration logs locally but production never logs codes or reset links', async () => {
  const warn = mock.method(console, 'warn', () => {});
  const email = require('../utils/email');
  await email.sendEmailVerificationOtp('student@example.com', '123456');
  assert.match(warn.mock.calls[0].arguments[0], /123456/);
  process.env.NODE_ENV = 'production';
  for (const send of [
    () => email.sendEmailVerificationOtp('student@example.com', '123456'),
    () => email.sendPasswordResetOtpEmail('student@example.com', '123456'),
    () => email.sendPasswordResetEmail('student@example.com', 'https://example.com/reset'),
  ]) await assert.rejects(send(), /not configured/);
  assert.equal(warn.mock.callCount(), 1);
});

test('SMTP check verifies authentication without sending a message', async () => {
  smtpEnv();
  let verified = false;
  mock.method(nodemailer, 'createTransport', () => ({
    verify: async () => { verified = true; },
    sendMail: async () => { assert.fail('Connection check must not send mail'); },
  }));
  const result = await require('../utils/emailTransport').verifyEmailConfiguration();
  assert.equal(verified, true);
  assert.equal(result.provider, 'SMTP');
});

test('required reminder delivery fails without a provider even during local development', async () => {
  const warn = mock.method(console, 'warn', () => {});
  await assert.rejects(require('../utils/emailTransport').sendEmail({ to: 'student@example.com', text: 'Practice' }, undefined, { requireDelivery: true }), /not configured/);
  assert.equal(warn.mock.callCount(), 0);
});

test('password reset API never returns a development code when SMTP is configured', async () => {
  smtpEnv();
  const User = require('../models/User');
  const email = require('../utils/email');
  mock.method(User, 'findOne', async () => ({ email: 'student@example.com', save: async () => {} }));
  mock.method(email, 'sendPasswordResetOtpEmail', async () => {});
  delete require.cache[require.resolve('../routes/auth')];
  const handler = require('../routes/auth').stack.find(layer => layer.route?.path === '/send-otp').route.stack.at(-1).handle;
  const res = { json(body) { this.body = body; return this; }, status(code) { this.code = code; return this; } };
  await handler({ body: { email: 'student@example.com' } }, res);
  assert.equal(res.body.success, true);
  assert.equal(res.body.devOtp, undefined);
});
