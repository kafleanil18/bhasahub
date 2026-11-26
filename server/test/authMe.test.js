const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

test('/api/auth/me reports the role saved in the database, so a promotion applies without signing in again', async () => {
  const originalFindById = User.findById;
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'auth-me-test';
  let role = 'student';
  User.findById = () => ({ select: async () => ({ _id: 'person', name: 'Mei', email: 'mei@example.com', role }) });
  const app = express();
  app.use('/api/auth', require('../routes/auth'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/auth/me`;
    assert.equal((await fetch(url)).status, 401);
    // The token was issued at sign-in, while the account was still a student.
    const headers = { Authorization: `Bearer ${jwt.sign({ id: 'person', role: 'student' }, process.env.JWT_SECRET)}` };
    assert.deepEqual(await (await fetch(url, { headers })).json(), { id: 'person', name: 'Mei', email: 'mei@example.com', role: 'student' });
    role = 'admin';
    assert.deepEqual(await (await fetch(url, { headers })).json(), { id: 'person', name: 'Mei', email: 'mei@example.com', role: 'admin' });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    User.findById = originalFindById;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
});
