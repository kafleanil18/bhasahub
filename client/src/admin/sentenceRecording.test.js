import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordingMimeType, recordingExtension } from './sentenceRecording.js';

test('selects supported browser recording formats and matching server filename extensions', () => {
  for (const [supported, extension] of [['audio/webm;codecs=opus', 'webm'], ['audio/mp4', 'm4a'], ['audio/ogg;codecs=opus', 'ogg']]) {
    const type = recordingMimeType({ isTypeSupported: candidate => candidate === supported });
    assert.equal(type, supported);
    assert.equal(recordingExtension(type), extension);
  }
  assert.equal(recordingMimeType({ isTypeSupported: () => false }), '');
  assert.equal(recordingExtension('audio/wav'), 'wav');
});
