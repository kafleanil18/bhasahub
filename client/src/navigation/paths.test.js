import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath, signInPath } from './paths.js';

test('sign-in destinations preserve internal paths, query parameters, and anchors', () => {
  const destination = '/courses/abc/lessons/def?mode=practice#question-2';
  assert.equal(safeReturnPath(destination), destination);
  assert.equal(new URL(signInPath(destination), 'https://local.invalid').searchParams.get('next'), destination);
});

test('return destinations reject external addresses and authentication loops', () => {
  for (const value of ['https://example.com', '//example.com', '/\\example.com', '/sign-in', '/register?next=/admin', '/forgot-password', '/reset-password?token=x', '/\n/example.com', '']) {
    assert.equal(safeReturnPath(value, '/my-courses'), '/my-courses');
  }
});
