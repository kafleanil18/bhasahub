import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickConversationVoice } from './conversationVoice.js';

const v = (name, lang) => ({ name, lang });
test('prefers the Google Mandarin (mainland) voice', () => {
  const voices = [v('Tingting', 'zh-CN'), v('Google 粤語（香港）', 'zh-HK'), v('Google 普通话（中国大陆）', 'zh-CN')];
  assert.equal(pickConversationVoice(voices).name, 'Google 普通话（中国大陆）');
});
test('uses any Google Chinese voice before other voices', () => {
  assert.equal(pickConversationVoice([v('Meijia', 'zh-TW'), v('Google 國語（臺灣）', 'zh-TW')]).name, 'Google 國語（臺灣）');
});
test('falls back to the best device voice, or null', () => {
  assert.equal(pickConversationVoice([v('Tingting', 'zh-CN')]).name, 'Tingting');
  assert.equal(pickConversationVoice([]), null);
});
