import test from 'node:test';
import assert from 'node:assert/strict';
import { MEASURE_GROUPS, MEASURE_TOPICS, MEASURE_QUESTIONS, measureRound, isCorrectMeasure } from './measureQuiz.js';
test('catalog has unique phrases with complete character pinyin', () => {
  assert.equal(MEASURE_GROUPS.length,10);
  assert.equal(MEASURE_QUESTIONS.length,132);
  assert.equal(new Set(MEASURE_QUESTIONS.map(q=>q.chinese)).size,132);
  assert.equal(new Set(MEASURE_QUESTIONS.map(q=>q.id)).size,132);
  for(const q of MEASURE_QUESTIONS) q.tokens.forEach((token,i)=>assert.equal([...token].length,q.tokenPinyin[i].length));
});
test('mixed rounds cover all classifiers and grade only valid choices', () => {
  for(let i=0;i<30;i++) {
    const round=measureRound();
    assert.equal(round.length,10);
    assert.equal(new Set(round.map(q=>q.measure)).size,10);
    for(const q of round) {
      assert.equal(new Set(q.options).size,4);
      assert.equal(q.options.filter(choice=>isCorrectMeasure(q,choice)).length,1);
      assert.equal(isCorrectMeasure(q,'unknown'),false);
      if(q.measure!=='个') assert.ok(!q.options.includes('个'));
      if(q.measure==='只') assert.ok(!q.options.includes('条'));
      if(q.measure==='条') assert.ok(!q.options.includes('只') && !q.options.includes('件'));
      if(q.measure==='把') assert.ok(!q.options.includes('张'));
      if(q.measure==='辆') assert.ok(!q.options.includes('台'));
    }
  }
});
test('topic rounds contain ten unique matching phrases without mutating catalog', () => {
  const before=JSON.stringify(MEASURE_QUESTIONS);
  for(const topic of MEASURE_TOPICS) {
    const round=measureRound(topic.id);
    assert.equal(round.length,10);
    assert.equal(new Set(round.map(q=>q.id)).size,10);
    assert.ok(round.every(q=>q.topic===topic.id));
  }
  assert.equal(JSON.stringify(MEASURE_QUESTIONS),before);
  assert.deepEqual(measureRound('unknown'),[]);
});
test('quantities use 两, spoken 一 tones, and correct irregular English plurals', () => {
  const get=id=>MEASURE_QUESTIONS.find(q=>q.id===id);
  assert.equal(get('measure-child-2').english,'Two children');
  assert.equal(get('measure-fish-3').english,'Three fish');
  assert.equal(get('measure-trousers-5').english,'Five pairs of trousers');
  assert.equal(get('measure-book-2').quantity,'两');
  assert.equal(get('measure-shirt-1').quantityPinyin[0],'yí');
  assert.equal(get('measure-book-1').quantityPinyin[0],'yì');
});
