const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startWhenReady, databaseHealth, requireDatabase } = require('../utils/serverReadiness');

function response() {
  return { code: 200, headers: {}, set(key, value) { this.headers[key] = value; return this; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('HTTP listening waits for database connection and initialization', async () => {
  let connected; const events = [];
  const started = startWhenReady({
    connect: () => new Promise(resolve => { connected = resolve; }),
    initialize: async () => { events.push('initialize'); },
    listen: async () => { events.push('listen'); return 'server'; },
    disconnect: async () => { events.push('disconnect'); },
  });
  assert.deepEqual(events, []);
  connected();
  assert.equal(await started, 'server');
  assert.deepEqual(events, ['initialize', 'listen']);
});

test('failed startup disconnects and never accepts traffic', async () => {
  for (const stage of ['connect', 'initialize', 'listen']) {
    const calls = [];
    const step = name => async () => { calls.push(name); if (stage === name) throw new Error('startup failure'); };
    await assert.rejects(startWhenReady({ connect: step('connect'), initialize: step('initialize'), listen: step('listen'), disconnect: step('disconnect') }), /startup failure/);
    assert.equal(calls.at(-1), 'disconnect');
    if (stage !== 'listen') assert.equal(calls.includes('listen'), false);
  }
});

test('health checks ping MongoDB with a timeout and prevent cached success', async () => {
  let pinged = false;
  const connection = { readyState: 1, db: { admin: () => ({ command: async (command, options) => {
    assert.deepEqual(command, { ping: 1 }); assert.equal(options.timeoutMS, 2000); pinged = true;
  } }) } };
  const res = response(); await databaseHealth(connection)({}, res);
  assert.equal(pinged, true); assert.equal(res.code, 200);
  assert.equal(res.body.database, 'connected'); assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('health is unavailable for disconnected, connecting, and disconnecting states', async () => {
  for (const readyState of [0, 2, 3]) {
    const res = response(); await databaseHealth({ readyState })({}, res);
    assert.equal(res.code, 503); assert.equal(res.body.status, 'unavailable');
  }
});

test('a failed or timed-out database ping produces 503 without internal details', async () => {
  const connection = { readyState: 1, db: { admin: () => ({ command: async () => { throw new Error('private database details'); } }) } };
  const res = response(); await databaseHealth(connection)({}, res);
  assert.equal(res.code, 503); assert.equal(JSON.stringify(res.body).includes('private'), false);
});

test('API requests fail promptly during an outage and recover after reconnection', () => {
  const connection = { readyState: 0 }; const guard = requireDatabase(connection);
  let nextCalls = 0;
  const res = response(); guard({}, res, () => nextCalls++);
  assert.equal(res.code, 503); assert.equal(res.headers['Retry-After'], '5'); assert.equal(nextCalls, 0);
  connection.readyState = 1; guard({}, response(), () => nextCalls++);
  assert.equal(nextCalls, 1);
});
