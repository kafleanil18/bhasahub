import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useAnswerSound from './useAnswerSound';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl';
import { shuffleSentences } from './sentenceQuiz';
import SyllablePicker from './SingleSyllableStart';
import TonePairSession from './TonePairSession';
import useMandarinSpeaker from './useMandarinSpeaker';
import VoiceSwitch from './VoiceSwitch';
import { markSyllable, pairRound } from './tonePairs';
import { AdvanceBar, PlayButton, ProgressDots, ScoreRing, SlowButton, SoundToggle, ToneContour } from './ToneVisuals';
import useToneKeys from './useToneKeys';
import './SentencePractice.css';
import './TonePractice.css';

const tones = [1, 2, 3, 4].map(value => ({ value }));
async function request(path, options = {}) {
  const response = await fetch(`${window.API_BASE_URL}/api/tone-practice${path}`, {
    ...options, signal: options.signal || AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load tone practice.');
  return data;
}

function ToneSession({ questions, onRestart }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [heard, setHeard] = useState(false);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [audioError, setAudioError] = useState('');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const feedbackSound = useAnswerSound(soundsEnabled);
  const audioRef = useRef(null);
  const headingRef = useRef(null);
  const lockedRef = useRef(false);
  const advancingRef = useRef(false);
  const activeRef = useRef(true);
  const playbackRef = useRef(0);
  const question = questions[index];
  const finished = index >= questions.length;
  useEffect(() => { activeRef.current = true; return () => { activeRef.current = false; }; }, []);
  useEffect(() => { advancingRef.current = false; headingRef.current?.focus(); }, [index]);
  const play = useCallback(async rate => {
    const audio = audioRef.current;
    if (!audio) return;
    const attempt = ++playbackRef.current;
    setAudioError(''); audio.pause(); audio.currentTime = 0; audio.playbackRate = rate;
    try { await audio.play(); }
    catch (err) {
      if (activeRef.current && audioRef.current === audio && attempt === playbackRef.current) {
        setAudioError(err.name === 'NotAllowedError'
          ? 'Your browser blocked automatic playback. Tap Play recording to start the audio.'
          : 'Could not play this recording. Try again or skip it.');
      }
    }
  }, []);
  useEffect(() => {
    if (!question) return;
    const audio = audioRef.current;
    void play(1);
    const playback = playbackRef;
    return () => { playback.current++; audio?.pause(); };
  }, [question, play]);

  const submitAnswer = async tone => {
    if (!heard || lockedRef.current) return;
    feedbackSound.prepare();
    setSelected(tone);
    lockedRef.current = true; setBusy(true); setError(''); audioRef.current?.pause();
    try {
      const data = await request('/answer', { method: 'POST', body: JSON.stringify({ recordingId: question._id, selectedTone: tone }) });
      if (!activeRef.current) return;
      setResult(data); setResults(previous => [...previous, data]);
      setStatuses(previous => { const copy = [...previous]; copy[index] = data.correct ? 'correct' : 'wrong'; return copy; });
      feedbackSound.play(data.correct);
    } catch (err) {
      if (activeRef.current) { setError(err.message); lockedRef.current = false; }
    } finally { if (activeRef.current) setBusy(false); }
  };
  const advanceDelay = result?.correct ? 1200 : 2400;
  const next = useCallback(skip => {
    if (advancingRef.current || busy || (!skip && !result)) return;
    advancingRef.current = true;
    audioRef.current?.pause();
    if (skip) { setSkipped(value => value + 1); setStatuses(previous => { const copy = [...previous]; copy[index] = 'skipped'; return copy; }); }
    setIndex(value => value + 1); setSelected(null); setPlaying(false); setHeard(false); setResult(null);
    setError(''); setAudioError(''); lockedRef.current = false;
  }, [busy, result, index]);

  useEffect(() => {
    if (!result || busy) return;
    const timer = window.setTimeout(() => next(false), advanceDelay);
    return () => window.clearTimeout(timer);
  }, [result, busy, next, advanceDelay]);
  useToneKeys({ enabled: !finished && heard && !result && !busy, onTone: submitAnswer, onReplay: () => play(1) });

  if (finished) {
    const correct = results.filter(item => item.correct).length;
    return <section className="sentence-card tone-results" aria-labelledby="tone-round-title">
      <div className="tone-results-summary">
        {results.length > 0 && <ScoreRing correct={correct} total={results.length} />}
        <div><p className="sentence-eyebrow">Round complete</p><h2 id="tone-round-title" ref={headingRef} tabIndex={-1}>{results.length ? `${correct} of ${results.length} correct` : 'No answers checked'}</h2>
          {skipped > 0 && <p className="sentence-muted">{skipped} skipped</p>}</div>
      </div>
      {results.length > 0 && <div className="tone-results-table"><table><caption>Your answers this round</caption><thead><tr><th scope="col">Pinyin</th><th scope="col">Your tone</th><th scope="col">Recorded tone</th><th scope="col">Result</th></tr></thead><tbody>{results.map(item => <tr key={item.recordingId}><th scope="row">{markSyllable(item.syllable, item.correctTone)}</th><td><span className="tone-cell"><ToneContour tone={item.selectedTone} size={28} />Tone {item.selectedTone}</span></td><td><span className="tone-cell"><ToneContour tone={item.correctTone} size={28} />Tone {item.correctTone}</span></td><td><span className={`tone-result-pill ${item.correct ? 'is-correct' : 'is-wrong'}`}>{item.correct ? '✓ Correct' : '↻ Review'}</span></td></tr>)}</tbody></table></div>}
      <div className="sentence-actions"><button className="sentence-primary" onClick={onRestart}>Start another round</button><Link className="sentence-secondary" to="/progress">View My Progress</Link></div>
    </section>;
  }
  return <section className="sentence-card tone-stage" aria-labelledby="tone-question-title">
    <div className="tone-topbar">
      <span className="tone-count">{index + 1} / {questions.length}</span>
      <SoundToggle enabled={soundsEnabled} onToggle={() => setSoundsEnabled(value => !value)} />
    </div>
    <ProgressDots total={questions.length} current={index} statuses={statuses} />
    <h2 id="tone-question-title" ref={headingRef} tabIndex={-1} className="tone-question">Which tone do you hear?</h2>
    <audio ref={audioRef} src={mediaUrl(question.audioUrl)} preload="none" onPlaying={() => { setHeard(true); setPlaying(true); setAudioError(''); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('This recording is unavailable. Try again or skip it.'); }} />
    <div className="tone-listen">
      <PlayButton playing={playing} onClick={() => play(1)} disabled={busy} label={audioError && !heard ? 'Play recording' : 'Replay recording'} />
      <p className="tone-listen-syllable">{result ? markSyllable(question.syllable, result.correctTone) : question.syllable}</p>
      <SlowButton onClick={() => play(.75)} disabled={busy} />
    </div>
    {audioError && <p className="tone-alert" role="alert">{audioError}</p>}
    <fieldset className={`tone-choices${result ? ' has-result' : ''}`} disabled={!heard || !!result || busy}><legend className="tone-visually-hidden">Choose one of the four tones</legend>{tones.map(tone => <label key={tone.value} data-tone={tone.value} className={`tone-choice${selected === tone.value ? ' is-selected' : ''}${result && result.correctTone === tone.value ? ' is-correct' : ''}${result && !result.correct && selected === tone.value ? ' is-wrong' : ''}`}>
      <input type="radio" name="tone" value={tone.value} checked={selected === tone.value} onChange={() => submitAnswer(tone.value)} onClick={() => { if (error && selected === tone.value) submitAnswer(tone.value); }} />
      <ToneContour tone={tone.value} size={72} />
      <span className="tone-choice-mark" aria-hidden="true">{markSyllable(question.syllable, tone.value)}</span>
      <span className="tone-choice-text"><strong>Tone {tone.value}</strong></span>
    </label>)}</fieldset>
    {!result && <div className="tone-footer"><button type="button" className="tone-skip" disabled={busy} aria-label="Skip recording" onClick={() => next(true)}>Skip →</button></div>}
    {error && <div className="tone-alert" role="alert"><p>{error} Your question is still here; retry saving your answer.</p><button type="button" className="sentence-primary" disabled={busy} onClick={() => submitAnswer(selected)}>Retry answer</button></div>}
    {result && <div className={`sentence-feedback tone-feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status">
      <span className="tone-feedback-icon" aria-hidden="true">{result.correct ? '✓' : '✗'}</span>
      <div><h3>{result.correct ? 'Correct!' : 'Keep practicing.'}</h3><p>{markSyllable(result.syllable, result.correctTone)} · Tone {result.correctTone}</p></div>
      <AdvanceBar duration={advanceDelay} />
    </div>}
  </section>;
}

function useTonePairs() {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  // Pairs without a teacher recording use the chosen voice: Google's female Mandarin voice (or the device's best), or the male voice.
  const speech = useMandarinSpeaker();
  useEffect(() => {
    const controller = new AbortController(); setState({ loading: true });
    request('/pairs', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(data => {
      if (!Array.isArray(data.pairs)) throw new Error('Could not load tone pairs.');
      if (!controller.signal.aborted) setState({ pairs: data.pairs });
    }).catch(err => { if (!controller.signal.aborted) setState({ error: err.message }); });
    return () => controller.abort();
  }, [attempt]);
  // Words without a teacher recording need a Mandarin voice.
  const canSpeak = speech.available;
  const playable = state.pairs?.filter(pair => pair.audioUrl || canSpeak) || [];
  return { ...state, loading: state.loading || (speech.loading && !!state.pairs), playable, speaker: speech, canSpeak, retry: () => setAttempt(value => value + 1) };
}

function ModeCard({ id, title, text, hint, art, onClick }) {
  return <button type="button" className={`tone-mode-card tone-mode-card-${id}`} disabled={!!hint} onClick={onClick} aria-label={title} aria-describedby={`tone-card-${id}`}>
    <span className="tone-mode-card-art" aria-hidden="true">{art}</span>
    <span className="tone-mode-card-body">
      <strong>{title}</strong>
      <span id={`tone-card-${id}`} className={hint ? 'tone-mode-card-hint' : undefined}>{hint || text}</span>
      {!hint && <span className="tone-mode-card-cta" aria-hidden="true">Start →</span>}
    </span>
  </button>;
}

export default function TonePractice({ onBack }) {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const [round, setRound] = useState(null);
  const [roundKey, setRoundKey] = useState(0);
  const [picked, setPicked] = useState(null);
  const [changesOnly, setChangesOnly] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setState({ loading: true });
    request('/questions', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(data => {
      if (!Array.isArray(data.questions)) throw new Error('Could not load tone recordings.');
      if (!controller.signal.aborted) setState({ questions: data.questions });
    }).catch(err => { if (!controller.signal.aborted) setState({ error: err.message }); });
    return () => controller.abort();
  }, [attempt]);
  const pairs = useTonePairs();
  const questions = useMemo(() => state.questions || [], [state.questions]);
  const pool = useMemo(() => picked ? questions.filter(question => picked.has(question.syllable)) : questions, [questions, picked]);
  const changes = pairs.playable.filter(pair => pair.toneRule).length;
  const start = useCallback(list => { setRound({ mode: 'single', questions: shuffleSentences(list).slice(0, 10) }); setRoundKey(value => value + 1); }, []);
  const startPairs = useCallback(onlyChanges => { setRound({ mode: 'pairs', questions: pairRound(pairs.playable, { focus: onlyChanges ? 'changes' : 'all', shuffle: shuffleSentences }) }); setRoundKey(value => value + 1); }, [pairs.playable]);
  const restart = () => round.mode === 'pairs' ? startPairs(changesOnly) : start(pool);

  const singleHint = state.loading ? 'Loading…' : state.error ? state.error : !questions.length ? 'No recordings yet' : !pool.length ? 'Pick at least one syllable' : null;
  const pairsHint = pairs.loading ? 'Loading…' : pairs.error ? pairs.error : !pairs.playable.length ? 'Tone pairs need a teacher recording or a Mandarin voice on your device.' : null;

  const pickSyllables = next => {
    setPicked(next);
    const list = next ? questions.filter(question => next.has(question.syllable)) : questions;
    if (round?.mode === 'single' && list.length) start(list);
  };
  const toggleChanges = value => { setChangesOnly(value); if (round?.mode === 'pairs') startPairs(value); };
  const mode = round?.mode;
  const showPicker = mode !== 'pairs' && questions.length > 0;
  const showChanges = mode !== 'single' && changes > 0;

  return <main className="sentence-page tone-practice tone-minimal" aria-labelledby="tone-practice-title">
    <div className="tone-header">
      <button className="sentence-back" onClick={onBack}>← Back to home</button>
      <h1 id="tone-practice-title" className="tone-visually-hidden">Tone listening</h1>
      {round && <div className="tone-mode-toggle" role="group" aria-label="Practice mode">
        <button type="button" aria-pressed={mode === 'single'} disabled={!!singleHint} title={singleHint || undefined} onClick={() => start(pool)}>Single syllables</button>
        <button type="button" aria-pressed={mode === 'pairs'} disabled={!!pairsHint} title={pairsHint || undefined} onClick={() => startPairs(changesOnly)}>Tone pairs</button>
      </div>}
    </div>
    {round
      ? (round.mode === 'pairs'
        ? <TonePairSession key={roundKey} pairs={round.questions} speaker={pairs.speaker} onRestart={restart} />
        : <ToneSession key={roundKey} questions={round.questions} onRestart={restart} />)
      : <>
        <h2 className="tone-choose-title">Choose how to practise</h2>
        <VoiceSwitch speaker={pairs.speaker} className="tone-voice-switch" label="Tone pair voice"/>
        <div className="tone-mode-cards">
          <ModeCard id="single" title="Single syllables" text="Hear one syllable and pick its tone." hint={singleHint} onClick={() => start(pool)}
            art={<div className="tone-art-single">
              <span className="tone-art-syllable">mā</span>
              <span className="tone-art-row">{tones.map(tone => <span key={tone.value} data-tone={tone.value}><ToneContour tone={tone.value} size={44} /></span>)}</span>
            </div>} />
          <ModeCard id="pairs" title="Tone pairs" text="Hear a two-syllable word and pick both tones." hint={pairsHint} onClick={() => startPairs(changesOnly)}
            art={<div className="tone-art-pair">
              {[['中', 'zhōng', 1], ['文', 'wén', 2]].map(([hanzi, pinyin, tone], i) => <span key={hanzi} className="tone-art-char" data-tone={tone}>
                <ToneContour tone={tone} size={52} /><b lang="zh-CN">{hanzi}</b><small>{pinyin}</small>
                {i === 0 && <i aria-hidden="true">+</i>}
              </span>)}
            </div>} />
        </div>
      </>}
    {(state.error || pairs.error) && <div className="tone-retry">
      {state.error && <button type="button" className="tone-link" onClick={() => setAttempt(value => value + 1)}>Try loading recordings again</button>}
      {pairs.error && <button type="button" className="tone-link" onClick={pairs.retry}>Try loading tone pairs again</button>}
    </div>}
    {(showPicker || showChanges) && <details className="tone-options">
      <summary>Options</summary>
      {showPicker && <SyllablePicker questions={questions} picked={picked} onChange={pickSyllables} />}
      {showChanges && <label className="tone-option-toggle"><input type="checkbox" checked={changesOnly} onChange={event => toggleChanges(event.target.checked)} /> Tone changes only ({changes} {changes === 1 ? 'word' : 'words'})</label>}
    </details>}
  </main>;
}
