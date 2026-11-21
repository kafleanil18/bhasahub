import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import SentenceRecorder from './SentenceRecorder';
import AccessDialog from './subscriptions/AccessDialog';
import AddTonePairDialog from './AddTonePairDialog';
import { MAX_RECORDING_BYTES, recordingExtension } from './sentenceRecording';
import '../practice/SentencePractice.css';
import './SubscriptionManager.css';
import './SentenceAudioManager.css';

const API = () => `${window.API_BASE_URL}/api/tone-practice/pairs`;
const ruleLabels = { third: 'Two 3rd tones', bu: '不 tone change', yi: '一 tone change' };

export default function TonePairAudioManager({ onBack }) {
  const [pairs, setPairs] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [recordingPair, setRecordingPair] = useState(null);
  const [removingPair, setRemovingPair] = useState(null);
  const [deletingPair, setDeletingPair] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const controllerRef = useRef(null);
  const workspaceRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const load = useCallback(async signal => {
    setLoadError('');
    try {
      const response = await fetch(API(), { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, signal });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.pairs)) throw new Error(data.error || 'Could not load tone pair words.');
      setPairs(data.pairs);
    } catch (err) { if (err.name !== 'AbortError') setLoadError(err.message || 'Could not load tone pair words.'); }
  }, []);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);

  async function changeAudio(pair, recording) {
    if (busyRef.current) throw new Error('Another recording is being saved. Please wait.');
    if (recording && (!recording.size || recording.size > MAX_RECORDING_BYTES)) throw new Error('Please make a shorter recording and try again.');
    busyRef.current = true;
    setBusyId(pair.id); setError(''); setMessage('');
    controllerRef.current = new AbortController();
    try {
      const form = new FormData();
      const fileExtension = recording?.name?.match(/\.(mp3|m4a|wav|ogg|webm)$/i)?.[1]?.toLowerCase();
      if (recording) form.append('recording', recording, `${pair.id}.${fileExtension || recordingExtension(recording.type)}`);
      const response = await fetch(`${API()}/${encodeURIComponent(pair.id)}/audio`, {
        method: recording ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        ...(recording ? { body: form } : {}), signal: controllerRef.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this recording.');
      setPairs(previous => previous.map(item => item.id === pair.id ? { ...item, audioUrl: data.audioUrl } : item));
      setMessage(`${pair.hanzi}: ${recording ? 'recording saved and ready for tone pair practice' : 'recording removed. Students will hear their device voice instead'}.`);
    } finally { setBusyId(''); busyRef.current = false; }
  }
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
  async function addWord(word, file) {
    if (busyRef.current) return;
    setAddError(''); setMessage(''); setError('');
    if (file && !/\.(mp3|m4a|wav|ogg|webm)$/i.test(file.name)) { setAddError('Choose an MP3, M4A, WAV, OGG or WebM file.'); return; }
    busyRef.current = true; setBusyId('new');
    let pair;
    try {
      const response = await fetch(API(), { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(word) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not add this word.');
      pair = data.pair;
      setPairs(previous => [...previous, pair]);
      setStatus('all'); setSearch('');
    } catch (err) { setAddError(err.message || 'Could not add this word.'); return; }
    finally { busyRef.current = false; setBusyId(''); }
    setAdding(false);
    if (!file) { setMessage(`${pair.hanzi} added. Record it now so students hear your voice.`); openRecording(pair); return; }
    try { await changeAudio(pair, file); }
    catch (err) { setError(`${pair.hanzi} was added, but the audio file could not be saved: ${err.message}`); }
  }
  async function deleteWord() {
    const pair = deletingPair;
    busyRef.current = true; setBusyId(pair.id); setError('');
    try {
      const response = await fetch(`${API()}/${encodeURIComponent(pair.id)}`, { method: 'DELETE', headers: authHeaders });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete this word.');
      setPairs(previous => previous.filter(item => item.id !== pair.id));
      setDeletingPair(null); setMessage(`${pair.hanzi} deleted from tone pair practice.`);
    } catch (err) { setError(err.message || 'Could not delete this word.'); }
    finally { busyRef.current = false; setBusyId(''); }
  }
  const chooseFile = pair => { uploadTargetRef.current = pair; setError(''); fileInputRef.current.value = ''; fileInputRef.current.click(); };
  const uploadFile = async event => {
    const file = event.target.files?.[0]; const pair = uploadTargetRef.current;
    if (!file || !pair) return;
    if (!/\.(mp3|m4a|wav|ogg|webm)$/i.test(file.name)) { setError('Choose an MP3, M4A, WAV, OGG or WebM file.'); return; }
    try { await changeAudio(pair, file); }
    catch (err) { if (err.name !== 'AbortError') setError(err.message || 'Could not upload this file.'); }
  };
  const removeAudio = async () => {
    try { await changeAudio(removingPair, null); setRemovingPair(null); }
    catch (err) { if (err.name !== 'AbortError') setError(err.message || 'Could not remove the recording. Please try again.'); }
  };
  const openRecording = pair => {
    workspaceRef.current?.querySelectorAll('audio').forEach(audio => audio.pause());
    setError(''); setRecordingPair(pair);
  };

  const all = pairs || [];
  const recorded = all.filter(pair => pair.audioUrl).length;
  const nextMissing = all.find(pair => !pair.audioUrl);
  const query = search.trim().toLocaleLowerCase();
  const matchesStatus = pair => status === 'all' || (status === 'added' ? pair.custom : status === 'recorded' ? Boolean(pair.audioUrl) : !pair.audioUrl);
  const visible = all.filter(pair => matchesStatus(pair)
    && (!query || `${pair.hanzi} ${pair.pinyin} ${pair.syllables.join('')} ${pair.english}`.toLocaleLowerCase().includes(query)));

  return <section className="container access-manager audio-studio" aria-labelledby="tone-pair-audio-title">
    <button className="back-btn" onClick={onBack}>← Back to dashboard</button>
    <div className="access-page-heading"><div><p className="access-eyebrow">Learning content · Studio</p><h1 id="tone-pair-audio-title">Tone pair studio</h1><p>Add two-syllable words, then record or upload how each one is said naturally, including tone changes. Words without audio use the student’s device voice.</p></div><div className="tone-pair-studio-actions"><button className="access-button is-primary" disabled={!pairs || !!busyId} onClick={() => { setAddError(''); setAdding(true); }}><span aria-hidden="true">＋</span> Add word</button><button className="access-button" disabled={!nextMissing || !!busyId} onClick={() => openRecording(nextMissing)}>Record next missing</button></div></div>
    <input ref={fileInputRef} type="file" accept=".mp3,.m4a,.wav,.ogg,.webm,audio/*" hidden onChange={uploadFile} />
    {error && !removingPair && !deletingPair && <div className="access-feedback is-error" role="alert"><span>{error}</span><button className="access-link" onClick={() => setError('')}>Dismiss</button></div>}
    {message && <div className="access-feedback is-success" role="status"><span>{message}</span><button className="access-link" onClick={() => setMessage('')} aria-label="Dismiss success message">Dismiss</button></div>}
    {loadError ? <div className="access-feedback is-error" role="alert"><p>{loadError}</p><button className="access-button" onClick={() => load()}>Retry loading</button></div> : !pairs ? <div className="access-loading" role="status">Loading tone pair words…</div> : <>
      <div className="audio-library-progress"><div><strong>{recorded} of {all.length} words recorded</strong><span>{recorded < all.length ? `${all.length - recorded} still use the device voice.` : 'Every word has your recording.'}</span></div><div><span>{all.length ? Math.round(recorded / all.length * 100) : 0}% complete</span><progress value={recorded} max={all.length || 1} aria-label="Tone pair recording completion"/></div></div>
      <section className="access-workspace" ref={workspaceRef} aria-labelledby="tone-pair-library-title">
        <div className="access-list-heading"><div><h2 id="tone-pair-library-title">Manage word recordings</h2><p>Speak the tones shown: they are the spoken tones, after any tone change.</p></div></div>
        <div className="access-filter-bar audio-library-filters"><label className="access-search"><span>Search words</span><input type="search" value={search} placeholder="Chinese, pinyin, or English…" onChange={event => setSearch(event.target.value)}/></label><label><span>Audio status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All words</option><option value="missing">Needs audio</option><option value="recorded">Recorded</option><option value="added">Added in studio</option></select></label></div>
        <p className="access-result-count" role="status">{visible.length ? `Showing ${visible.length} of ${all.length} words` : 'No matching words'}</p>
        {visible.length > 0 && <div className="audio-library-list">{visible.map(pair => <article key={pair.id} className="audio-library-row" aria-labelledby={`pair-title-${pair.id}`} aria-busy={busyId === pair.id}>
          <div className="audio-library-copy"><div className="audio-sentence-meta">{pair.custom && <span className="access-status is-active">Added</span>}{pair.rule && <span>{ruleLabels[pair.rule]}</span>}<span className={`access-status ${pair.audioUrl ? 'is-active' : 'is-pending'}`}>{pair.audioUrl ? 'Recorded' : 'Device voice'}</span></div><h3 id={`pair-title-${pair.id}`}><span lang="zh-CN">{pair.hanzi}</span> · {pair.pinyin}</h3><p>{pair.english}{pair.writtenPinyin ? ` · written ${pair.writtenPinyin}` : ''}</p></div>
          <div className="audio-library-controls">{pair.audioUrl ? <audio key={pair.audioUrl} src={mediaUrl(pair.audioUrl)} controls preload="none" aria-label={`Recording for ${pair.hanzi}`} onPlay={event => workspaceRef.current?.querySelectorAll('audio').forEach(audio => { if (audio !== event.currentTarget) audio.pause(); })}/> : <p className="audio-recording-hint">Say the word once, clearly and naturally.</p>}<div><button className={`access-button ${pair.audioUrl ? '' : 'is-primary'}`} disabled={!!busyId} aria-label={`${pair.audioUrl ? 'Replace' : 'Record'} audio for ${pair.hanzi}`} onClick={() => openRecording(pair)}>{pair.audioUrl ? 'Replace recording' : 'Record audio'}</button><button className="access-button" disabled={!!busyId} aria-label={`Upload audio file for ${pair.hanzi}`} onClick={() => chooseFile(pair)}>{busyId === pair.id ? 'Saving…' : 'Upload file'}</button>{pair.audioUrl && <button className="access-link is-danger" disabled={!!busyId} aria-label={`Remove audio for ${pair.hanzi}`} onClick={() => { setError(''); setRemovingPair(pair); }}>Remove audio</button>}{pair.custom && <button className="access-link is-danger" disabled={!!busyId} aria-label={`Delete word ${pair.hanzi}`} onClick={() => { setError(''); setDeletingPair(pair); }}>Delete word</button>}</div></div>
        </article>)}</div>}
      </section>
    </>}
    {recordingPair && <SentenceRecorder key={recordingPair.id} sentence={recordingPair} noun="word" eyebrow={recordingPair.rule ? ruleLabels[recordingPair.rule] : 'Tone pair'} script={<><p lang="zh-CN">{recordingPair.hanzi}</p><span>{recordingPair.pinyin} · {recordingPair.english}</span></>} onSave={changeAudio} onClose={() => setRecordingPair(null)}/>}
    {adding && <AddTonePairDialog busy={busyId === 'new'} error={addError} onSave={addWord} onClose={() => setAdding(false)} />}
    {deletingPair && <AccessDialog title="Delete this word?" description="It will be removed from tone pair practice along with its recording. Students’ past answers stay in their progress." busy={!!busyId} onClose={() => { setDeletingPair(null); setError(''); }}><div className="access-confirm-details"><strong lang="zh-CN">{deletingPair.hanzi}</strong><span>{deletingPair.pinyin}</span><span>{deletingPair.english}</span></div>{error && <p className="access-feedback is-error" role="alert">{error}</p>}<div className="access-dialog-actions"><button className="access-button" disabled={!!busyId} onClick={() => { setDeletingPair(null); setError(''); }}>Keep word</button><button className="access-button is-destructive" disabled={!!busyId} onClick={deleteWord}>{busyId ? 'Deleting…' : 'Delete word'}</button></div></AccessDialog>}
    {removingPair && <AccessDialog title="Remove this recording?" description="Students will hear their device’s Mandarin voice for this word until you add a new recording." busy={!!busyId} onClose={() => { setRemovingPair(null); setError(''); }}><div className="access-confirm-details"><strong lang="zh-CN">{removingPair.hanzi}</strong><span>{removingPair.pinyin}</span><span>{removingPair.english}</span></div>{error && <p className="access-feedback is-error" role="alert">{error}</p>}<div className="access-dialog-actions"><button className="access-button" disabled={!!busyId} onClick={() => { setRemovingPair(null); setError(''); }}>Keep recording</button><button className="access-button is-destructive" disabled={!!busyId} onClick={removeAudio}>{busyId ? 'Removing…' : 'Remove recording'}</button></div></AccessDialog>}
  </section>;
}
