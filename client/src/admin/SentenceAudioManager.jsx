import { useEffect, useRef, useState } from 'react';
import { useSentenceCatalog } from '../practice/useSentenceCatalog';
import { mediaUrl } from '../utils/mediaUrl';
import SentenceText from '../practice/SentenceText';
import SentenceRecorder from './SentenceRecorder';
import { MAX_RECORDING_BYTES, recordingExtension } from './sentenceRecording';
import '../practice/SentencePractice.css';

const PAGE_SIZE = 15;

export default function SentenceAudioManager({ onBack }) {
  const { catalog, error: loadError, reload, updateAudio } = useSentenceCatalog();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [recordingSentence, setRecordingSentence] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function changeAudio(sentence, recording) {
    if (busyRef.current) throw new Error('Another recording is being saved. Please wait.');
    if (recording && (!recording.size || recording.size > MAX_RECORDING_BYTES)) throw new Error('Please record a shorter sentence and try again.');
    if (!recording && !window.confirm(`Remove the audio for sentence #${sentence.number}?`)) return;
    busyRef.current = true;
    setBusyId(sentence.id);
    setError('');
    setMessage('');
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
      setMessage(`Sentence #${String(sentence.number).padStart(3, '0')}: audio ${recording ? 'saved and available for practice' : 'removed'}.`);
    } catch (err) {
      if (recording) throw err;
      if (err.name !== 'AbortError') setError(err.message || 'Could not remove the recording. Please try again.');
    } finally {
      setBusyId('');
      busyRef.current = false;
    }
  }

  const recorded = catalog?.sentences.filter(sentence => sentence.audioUrl).length || 0;
  const query = search.trim().toLocaleLowerCase();
  const filtered = catalog?.sentences.filter(sentence => (
    (topic === 'all' || sentence.topicId === topic)
    && (status === 'all' || (status === 'recorded' ? Boolean(sentence.audioUrl) : !sentence.audioUrl))
    && (!query || `${sentence.id} ${sentence.number} ${sentence.chinese} ${sentence.pinyin} ${sentence.english}`.toLocaleLowerCase().includes(query))
  )) || [];
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return <section className="sentence-page sentence-admin" aria-labelledby="sentence-audio-title">
    <button className="sentence-back" onClick={onBack}>← Back to control panel</button>
    <div className="sentence-heading"><p className="sentence-eyebrow">Super admin · Audio library</p><h1 id="sentence-audio-title">A voice for every sentence.</h1><p>Record each HSK 1 sentence directly with your microphone. Saved audio becomes available in sentence practice.</p></div>
    {loadError ? <div className="sentence-card" role="alert"><p>{loadError}</p><button className="sentence-primary" onClick={reload}>Try again</button></div> : !catalog ? <p role="status">Loading the sentence library…</p> : <>
      <div className="sentence-overview"><div><strong>{catalog.sentences.length}</strong><span>total sentences</span></div><div><strong>{recorded}</strong><span>with recordings</span></div><div><strong>{catalog.sentences.length - recorded}</strong><span>waiting for audio</span></div></div>
      <p className="sentence-muted">Record, stop, and listen before saving. Re-recording keeps the existing audio until you save the replacement.</p>
      <div className="sentence-filters">
        <label>Search sentences<input type="search" value={search} placeholder="Number, Chinese, pinyin, or English" onChange={event => { setSearch(event.target.value); setPage(0); }} /></label>
        <label>Topic<select value={topic} onChange={event => { setTopic(event.target.value); setPage(0); }}><option value="all">All topics</option>{catalog.topics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Audio status<select value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="all">All sentences</option><option value="missing">Missing audio</option><option value="recorded">Has audio</option></select></label>
      </div>
      <div aria-live="polite">{message && <p className="sentence-success">{message}</p>}{busyId && <p role="status">Saving audio for {busyId}…</p>}</div>
      {error && <p className="sentence-error" role="alert">{error}</p>}
      <p className="sentence-muted">{filtered.length} matching sentences</p>
      {!visible.length && <div className="sentence-card"><p>No sentences match these filters.</p><button className="sentence-secondary" onClick={() => { setSearch(''); setTopic('all'); setStatus('all'); setPage(0); }}>Clear filters</button></div>}
      <div className="sentence-audio-list">{visible.map(sentence => <article key={sentence.id} className="sentence-audio-row" aria-labelledby={`title-${sentence.id}`} aria-busy={busyId === sentence.id}>
        <div className="sentence-audio-copy"><span className="sentence-eyebrow">#{String(sentence.number).padStart(3, '0')} · {catalog.topics.find(item => item.id === sentence.topicId)?.title}</span><h2 id={`title-${sentence.id}`}><SentenceText sentence={sentence} /></h2><p>{sentence.english}</p></div>
        <div className="sentence-audio-controls">
          {sentence.audioUrl ? <audio key={sentence.audioUrl} src={mediaUrl(sentence.audioUrl)} controls preload="none" aria-label={`Recording for sentence ${sentence.number}`} /> : <span className="sentence-muted">No recording yet</span>}
          <button className="sentence-secondary" disabled={Boolean(busyId)} aria-label={`${sentence.audioUrl ? 'Re-record' : 'Record'} audio for sentence ${sentence.number}`} onClick={() => setRecordingSentence(sentence)}>{sentence.audioUrl ? 'Re-record audio' : 'Record audio'}</button>
          {sentence.audioUrl && <button className="sentence-back" disabled={Boolean(busyId)} onClick={() => changeAudio(sentence, null)}>Remove audio</button>}
        </div>
      </article>)}</div>
      {pages > 1 && <nav className="sentence-pagination" aria-label="Sentence library pages"><button className="sentence-secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>← Previous</button><span aria-live="polite">Page {currentPage + 1} of {pages}</span><button className="sentence-secondary" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next →</button></nav>}
    </>}
    {recordingSentence && <SentenceRecorder key={recordingSentence.id} sentence={recordingSentence} onSave={changeAudio} onClose={() => setRecordingSentence(null)} />}
  </section>;
}
