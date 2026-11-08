const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../models/EmailApiSettings');
const AuditLog = require('../models/AuditLog');
const google = require('../utils/googleSmtpSettings');
const api = require('../utils/emailApiSettings');
const email = require('../utils/emailTransport');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const router = require('../routes/emailApiSettings');
const draft = { provider: 'resend', enabled: true, senderEmail: 'teacher@example.com', senderName: 'Xiao Ao', apiKey: 're_test_private_api_key' };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const handler = (method, path = '/') => router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
let stored;
let secret;
let requests;
beforeEach(() => {
  secret = process.env.JWT_SECRET; process.env.JWT_SECRET = 'api-settings-test-secret'; stored = null; requests = [];
  mock.method(Model, 'findOne', () => ({ select: () => ({ lean: async () => stored }) }));
  mock.method(Model, 'findOneAndUpdate', async (_filter, update) => { stored = update.$set; return stored; });
  mock.method(AuditLog, 'create', async () => ({}));
  mock.method(google, 'loadGoogleSmtpDelivery', async () => null);
  mock.method(global, 'fetch', async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => url.includes('/domains') ? { data: [{ id: 'domain', name: 'example.com', status: 'verified' }], has_more: false } : url.endsWith('/senders') ? { senders: [{ email: draft.senderEmail, active: true }] } : url.endsWith('/emails') ? { id: 'accepted' } : { messageId: 'accepted' } };
  });
});
afterEach(() => {
  mock.restoreAll(); email.setEmailSettingsLoader(async () => null);
  if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
});

test('email API settings require current superadmin authorization', () => {
  assert.equal(router.stack[0].handle, requireAuth); assert.equal(router.stack[1].handle, requireSuperAdmin);
  for (const role of ['student', 'admin']) { const res = response(); requireSuperAdmin({ user: { role } }, res, () => assert.fail('access allowed')); assert.equal(res.code, 403); }
});

test('Resend saves an encrypted API key and checks the verified sender domain without sending email', async () => {
  const res = response(); await handler('put')({ body: draft }, res);
  assert.equal(res.code, 200); assert.equal(res.body.enabled, true); assert.equal(res.body.hasApiKey, true);
  assert.equal(res.body.apiKeyEncrypted, undefined); assert.equal(res.body.apiKey, undefined);
  assert.equal(google.decryptPassword(stored.apiKeyEncrypted), draft.apiKey);
  assert.equal(requests.length, 1); assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.headers.Authorization, `Bearer ${draft.apiKey}`);
  assert.equal(JSON.stringify(res.body).includes(draft.apiKey), false);
  assert.equal(JSON.stringify(AuditLog.create.mock.calls[0].arguments[0]).includes(draft.apiKey), false);
});

test('Brevo checks an active sender and sends over HTTPS with the correct single-recipient payload', async () => {
  stored = api.prepareSettings({ ...draft, provider: 'brevo' }, null);
  await api.verifySettings(stored);
  await api.send(stored, { to: 'student@example.com', subject: 'Practice', text: 'Practice today.' });
  assert.equal(requests[0].url, 'https://api.brevo.com/v3/senders');
  assert.equal(requests[0].options.headers['api-key'], draft.apiKey);
  assert.equal(requests[1].url, 'https://api.brevo.com/v3/smtp/email');
  const body = JSON.parse(requests[1].options.body);
  assert.deepEqual(body.to, [{ email: 'student@example.com' }]); assert.equal(body.textContent, 'Practice today.'); assert.equal(body.htmlContent, undefined);
});

test('enabled API delivery takes priority over SMTP and routes existing sendEmail calls correctly', async () => {
  stored = api.prepareSettings(draft, null); email.setEmailSettingsLoader(api.loadSavedEmailDelivery);
  await email.sendEmail({ to: 'student@example.com', subject: 'Verify', text: '123456' }, undefined, { requireDelivery: true });
  assert.equal(google.loadGoogleSmtpDelivery.mock.callCount(), 0);
  assert.equal(requests[0].url, 'https://api.resend.com/emails');
  assert.equal(JSON.parse(requests[0].options.body).to, 'student@example.com');
  stored.enabled = false; await api.loadSavedEmailDelivery();
  assert.equal(google.loadGoogleSmtpDelivery.mock.callCount(), 1);
});

test('blank keys preserve the secret for the same provider and switching provider requires a new key', () => {
  stored = api.prepareSettings(draft, null);
  assert.equal(api.prepareSettings({ ...draft, apiKey: '' }, stored).apiKeyEncrypted, stored.apiKeyEncrypted);
  assert.throws(() => api.prepareSettings({ ...draft, provider: 'brevo', apiKey: '' }, stored), /new API key/);
});

test('first-time failures save an inactive draft while active provider failures preserve current settings', async () => {
  global.fetch.mock.restore(); mock.method(global, 'fetch', async () => ({ ok: false, status: 401, json: async () => ({ message: draft.apiKey }) }));
  let res = response(); await handler('put')({ body: draft }, res);
  assert.equal(res.code, 200); assert.equal(stored.enabled, false); assert.equal(res.body.hasApiKey, true);
  assert.ok(res.body.connectionError); assert.equal(JSON.stringify(res.body).includes(draft.apiKey), false);
  stored.enabled = true; const original = stored;
  res = response(); await handler('put')({ body: { ...draft, senderName: 'Changed' } }, res);
  assert.equal(res.code, 502); assert.equal(stored, original);
});

test('unverified Resend domains, test senders, inactive Brevo senders, and invalid input cannot activate', async () => {
  for (const senderEmail of ['owner@gmail.com', 'onboarding@resend.dev', 'owner@project.vercel.app']) await assert.rejects(api.verifySettings(api.prepareSettings({ ...draft, senderEmail }, null)), /own verified domain/);
  global.fetch.mock.restore(); mock.method(global, 'fetch', async () => ({ ok: true, status: 200, json: async () => ({ data: [{ name: 'example.com', status: 'pending' }], senders: [{ email: draft.senderEmail, active: false }] }) }));
  await assert.rejects(api.verifySettings(api.prepareSettings(draft, null)), /Verify the sender domain/);
  await assert.rejects(api.verifySettings(api.prepareSettings({ ...draft, provider: 'brevo' }, null)), /verify this exact sender/);
  for (const body of [{ ...draft, provider: 'evil' }, { ...draft, apiKey: {} }, { ...draft, apiKey: 'bad' }, { ...draft, senderEmail: 'bad' }, { ...draft, senderName: 'bad\r\nname' }]) assert.throws(() => api.prepareSettings(body, null));
});

test('provider checks do not save or send mail; provider rejection cannot be reported as acceptance', async () => {
  let res = response(); await handler('post', '/check')({ body: draft }, res);
  assert.equal(res.code, 200); assert.equal(stored, null); assert.equal(requests[0].options.method, 'GET');
  global.fetch.mock.restore(); mock.method(global, 'fetch', async () => ({ ok: true, status: 200, json: async () => ({}) }));
  await assert.rejects(api.send(api.prepareSettings(draft, null), { to: 'student@example.com', subject: 'Practice', text: 'Today' }), /did not confirm/);
});
