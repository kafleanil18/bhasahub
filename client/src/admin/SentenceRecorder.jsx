import { useEffect, useRef, useState } from 'react';
import SentenceText from '../practice/SentenceText';
import { MAX_RECORDING_BYTES, MAX_RECORDING_SECONDS, recordingMimeType } from './sentenceRecording';

export default function SentenceRecorder({ sentence, onSave, onClose }) {
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const draftUrlRef = useRef('');
  const mountedRef = useRef(false);
  const startingRef = useRef(false);
  const previewRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      mountedRef.current = false;
      window.clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        recorder.onerror = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (draftUrlRef.current) URL.revokeObjectURL(draftUrlRef.current);
      dialog.close();
    };
  }, []);

  function stop() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    window.clearInterval(timerRef.current);
    setPhase('stopping');
    recorder.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
  }

  async function start() {
    if (startingRef.current || savingRef.current || recorderRef.current?.state === 'recording') return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Microphone recording is unavailable. Open this page over HTTPS in a browser that supports recording.');
      return;
    }
    startingRef.current = true;
    setError('');
    setPhase('requesting');
    previewRef.current?.pause();
    if (draftUrlRef.current) { URL.revokeObjectURL(draftUrlRef.current); draftUrlRef.current = ''; }
    setDraft(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const mimeType = recordingMimeType();
      const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 128000 });
      recorderRef.current = recorder;
      const chunks = [];
      let failed = false;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => {
        failed = true;
        window.clearInterval(timerRef.current);
        stream.getTracks().forEach(track => track.stop());
        if (mountedRef.current) { setPhase('idle'); setError('The microphone recording stopped unexpectedly. Please record again.'); }
      };
      recorder.onstop = () => {
        window.clearInterval(timerRef.current);
        stream.getTracks().forEach(track => track.stop());
        if (!mountedRef.current || failed) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' });
        if (!blob.size || blob.size > MAX_RECORDING_BYTES) {
          setPhase('idle');
          setError(blob.size ? 'The recording is too large. Please make a shorter recording.' : 'No audio was captured. Check your microphone and record again.');
          return;
        }
        const url = URL.createObjectURL(blob);
        draftUrlRef.current = url;
        setDraft({ blob, url });
        setPhase('preview');
      };
      recorder.start(1000);
      const startedAt = Date.now();
      setSeconds(0);
      setPhase('recording');
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(Math.min(elapsed, MAX_RECORDING_SECONDS));
        if (elapsed >= MAX_RECORDING_SECONDS) stop();
      }, 250);
    } catch (err) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (!mountedRef.current) return;
      setPhase('idle');
      setError(err.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow microphone access in your browser, then try again.'
        : err.name === 'NotFoundError' ? 'No microphone was found. Connect a microphone and try again.'
          : 'Could not start recording. Check that your microphone is connected and available.');
    } finally { startingRef.current = false; }
  }

  async function save() {
    if (!draft || savingRef.current) return;
    savingRef.current = true;
    previewRef.current?.pause();
    setPhase('saving');
    setError('');
    try { await onSave(sentence, draft.blob); if (mountedRef.current) onClose(); }
    catch (err) {
      if (mountedRef.current) { setError(err.message || 'Could not save the recording. Please try again.'); setPhase('preview'); }
    } finally { savingRef.current = false; }
  }

  return <dialog ref={dialogRef} className="sentence-recorder-dialog" aria-labelledby="sentence-recorder-title" onCancel={event => { event.preventDefault(); if (phase !== 'saving') onClose(); }}>
    <div className="sentence-recorder-content">
      <p className="sentence-eyebrow">Sentence #{String(sentence.number).padStart(3, '0')}</p>
      <h2 id="sentence-recorder-title">Record your voice</h2>
      <p className="sentence-recorder-script"><SentenceText sentence={sentence} /></p>
      <p>{sentence.english}</p>
      <p className="sentence-muted">Read the sentence clearly. Stop to listen, then save when you are happy with it. Up to 60 seconds.</p>
      <div role="status" aria-live="polite" className="sentence-mic-status">
        {phase === 'recording' ? `Recording · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : phase === 'requesting' ? 'Waiting for microphone permission…' : phase === 'stopping' ? 'Preparing your recording…' : phase === 'saving' ? 'Saving recording…' : draft ? 'Preview your recording before saving.' : 'Ready when you are.'}
      </div>
      {draft && <audio ref={previewRef} src={draft.url} controls aria-label="Preview your microphone recording" onError={() => setError('Could not play this preview. Please record again.')} />}
      {error && <p className="sentence-error" role="alert">{error}</p>}
      <div className="sentence-actions">
        {phase === 'recording' ? <button className="sentence-primary" onClick={stop}>Stop recording</button> : <button className="sentence-secondary" disabled={['requesting', 'stopping', 'saving'].includes(phase)} onClick={start}>{draft ? 'Re-record' : 'Start recording'}</button>}
        {draft && <button className="sentence-primary" disabled={phase !== 'preview'} onClick={save}>Save recording</button>}
        <button className="sentence-secondary" disabled={phase === 'saving'} onClick={onClose}>{draft ? 'Discard recording' : 'Cancel'}</button>
      </div>
    </div>
  </dialog>;
}
