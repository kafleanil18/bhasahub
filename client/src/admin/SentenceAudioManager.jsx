import { useEffect, useRef, useState } from 'react';
import { useSentenceCatalog } from '../practice/useSentenceCatalog';
import { mediaUrl } from '../utils/mediaUrl';
import '../practice/SentencePractice.css';

const PAGE_SIZE = 15;
const MAX_AUDIO_SIZE = 15 * 1024 * 1024;

export default function SentenceAudioManager({ onBack }) {
  const { catalog, error: loadError, reload, updateAudio } = useSentenceCatalog();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function changeAudio(sentence, file) {
    if (busyRef.current) return;
    if (file && (file.size > MAX_AUDIO_SIZE || !/\.(mp3|m4a|wav|ogg|webm)$/i.test(file.name))) {
      setError('Choose an MP3, M4A, WAV, OGG, or WebM file, up to 15 MB.');
      return;
    }
    if (!file && !window.confirm(`Remove the audio for sentence #${sentence.number}?`)) return;
    busyRef.current = true;
    setBusyId(sentence.id);
    setError('');
    setMessage('');
    controllerRef.current = new AbortController();
    try {
      const form = new FormData();
      if (file) form.append('file', file);
      const response = await fetch(`${window.API_BASE_URL}/api/sentences/${sentence.id}/audio`, {
        method: file ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        ...(file ? { body: form } : {}), signal: controllerRef.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this recording.');
      updateAudio(sentence.id, data.audioUrl);
      setMessage(`Sentence #${String(sentence.number).padStart(3, '0')}: audio ${file ? 'saved and available for practice' : 'removed'}.`);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Could not upload the recording. Please try again.');
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
    <div className="sentence-heading"><p className="sentence-eyebrow">Super admin · Audio library</p><h1 id="sentence-audio-title">A voice for every sentence.</h1><p>Upload a recording for each HSK 1 sentence. Saved audio becomes available in sentence practice.</p></div>
    {loadError ? <div className="sentence-card" role="alert"><p>{loadError}</p><button className="sentence-primary" onClick={reload}>Try again</button></div> : !catalog ? <p role="status">Loading the sentence library…</p> : <>
      <div className="sentence-overview"><div><strong>{catalog.sentences.length}</strong><span>total sentences</span></div><div><strong>{recorded}</strong><span>with recordings</span></div><div><strong>{catalog.sentences.length - recorded}</strong><span>waiting for audio</span></div></div>
      <p className="sentence-muted">MP3, M4A, WAV, OGG, or WebM · Up to 15 MB per file. Replacing audio keeps the sentence and its practice progress.</p>
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
        <div className="sentence-audio-copy"><span className="sentence-eyebrow">#{String(sentence.number).padStart(3, '0')} · {catalog.topics.find(item => item.id === sentence.topicId)?.title}</span><h2 id={`title-${sentence.id}`} lang="zh-CN">{sentence.chinese}</h2><p lang="zh-Latn">{sentence.pinyin}</p><p>{sentence.english}</p></div>
        <div className="sentence-audio-controls">
          {sentence.audioUrl ? <audio key={sentence.audioUrl} src={mediaUrl(sentence.audioUrl)} controls preload="none" aria-label={`Recording for sentence ${sentence.number}`} /> : <span className="sentence-muted">No recording yet</span>}
          <label className={`sentence-upload${busyId ? ' is-disabled' : ''}`}>
            <span>{sentence.audioUrl ? 'Replace audio' : 'Upload audio'}</span>
            <input type="file" accept=".mp3,.m4a,.wav,.ogg,.webm,audio/*" disabled={Boolean(busyId)} aria-label={`${sentence.audioUrl ? 'Replace' : 'Upload'} audio for sentence ${sentence.number}`} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void changeAudio(sentence, file); }} />
          </label>
          {sentence.audioUrl && <button className="sentence-back" disabled={Boolean(busyId)} onClick={() => changeAudio(sentence, null)}>Remove audio</button>}
        </div>
      </article>)}</div>
      {pages > 1 && <nav className="sentence-pagination" aria-label="Sentence library pages"><button className="sentence-secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>← Previous</button><span aria-live="polite">Page {currentPage + 1} of {pages}</span><button className="sentence-secondary" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next →</button></nav>}
    </>}
  </section>;
}
