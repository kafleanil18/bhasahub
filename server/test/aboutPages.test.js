const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const AboutPage = require('../models/AboutPage');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// About pages: About Xiao Ao starts hidden and only a super admin can preview or change it.
async function withServer(run) {
  const originals = { find: AboutPage.find, findOne: AboutPage.findOne, findOneAndUpdate: AboutPage.findOneAndUpdate, findById: User.findById, create: AuditLog.create };
  const logged = [];
  AuditLog.create = async entry => { logged.push(entry); return entry; };
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'about-pages-test';
  const store = {};
  const roles = { boss: 'superadmin', helper: 'admin', learner: 'student' };
  AboutPage.find = () => ({ lean: async () => Object.values(store) });
  AboutPage.findOne = ({ slug }) => ({ lean: async () => store[slug] || null });
  AboutPage.findOneAndUpdate = ({ slug }, { $set }) => ({ lean: async () => (store[slug] = { _id: `id-${slug}`, slug, visible: false, content: {}, ...store[slug], ...$set, updatedAt: new Date() }) });
  User.findById = id => ({ select: async () => (roles[id] ? { _id: id, role: roles[id] } : null) });
  const app = express();
  app.use(express.json());
  app.use('/api/about-pages', require('../routes/aboutPages'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/about-pages`;
  const as = id => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' });
  try {
    await run({ base, as, store, logged });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    Object.assign(AboutPage, { find: originals.find, findOne: originals.findOne, findOneAndUpdate: originals.findOneAndUpdate });
    User.findById = originals.findById;
    AuditLog.create = originals.create;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
}

test('About Xiao Ao is hidden by default; About HSK is always visible', () => withServer(async ({ base, as }) => {
  assert.deepEqual(await (await fetch(base)).json(), [{ slug: 'xiao-ao', visible: false }, { slug: 'hsk', visible: true }]);
  assert.equal((await fetch(`${base}/xiao-ao`)).status, 404);
  assert.equal((await fetch(`${base}/xiao-ao`, { headers: as('helper') })).status, 404);
  assert.equal((await fetch(`${base}/xiao-ao`, { headers: { Authorization: 'Bearer not-a-token' } })).status, 404);
  const preview = await fetch(`${base}/xiao-ao`, { headers: as('boss') });
  assert.equal(preview.status, 200);
  assert.deepEqual((await preview.json()).visible, false);
  const hsk = await (await fetch(`${base}/hsk`)).json();
  assert.equal(hsk.visible, true);
  assert.deepEqual(hsk.content, {});
}));

test('a super admin shows the page and saves its text; empty fields fall back to the defaults', () => withServer(async ({ base, as, store, logged }) => {
  let response = await fetch(`${base}/xiao-ao`, { method: 'PUT', headers: as('boss'), body: JSON.stringify({ visible: true }) });
  assert.equal(response.status, 200);
  assert.equal((await fetch(`${base}/xiao-ao`)).status, 200);
  assert.deepEqual(await (await fetch(base)).json(), [{ slug: 'xiao-ao', visible: true }, { slug: 'hsk', visible: true }]);

  response = await fetch(`${base}/xiao-ao`, { method: 'PUT', headers: as('boss'), body: JSON.stringify({ content: { title: '  About us  ', motto: '' } }) });
  assert.deepEqual((await response.json()).content, { title: 'About us' });
  assert.equal(store['xiao-ao'].visible, true);
  assert.deepEqual((await (await fetch(`${base}/xiao-ao`)).json()).content, { title: 'About us' });
  assert.deepEqual(logged.map(entry => entry.label), ['About Xiao Ao shown to visitors', 'About Xiao Ao text']);
}));

test('only a super admin can change a page, and bad input is refused', () => withServer(async ({ base, as }) => {
  const put = (slug, body, who = 'boss') => fetch(`${base}/${slug}`, { method: 'PUT', headers: as(who), body: JSON.stringify(body) });
  assert.equal((await fetch(`${base}/xiao-ao`, { method: 'PUT', body: '{}' })).status, 401);
  assert.equal((await put('xiao-ao', { visible: true }, 'helper')).status, 403);
  assert.equal((await put('xiao-ao', { visible: true }, 'learner')).status, 403);
  assert.equal((await put('hsk', { visible: false })).status, 400);
  assert.equal((await put('xiao-ao', { visible: 'yes' })).status, 400);
  assert.equal((await put('xiao-ao', { content: ['title'] })).status, 400);
  assert.equal((await put('xiao-ao', { content: { 'bad key': 'x' } })).status, 400);
  assert.equal((await put('xiao-ao', { content: { title: 7 } })).status, 400);
  assert.equal((await put('xiao-ao', { content: { title: 'x'.repeat(3001) } })).status, 400);
  assert.equal((await put('xiao-ao', {})).status, 400);
  assert.equal((await put('elsewhere', { content: {} })).status, 404);
  assert.equal((await fetch(`${base}/elsewhere`)).status, 404);
}));
