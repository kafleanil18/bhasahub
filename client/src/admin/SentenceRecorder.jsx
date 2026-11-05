import { useEffect, useRef, useState } from 'react';
import SentenceText from '../practice/SentenceText';
import { mediaUrl } from '../utils/mediaUrl';
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
  const currentAudioRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
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
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
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
    currentAudioRef.current?.pause();
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

  return <dialog ref={dialogRef} className="access-dialog audio-recorder-dialog" aria-labelledby="sentence-recorder-title" aria-describedby="sentence-recorder-description" onCancel={event => { event.preventDefault(); if (phase !== 'saving') onClose(); }}>
    <div className="access-dialog-heading"><div><p className="access-eyebrow">Sentence #{String(sentence.number).padStart(3, '0')}</p><h2 id="sentence-recorder-title">{sentence.audioUrl ? 'Replace recording' : 'Record sentence audio'}</h2><p id="sentence-recorder-description">Read the Chinese sentence naturally. You can listen and try again before saving.</p></div><button className="access-close" aria-label="Close recorder" disabled={phase === 'saving'} onClick={onClose}>×</button></div>
    <ol className="audio-recording-steps" aria-label="Recording steps">{['Record', 'Review', 'Save'].map((step, index) => <li key={step} aria-current={(phase === 'saving' ? 2 : draft ? 1 : 0) === index ? 'step' : undefined}><span>{index + 1}</span>{step}</li>)}</ol>
    <div className="audio-recording-script"><p><SentenceText sentence={sentence}/></p><span>{sentence.english}</span></div>
    {sentence.audioUrl && <div className="audio-current-recording"><label htmlFor="current-sentence-audio">Current recording</label><audio id="current-sentence-audio" ref={currentAudioRef} src={mediaUrl(sentence.audioUrl)} controls preload="none" aria-label="Current saved recording"/><p>Your current recording stays available until you save a replacement.</p></div>}
    <div className={`audio-recording-state ${phase === 'recording' ? 'is-recording' : ''}`}><span role="status" aria-live="polite">{phase === 'recording' ? 'Recording your voice…' : phase === 'requesting' ? 'Allow microphone access in your browser to begin.' : phase === 'stopping' ? 'Preparing your recording…' : phase === 'saving' ? 'Saving for student practice…' : draft ? 'Listen to your recording. Save it or try again.' : 'Ready to record · Up to 60 seconds'}</span>{phase === 'recording' && <strong role="timer" aria-label="Recording duration">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong>}</div>
    {draft && <div className="audio-preview"><label htmlFor="new-sentence-audio">Your new recording</label><audio id="new-sentence-audio" ref={previewRef} src={draft.url} controls aria-label="Preview your microphone recording" onError={() => setError('Could not play this preview. Please record again.')}/></div>}
    {error && <p className="access-feedback is-error" role="alert">{error}</p>}
    <div className="audio-recording-actions">{phase === 'recording' ? <button className="access-button is-destructive" onClick={stop}><span aria-hidden="true">■</span> Stop recording</button> : <button className={`access-button ${draft ? '' : 'is-primary'}`} autoFocus disabled={['requesting', 'stopping', 'saving'].includes(phase)} onClick={start}>{draft ? 'Record again' : phase === 'requesting' ? 'Connecting microphone…' : 'Start recording'}</button>}{draft && <button className="access-button is-primary" disabled={phase !== 'preview'} onClick={save}>{phase === 'saving' ? 'Saving recording…' : 'Save recording'}</button>}</div>
    <div className="audio-recording-footer"><p>{draft ? 'Saving makes this audio available to students.' : 'Choose a quiet place and speak at a comfortable pace.'}</p><button className="access-link" disabled={phase === 'saving'} onClick={onClose}>{draft || phase === 'recording' ? 'Discard & close' : 'Cancel'}</button></div>
  </dialog>;
}
