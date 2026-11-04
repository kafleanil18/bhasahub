import { useState } from 'react';
import { useSentenceCatalog } from './useSentenceCatalog';
import { recordedSentences } from './dictationQuiz';
import { shuffleSentences } from './sentenceQuiz';
import DictationSession from './DictationSession';
import './SentencePractice.css';
import './ListeningDictation.css';

export default function ListeningDictation({ onBack, onRecordAudio }) {
  const { catalog, error, reload } = useSentenceCatalog();
  const [session, setSession] = useState(null);
  const ready = catalog ? recordedSentences(catalog.sentences) : [];
  const topics = catalog?.topics.filter(topic => ready.some(sentence => sentence.topicId === topic.id)) || [];
  function start(sentences) { setSession(shuffleSentences(sentences).slice(0, 10)); }
  return <section className="sentence-page dictation-page" aria-labelledby="dictation-title">
    <button className="sentence-back" onClick={onBack}>← Back to home</button>
    <div className="sentence-heading"><p className="sentence-eyebrow">HSK 1 · Listen and write</p><h1 id="dictation-title">Listening dictation</h1><p>Listen to your teacher, write the Chinese sentence, and discover which characters you recognized.</p></div>
    {error ? <div className="sentence-card" role="alert"><p>{error}</p><button className="sentence-primary" onClick={reload}>Try again</button></div> : !catalog ? <p role="status">Loading recordings…</p> : session ? <><button className="sentence-back" onClick={() => setSession(null)}>← Choose another topic</button><DictationSession initialSentences={session} onExit={() => setSession(null)} /></> : !ready.length ? <div className="sentence-card"><h2>Teacher recordings are coming soon</h2><p>Dictation will be ready when your teacher records audio for sentences in the library.</p><div className="sentence-actions"><button className="sentence-secondary" onClick={reload}>Check for recordings</button>{onRecordAudio && <button className="sentence-primary" onClick={onRecordAudio}>Record sentence audio</button>}</div></div> : <>
      <div className="sentence-overview"><div><strong>{ready.length}</strong><span>recorded sentences</span></div><div><strong>{topics.length}</strong><span>topics ready</span></div><div><strong>10</strong><span>sentences per session, or fewer</span></div></div>
      <div className="sentence-mixed"><div><h2>A little of everything</h2><p>Practice with up to 10 recordings from across the library.</p></div><button className="sentence-primary" onClick={() => start(ready)}>Start mixed dictation →</button></div>
      <div className="sentence-section-heading"><h2>Pick a topic</h2><p>Only sentences with teacher recordings are included.</p></div>
      <div className="sentence-topics">{topics.map((topic, index) => {
        const sentences = ready.filter(sentence => sentence.topicId === topic.id);
        return <button className="sentence-topic" key={topic.id} onClick={() => start(sentences)}><span className="sentence-topic-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{topic.title}</strong><small>{sentences.length} recording{sentences.length === 1 ? '' : 's'} available</small></span><span aria-hidden="true">↗</span></button>;
      })}</div>
      <button className="sentence-back" onClick={reload}>Refresh available recordings</button>
    </>}
  </section>;
}
