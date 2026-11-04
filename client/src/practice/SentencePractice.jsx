import { useState } from 'react';
import { useSentenceCatalog } from './useSentenceCatalog';
import { shuffleSentences } from './sentenceQuiz';
import SentenceSession from './SentenceSession';
import './SentencePractice.css';

function readProgress(key) {
  try { const saved = JSON.parse(localStorage.getItem(key)); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : []; }
  catch { return []; }
}

export default function SentencePractice({ user, onBack }) {
  const { catalog, error, reload } = useSentenceCatalog();
  const progressKey = `sentence-practice-v1:${user?.id || 'guest'}`;
  const [mastered, setMastered] = useState(() => readProgress(progressKey));
  const [session, setSession] = useState(null);
  function markMastered(id) {
    setMastered(previous => {
      const next = [...new Set([...previous, id])];
      try { localStorage.setItem(progressKey, JSON.stringify(next)); } catch { /* Practice can continue without local storage. */ }
      return next;
    });
  }
  const completed = catalog ? catalog.sentences.filter(sentence => mastered.includes(sentence.id)).length : 0;
  return <section className="sentence-page" aria-labelledby="sentence-title">
    <button className="sentence-back" onClick={onBack}>← Back to home</button>
    <div className="sentence-heading"><p className="sentence-eyebrow">HSK 1 · Word order practice</p><h1 id="sentence-title">Small words.<br />Real sentences.</h1><p>Put Chinese words in order, learn the pattern, and listen to your teacher's recording.</p></div>
    {error ? <div className="sentence-card" role="alert"><p>{error}</p><button className="sentence-primary" onClick={reload}>Try again</button></div> : !catalog ? <p role="status">Loading sentences…</p> : session ? <><button className="sentence-back" onClick={() => setSession(null)}>← Choose another topic</button><SentenceSession initialSentences={session} onExit={() => setSession(null)} onMastered={markMastered} /></> : <>
      <div className="sentence-overview"><div><strong>{catalog.sentences.length}</strong><span>sentences to build</span></div><div><strong>{catalog.topics.length}</strong><span>everyday topics</span></div><div><strong>{completed}</strong><span>answered correctly</span></div></div>
      <div className="sentence-mixed"><div><h2>A little of everything</h2><p>Warm up with 10 sentences from across the collection.</p></div><button className="sentence-primary" onClick={() => setSession(shuffleSentences(catalog.sentences).slice(0, 10))}>Start mixed practice →</button></div>
      <div className="sentence-section-heading"><h2>Pick a topic</h2><p>Practice at your own pace</p></div>
      <div className="sentence-topics">{catalog.topics.map((topic, index) => {
        const sentences = catalog.sentences.filter(sentence => sentence.topicId === topic.id);
        const count = sentences.filter(sentence => mastered.includes(sentence.id)).length;
        return <button key={topic.id} className="sentence-topic" onClick={() => setSession(shuffleSentences(sentences))}><span className="sentence-topic-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{topic.title}</strong><small>{count} / {sentences.length} answered correctly</small></span><span aria-hidden="true">↗</span></button>;
      })}</div>
      <p className="sentence-muted sentence-local-note">Progress is saved in this browser{user ? ' for your account' : ''}. Original practice sentences; these are not official exam questions.</p>
    </>}
  </section>;
}
