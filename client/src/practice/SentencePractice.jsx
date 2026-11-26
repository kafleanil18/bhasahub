import { useState } from 'react';
import { useSentenceCatalog } from './useSentenceCatalog';
import { shuffleSentences } from './sentenceQuiz';
import SentenceSession from './SentenceSession';
import './SentencePractice.css';
import './SentenceBuilder.css';
import Icon from '../components/Icon';
import { useInitialLoad } from '../navigation/pageLoad';

import RefreshButton from '../components/RefreshButton';
const COLLAPSED_TOPICS = 8;

function readProgress(key) {
  try { const saved = JSON.parse(localStorage.getItem(key)); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : []; }
  catch { return []; }
}

function TopicList({ topics, onStart }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const search = query.trim().toLowerCase();
  const matches = search ? topics.filter(topic => topic.title.toLowerCase().includes(search)) : topics;
  const visible = search || showAll ? matches : matches.slice(0, COLLAPSED_TOPICS);
  return <>
    <div className="sb-topics-head">
      <div><h2>Pick a topic</h2><p>{topics.length} everyday topics · practice at your own pace</p></div>
      <label className="sb-search"><span className="sentence-visually-hidden">Find a topic</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <input type="search" placeholder="Find a topic…" value={query} onChange={event => setQuery(event.target.value)} />
      </label>
    </div>
    {!matches.length && <p className="sb-empty">No topics match “{query}”.</p>}
    <div className="sentence-topics sb-topic-grid">{visible.map(topic => {
      const pct = topic.total ? Math.round(topic.done / topic.total * 100) : 0;
      return <button key={topic.id} className={`sentence-topic sb-topic${topic.done === topic.total ? ' is-done' : topic.done ? ' is-started' : ''}`} onClick={() => onStart(topic.sentences)}>
        <span className="sentence-topic-number">{String(topic.number).padStart(2, '0')}</span>
        <span className="sb-topic-body"><strong>{topic.title}</strong>
          <span className="sb-topic-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
          <small>{topic.done} / {topic.total} answered correctly</small></span>
        <span className="sb-topic-go" aria-hidden="true">{topic.done === topic.total ? '✓' : '→'}</span>
      </button>;
    })}</div>
    {!search && matches.length > COLLAPSED_TOPICS && <button className="sentence-secondary sb-show-all" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show fewer topics' : `Show all ${matches.length} topics`}</button>}
  </>;
}

export default function SentencePractice({ user, onBack }) {
  const { catalog, error, reload } = useSentenceCatalog();
  useInitialLoad(!catalog && !error, 'Loading sentences…');
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
  const topics = catalog ? catalog.topics.map((topic, index) => {
    const sentences = catalog.sentences.filter(sentence => sentence.topicId === topic.id);
    return { ...topic, number: index + 1, sentences, total: sentences.length, done: sentences.filter(sentence => mastered.includes(sentence.id)).length };
  }) : [];
  const resume = topics.find(topic => topic.done > 0 && topic.done < topic.total);
  const startTopic = sentences => setSession(shuffleSentences(sentences));
  const pct = catalog?.sentences.length ? Math.round(completed / catalog.sentences.length * 100) : 0;

  return <section className="sentence-page sentence-builder" aria-labelledby="sentence-title">
    <button className="sentence-back" onClick={session ? () => setSession(null) : onBack}>{session ? '← Choose another topic' : '← Back to home'}</button>
    {session ? <h1 id="sentence-title" className="sb-compact-title">Sentence builder</h1>
      : <div className="sb-hero">
        <div className="sb-hero-copy"><p className="sb-hero-eyebrow">HSK 1 · Word order practice</p><h1 id="sentence-title">Small words.<br />Real sentences.</h1><p>Put Chinese words in order, learn the pattern, and listen to your teacher's recording.</p></div>
        <div className="sb-hero-demo" aria-hidden="true">
          <div className="sb-demo-row"><span lang="zh-CN">我</span><span lang="zh-CN">是</span><span lang="zh-CN">学生</span><b>。</b></div>
          <p>I am a student.</p>
        </div>
      </div>}
    {error ? <div className="sentence-card" role="alert"><p>{error}</p><RefreshButton onClick={reload}>Try again</RefreshButton></div> : !catalog ? <p role="status">Loading sentences…</p> : session ? <SentenceSession initialSentences={session} onExit={() => setSession(null)} onMastered={markMastered} /> : <>
      <div className="sentence-overview sb-overview">
        <div><strong>{catalog.sentences.length}</strong><span>sentences to build</span></div>
        <div><strong>{catalog.topics.length}</strong><span>everyday topics</span></div>
        <div><strong>{completed}</strong><span>answered correctly</span></div>
        <div className="sb-overall" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="sb-start">
        <div className="sentence-mixed sb-start-card"><span className="sb-start-icon" aria-hidden="true"><Icon name="shuffle"/></span><div><h2>A little of everything</h2><p>Warm up with 10 sentences from across the collection.</p></div><button className="sentence-primary" onClick={() => setSession(shuffleSentences(catalog.sentences).slice(0, 10))}>Start mixed practice →</button></div>
        {resume && <div className="sentence-mixed sb-start-card sb-resume"><span className="sb-start-icon" aria-hidden="true"><Icon name="play"/></span><div><h2>Continue: {resume.title}</h2><p>{resume.done} of {resume.total} answered correctly so far.</p></div><button className="sentence-secondary" onClick={() => startTopic(resume.sentences)}>Continue topic</button></div>}
      </div>
      <TopicList topics={topics} onStart={startTopic} />
      <p className="sentence-muted sentence-local-note">Progress is saved in this browser{user ? ' for your account' : ''}. Original practice sentences; these are not official exam questions.</p>
    </>}
  </section>;
}
