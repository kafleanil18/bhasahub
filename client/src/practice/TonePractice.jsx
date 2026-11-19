import { useCallback, useEffect, useRef, useState } from 'react';
import useAnswerSound from './useAnswerSound';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl';
import { shuffleSentences } from './sentenceQuiz';
import SingleSyllableStart from './SingleSyllableStart';
import TonePairSession from './TonePairSession';
import useChineseVoice from './useChineseVoice';
import { markSyllable, pairRound } from './tonePairs';
import { AdvanceBar, PlayButton, ProgressDots, ScoreRing, SlowButton, SoundToggle, ToneContour } from './ToneVisuals';
import useToneKeys from './useToneKeys';
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
          {results.length > 0 && <p>{Math.round(correct / results.length * 100)}% accuracy this round.</p>}
          {skipped > 0 && <p className="sentence-muted">{skipped} skipped. Skipped recordings are not counted or graded.</p>}</div>
      </div>
      {results.length > 0 && <div className="tone-results-table"><table><caption>Your answers this round</caption><thead><tr><th scope="col">Pinyin</th><th scope="col">Your tone</th><th scope="col">Recorded tone</th><th scope="col">Result</th></tr></thead><tbody>{results.map(item => <tr key={item.recordingId}><th scope="row">{markSyllable(item.syllable, item.correctTone)}</th><td><span className="tone-cell"><ToneContour tone={item.selectedTone} size={28} />Tone {item.selectedTone}</span></td><td><span className="tone-cell"><ToneContour tone={item.correctTone} size={28} />Tone {item.correctTone}</span></td><td><span className={`tone-result-pill ${item.correct ? 'is-correct' : 'is-wrong'}`}>{item.correct ? '✓ Correct' : '↻ Review'}</span></td></tr>)}</tbody></table></div>}
      <p className="sentence-muted">My Progress keeps the first checked answer for each recording until you reset Tone listening. Repeated rounds do not increase the unique count.</p>
      <div className="sentence-actions"><button className="sentence-primary" onClick={onRestart}>Start another round</button><button className="sentence-secondary" onClick={onChangeMode}>Choose another mode</button><Link className="sentence-secondary" to="/progress">View My Progress</Link></div>
    </section>;
  }
  return <section className="sentence-card tone-stage" aria-labelledby="tone-question-title">
    <div className="tone-topbar">
      <div className="sentence-progress"><span>Question {index + 1} of {questions.length}</span><span>{results.length} checked</span></div>
      <SoundToggle enabled={soundsEnabled} onToggle={() => setSoundsEnabled(value => !value)} />
    </div>
    <ProgressDots total={questions.length} current={index} statuses={statuses} />
    <h2 id="tone-question-title" ref={headingRef} tabIndex={-1} className="tone-question">Which tone do you hear?</h2>
    <audio ref={audioRef} src={mediaUrl(question.audioUrl)} preload="none" onPlaying={() => { setHeard(true); setPlaying(true); setAudioError(''); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('This recording is unavailable. Try again or skip it.'); }} />
    <div className="tone-listen">
      <PlayButton playing={playing} onClick={() => play(1)} disabled={busy} label={audioError && !heard ? 'Play recording' : 'Replay recording'} />
      <p className="tone-listen-syllable">{result ? markSyllable(question.syllable, result.correctTone) : question.syllable}</p>
      <p className="sentence-muted tone-listen-hint">{heard ? 'Match the pitch you hear to a shape below.' : 'The recording plays automatically. If it does not start, tap play.'}</p>
      <SlowButton onClick={() => play(.75)} disabled={busy} />
    </div>
    {audioError && <p className="tone-alert" role="alert">{audioError}</p>}
    <fieldset className={`tone-choices${result ? ' has-result' : ''}`} disabled={!heard || !!result || busy}><legend className="tone-visually-hidden">Choose one of the four tones</legend>{tones.map(tone => <label key={tone.value} data-tone={tone.value} className={`tone-choice${selected === tone.value ? ' is-selected' : ''}${result && result.correctTone === tone.value ? ' is-correct' : ''}${result && !result.correct && selected === tone.value ? ' is-wrong' : ''}`}>
      <input type="radio" name="tone" value={tone.value} checked={selected === tone.value} onChange={() => submitAnswer(tone.value)} onClick={() => { if (error && selected === tone.value) submitAnswer(tone.value); }} />
      <kbd className="tone-key" aria-hidden="true">{tone.value}</kbd>
      <ToneContour tone={tone.value} size={72} />
      <span className="tone-choice-mark" aria-hidden="true">{markSyllable(question.syllable, tone.value)}</span>
      <span className="tone-choice-text"><strong>Tone {tone.value}</strong><small>{tone.label}</small>{result && result.correctTone === tone.value && <small className="tone-option-status">✓ Correct answer</small>}{result && !result.correct && selected === tone.value && <small className="tone-option-status">✗ Your answer</small>}</span>
    </label>)}</fieldset>
    {busy && <p className="tone-checking" role="status">Checking & saving your answer…</p>}
    {!result && !busy && <div className="tone-footer"><span className="tone-shortcuts">Keys <kbd>1</kbd>–<kbd>4</kbd> answer · <kbd>R</kbd> replays</span><button type="button" className="tone-skip" disabled={busy} onClick={() => next(true)}>Skip recording →</button></div>}
    {error && <div className="tone-alert" role="alert"><p>{error} Your question is still here; retry saving your answer.</p><button type="button" className="sentence-primary" disabled={busy} onClick={() => submitAnswer(selected)}>Retry answer</button></div>}
    {result && <div className={`sentence-feedback tone-feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status">
      <span className="tone-feedback-icon" aria-hidden="true">{result.correct ? '✓' : '✗'}</span>
      <div><h3>{result.correct ? 'Correct!' : 'Keep practicing.'}</h3><p>{markSyllable(result.syllable, result.correctTone)} · Tone {result.correctTone} ({tones[result.correctTone - 1].label.toLowerCase()}).{!result.correct && ` You chose Tone ${result.selectedTone}.`}</p><p className="tone-next">{index === questions.length - 1 ? 'Opening your results…' : 'Next recording in a moment…'}</p></div>
      <AdvanceBar duration={advanceDelay} />
    </div>}
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

const meetTones = [
  { tone: 1, hanzi: '妈', pinyin: 'mā', meaning: 'mother' }, { tone: 2, hanzi: '麻', pinyin: 'má', meaning: 'hemp' },
  { tone: 3, hanzi: '马', pinyin: 'mǎ', meaning: 'horse' }, { tone: 4, hanzi: '骂', pinyin: 'mà', meaning: 'to scold' },
];

// Landing banner: the classic ma/ma/ma/ma set, playable with the device's Mandarin voice.
function ToneHero({ voice, canSpeak }) {
  const [speaking, setSpeaking] = useState(null);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const say = item => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(item.hanzi);
    utterance.lang = voice?.lang || 'zh-CN';
    if (voice) utterance.voice = voice;
    utterance.rate = .7;
    utterance.onend = utterance.onerror = () => setSpeaking(current => current === item.tone ? null : current);
    setSpeaking(item.tone);
    synth.speak(utterance);
  };
  const tile = item => <>
    <ToneContour tone={item.tone} size={52} />
    <span lang="zh-CN" className="tone-meet-hanzi">{item.hanzi}</span>
    <b>{item.pinyin}</b><small>{item.meaning}</small>
  </>;
  return <div className="tone-hero">
    <span className="tone-hero-glyph" lang="zh-CN" aria-hidden="true">声</span>
    <div className="tone-hero-copy">
      <p className="tone-hero-eyebrow">Listen · Choose · Recognize</p>
      <h1 id="tone-practice-title">Tone listening</h1>
      <p>One sound, four meanings. Train your ear to hear the pitch, then practise tones in real words.</p>
    </div>
    <div className="tone-hero-tones">
      <p className="tone-hero-label">Meet the four tones{canSpeak ? ' · tap to hear' : ''}</p>
      <div className="tone-meet-grid">{meetTones.map(item => canSpeak
        ? <button key={item.tone} type="button" data-tone={item.tone} className={`tone-meet${speaking === item.tone ? ' is-speaking' : ''}`} aria-label={`Hear ${item.pinyin}, ${item.meaning}`} onClick={() => say(item)}>{tile(item)}</button>
        : <div key={item.tone} data-tone={item.tone} className="tone-meet">{tile(item)}</div>)}</div>
    </div>
  </div>;
}

const howItWorks = [
  { icon: '🎧', title: 'Listen', text: 'The audio plays by itself. Replay or slow it down any time.' },
  { icon: '〽️', title: 'Match the shape', text: 'Pick the pitch line that matches what you heard.' },
  { icon: '💡', title: 'Learn the rule', text: 'See the right answer and why tones change in real speech.' },
];

function TonePairStart({ pairs, onStart, featured }) {
  const [focus, setFocus] = useState('all');
  if (pairs.loading) return <section className="sentence-card tone-mode-card"><h2>Tone pairs</h2><p role="status">Loading tone pairs…</p></section>;
  if (pairs.error) return <section className="sentence-card tone-mode-card"><h2>Tone pairs</h2><p role="alert">{pairs.error}</p><button className="sentence-secondary" onClick={pairs.retry}>Try again</button></section>;
  const changes = pairs.playable.filter(pair => pair.toneRule).length;
  const recorded = pairs.playable.filter(pair => pair.audioUrl).length;
  if (!pairs.playable.length) return <section className="sentence-card tone-mode-card"><h2>Tone pairs</h2><p>Tone pairs need a teacher recording or a Mandarin voice on your device. Install a Chinese (Mandarin) voice in your device’s speech settings, or check back once your teacher has recorded the words.</p></section>;
  const samples = pairs.playable.slice(0, 5);
  return <section className={`sentence-card tone-mode-card tone-mode-pairs${featured ? ' is-featured' : ''}`} aria-labelledby="tone-pairs-title">
    <div className="tone-mode-art tone-mode-art-pairs" aria-hidden="true">
      <div className="tone-mode-art-word"><span lang="zh-CN">你</span><ToneContour tone={2} size={56} /><span className="tone-mode-plus">+</span><span lang="zh-CN">好</span><ToneContour tone={3} size={56} /></div>
      <ul className="tone-word-chips">{samples.map(pair => <li key={pair.id}><span lang="zh-CN">{pair.hanzi}</span> {pair.english}</li>)}</ul>
    </div>
    <p className="sentence-eyebrow"><span className="tone-badge">New</span> Two-syllable words</p><h2 id="tone-pairs-title">Tone pairs</h2>
    <p>Hear a real word like 你好 or 不是 and choose the tone of each syllable. Learn how tones change in natural speech: two 3rd tones, 不 and 一.</p>
    <ul className="tone-mode-stats">
      <li><strong>{pairs.playable.length}</strong><span>words</span></li>
      <li><strong>{changes}</strong><span>tone changes</span></li>
      <li><strong>{Math.min(10, pairs.playable.length)}</strong><span>per round</span></li>
    </ul>
    <p className="tone-mode-meta">🎧 {recorded ? `${recorded} recorded by your teacher` : 'Played with your device’s Mandarin voice'}{recorded && recorded < pairs.playable.length ? ', the rest use your device voice' : ''}.</p>
    <fieldset className="tone-pair-focus"><legend>Practice focus</legend>
      <label><input type="radio" name="tone-pair-focus" value="all" checked={focus === 'all'} onChange={() => setFocus('all')} /> All tone pairs</label>
      <label><input type="radio" name="tone-pair-focus" value="changes" checked={focus === 'changes'} disabled={!changes} onChange={() => setFocus('changes')} /> Tone changes only ({changes} {changes === 1 ? 'word' : 'words'})</label>
    </fieldset>
    <button className="sentence-primary tone-start" onClick={() => onStart(focus)}>Start tone pairs <span aria-hidden="true">→</span></button>
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
  const singleEmpty = !state.loading && !state.error && !state.questions.length;
  const start = pool => { setRound({ mode: 'single', pool, questions: shuffleSentences(pool).slice(0, 10) }); setRoundKey(value => value + 1); };
  const startPairs = focus => { setRound({ mode: 'pairs', focus, questions: pairRound(pairs.playable, { focus, shuffle: shuffleSentences }) }); setRoundKey(value => value + 1); };
  const restart = () => round.mode === 'pairs' ? startPairs(round.focus) : start(round.pool);
  return <main className="sentence-page tone-practice" aria-labelledby="tone-practice-title">
    <button className="sentence-back" onClick={onBack}>← Back to home</button>
    {round ? <h1 id="tone-practice-title" className="tone-compact-title">Tone listening <span>· {round.mode === 'pairs' ? 'Tone pairs' : 'Single syllables'}</span></h1> : <ToneHero voice={pairs.voice} canSpeak={pairs.canSpeak} />}
    {round?.mode === 'pairs' ? <TonePairSession key={roundKey} pairs={round.questions} voice={pairs.voice} onRestart={restart} onChangeMode={() => setRound(null)} />
      : round ? <ToneSession key={roundKey} questions={round.questions} onRestart={restart} onChangeMode={() => setRound(null)} />
        : <>
          <div className={`tone-modes${singleEmpty ? ' is-single-empty' : ''}`}>
            {singleEmpty && <TonePairStart pairs={pairs} onStart={startPairs} featured />}
            {state.loading ? <section className="sentence-card tone-mode-card"><p role="status">Loading recorded pinyin…</p></section>
              : state.error ? <section className="sentence-card tone-mode-card" role="alert"><p>{state.error}</p><button className="sentence-primary" onClick={() => setAttempt(value => value + 1)}>Try again</button></section>
              : singleEmpty ? <section className="sentence-card tone-mode-card tone-mode-empty">
                <div className="tone-mode-art" aria-hidden="true">{tones.map(tone => <span key={tone.value} className="tone-mode-tone" data-tone={tone.value}><ToneContour tone={tone.value} size={44} /><b>{tone.mark}</b></span>)}</div>
                <p className="sentence-eyebrow"><span className="tone-badge is-muted">Coming soon</span> Single syllables</p>
                <h2>No recorded pinyin yet</h2>
                <p>A teacher needs to add pinyin recordings before this quiz is available. In the meantime, explore every syllable and tone in the chart.</p>
                <Link className="sentence-secondary tone-start" to="/practice/pinyin">Explore the pinyin chart <span aria-hidden="true">→</span></Link>
              </section>
              : <SingleSyllableStart questions={state.questions} onStart={start} />}
            {!singleEmpty && <TonePairStart pairs={pairs} onStart={startPairs} />}
          </div>
          <ol className="tone-how" aria-label="How it works">{howItWorks.map((step, i) => <li key={step.title}><span className="tone-how-icon" aria-hidden="true">{step.icon}</span><div><strong><span className="tone-how-step">{i + 1}</span>{step.title}</strong><p>{step.text}</p></div></li>)}</ol>
        </>}
  </main>;
}
