import { useCallback, useEffect, useRef, useState } from 'react';
import useAnswerSound from './useAnswerSound';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl';
import { shuffleSentences } from './sentenceQuiz';
import TonePairSession from './TonePairSession';
import useChineseVoice from './useChineseVoice';
import { pairRound } from './tonePairs';
import './SentencePractice.css';
import './TonePractice.css';

const tones = [
  { value: 1, mark: 'ā', label: 'High and level' }, { value: 2, mark: 'á', label: 'Rising' },
  { value: 3, mark: 'ǎ', label: 'Low / dipping' }, { value: 4, mark: 'à', label: 'Falling' },
];
async function request(path, options = {}) {
  const response = await fetch(`${window.API_BASE_URL}/api/tone-practice${path}`, {
    ...options, signal: options.signal || AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load tone practice.');
  return data;
}

function ToneSession({ questions, onRestart, onChangeMode }) {
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
      feedbackSound.play(data.correct);
    } catch (err) {
      if (activeRef.current) { setError(err.message); lockedRef.current = false; }
    } finally { if (activeRef.current) setBusy(false); }
  };
  const next = useCallback(skip => {
    if (advancingRef.current || busy || (!skip && !result)) return;
    advancingRef.current = true;
    audioRef.current?.pause();
    if (skip) setSkipped(value => value + 1);
    setIndex(value => value + 1); setSelected(null); setHeard(false); setResult(null);
    setError(''); setAudioError(''); lockedRef.current = false;
  }, [busy, result]);

  useEffect(() => {
    if (!result || busy) return;
    const timer = window.setTimeout(() => next(false), result.correct ? 1200 : 2400);
    return () => window.clearTimeout(timer);
  }, [result, busy, next]);

  if (finished) {
    const correct = results.filter(item => item.correct).length;
    return <section className="sentence-card tone-results" aria-labelledby="tone-round-title">
      <p className="sentence-eyebrow">Round complete</p><h2 id="tone-round-title" ref={headingRef} tabIndex={-1}>{results.length ? `${correct} of ${results.length} correct` : 'No answers checked'}</h2>
      {results.length > 0 && <p>{Math.round(correct / results.length * 100)}% accuracy this round.</p>}
      {skipped > 0 && <p>{skipped} skipped. Skipped recordings are not counted or graded.</p>}
      {results.length > 0 && <div className="tone-results-table"><table><caption>Your answers this round</caption><thead><tr><th scope="col">Pinyin</th><th scope="col">Your tone</th><th scope="col">Recorded tone</th><th scope="col">Result</th></tr></thead><tbody>{results.map(item => <tr key={item.recordingId}><th scope="row">{item.syllable}</th><td>Tone {item.selectedTone}</td><td>Tone {item.correctTone}</td><td>{item.correct ? 'Correct' : 'Review'}</td></tr>)}</tbody></table></div>}
      <p>My Progress keeps the first checked answer for each recording until you reset Tone listening. Repeated rounds do not increase the unique count.</p>
      <div className="sentence-actions"><button className="sentence-primary" onClick={onRestart}>Start another round</button><button className="sentence-secondary" onClick={onChangeMode}>Choose another mode</button><Link className="sentence-secondary" to="/progress">View My Progress</Link></div>
    </section>;
  }
  return <section className="sentence-card" aria-labelledby="tone-question-title">
    <div className="sentence-progress"><span>Question {index + 1} of {questions.length}</span><span>{results.length} checked</span></div>
    <progress value={index} max={questions.length} aria-label="Tone questions completed" />
    <h2 id="tone-question-title" ref={headingRef} tabIndex={-1}>Which tone do you hear?</h2>
    <p>Listen to <strong>{question.syllable}</strong>, then choose its tone.</p>
    <audio ref={audioRef} src={mediaUrl(question.audioUrl)} preload="none" onPlaying={() => { setHeard(true); setAudioError(''); }} onError={() => setAudioError('This recording is unavailable. Try again or skip it.')} />
    <div className="sentence-actions"><button type="button" className="sentence-primary" onClick={() => play(1)} disabled={busy}>{audioError && !heard ? 'Play recording' : 'Replay recording'}</button><button type="button" className="sentence-secondary" onClick={() => play(.75)} disabled={busy}>Slow · 0.75×</button><button type="button" className="sentence-secondary" aria-pressed={!soundsEnabled} onClick={() => setSoundsEnabled(value => !value)}>{soundsEnabled ? 'Mute answer sounds' : 'Unmute answer sounds'}</button></div>
    {audioError && <p role="alert">{audioError}</p>}
    <div>
      <fieldset className={`tone-choices${result ? ' has-result' : ''}`} disabled={!heard || !!result || busy}><legend>Choose one of the four tones</legend>{tones.map(tone => <label key={tone.value} className={`tone-choice${selected === tone.value ? ' is-selected' : ''}${result && result.correctTone === tone.value ? ' is-correct' : ''}${result && !result.correct && selected === tone.value ? ' is-wrong' : ''}`}>
        <input type="radio" name="tone" value={tone.value} checked={selected === tone.value} onChange={() => submitAnswer(tone.value)} onClick={() => { if (error && selected === tone.value) submitAnswer(tone.value); }} />
        <span className="tone-choice-mark" aria-hidden="true">{tone.mark}</span><span><strong>Tone {tone.value}</strong><small>{tone.label}</small>{result && result.correctTone === tone.value && <small className="tone-option-status">✓ Correct answer</small>}{result && !result.correct && selected === tone.value && <small className="tone-option-status">✗ Your answer</small>}</span>
      </label>)}</fieldset>
      {!heard && <p className="sentence-muted">The recording plays automatically. If it does not start, use Play recording.</p>}
      {busy && <p role="status">Checking & saving your answer…</p>}
      {!result && <div className="sentence-actions"><button type="button" className="sentence-secondary" disabled={busy} onClick={() => next(true)}>Skip recording</button></div>}
      {error && <div role="alert"><p>{error} Your question is still here; retry saving your answer.</p><button type="button" className="sentence-primary" disabled={busy} onClick={() => submitAnswer(selected)}>Retry answer</button></div>}
      {result && <><div className={`sentence-feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status"><h3>{result.correct ? 'Correct!' : 'Keep practicing.'}</h3><p>{result.syllable} · Tone {result.correctTone} ({tones[result.correctTone - 1].label.toLowerCase()}).{!result.correct && ` You chose Tone ${result.selectedTone}.`}</p><p>{index === questions.length - 1 ? 'Opening your results…' : 'Next recording in a moment…'}</p></div></>}
    </div>
  </section>;
}

function useTonePairs() {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const speech = useChineseVoice();
  useEffect(() => {
    const controller = new AbortController(); setState({ loading: true });
    request('/pairs', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(data => {
      if (!Array.isArray(data.pairs)) throw new Error('Could not load tone pairs.');
      if (!controller.signal.aborted) setState({ pairs: data.pairs });
    }).catch(err => { if (!controller.signal.aborted) setState({ error: err.message }); });
    return () => controller.abort();
  }, [attempt]);
  // Words without a teacher recording need a Mandarin device voice.
  const canSpeak = speech.supported && !!speech.voice;
  const playable = state.pairs?.filter(pair => pair.audioUrl || canSpeak) || [];
  return { ...state, loading: state.loading || (speech.loading && !!state.pairs), playable, voice: speech.voice, canSpeak, retry: () => setAttempt(value => value + 1) };
}

function TonePairStart({ pairs, onStart }) {
  const [focus, setFocus] = useState('all');
  if (pairs.loading) return <section className="sentence-card tone-mode-card"><h2>Tone pairs</h2><p role="status">Loading tone pairs…</p></section>;
  if (pairs.error) return <section className="sentence-card tone-mode-card"><h2>Tone pairs</h2><p role="alert">{pairs.error}</p><button className="sentence-secondary" onClick={pairs.retry}>Try again</button></section>;
  const changes = pairs.playable.filter(pair => pair.toneRule).length;
  const recorded = pairs.playable.filter(pair => pair.audioUrl).length;
  if (!pairs.playable.length) return <section className="sentence-card tone-mode-card"><h2>Tone pairs</h2><p>Tone pairs need a teacher recording or a Mandarin voice on your device. Install a Chinese (Mandarin) voice in your device’s speech settings, or check back once your teacher has recorded the words.</p></section>;
  return <section className="sentence-card tone-mode-card" aria-labelledby="tone-pairs-title">
    <p className="sentence-eyebrow">New · Two-syllable words</p><h2 id="tone-pairs-title">Tone pairs</h2>
    <p>Hear a real word like 你好 or 不是 and choose the tone of each syllable. Learn how tones change in natural speech: two 3rd tones, 不 and 一.</p>
    <p className="sentence-muted">{pairs.playable.length} words · {recorded ? `${recorded} recorded by your teacher` : 'Played with your device’s Mandarin voice'}{recorded && recorded < pairs.playable.length ? ', the rest use your device voice' : ''}.</p>
    <fieldset className="tone-pair-focus"><legend>Practice focus</legend>
      <label><input type="radio" name="tone-pair-focus" value="all" checked={focus === 'all'} onChange={() => setFocus('all')} /> All tone pairs</label>
      <label><input type="radio" name="tone-pair-focus" value="changes" checked={focus === 'changes'} disabled={!changes} onChange={() => setFocus('changes')} /> Tone changes only ({changes} {changes === 1 ? 'word' : 'words'})</label>
    </fieldset>
    <button className="sentence-primary" onClick={() => onStart(focus)}>Start tone pairs</button>
  </section>;
}

export default function TonePractice({ onBack }) {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const [round, setRound] = useState(null);
  const [roundKey, setRoundKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setState({ loading: true });
    request('/questions', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(data => {
      if (!Array.isArray(data.questions)) throw new Error('Could not load tone recordings.');
      if (!controller.signal.aborted) setState({ questions: data.questions });
    }).catch(err => { if (!controller.signal.aborted) setState({ error: err.message }); });
    return () => controller.abort();
  }, [attempt]);
  const pairs = useTonePairs();
  const start = () => { setRound({ mode: 'single', questions: shuffleSentences(state.questions).slice(0, 10) }); setRoundKey(value => value + 1); };
  const startPairs = focus => { setRound({ mode: 'pairs', focus, questions: pairRound(pairs.playable, { focus, shuffle: shuffleSentences }) }); setRoundKey(value => value + 1); };
  const restart = () => round.mode === 'pairs' ? startPairs(round.focus) : start();
  return <main className="sentence-page tone-practice" aria-labelledby="tone-practice-title">
    <button className="sentence-back" onClick={onBack}>← Back to home</button>
    <div className="sentence-heading"><p className="sentence-eyebrow">Listen · Choose · Recognize</p><h1 id="tone-practice-title">Tone listening</h1><p>Hear your teacher’s recorded pinyin and choose Tone 1, 2, 3, or 4, then practice tone pairs in real words.</p></div>
    {round?.mode === 'pairs' ? <TonePairSession key={roundKey} pairs={round.questions} voice={pairs.voice} onRestart={restart} onChangeMode={() => setRound(null)} />
      : round ? <ToneSession key={roundKey} questions={round.questions} onRestart={restart} onChangeMode={() => setRound(null)} />
        : <div className="tone-modes">
          {state.loading ? <section className="sentence-card tone-mode-card"><p role="status">Loading recorded pinyin…</p></section> : state.error ? <section className="sentence-card tone-mode-card" role="alert"><p>{state.error}</p><button className="sentence-primary" onClick={() => setAttempt(value => value + 1)}>Try again</button></section> : !state.questions.length ? <section className="sentence-card tone-mode-card"><h2>No recorded pinyin yet</h2><p>A teacher needs to add pinyin recordings before this quiz is available.</p><Link to="/practice/pinyin">Explore the pinyin chart</Link></section> : <section className="sentence-card tone-mode-card"><p className="sentence-eyebrow">Single syllables</p><h2>Train your ear for the four tones</h2><p>{state.questions.length} recordings available · Up to 10 questions per round.</p><p>The recording plays automatically. Choose a tone to check your answer and continue. Your results are saved to My Progress.</p><button className="sentence-primary" onClick={start}>Start tone practice</button></section>}
          <TonePairStart pairs={pairs} onStart={startPairs} />
        </div>}
  </main>;
}
