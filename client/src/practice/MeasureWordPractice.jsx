import { useState } from 'react';
import { MEASURE_GROUPS, MEASURE_TOPICS, MEASURE_QUESTIONS, measureRound } from './measureQuiz';
import useChineseVoice, { voiceKey } from './useChineseVoice';
import SentenceText, { PinyinText } from './SentenceText';
import MeasureSession from './MeasureSession';
import './SentencePractice.css';
import './MeasureWordPractice.css';

export default function MeasureWordPractice({ onBack }) {
  const [session, setSession] = useState(null);
  const { voice, voices, selected, setSelected } = useChineseVoice();
  return <section className="sentence-page measure-page" aria-labelledby="measure-title">
    <button className="sentence-back" onClick={onBack}>← Back to home</button>
    <div className="sentence-heading"><p className="sentence-eyebrow">Small words · Better Chinese</p><h1 id="measure-title">Measure word practice</h1><p>One book, a cup of tea, three cats. Learn the word that connects a number to the thing you are counting.</p></div>
    {session ? <><button className="sentence-back" onClick={() => setSession(null)}>← Choose another topic</button><MeasureSession initialQuestions={session} voice={voice} onExit={() => setSession(null)} /></> : <>
      <div className="sentence-overview"><div><strong>{MEASURE_GROUPS.length}</strong><span>common measure words</span></div><div><strong>{MEASURE_QUESTIONS.length}</strong><span>practice phrases</span></div><div><strong>10</strong><span>questions per round</span></div></div>
      {voices.length > 0 ? <label className="measure-voice-label">Chinese voice for answer playback<select value={selected} onChange={event => setSelected(event.target.value)}>{voices.map(voice => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} · {voice.lang}</option>)}</select></label> : <p className="sentence-muted">Practice works without audio. If your device has a Mandarin voice, you can hear each phrase after answering.</p>}
      <div className="sentence-mixed"><div><h2>Mix the measure words</h2><p>One question for each of the 10 measure words.</p></div><button className="sentence-primary" onClick={() => setSession(measureRound())}>Start mixed practice →</button></div>
      <div className="sentence-topics">{MEASURE_TOPICS.map((topic,index) => <button key={topic.id} className="sentence-topic" onClick={() => setSession(measureRound(topic.id))}><span className="sentence-topic-number">{String(index + 1).padStart(2,'0')}</span><span><strong>{topic.title}</strong><small>{topic.description}</small></span><span aria-hidden="true">↗</span></button>)}</div>
      <details className="measure-reference"><summary>Review the 10 measure words</summary><div>{MEASURE_GROUPS.map(group => {
        const example = MEASURE_QUESTIONS.find(question => question.measure === group.word);
        return <article key={group.word}><h2><PinyinText text={group.word} readings={[group.pinyin]} /></h2><div><strong>{group.meaning}</strong><p>{group.explanation}</p><p><SentenceText sentence={example} /> · {example.english}</p></div></article>;
      })}</div></details>
    </>}
  </section>;
}
