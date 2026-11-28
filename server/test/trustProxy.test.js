const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { trustProxySetting } = require('../utils/trustProxy');

// A stand-in for the login route behind Render's proxy: 2 attempts per visitor.
async function withLimitedServer(trust, run) {
  const app = express();
  app.set('trust proxy', trust);
  app.post('/login', rateLimit({ windowMs: 60000, max: 2, standardHeaders: true, legacyHeaders: false }), (req, res) => res.json({ ip: req.ip }));
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/login`;
  // The proxy appends the address it saw; anything before it came from the visitor.
  const attempt = forwardedFor => fetch(url, { method: 'POST', headers: { 'X-Forwarded-For': forwardedFor } });
  try { await run(attempt); } finally { server.close(); }
}

test('each visitor behind the proxy gets their own sign-in limit', async () => {
  await withLimitedServer(trustProxySetting(), async attempt => {
    assert.equal((await attempt('203.0.113.1')).status, 200);
    assert.equal((await attempt('203.0.113.1')).status, 200);
    assert.equal((await attempt('203.0.113.1')).status, 429);
    // Before the fix everyone shared one limit, so this visitor would be locked out too.
    const other = await attempt('198.51.100.7');
    assert.equal(other.status, 200);
    assert.equal((await other.json()).ip, '198.51.100.7');
  });
});

test('a visitor cannot dodge the limit by sending their own forwarded address', async () => {
  await withLimitedServer(trustProxySetting(), async attempt => {
    await attempt('1.1.1.1, 203.0.113.1');
    await attempt('2.2.2.2, 203.0.113.1');
    // The made-up first address is ignored; the one the proxy added is still limited.
    assert.equal((await attempt('3.3.3.3, 203.0.113.1')).status, 429);
  });
});

test('TRUST_PROXY defaults to one proxy and rejects values that are not a count', () => {
  assert.equal(trustProxySetting(undefined), 1);
  assert.equal(trustProxySetting(''), 1);
  assert.equal(trustProxySetting('2'), 2);
  assert.equal(trustProxySetting('0'), 0);
  assert.throws(() => trustProxySetting('true'), /whole number/);
  assert.throws(() => trustProxySetting('-1'), /whole number/);
});

test('the app trusts the proxy', () => {
  const { app } = require('../index');
  assert.equal(app.get('trust proxy'), trustProxySetting());
});
