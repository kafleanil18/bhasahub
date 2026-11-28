import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
globalThis.window = Object.assign(new EventTarget(), { API_BASE_URL: 'https://api.test' });
let calls = [];
let reply = () => new Response('{}', { status: 200 });
globalThis.fetch = async (url, init) => { calls.push({ url, init }); return reply(url, init); };

const { apiFetch, apiJson, ApiError, SESSION_EXPIRED_EVENT } = await import('./apiClient.js');

let expired = 0;
window.addEventListener(SESSION_EXPIRED_EVENT, () => { expired += 1; });
beforeEach(() => { store.clear(); calls = []; expired = 0; reply = () => new Response('{}', { status: 200 }); });
const sentAuth = () => calls.at(-1).init.headers.get('Authorization');

test('paths are sent to the API server and full URLs are left alone', async () => {
  await apiFetch('/api/courses');
  assert.equal(calls.at(-1).url, 'https://api.test/api/courses');
  await apiFetch('https://api.test/api/team');
  assert.equal(calls.at(-1).url, 'https://api.test/api/team');
});

test('the stored token is added, and nothing is added when signed out', async () => {
  await apiFetch('/api/courses');
  assert.equal(sentAuth(), null);
  store.set('token', 'abc');
  await apiFetch('/api/courses', { headers: { 'Content-Type': 'application/json' } });
  assert.equal(sentAuth(), 'Bearer abc');
  assert.equal(calls.at(-1).init.headers.get('Content-Type'), 'application/json');
});

test('json bodies are encoded and labelled', async () => {
  await apiFetch('/api/feedback', { method: 'POST', json: { message: 'hi' } });
  assert.equal(calls.at(-1).init.body, '{"message":"hi"}');
  assert.equal(calls.at(-1).init.headers.get('Content-Type'), 'application/json');
});

test('a 401 for the stored token reports the session as expired once', async () => {
  store.set('token', 'old');
  reply = () => new Response('{"error":"Session expired"}', { status: 401 });
  await apiFetch('/api/progress/me');
  await apiFetch('/api/srs/due');
  assert.equal(expired, 1);
});

test('wrong passwords on sign-in and password forms do not end the session', async () => {
  store.set('token', 'tok-forms');
  reply = () => new Response('{"error":"Current password is incorrect"}', { status: 401 });
  await apiFetch('/api/auth/change-password', { method: 'POST' });
  await apiFetch('/api/auth/login', { method: 'POST' });
  assert.equal(expired, 0);
  await apiFetch('/api/auth/me');
  assert.equal(expired, 1);
});

test('a 401 is ignored when the caller sent its own token or the person already signed out', async () => {
  store.set('token', 'tok-own');
  reply = () => new Response('{}', { status: 401 });
  await apiFetch('/api/push/subscriptions', { headers: { Authorization: 'Bearer previous' } });
  assert.equal(expired, 0);
  reply = () => { store.delete('token'); return new Response('{}', { status: 401 }); };
  await apiFetch('/api/courses');
  assert.equal(expired, 0);
});

test('apiJson returns the body or throws the server message with the status', async () => {
  reply = () => new Response('{"ok":true}', { status: 200 });
  assert.deepEqual(await apiJson('/api/plans/me'), { ok: true });
  reply = () => new Response('{"error":"Plan not found"}', { status: 404 });
  await assert.rejects(apiJson('/api/plans/me'), err => err instanceof ApiError && err.status === 404 && err.message === 'Plan not found');
  reply = () => new Response('<html>Bad gateway</html>', { status: 502 });
  await assert.rejects(apiJson('/api/plans/me', { fallbackError: 'Could not load plans.' }), { message: 'Could not load plans.', status: 502 });
});

test('a timeout aborts the request', async () => {
  reply = (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  await assert.rejects(apiFetch('/api/health', { timeout: 20 }), { name: 'TimeoutError' });
});
