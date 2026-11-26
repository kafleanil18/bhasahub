import { useState } from 'react';
import { MEASURE_GROUPS, MEASURE_TOPICS, MEASURE_QUESTIONS, measureRound } from './measureQuiz';
import useMandarinSpeaker from './useMandarinSpeaker';
import VoiceSwitch from './VoiceSwitch';
import SentenceText, { PinyinText } from './SentenceText';
import MeasureSession from './MeasureSession';
import './SentencePractice.css';
import './TonePractice.css';
import './MeasureWordPractice.css';

// A sample phrase for each card: [number, measure word, noun].
const examples = {
  mixed: ['一', '本', '书'], people: ['三', '只', '猫'], study: ['两', '张', '照片'],
  food: ['一', '杯', '茶'], home: ['一', '把', '伞'], outside: ['五', '辆', '汽车'],
};
function PhraseArt({ id }) {
  const [count, measure, noun] = examples[id];
  return <span className="measure-art" aria-hidden="true" lang="zh-CN">{count}<b>{measure}</b>{noun}</span>;
}

export default function MeasureWordPractice({ onBack }) {
  const [session, setSession] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const speaker = useMandarinSpeaker();
  const topic = session && (session.topic === 'mixed' ? { title: 'Mixed' } : MEASURE_TOPICS.find(item => item.id === session.topic));
  const start = id => { setSession({ topic: id, questions: measureRound(id) }); setSessionKey(value => value + 1); };

  return <main className="sentence-page tone-practice measure-page" aria-labelledby="measure-title">
    <div className="measure-header">
      <button className="sentence-back" onClick={session ? () => setSession(null) : onBack}>{session ? 'All topics' : 'Back to home'}</button>
      {topic && <span className="measure-chip">{topic.title}</span>}
    </div>
    <h1 id="measure-title" className={session ? 'tone-visually-hidden' : 'measure-title'}>Measure word practice</h1>
    {session ? <MeasureSession key={sessionKey} initialQuestions={session.questions} speaker={speaker.available ? speaker : null} onRestart={() => start(session.topic)} onExit={() => setSession(null)} /> : <>
      <p className="measure-intro">Pick the word that joins a number to the thing you count.</p>
      <button type="button" className="measure-card measure-card-mixed" onClick={() => start('mixed')} aria-label="Mixed practice" aria-describedby="measure-card-mixed">
        <span className="measure-card-art"><PhraseArt id="mixed" /></span>
        <span className="measure-card-body"><strong>Mixed practice</strong><span id="measure-card-mixed">One question for each of the {MEASURE_GROUPS.length} measure words.</span><span className="measure-card-cta" aria-hidden="true">Start</span></span>
      </button>
      <h2 className="measure-section-title">Or choose a topic</h2>
      <div className="measure-cards">{MEASURE_TOPICS.map(item => <button type="button" key={item.id} className="measure-card" onClick={() => start(item.id)} aria-label={item.title} aria-describedby={`measure-card-${item.id}`}>
        <span className="measure-card-art"><PhraseArt id={item.id} /></span>
        <span className="measure-card-body"><strong>{item.title}</strong><span id={`measure-card-${item.id}`}>{item.description}</span></span>
      </button>)}</div>
      <details className="measure-reference"><summary>Review the {MEASURE_GROUPS.length} measure words</summary>
        <div className="measure-reference-grid">{MEASURE_GROUPS.map(group => {
          const example = MEASURE_QUESTIONS.find(question => question.measure === group.word);
          return <article key={group.word}><h3><PinyinText text={group.word} readings={[group.pinyin]} /></h3><div><strong>{group.meaning}</strong><p><SentenceText sentence={example} /></p><p className="measure-reference-english">{example.english}</p></div></article>;
        })}</div>
      </details>
      <VoiceSwitch speaker={speaker}/>
    </>}
  </main>;
}
