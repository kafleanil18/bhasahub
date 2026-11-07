import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearLegacyPassword, loadRememberedEmail, saveRememberedEmail } from './rememberedEmail.js';

function browserStorage() {
  const values = new Map([
    ['remembered_password', 'legacy-secret'],
    ['remembered_email', 'student@example.com'],
    ['token', 'existing-session'],
  ]);
  return {
    values,
    getItem(key) {
      assert.notEqual(key, 'remembered_password', 'Never read the saved password');
      return values.get(key) ?? null;
    },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

test('startup migration removes the legacy password while preserving the session', () => {
  const storage = browserStorage();
  clearLegacyPassword(storage);
  assert.equal(storage.values.has('remembered_password'), false);
  assert.equal(storage.getItem('token'), 'existing-session');
});

test('remembering an email never reads or retains the legacy password', () => {
  const storage = browserStorage();
  assert.equal(loadRememberedEmail(storage), 'student@example.com');
  assert.equal(storage.values.has('remembered_password'), false);
  saveRememberedEmail(storage, 'new@example.com');
  assert.equal(loadRememberedEmail(storage), 'new@example.com');
  assert.equal(storage.values.has('remembered_password'), false);
  saveRememberedEmail(storage, '');
  assert.equal(loadRememberedEmail(storage), '');
  assert.equal(storage.getItem('token'), 'existing-session');
});

test('unavailable storage does not interrupt sign-in preferences', () => {
  const storage = { removeItem() { throw new Error('Storage disabled'); } };
  assert.equal(loadRememberedEmail(storage), '');
  assert.doesNotThrow(() => saveRememberedEmail(storage, 'student@example.com'));
});
