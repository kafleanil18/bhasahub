import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NUMBER_MODES, NUMBER_QUESTIONS, chineseNumber, numberRound, checkNumberAnswer } from './numberQuiz.js';
import { mandarinVoices, rankGoogleFemale } from './useChineseVoice.js';

test('Chinese numbers handle tens, hundreds, and embedded zeros', () => {
  const examples = {0:'零',1:'一',10:'十',11:'十一',20:'二十',25:'二十五',99:'九十九',100:'一百',101:'一百零一',110:'一百一十',205:'二百零五',1000:'一千',1001:'一千零一',1010:'一千零一十',9999:'九千九百九十九'};
  for (const [input, expected] of Object.entries(examples)) assert.equal(chineseNumber(Number(input)), expected);
  for (const invalid of [-1, 10000, 1.5]) assert.throws(() => chineseNumber(invalid), RangeError);
});

test('all five modes provide unique, complete ten-question rounds and aligned character pinyin', () => {
  assert.equal(NUMBER_MODES.length, 5);
  assert.equal(NUMBER_QUESTIONS.length, 282);
  assert.equal(new Set(NUMBER_QUESTIONS.map(q => q.id)).size, 282);
  for (const mode of NUMBER_MODES) {
    const pool = NUMBER_QUESTIONS.filter(q => q.mode === mode.id);
    assert.ok(pool.length >= 10);
    assert.equal(new Set(pool.map(q => q.speech)).size, pool.length);
    const round = numberRound(mode.id, () => .3);
    assert.equal(round.length, 10);
    assert.equal(new Set(round.map(q => q.id)).size, 10);
    assert.ok(round.every(q => q.mode === mode.id));
  }
  for (const q of NUMBER_QUESTIONS) {
    assert.ok(q.display && q.speech && q.explanation);
    assert.equal(q.tokenPinyin.length, q.tokens.join('').length);
    assert.ok(q.tokenPinyin.every(reading => reading.length === 1 && /^[\p{L}]+$/u.test(reading[0])));
    const answer = q.mode === 'time' || q.mode === 'dates' ? q.expected : { value: q.mode === 'prices' ? (q.expected / 100).toFixed(2) : String(q.expected) };
    assert.deepEqual(checkNumberAnswer(q, answer), { valid: true, correct: true }, q.id);
  }
});

test('prices accept currency labels, grouping, and exact decimal amounts without rounding away mistakes', () => {
  const q = NUMBER_QUESTIONS.find(q => q.id === 'price-255');
  for (const value of ['25.5','25.50','¥25.50','￥２５．５０','25.50元','RMB 25.50']) assert.equal(checkNumberAnswer(q, {value}).correct, true, value);
  assert.equal(checkNumberAnswer(q, {value:'25.05'}).correct, false);
  for (const value of ['25,5','25.500','1e2','-25']) assert.equal(checkNumberAnswer(q, {value}).valid, false, value);
  assert.equal(checkNumberAnswer({...q, expected:100000}, {value:'1,000.00'}).correct, true);
});

test('times distinguish AM/PM and validate the complete 24-hour time', () => {
  const q = NUMBER_QUESTIONS.find(q => q.id === 'time-15-30');
  assert.equal(q.chinese, '下午三点半。');
  assert.equal(checkNumberAnswer(q, {hour:'15',minute:'30'}).correct, true);
  assert.equal(checkNumberAnswer(q, {hour:'3',minute:'30'}).correct, false);
  for (const answer of [{hour:24,minute:0},{hour:15,minute:60},{hour:'',minute:30}]) assert.equal(checkNumberAnswer(q, answer).valid, false);
});

test('dates enforce month-before-day and reject nonexistent calendar dates', () => {
  const q = NUMBER_QUESTIONS.find(q => q.id === 'date-3-15');
  assert.equal(checkNumberAnswer(q,{month:3,day:15}).correct,true);
  for (const answer of [{month:15,day:3},{month:2,day:30},{month:4,day:31},{month:0,day:1}]) assert.equal(checkNumberAnswer(q,answer).valid,false);
  assert.equal(checkNumberAnswer(q,{month:2,day:29}).valid,true);
});

test('ages require integers and phone answers preserve leading zeros', () => {
  const age=NUMBER_QUESTIONS.find(q=>q.id==='age-28');
  assert.equal(checkNumberAnswer(age,{value:'28'}).correct,true);
  assert.equal(checkNumberAnswer(age,{value:'28.5'}).valid,false);
  const phone=NUMBER_QUESTIONS.find(q=>q.mode==='phones'&&q.expected.startsWith('0'));
  assert.ok(phone.speech.includes('幺'));
  assert.equal(checkNumberAnswer(phone,{value:phone.expected}).correct,true);
  assert.equal(checkNumberAnswer(phone,{value:phone.expected.slice(0,4)+'-'+phone.expected.slice(4)}).correct,true);
  assert.equal(checkNumberAnswer(phone,{value:String(Number(phone.expected))}).correct,false);
  assert.equal(checkNumberAnswer(phone,{value:'---'}).valid,false);
});

test('Mandarin voice selection prioritizes mainland Mandarin and excludes Cantonese and unrelated languages', () => {
  const voices=[{name:'English',lang:'en-US'},{name:'Cantonese',lang:'zh-HK'},{name:'Taiwan',lang:'zh-TW'},{name:'Mandarin',lang:'zh-CN'},{name:'Mandarin BCP47',lang:'cmn-Hans-CN'}];
  const selected=mandarinVoices(voices);
  assert.equal(selected[0].lang,'zh-CN');
  assert.deepEqual(new Set(selected.map(v=>v.name)),new Set(['Taiwan','Mandarin','Mandarin BCP47']));
});

test('voice choice prefers Google female Mandarin, then a female device voice, never dropping Mandarin voices', () => {
  const first = voices => rankGoogleFemale(voices)[0]?.name;
  const google = { name: 'Google 普通话（中国大陆）', lang: 'zh-CN' }, taiwan = { name: 'Google 國語（臺灣）', lang: 'zh-TW' };
  const tingting = { name: 'Tingting', lang: 'zh-CN' }, kangkang = { name: 'Microsoft Kangkang - Chinese (Simplified, PRC)', lang: 'zh-CN' };
  const xiaoxiao = { name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', lang: 'zh-CN' }, english = { name: 'Google US English', lang: 'en-US' };
  assert.equal(first([tingting, taiwan, google, english]), google.name);
  assert.equal(first([kangkang, xiaoxiao, english]), xiaoxiao.name);
  assert.equal(first([tingting, english]), tingting.name);
  assert.equal(first([{ name: '中文（中国）', lang: 'zh_CN' }]), '中文（中国）');
  assert.equal(rankGoogleFemale([kangkang, tingting, english]).length, 2);
  assert.deepEqual(rankGoogleFemale([english]), []);
});
