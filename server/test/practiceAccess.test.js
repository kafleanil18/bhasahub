const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Test = require('../models/Test');

test('mock test list and questions require authentication and remain available to students', async () => {
  const originalUser = User.findById, originalFind = Test.find, originalById = Test.findById;
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'practice-access-test';
  User.findById = () => ({ select: async () => ({ _id: 'student', role: 'student' }) });
  Test.find = () => ({ select: () => ({ sort: async () => [] }) });
  Test.findById = async () => ({ published: true, toObject: () => ({ questions: [{ prompt: 'Test', correctIndex: 0 }] }) });
  const app = express();
  app.use('/api/tests', require('../routes/tests'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/tests`;
    const headers = { Authorization: `Bearer ${jwt.sign({ id: 'student' }, process.env.JWT_SECRET)}` };
    for (const path of ['', '/sample']) {
      assert.equal((await fetch(base + path)).status, 401);
      assert.equal((await fetch(base + path, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
      const response = await fetch(base + path, { headers });
      assert.equal(response.status, 200);
      const data = await response.json();
      if (path) assert.equal(data.questions[0].correctIndex, undefined);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    User.findById = originalUser; Test.find = originalFind; Test.findById = originalById;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
});
