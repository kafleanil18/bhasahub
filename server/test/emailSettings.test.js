const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const EmailSettings = require('../models/EmailSettings');
const AuditLog = require('../models/AuditLog');
const settings = require('../utils/googleSmtpSettings');
const emailTransport = require('../utils/emailTransport');
const router = require('../routes/emailSettings');
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const handler = (method, path = '/') => router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
const draft = { enabled: true, email: 'owner@gmail.com', senderName: 'Xiao Ao', port: 465, appPassword: 'abcd efgh ijkl mnop' };
let stored;
let verified;
let env;

beforeEach(() => {
  env = { JWT_SECRET: process.env.JWT_SECRET, EMAIL_SETTINGS_KEY: process.env.EMAIL_SETTINGS_KEY };
  process.env.JWT_SECRET = 'settings-test-secret'; delete process.env.EMAIL_SETTINGS_KEY;
  stored = null; verified = 0;
  mock.method(EmailSettings, 'findOne', () => ({ select: () => ({ lean: async () => stored }) }));
  mock.method(EmailSettings, 'findOneAndUpdate', async (_query, update) => { stored = { ...update.$set }; return stored; });
  mock.method(AuditLog, 'create', async () => ({}));
  mock.method(nodemailer, 'createTransport', options => {
    assert.equal(options.host, 'smtp.gmail.com');
    assert.equal(options.auth.user, draft.email);
    assert.equal(options.auth.pass, 'abcdefghijklmnop');
    return { verify: async () => { verified++; }, sendMail: async () => ({}) };
  });
});

afterEach(() => {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  emailTransport.setEmailSettingsLoader(async () => null);
  mock.restoreAll();
});

test('email settings require a live superadmin role, including when JWT claims are stale', async () => {
  const [auth, guard] = router.stack;
  let res = response();
  await auth.handle({ headers: {} }, res, () => assert.fail('Anonymous access allowed'));
  assert.equal(res.code, 401);
  for (const role of ['student', 'admin', 'superadmin']) {
    mock.method(User, 'findById', () => ({ select: async () => ({ _id: 'owner', role }) }));
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 'owner', role: 'superadmin' }, process.env.JWT_SECRET)}` } };
    res = response(); let allowed = false;
    await auth.handle(req, res, () => guard.handle(req, res, () => { allowed = true; }));
    assert.equal(allowed, role === 'superadmin');
    if (!allowed) assert.equal(res.code, 403);
  }
});

test('enabling verifies before saving, encrypts the app password, and never returns it', async () => {
  const res = response();
  await handler('put')({ body: draft, user: { id: 'owner' } }, res);
  assert.equal(res.code, 200);
  assert.equal(verified, 1);
  assert.equal(stored.enabled, true);
  assert.notEqual(stored.appPasswordEncrypted, 'abcdefghijklmnop');
  assert.equal(settings.decryptPassword(stored.appPasswordEncrypted), 'abcdefghijklmnop');
  assert.equal(res.body.hasAppPassword, true);
  assert.equal(res.body.appPasswordEncrypted, undefined);
  assert.equal(res.body.appPassword, undefined);
  const get = response(); await handler('get')({}, get);
  assert.deepEqual(get.body, res.body);
  assert.equal(JSON.stringify(get.body).includes(stored.appPasswordEncrypted), false);
  const audit = AuditLog.create.mock.calls[0].arguments[0];
  assert.equal(audit.label, 'Google SMTP enabled');
  assert.equal(JSON.stringify(audit).includes('abcdefghijklmnop'), false);
});

test('blank passwords preserve credentials; account changes require a replacement', async () => {
  stored = settings.prepareSettings(draft, null);
  const ciphertext = stored.appPasswordEncrypted;
  const res = response();
  await handler('put')({ body: { ...draft, appPassword: '', senderName: 'New name' } }, res);
  assert.equal(res.code, 200);
  assert.equal(stored.appPasswordEncrypted, ciphertext);
  const bad = response();
  await handler('put')({ body: { ...draft, appPassword: '', email: 'another@gmail.com' } }, bad);
  assert.equal(bad.code, 400);
  assert.match(bad.body.error, /new app password/);
  assert.equal(stored.email, draft.email);
});

test('a connection test checks draft credentials without saving or sending mail', async () => {
  const res = response();
  await handler('post', '/test-connection')({ body: { ...draft, enabled: false, port: 587 } }, res);
  assert.equal(res.code, 200);
  assert.equal(verified, 1);
  assert.equal(stored, null);
  const options = nodemailer.createTransport.mock.calls[0].arguments[0];
  assert.equal(options.port, 587); assert.equal(options.secure, false); assert.equal(options.requireTLS, true);
  assert.match(res.body.message, /No email was sent/);
  assert.equal(EmailSettings.findOneAndUpdate.mock.callCount(), 0);
});

test('failed verification preserves active settings and hides provider details', async () => {
  stored = settings.prepareSettings(draft, null);
  const before = { ...stored };
  nodemailer.createTransport.mock.restore();
  mock.method(nodemailer, 'createTransport', () => ({ verify: async () => { throw new Error('private provider response abcdefghijklmnop'); } }));
  const res = response();
  await handler('put')({ body: { ...draft, senderName: 'Changed' } }, res);
  assert.equal(res.code, 502);
  assert.equal(JSON.stringify(res.body).includes('private provider'), false);
  assert.deepEqual(stored, before);
  assert.equal(EmailSettings.findOneAndUpdate.mock.callCount(), 0);
});

test('failed verification of a new setup saves encrypted credentials while keeping SMTP disabled', async () => {
  nodemailer.createTransport.mock.restore();
  mock.method(nodemailer, 'createTransport', () => ({ verify: async () => { const error = new Error('private SMTP response'); error.code = 'ETIMEDOUT'; throw error; } }));
  const res = response();
  await handler('put')({ body: draft }, res);
  assert.equal(res.code, 200);
  assert.equal(stored.enabled, false);
  assert.equal(settings.decryptPassword(stored.appPasswordEncrypted), 'abcdefghijklmnop');
  assert.equal(res.body.hasAppPassword, true);
  assert.match(res.body.connectionError, /Settings saved/);
  assert.equal(JSON.stringify(res.body).includes('private SMTP response'), false);
  const loaded = response(); await handler('get')({}, loaded);
  assert.equal(loaded.body.connectionError, res.body.connectionError);
});

test('Google SMTP can be disabled without contacting Google or decrypting credentials', async () => {
  stored = { ...settings.prepareSettings(draft, null), appPasswordEncrypted: 'old-key.invalid.secret' };
  const res = response();
  await handler('put')({ body: { ...draft, appPassword: '', enabled: false } }, res);
  assert.equal(res.code, 200); assert.equal(stored.enabled, false); assert.equal(verified, 0);
});

test('invalid inputs cannot be enabled or override the fixed Google SMTP host', async () => {
  for (const body of [
    { ...draft, enabled: 'true' }, { ...draft, email: 'bad-address' },
    { ...draft, email: 'owner@gmail.com\nattacker@example.com' },
    { ...draft, appPassword: 'regular-password' }, { ...draft, appPassword: {} },
    { ...draft, senderName: 'bad\nname' }, { ...draft, port: 25 }, { ...draft, port: '465' },
    { ...draft, appPassword: '' },
  ]) {
    const res = response(); await handler('put')({ body }, res); assert.equal(res.code, 400);
  }
  assert.equal(EmailSettings.findOneAndUpdate.mock.callCount(), 0);
  const options = settings.googleDelivery(settings.prepareSettings({ ...draft, host: 'localhost' }, null)).options;
  assert.equal(options.host, 'smtp.gmail.com');
});

test('ciphertexts use random nonces, reject tampering, and depend on a stable encryption secret', () => {
  const first = settings.encryptPassword('abcdefghijklmnop');
  const second = settings.encryptPassword('abcdefghijklmnop');
  assert.notEqual(first, second);
  const parts = first.split('.');
  const changed = Buffer.from(parts[2], 'base64'); changed[0] ^= 1; parts[2] = changed.toString('base64');
  assert.throws(() => settings.decryptPassword(parts.join('.')));
  process.env.EMAIL_SETTINGS_KEY = 'separate-secret';
  assert.throws(() => settings.decryptPassword(first));
  const separate = settings.encryptPassword('abcdefghijklmnop');
  process.env.JWT_SECRET = 'rotated-jwt-secret';
  assert.equal(settings.decryptPassword(separate), 'abcdefghijklmnop');
});

test('saved settings are read for each delivery and disabling restores the default provider', async () => {
  stored = settings.prepareSettings(draft, null);
  emailTransport.setEmailSettingsLoader(settings.loadGoogleSmtpDelivery);
  const sent = [];
  nodemailer.createTransport.mock.restore();
  mock.method(nodemailer, 'createTransport', options => ({ sendMail: async payload => { sent.push({ options, payload }); return {}; } }));
  await emailTransport.sendEmail({ to: 'student@example.com', text: 'verification' });
  stored.senderName = 'Updated sender'; stored.port = 587;
  await emailTransport.sendEmail({ to: 'student@example.com', text: 'reset' });
  assert.equal(sent[0].payload.from.name, 'Xiao Ao');
  assert.equal(sent[1].payload.from.name, 'Updated sender');
  assert.equal(sent[1].options.port, 587);
  assert.equal(await emailTransport.isEmailConfigured(), true);
  stored.enabled = false;
  assert.equal(await settings.loadGoogleSmtpDelivery(), null);
  // A database outage must propagate rather than silently changing providers.
  emailTransport.setEmailSettingsLoader(async () => { throw new Error('database unavailable'); });
  await assert.rejects(emailTransport.sendEmail({ to: 'student@example.com', text: 'reset' }), /database unavailable/);
});
