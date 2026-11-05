import { useEffect, useRef, useState } from 'react';
import { useSentenceCatalog } from '../practice/useSentenceCatalog';
import { mediaUrl } from '../utils/mediaUrl';
import SentenceText from '../practice/SentenceText';
import SentenceRecorder from './SentenceRecorder';
import AccessDialog from './subscriptions/AccessDialog';
import { MAX_RECORDING_BYTES, recordingExtension } from './sentenceRecording';
import '../practice/SentencePractice.css';
import './SubscriptionManager.css';
import './SentenceAudioManager.css';

const PAGE_SIZE = 15;
const numberLabel = sentence => `#${String(sentence.number).padStart(3, '0')}`;

export default function SentenceAudioManager({ onBack }) {
  const { catalog, error: loadError, reload, updateAudio } = useSentenceCatalog();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [recordingSentence, setRecordingSentence] = useState(null);
  const [removingSentence, setRemovingSentence] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  const workspaceRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function changeAudio(sentence, recording) {
    if (busyRef.current) throw new Error('Another recording is being saved. Please wait.');
    if (recording && (!recording.size || recording.size > MAX_RECORDING_BYTES)) throw new Error('Please record a shorter sentence and try again.');
    busyRef.current = true;
    setBusyId(sentence.id); setError(''); setMessage('');
    controllerRef.current = new AbortController();
    try {
      const form = new FormData();
      if (recording) form.append('recording', recording, `${sentence.id}.${recordingExtension(recording.type)}`);
      const response = await fetch(`${window.API_BASE_URL}/api/sentences/${sentence.id}/audio`, {
        method: recording ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        ...(recording ? { body: form } : {}), signal: controllerRef.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this recording.');
      updateAudio(sentence.id, data.audioUrl);
      setMessage(`Sentence ${numberLabel(sentence)}: ${recording ? 'recording saved and ready for student practice' : 'recording removed'}.`);
    } finally { setBusyId(''); busyRef.current = false; }
  }
  const removeAudio = async () => {
    try { await changeAudio(removingSentence, null); setRemovingSentence(null); }
    catch (err) { if (err.name !== 'AbortError') setError(err.message || 'Could not remove the recording. Please try again.'); }
  };
  const openRecording = sentence => {
    workspaceRef.current?.querySelectorAll('audio').forEach(audio => audio.pause());
    setError(''); setRecordingSentence(sentence);
  };
  const clearFilters = (nextStatus = 'all') => { setSearch(''); setTopic('all'); setStatus(nextStatus); setPage(0); };
  const selectPage = next => { setPage(next); workspaceRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); };
  const sentences = catalog?.sentences || [];
  const recorded = sentences.filter(sentence => sentence.audioUrl).length;
  const missing = sentences.length - recorded;
  const nextMissing = sentences.find(sentence => !sentence.audioUrl);
  const query = search.trim().toLocaleLowerCase();
  const filtered = sentences.filter(sentence => (
    (topic === 'all' || sentence.topicId === topic)
    && (status === 'all' || (status === 'recorded' ? Boolean(sentence.audioUrl) : !sentence.audioUrl))
    && (!query || `${sentence.id} ${sentence.number} ${sentence.chinese} ${sentence.pinyin} ${sentence.english}`.toLocaleLowerCase().includes(query))
  ));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const hasFilters = search.trim() || topic !== 'all' || status !== 'all';
  const percentage = sentences.length ? Math.round(recorded / sentences.length * 100) : 0;

  return <section className="container access-manager audio-studio" aria-labelledby="sentence-audio-title">
    <button className="back-btn" onClick={onBack}>← Back to dashboard</button>
    <div className="access-page-heading"><div><p className="access-eyebrow">Learning content · Audio library</p><h1 id="sentence-audio-title">Sentence audio</h1><p>Record clear Chinese audio for each sentence. Listen, review, and save it for student practice.</p></div><button className="access-button is-primary" disabled={!nextMissing || !!busyId} onClick={() => openRecording(nextMissing)}><span aria-hidden="true">＋</span> Record next missing</button></div>
    {message && <div className="access-feedback is-success" role="status"><span>{message}</span><button className="access-link" onClick={() => setMessage('')} aria-label="Dismiss success message">Dismiss</button></div>}
    {loadError ? <div className="access-feedback is-error" role="alert"><p>{loadError}</p><button className="access-button" onClick={reload}>Retry loading</button></div> : !catalog ? <div className="access-loading" role="status">Loading sentence recordings…</div> : <>
      <div className="access-overview" aria-label="Audio library overview">{[{ key: 'all', label: 'All sentences', count: sentences.length, hint: 'Browse the full library' }, { key: 'recorded', label: 'Recorded', count: recorded, hint: 'Ready for student practice' }, { key: 'missing', label: 'Needs audio', count: missing, hint: 'Choose a sentence to record' }].map(item => <button type="button" key={item.key} aria-pressed={status === item.key && !search && topic === 'all'} onClick={() => { clearFilters(item.key); workspaceRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); }}><span>{item.label}</span><strong>{item.count.toLocaleString()}</strong><small>{item.hint}<span aria-hidden="true">↗</span></small></button>)}</div>
      <div className="audio-library-progress"><div><strong>{recorded.toLocaleString()} of {sentences.length.toLocaleString()} sentences recorded</strong><span>{missing ? `${missing.toLocaleString()} still need your voice.` : sentences.length ? 'Every sentence has a recording. You can review or replace any below.' : 'Sentences will appear here when the library is available.'}</span></div><div><span>{percentage}% complete</span><progress value={recorded} max={sentences.length || 1} aria-label="Sentence recording completion"/></div></div>
      <section className="access-workspace" ref={workspaceRef} aria-labelledby="audio-library-title">
        <div className="access-list-heading"><div><h2 id="audio-library-title">Manage sentence recordings</h2><p>Find a sentence, play its audio, or record a new version.</p></div><button className="access-button" disabled={!!busyId} onClick={reload}>Refresh library</button></div>
        <div className="access-filter-bar audio-library-filters"><label className="access-search"><span>Search sentences</span><input type="search" value={search} placeholder="Number, Chinese, pinyin, or English…" onChange={event => { setSearch(event.target.value); setPage(0); }}/></label><label><span>Topic</span><select value={topic} onChange={event => { setTopic(event.target.value); setPage(0); }}><option value="all">All topics</option>{catalog.topics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label><span>Audio status</span><select value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="all">All sentences</option><option value="missing">Needs audio</option><option value="recorded">Recorded</option></select></label></div>
        <div className="access-list-summary"><p className="access-result-count" role="status">{filtered.length ? `Showing ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length.toLocaleString()} sentences` : 'No matching sentences'}{status !== 'all' ? ` · ${status === 'missing' ? 'needs audio' : 'recorded'}` : ''}</p>{hasFilters && <button className="access-link" onClick={() => clearFilters()}>Clear filters</button>}</div>
        {!visible.length ? <div className="access-empty"><span aria-hidden="true">{!missing && status === 'missing' ? '✓' : '⌕'}</span><h3>{!missing && status === 'missing' ? 'Every sentence has audio' : 'No sentences match these filters'}</h3><p>{!missing && status === 'missing' ? 'Switch to recorded sentences to listen or update a recording.' : 'Try another number, word, or topic.'}</p><button className="access-button" onClick={() => clearFilters()}>View all sentences</button></div> : <div className="audio-library-list">{visible.map(sentence => <article key={sentence.id} className="audio-library-row" aria-labelledby={`audio-title-${sentence.id}`} aria-busy={busyId === sentence.id}>
          <div className="audio-library-copy"><div className="audio-sentence-meta"><span className="audio-sentence-number">{numberLabel(sentence)}</span><span>{catalog.topics.find(item => item.id === sentence.topicId)?.title}</span><span className={`access-status ${sentence.audioUrl ? 'is-active' : 'is-pending'}`}>{sentence.audioUrl ? 'Recorded' : 'Needs audio'}</span></div><h3 id={`audio-title-${sentence.id}`}><SentenceText sentence={sentence}/></h3><p>{sentence.english}</p></div>
          <div className="audio-library-controls">{sentence.audioUrl ? <audio key={sentence.audioUrl} src={mediaUrl(sentence.audioUrl)} controls preload="none" aria-label={`Recording for sentence ${sentence.number}`} onPlay={event => workspaceRef.current?.querySelectorAll('audio').forEach(audio => { if (audio !== event.currentTarget) audio.pause(); })}/> : <p className="audio-recording-hint">Read aloud, then listen before saving.</p>}<div><button className={`access-button ${sentence.audioUrl ? '' : 'is-primary'}`} disabled={!!busyId} aria-label={`${sentence.audioUrl ? 'Replace' : 'Record'} audio for sentence ${sentence.number}`} onClick={() => openRecording(sentence)}>{sentence.audioUrl ? 'Replace recording' : 'Record audio'}</button>{sentence.audioUrl && <button className="access-link is-danger" disabled={!!busyId} aria-label={`Remove audio for sentence ${sentence.number}`} onClick={() => { setError(''); setRemovingSentence(sentence); }}>Remove</button>}</div></div>
        </article>)}</div>}
        {pages > 1 && <nav className="audio-library-pagination" aria-label="Sentence library pages"><button className="access-button" disabled={currentPage === 0} onClick={() => selectPage(currentPage - 1)}>← Previous</button><form className="audio-page-jump" onSubmit={event => { event.preventDefault(); selectPage(Number(event.currentTarget.elements.page.value) - 1); }}><label>Page<input key={currentPage} name="page" aria-label="Go to sentence page" type="number" min="1" max={pages} step="1" defaultValue={currentPage + 1} required/></label><span>of {pages}</span><button className="access-button" type="submit">Go</button></form><button className="access-button" disabled={currentPage + 1 >= pages} onClick={() => selectPage(currentPage + 1)}>Next →</button></nav>}
      </section>
      <p className="audio-studio-note">Microphone recordings only · Up to 60 seconds per sentence · Replacements go live after you save.</p>
    </>}
    {recordingSentence && <SentenceRecorder key={recordingSentence.id} sentence={recordingSentence} onSave={changeAudio} onClose={() => setRecordingSentence(null)}/>}
    {removingSentence && <AccessDialog title="Remove this recording?" description="The sentence stays in the library, but students won’t have recorded audio for it until you add a new recording." busy={!!busyId} onClose={() => { setRemovingSentence(null); setError(''); }}><div className="access-confirm-details"><strong>Sentence {numberLabel(removingSentence)}</strong><span lang="zh-CN">{removingSentence.chinese}</span><span>{removingSentence.english}</span></div>{error && <p className="access-feedback is-error" role="alert">{error}</p>}<div className="access-dialog-actions"><button className="access-button" disabled={!!busyId} onClick={() => { setRemovingSentence(null); setError(''); }}>Keep recording</button><button className="access-button is-destructive" disabled={!!busyId} onClick={removeAudio}>{busyId ? 'Removing…' : 'Remove recording'}</button></div></AccessDialog>}
  </section>;
}
