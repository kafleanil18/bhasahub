const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const Lesson = require('../models/Lesson');
const Subscription = require('../models/Subscription');
const AccessRequest = require('../models/AccessRequest');
const Enrollment = require('../models/Enrollment');
const AuditLog = require('../models/AuditLog');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const restorations = [];
function mock(object, key, value) { const old = object[key]; object[key] = value; restorations.push(() => { object[key] = old; }); }
afterEach(() => { restorations.reverse().forEach(f => f()); restorations.length = 0; });
function response() { return { code: 200, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } }; }
function handler(module, path, method = 'get') { return require(module).stack.find(l => l.route?.path === path && l.route.methods[method]).route.stack.at(-1).handle; }

test('a demoted admin loses access despite their old JWT role', async () => {
  mock(process.env, 'JWT_SECRET', 'test-secret');
  mock(User, 'findById', () => ({ select: async () => ({ _id: 'user', role: 'student' }) }));
  const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 'user', role: 'admin' }, 'test-secret')}` } };
  const res = response();
  await requireAuth(req, res, () => requireAdmin(req, res, () => assert.fail('must not authorize')));
  assert.equal(res.code, 403);
});

test('test detail hides unpublished tests and strips answer keys', async () => {
  const run = handler('../routes/tests', '/:id');
  mock(Test, 'findById', async () => ({ published: false }));
  let res = response();
  await run({ params: { id: 'test' } }, res);
  assert.equal(res.code, 404);
  mock(Test, 'findById', async () => ({ published: true, toObject: () => ({ questions: [{ correctIndex: 1, questionText: 'Question' }] }) }));
  res = response();
  await run({ params: { id: 'test' } }, res);
  assert.equal(res.body.questions[0].correctIndex, undefined);
});

test('server grades test answers and ignores forged score fields', async () => {
  mock(Test, 'findById', async () => ({ _id: 'test', published: true, questions: [{ correctIndex: 1, options: ['a', 'b'] }] }));
  let stored;
  mock(Attempt, 'create', async data => { stored = data; return data; });
  const run = handler('../routes/attempts', '/test', 'post');
  const res = response();
  await run({ user: { id: 'student', role: 'student' }, body: { testId: 'test', answers: [0], score: 999, total: -1 } }, res);
  assert.equal(stored.score, 0);
  assert.equal(stored.total, 1);
  const invalid = response();
  await run({ body: { testId: 'test', answers: [100] } }, invalid);
  assert.equal(invalid.code, 400);
});

test('vocabulary endpoint rejects students without course access', async () => {
  mock(Lesson, 'findById', async () => ({ published: true, course: 'course' }));
  const Course = require('../models/Course');
  mock(Course, 'findById', async () => ({ published: true }));
  mock(Subscription, 'exists', async () => null);
  const res = response();
  await handler('../routes/lessons', '/:id/vocabulary')({ params: { id: 'lesson' }, user: { id: 'student', role: 'student' } }, res);
  assert.equal(res.code, 403);
});

test('tone evaluation reports unavailability and preserves genuine zero scores', async () => {
  mock(process.env, 'GEMINI_API_KEY', '');
  const run = handler('../routes/aiTone', '/evaluate-tone', 'post');
  const req = { body: {}, file: { buffer: Buffer.from('audio'), mimetype: 'audio/webm' } };
  let res = response();
  await run(req, res);
  assert.equal(res.code, 503);
  assert.equal(res.body.overallScore, undefined);
  process.env.GEMINI_API_KEY = 'test-key';
  mock(global, 'fetch', async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ overallScore: 0, pitchMatch: 0, rhythmScore: 0 }) }] } }] }) }));
  res = response();
  await run(req, res);
  assert.equal(res.body.overallScore, 0);
  assert.equal(res.body.pitchMatch, 0);
});

test('repeated approval is rejected without extending a subscription', async () => {
  mock(AccessRequest, 'findById', async () => ({ status: 'approved' }));
  mock(Subscription, 'findOne', () => assert.fail('must not extend'));
  const res = response();
  await handler('../routes/accessRequests', '/:id/approve', 'put')({ params: { id: 'request' }, body: { days: 30 } }, res);
  assert.equal(res.code, 409);
});

test('concurrent approval retries use a guarded subscription update', async () => {
  const request = { _id: 'request', user: 'student', course: 'course', status: 'pending', save: async () => {} };
  mock(AccessRequest, 'findById', async () => ({ ...request }));
  mock(Subscription, 'findOne', async () => ({ _id: 'sub' }));
  let grants = 0;
  mock(Subscription, 'findOneAndUpdate', async (filter, update) => {
    assert.deepEqual(filter.appliedRequests, { $ne: 'request' });
    assert.deepEqual(update[0].$set.appliedRequests.$concatArrays[1], ['request']);
    return grants++ === 0 ? { _id: 'sub' } : null;
  });
  mock(Subscription, 'findById', async () => ({ _id: 'sub' }));
  mock(User, 'findById', () => ({ select: async () => ({ name: 'Student' }) }));
  mock(require('../models/Course'), 'findById', () => ({ select: async () => ({ title: 'Course' }) }));
  mock(AuditLog, 'create', async () => ({}));
  let enrollments = 0;
  mock(Enrollment, 'updateOne', async (filter, update, options) => {
    assert.deepEqual(filter, { user: 'student', course: 'course' });
    assert.deepEqual(update.$setOnInsert, filter);
    assert.equal(options.upsert, true);
    enrollments++;
  });
  const run = handler('../routes/accessRequests', '/:id/approve', 'put');
  const req = { params: { id: 'request' }, body: { days: 30 }, user: { id: '507f1f77bcf86cd799439011' } };
  const responses = [response(), response()];
  await Promise.all(responses.map(res => run(req, res)));
  responses.forEach(res => assert.equal(res.code, 200));
  assert.equal(enrollments, 2);
});

test('quiz grading derives missed words and rejects invented vocabulary IDs', async () => {
  mock(Lesson, 'findById', async () => ({ _id: 'lesson', course: 'course', published: true }));
  mock(require('../models/Vocabulary'), 'find', async () => [{ _id: 'word', meaning: 'hello' }]);
  let stored;
  mock(Attempt, 'create', async data => { stored = data; return data; });
  const run = handler('../routes/attempts', '/quiz', 'post');
  const req = { user: { id: 'admin', role: 'admin' }, body: { lessonId: 'lesson', answers: [{ vocabularyId: 'word', answer: null }], score: 100 } };
  let res = response();
  await run(req, res);
  assert.equal(stored.score, 0);
  assert.deepEqual(stored.missedVocabulary, ['word']);
  req.body.answers[0].vocabularyId = 'invented';
  res = response();
  await run(req, res);
  assert.equal(res.code, 400);
});

test('locked course listing returns metadata without grammar or dialogue', async () => {
  mock(Lesson, 'find', () => ({ sort: async () => [{ _id: 'lesson', title: 'Lesson', order: 1, category: 'grammar', grammarExplanation: 'protected', dialogueLines: ['protected'] }] }));
  const res = response();
  await handler('../routes/lessons', '/course/:courseId')({ params: { courseId: 'course' } }, res);
  assert.equal(res.body[0].title, 'Lesson');
  assert.equal(res.body[0].grammarExplanation, undefined);
  assert.equal(res.body[0].dialogueLines, undefined);
});

test('review UI keeps its card on HTTP and network failures, advancing only after success', async () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const path = require('node:path');
  // Execute the actual event handler without needing a browser or React test renderer.
  const source = fs.readFileSync(path.join(__dirname, '../../client/src/courses/SrsReview.jsx'), 'utf8');
  const start = source.indexOf('  const grade = (quality) => {');
  const end = source.indexOf('\n\n  useEffect', start);
  for (const outcome of ['http-error', 'network-error', 'success']) {
    let index = 0, count = 0, error = null, submitting = false;
    const pending = [];
    const context = {
      card: { vocabularyId: 'word' }, submitting: false, API: '/api', token: 'token',
      setSubmitting: value => { submitting = value; },
      setSaveError: value => { error = value; },
      setReviewedCount: update => { count = update(count); },
      setFlipped: () => {}, setIndex: update => { index = update(index); },
      fetch: () => {
        const promise = outcome === 'network-error' ? Promise.reject(new Error('offline')) : Promise.resolve({ ok: outcome === 'success' });
        pending.push(promise.catch(() => {}));
        return promise;
      },
    };
    vm.runInNewContext(`${source.slice(start, end)}\ngrade(4);`, context);
    await Promise.all(pending);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(index, outcome === 'success' ? 1 : 0);
    assert.equal(count, outcome === 'success' ? 1 : 0);
    assert.equal(submitting, false);
    assert.equal(!!error, outcome !== 'success');
  }
});

test('review queue filters expired courses before applying the limit', async () => {
  const Course = require('../models/Course');
  const VocabSchedule = require('../models/VocabSchedule');
  mock(Subscription, 'find', query => {
    assert.equal(query.user, 'student');
    assert.ok(query.expiresAt.$gt instanceof Date);
    return { distinct: async () => ['active-course'] };
  });
  mock(Course, 'find', query => {
    assert.deepEqual(query, { _id: { $in: ['active-course'] }, published: true });
    return { distinct: async () => ['active-course'] };
  });
  mock(Lesson, 'find', query => {
    assert.deepEqual(query, { course: { $in: ['active-course'] }, published: true });
    return { distinct: async () => ['accessible-lesson'] };
  });
  const schedules = [
    { lesson: 'expired-lesson', vocabulary: { _id: 'old-word' } },
    { lesson: 'accessible-lesson', vocabulary: { _id: 'accessible-word' } },
  ];
  mock(VocabSchedule, 'find', query => ({
    populate() { return this; },
    sort() { return this; },
    limit: async limit => schedules.filter(s => query.lesson.$in.includes(s.lesson)).slice(0, limit),
  }));
  const res = response();
  await handler('../routes/srs', '/due')({ user: { id: 'student', role: 'student' }, query: { limit: '1' } }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.cards.map(c => c.vocabularyId), ['accessible-word']);
});

test('lesson review keeps access checks and clamps negative limits', async () => {
  const Course = require('../models/Course');
  const VocabSchedule = require('../models/VocabSchedule');
  const Vocabulary = require('../models/Vocabulary');
  mock(Lesson, 'findById', async () => ({ published: true, course: 'course' }));
  mock(Course, 'findById', async () => ({ published: true }));
  mock(Subscription, 'exists', async () => true);
  mock(VocabSchedule, 'find', query => query.dueDate ? {
    populate() { return this; }, sort() { return this; },
    limit: async limit => { assert.equal(limit, 1); return []; },
  } : { distinct: async () => [] });
  mock(Vocabulary, 'find', () => ({ sort: async () => [] }));
  const req = { user: { id: 'student', role: 'student' }, query: { lessonId: 'lesson', limit: '-5' } };
  const res = response();
  await handler('../routes/srs', '/due')(req, res);
  assert.equal(res.code, 200);
  mock(Subscription, 'exists', async () => null);
  const denied = response();
  await handler('../routes/srs', '/due')(req, denied);
  assert.equal(denied.code, 403);
});


test('subscription requests reject unpublished courses and reuse a pending request', async () => {
  const Course = require('../models/Course');
  const courseId = '507f1f77bcf86cd799439011';
  const req = { user: { id: 'student' }, body: { courseId } };
  const run = handler('../routes/accessRequests', '/', 'post');
  mock(Course, 'findById', async () => ({ published: false }));
  let res = response();
  await run(req, res);
  assert.equal(res.code, 404);
  mock(Course, 'findById', async () => ({ published: true }));
  mock(Subscription, 'findOne', async () => null);
  const pending = { _id: 'pending', status: 'pending' };
  mock(AccessRequest, 'findOne', async () => pending);
  mock(AccessRequest, 'create', () => assert.fail('must not create duplicate request'));
  res = response();
  await run(req, res);
  assert.equal(res.code, 200);
  assert.equal(res.body, pending);
});

test('a student can request subscription without receiving access', async () => {
  const courseId = '507f1f77bcf86cd799439011';
  mock(require('../models/Course'), 'findById', async () => ({ published: true }));
  mock(Subscription, 'findOne', async () => null);
  mock(Subscription, 'create', () => assert.fail('request must not grant access'));
  mock(Enrollment, 'updateOne', () => assert.fail('request must not enroll before approval'));
  mock(AccessRequest, 'findOne', async () => null);
  mock(AccessRequest, 'create', async data => data);
  const res = response();
  await handler('../routes/accessRequests', '/', 'post')({ user: { id: 'student' }, body: { courseId } }, res);
  assert.equal(res.code, 201);
  assert.deepEqual(res.body, { user: 'student', course: courseId, status: 'pending' });
});

test('denial only processes pending requests and does not grant a subscription', async () => {
  mock(Subscription, 'create', () => assert.fail('denial must not grant access'));
  mock(AccessRequest, 'findOneAndUpdate', filter => {
    assert.equal(filter.status, 'pending');
    return { populate() { return this; }, then(resolve) { resolve(null); } };
  });
  const res = response();
  await handler('../routes/accessRequests', '/:id/deny', 'put')({ params: { id: 'request' } }, res);
  assert.equal(res.code, 409);
});

test('students cannot approve or deny subscription requests', () => {
  const router = require('../routes/accessRequests');
  for (const path of ['/:id/approve', '/:id/deny']) {
    const stack = router.stack.find(layer => layer.route?.path === path).route.stack;
    const res = response();
    stack[1].handle({ user: { role: 'student' } }, res, () => assert.fail('must reject student'));
    assert.equal(res.code, 403);
    let allowed = false;
    stack[1].handle({ user: { role: 'superadmin' } }, response(), () => { allowed = true; });
    assert.equal(allowed, true);
  }
});
