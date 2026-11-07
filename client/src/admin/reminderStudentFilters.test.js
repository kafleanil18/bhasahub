import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterStudents, practiceLabel } from './reminderStudentFilters.js';

const students = [
  { user: 'recent', name: 'Recent', email: 'recent@example.com', lastPracticeAt: '2026-11-07', inactiveDays: 0, lastReminderAt: null },
  { user: 'three', name: 'Three days', email: 'three@example.com', lastPracticeAt: '2026-11-04', inactiveDays: 3, lastReminderAt: '2026-11-05' },
  { user: 'seven', name: 'Seven days', email: 'seven@example.com', lastPracticeAt: '2026-10-31', inactiveDays: 7, lastReminderAt: '2026-11-01' },
  { user: 'fourteen', name: 'Fourteen days', email: 'fourteen@example.com', lastPracticeAt: '2026-10-24', inactiveDays: 14, lastReminderAt: null },
  { user: 'unknown', name: 'Unknown', email: 'unknown@example.com', lastPracticeAt: null, inactiveDays: null, lastReminderAt: null },
];

test('inactivity thresholds include their boundary and keep unrecorded practice separate', () => {
  const ids = filter => filterStudents(students, filter, '', new Set()).map(student => student.user).sort();
  assert.deepEqual(ids('3'), ['fourteen', 'seven', 'three']);
  assert.deepEqual(ids('7'), ['fourteen', 'seven']);
  assert.deepEqual(ids('14'), ['fourteen']);
  assert.deepEqual(ids('unrecorded'), ['unknown']);
});

test('search and selected views preserve explicit selection across filters', () => {
  const selection = new Set(['recent', 'seven']);
  assert.deepEqual(filterStudents(students, 'selected', '', selection, 'name').map(student => student.user), ['recent', 'seven']);
  assert.deepEqual(filterStudents(students, 'all', ' SEVEN@EXAMPLE ', selection).map(student => student.user), ['seven']);
  assert.equal(selection.size, 2);
});

test('practice labels avoid inventing an inactivity period for missing history', () => {
  assert.equal(practiceLabel(students[0]), 'Within 24 hours');
  assert.equal(practiceLabel(students[1]), '3 days ago');
  assert.equal(practiceLabel(students[4]), 'No recorded practice');
});
