import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useAnswerSound from './useAnswerSound';
import { mediaUrl } from '../utils/mediaUrl';
import { markSyllable, toneNames, toneRuleNote } from './tonePairs';

const spokenTones = tones => tones.join(' + ');

// Plays the teacher recording when there is one, otherwise the device's Mandarin voice.
function usePairAudio(pair, voice) {
  const audioRef = useRef(null);
  const activeRef = useRef(true);
  const playbackRef = useRef(0);
  const [heard, setHeard] = useState(false);
  const [audioError, setAudioError] = useState('');
  useEffect(() => { activeRef.current = true; return () => { activeRef.current = false; window.speechSynthesis?.cancel(); }; }, []);

  const play = useCallback(async (rate, userStarted = false) => {
    if (!pair) return;
    const attempt = ++playbackRef.current;
    const stale = () => !activeRef.current || attempt !== playbackRef.current;
    setAudioError('');
    if (pair.audioUrl) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause(); audio.currentTime = 0; audio.playbackRate = rate;
      try { await audio.play(); }
      catch (err) {
        if (!stale() && audioRef.current === audio) setAudioError(err.name === 'NotAllowedError'
          ? 'Your browser blocked automatic playback. Tap Play word to start the audio.'
          : 'Could not play this recording. Try again or skip it.');
      }
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(pair.hanzi);
    utterance.lang = voice?.lang || 'zh-CN';
    if (voice) utterance.voice = voice;
    utterance.rate = rate < 1 ? .55 : .8;
    utterance.onstart = () => { if (!stale()) setHeard(true); };
    utterance.onend = () => { if (!stale()) setHeard(true); };
    utterance.onerror = event => {
      if (stale() || ['interrupted', 'canceled'].includes(event.error)) return;
      setAudioError(event.error === 'not-allowed'
        ? 'Your browser blocked automatic playback. Tap Play word to start the audio.'
        : 'Could not play this word with your device voice. Try again or skip it.');
    };
    synth.speak(utterance);
    // Some speech engines never report onstart; a student-started play counts as heard.
    if (userStarted) setHeard(true);
  }, [pair, voice]);

  useEffect(() => {
    if (!pair) return;
    setHeard(false); setAudioError('');
    const audio = audioRef.current;
    void play(1);
    const playback = playbackRef;
    return () => { playback.current++; audio?.pause(); window.speechSynthesis?.cancel(); };
  }, [pair, play]);

  const stop = useCallback(() => { playbackRef.current++; audioRef.current?.pause(); window.speechSynthesis?.cancel(); }, []);
  const element = pair?.audioUrl ? <audio ref={audioRef} src={mediaUrl(pair.audioUrl)} preload="none" onPlaying={() => { setHeard(true); setAudioError(''); }} onError={() => setAudioError('This recording is unavailable. Try again or skip it.')} /> : null;
  return { play, stop, heard, audioError, element };
}

async function submitPair(pairId, selectedTones) {
  const response = await fetch(`${window.API_BASE_URL}/api/tone-practice/pairs/answer`, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairId, selectedTones }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not check your answer.');
  return data;
}

export default function TonePairSession({ pairs, voice, onRestart, onChangeMode }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState([null, null]);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const feedbackSound = useAnswerSound(soundsEnabled);
  const headingRef = useRef(null);
  const lockedRef = useRef(false);
  const advancingRef = useRef(false);
  const activeRef = useRef(true);
  const pair = pairs[index];
  const finished = index >= pairs.length;
  const { play, stop, heard, audioError, element } = usePairAudio(finished ? null : pair, voice);
  useEffect(() => { activeRef.current = true; return () => { activeRef.current = false; }; }, []);
  useEffect(() => { advancingRef.current = false; headingRef.current?.focus(); }, [index]);

  const submit = async tones => {
    if (lockedRef.current || tones.some(tone => !tone)) return;
    lockedRef.current = true; setBusy(true); setError(''); stop();
    try {
      const data = await submitPair(pair.id, tones);
      if (!activeRef.current) return;
      setResult(data); setResults(previous => [...previous, data]);
      feedbackSound.play(data.correct);
    } catch (err) {
      if (activeRef.current) { setError(err.message); lockedRef.current = false; }
    } finally { if (activeRef.current) setBusy(false); }
  };
  const choose = (position, tone) => {
    if (!heard || lockedRef.current) return;
    feedbackSound.prepare();
    const next = position === 0 ? [tone, selected[1]] : [selected[0], tone];
    setSelected(next);
    void submit(next);
  };
  const next = useCallback(skip => {
    if (advancingRef.current || busy || (!skip && !result)) return;
    advancingRef.current = true;
    stop();
    if (skip) setSkipped(value => value + 1);
    setIndex(value => value + 1); setSelected([null, null]); setResult(null); setError('');
    lockedRef.current = false;
  }, [busy, result, stop]);

  const note = result ? toneRuleNote(result) : '';
  useEffect(() => {
    if (!result || busy) return;
    const timer = window.setTimeout(() => next(false), result.correct ? (note ? 2600 : 1400) : 4200);
    return () => window.clearTimeout(timer);
  }, [result, busy, next, note]);

  if (finished) {
    const correct = results.filter(item => item.correct).length;
    return <section className="sentence-card tone-results" aria-labelledby="tone-pair-round-title">
      <p className="sentence-eyebrow">Round complete</p><h2 id="tone-pair-round-title" ref={headingRef} tabIndex={-1}>{results.length ? `${correct} of ${results.length} correct` : 'No answers checked'}</h2>
      {results.length > 0 && <p>{Math.round(correct / results.length * 100)}% accuracy this round.</p>}
      {skipped > 0 && <p>{skipped} skipped. Skipped words are not counted or graded.</p>}
      {results.length > 0 && <div className="tone-results-table"><table><caption>Your answers this round</caption><thead><tr><th scope="col">Word</th><th scope="col">Your tones</th><th scope="col">Spoken tones</th><th scope="col">Result</th></tr></thead><tbody>{results.map(item => <tr key={item.pairId}><th scope="row"><span lang="zh-CN">{item.hanzi}</span> {item.pinyin}</th><td>{spokenTones(item.selectedTones)}</td><td>{spokenTones(item.correctTones)}{item.toneChange && <small className="tone-pair-change"> · tone change</small>}</td><td>{item.correct ? 'Correct' : 'Review'}</td></tr>)}</tbody></table></div>}
      <p>My Progress keeps the first checked answer for each word until you reset Tone listening.</p>
      <div className="sentence-actions"><button className="sentence-primary" onClick={onRestart}>Start another round</button><button className="sentence-secondary" onClick={onChangeMode}>Choose another mode</button><Link className="sentence-secondary" to="/progress">View My Progress</Link></div>
    </section>;
  }
  return <section className="sentence-card" aria-labelledby="tone-pair-question-title">
    <div className="sentence-progress"><span>Word {index + 1} of {pairs.length}</span><span>{results.length} checked</span></div>
    <progress value={index} max={pairs.length} aria-label="Tone pair questions completed" />
    <h2 id="tone-pair-question-title" ref={headingRef} tabIndex={-1}>Which tones do you hear?</h2>
    <p className="tone-pair-word"><span lang="zh-CN">{pair.hanzi}</span><span>{pair.syllables.join(' ')} · {pair.english}</span></p>
    {element}
    <div className="sentence-actions"><button type="button" className="sentence-primary" onClick={() => play(1, true)} disabled={busy}>{audioError && !heard ? 'Play word' : 'Replay word'}</button><button type="button" className="sentence-secondary" onClick={() => play(.75, true)} disabled={busy}>Slow · 0.75×</button><button type="button" className="sentence-secondary" aria-pressed={!soundsEnabled} onClick={() => setSoundsEnabled(value => !value)}>{soundsEnabled ? 'Mute answer sounds' : 'Unmute answer sounds'}</button></div>
    {!pair.audioUrl && <p className="sentence-muted">Played with your device’s Mandarin voice.</p>}
    {audioError && <p role="alert">{audioError}</p>}
    <div className="tone-pair-choices">{pair.syllables.map((syllable, position) => <fieldset key={position} className={`tone-choices tone-pair-row${result ? ' has-result' : ''}`} disabled={!heard || !!result || busy}>
      <legend>{position === 0 ? 'First' : 'Second'} syllable · <span lang="zh-CN">{[...pair.hanzi][position]}</span> {syllable}</legend>
      {[1, 2, 3, 4].map(tone => {
        const isSelected = selected[position] === tone;
        const isCorrect = result && result.correctTones[position] === tone;
        const isWrong = result && isSelected && !isCorrect;
        return <label key={tone} className={`tone-choice${isSelected ? ' is-selected' : ''}${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}>
          <input type="radio" name={`tone-pair-${position}`} value={tone} checked={isSelected} aria-label={`${syllable} tone ${tone}`} onChange={() => choose(position, tone)} onClick={() => { if (error && isSelected) void submit(selected); }} />
          <span className="tone-choice-mark" aria-hidden="true">{markSyllable(syllable, tone)}</span><span><strong>Tone {tone}</strong>{isCorrect && <small className="tone-option-status">✓ Spoken tone</small>}{isWrong && <small className="tone-option-status">✗ Your answer</small>}</span>
        </label>;
      })}
    </fieldset>)}</div>
    {!heard && <p className="sentence-muted">The word plays automatically. If it does not start, use Play word.</p>}
    {heard && !result && !busy && selected.some(Boolean) && <p className="sentence-muted">Now choose the tone of the {selected[0] ? 'second' : 'first'} syllable.</p>}
    {busy && <p role="status">Checking & saving your answer…</p>}
    {!result && <div className="sentence-actions"><button type="button" className="sentence-secondary" disabled={busy} onClick={() => next(true)}>Skip word</button></div>}
    {error && <div role="alert"><p>{error} Your word is still here; retry saving your answer.</p><button type="button" className="sentence-primary" disabled={busy} onClick={() => submit(selected)}>Retry answer</button></div>}
    {result && <div className={`sentence-feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status"><h3>{result.correct ? 'Correct!' : 'Keep practicing.'}</h3>
      <p><span lang="zh-CN">{result.hanzi}</span> {result.pinyin} · Tone {result.correctTones[0]} + Tone {result.correctTones[1]} ({toneNames[result.correctTones[0]]}, then {toneNames[result.correctTones[1]]}).{!result.correct && ` You chose ${spokenTones(result.selectedTones)}.`}</p>
      {note && <p className="tone-pair-note">{note}</p>}
      <p>{index === pairs.length - 1 ? 'Opening your results…' : 'Next word in a moment…'}</p></div>}
  </section>;
}
