import { useState } from 'react';
import { useSentenceCatalog } from './useSentenceCatalog';
import { recordedSentences } from './dictationQuiz';
import { shuffleSentences } from './sentenceQuiz';
import DictationSession from './DictationSession';
import './SentencePractice.css';
import './TonePractice.css';
import './ListeningDictation.css';
import { useInitialLoad } from '../navigation/pageLoad';

import RefreshButton from '../components/RefreshButton';
const shortest = sentences => sentences.reduce((best, sentence) => !best || sentence.chinese.length < best.chinese.length ? sentence : best, null);

export default function ListeningDictation({ onBack, onRecordAudio }) {
  const { catalog, error, reload } = useSentenceCatalog();
  useInitialLoad(!catalog && !error, 'Loading recordings…');
  const [session, setSession] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const ready = catalog ? recordedSentences(catalog.sentences) : [];
  const topics = catalog?.topics.map(topic => ({ ...topic, sentences: ready.filter(sentence => sentence.topicId === topic.id) })).filter(topic => topic.sentences.length) || [];
  const start = (title, sentences) => { setSession({ title, sentences: shuffleSentences(sentences).slice(0, 10), pool: sentences }); setSessionKey(value => value + 1); };
  const sample = shortest(ready);

  return <main className="sentence-page tone-practice dictation-page" aria-labelledby="dictation-title">
    <div className="dictation-header">
      <button className="sentence-back" onClick={session ? () => setSession(null) : onBack}>{session ? 'All topics' : 'Back to home'}</button>
      {session && <span className="dictation-chip">{session.title}</span>}
    </div>
    <h1 id="dictation-title" className={session ? 'tone-visually-hidden' : 'dictation-title'}>Listening dictation</h1>
    {error ? <div className="dictation-empty" role="alert"><p>{error}</p><RefreshButton onClick={reload}>Try again</RefreshButton></div>
      : !catalog ? <p className="dictation-empty" role="status">Loading recordings…</p>
      : session ? <DictationSession key={sessionKey} initialSentences={session.sentences} onRestart={() => start(session.title, session.pool)} onExit={() => setSession(null)} />
      : !ready.length ? <div className="dictation-empty"><h2>Teacher recordings are coming soon</h2><p>Dictation opens once your teacher records audio for sentences in the library.</p><div className="sentence-actions"><RefreshButton onClick={reload}>Check for recordings</RefreshButton>{onRecordAudio && <button className="sentence-primary" onClick={onRecordAudio}>Record sentence audio</button>}</div></div>
      : <>
        <p className="dictation-intro">Listen to your teacher, then type the sentence in Chinese.</p>
        <button type="button" className="dictation-card-mixed" onClick={() => start('Mixed', ready)} aria-label="Mixed dictation" aria-describedby="dictation-mixed-text">
          <span className="dictation-card-art" aria-hidden="true"><span className="dictation-art-icon">听写</span><small lang="zh-CN">{sample?.chinese}</small></span>
          <span className="dictation-card-body"><strong>Mixed dictation</strong><span id="dictation-mixed-text">Up to 10 recordings from across the library, {ready.length} ready</span><span className="dictation-card-cta" aria-hidden="true">Start</span></span>
        </button>
        <h2 className="dictation-section-title">Or choose a topic</h2>
        <div className="dictation-topics">{topics.map(topic => <button type="button" key={topic.id} className="dictation-topic" onClick={() => start(topic.title, topic.sentences)} aria-label={topic.title} aria-describedby={`dictation-topic-${topic.id}`}>
          <span className="dictation-topic-sample" lang="zh-CN" aria-hidden="true">{shortest(topic.sentences).chinese}</span>
          <strong>{topic.title}</strong>
          <small id={`dictation-topic-${topic.id}`}>{topic.sentences.length} recording{topic.sentences.length === 1 ? '' : 's'}</small>
        </button>)}</div>
        <RefreshButton className="dictation-refresh" onClick={reload}>Refresh available recordings</RefreshButton>
      </>}
  </main>;
}
