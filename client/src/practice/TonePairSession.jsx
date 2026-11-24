import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useAnswerSound from './useAnswerSound';
import { mediaUrl } from '../utils/mediaUrl';
import { markSyllable, toneRuleNote } from './tonePairs';
import { AdvanceBar, PlayButton, ProgressDots, ScoreRing, SlowButton, SoundToggle, ToneContour } from './ToneVisuals';
import useToneKeys from './useToneKeys';

const spokenTones = tones => tones.join(' + ');

// Plays the teacher recording when there is one, otherwise the chosen Mandarin voice (female or male).
function usePairAudio(pair, speaker) {
  const audioRef = useRef(null);
  const activeRef = useRef(true);
  const playbackRef = useRef(0);
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');
  const speakerRef = useRef(speaker);
  speakerRef.current = speaker;
  useEffect(() => { activeRef.current = true; return () => { activeRef.current = false; speakerRef.current?.stop(); }; }, []);

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
    const spoken = speakerRef.current?.speak(pair.hanzi, {
      rate: rate < 1 ? .55 : .8,
      onStart: () => { if (!stale()) { setHeard(true); setPlaying(true); } },
      onEnd: () => { if (!stale()) { setHeard(true); setPlaying(false); } },
      onError: error => {
        if (stale()) return;
        setPlaying(false);
        setAudioError(error === 'not-allowed'
          ? 'Your browser blocked automatic playback. Tap Play word to start the audio.'
          : 'Could not play this word. Try again or skip it.');
      },
    });
    if (!spoken) { setAudioError('No Mandarin voice is available on this device. Try again or skip it.'); return; }
    // Some speech engines never report onstart; a student-started play counts as heard.
    if (userStarted) setHeard(true);
  }, [pair]);

  useEffect(() => {
    if (!pair) return;
    setHeard(false); setPlaying(false); setAudioError('');
    const audio = audioRef.current;
    void play(1);
    const playback = playbackRef;
    const current = speakerRef;
    return () => { playback.current++; audio?.pause(); current.current?.stop(); };
  }, [pair, play]);

  const stop = useCallback(() => { setPlaying(false); playbackRef.current++; audioRef.current?.pause(); speakerRef.current?.stop(); }, []);
  const element = pair?.audioUrl ? <audio ref={audioRef} src={mediaUrl(pair.audioUrl)} preload="none" onPlaying={() => { setHeard(true); setPlaying(true); setAudioError(''); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('This recording is unavailable. Try again or skip it.'); }} /> : null;
  return { play, stop, heard, playing, audioError, element };
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

export default function TonePairSession({ pairs, speaker, onRestart }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState([null, null]);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [statuses, setStatuses] = useState([]);
  const feedbackSound = useAnswerSound(soundsEnabled);
  const headingRef = useRef(null);
  const lockedRef = useRef(false);
  const advancingRef = useRef(false);
  const activeRef = useRef(true);
  const pair = pairs[index];
  const finished = index >= pairs.length;
  const { play, stop, heard, playing, audioError, element } = usePairAudio(finished ? null : pair, speaker);
  useEffect(() => { activeRef.current = true; return () => { activeRef.current = false; }; }, []);
  useEffect(() => { advancingRef.current = false; headingRef.current?.focus(); }, [index]);

  const submit = async tones => {
    if (lockedRef.current || tones.some(tone => !tone)) return;
    lockedRef.current = true; setBusy(true); setError(''); stop();
    try {
      const data = await submitPair(pair.id, tones);
      if (!activeRef.current) return;
      setResult(data); setResults(previous => [...previous, data]);
      setStatuses(previous => { const copy = [...previous]; copy[index] = data.correct ? 'correct' : 'wrong'; return copy; });
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
    if (skip) { setSkipped(value => value + 1); setStatuses(previous => { const copy = [...previous]; copy[index] = 'skipped'; return copy; }); }
    setIndex(value => value + 1); setSelected([null, null]); setResult(null); setError('');
    lockedRef.current = false;
  }, [busy, result, stop, index]);

  const note = result ? toneRuleNote(result) : '';
  const advanceDelay = result?.correct ? (note ? 2600 : 1400) : 4200;
  useEffect(() => {
    if (!result || busy) return;
    const timer = window.setTimeout(() => next(false), advanceDelay);
    return () => window.clearTimeout(timer);
  }, [result, busy, next, advanceDelay]);
  const activePosition = selected[0] ? 1 : 0;
  useToneKeys({ enabled: !finished && heard && !result && !busy, onTone: tone => choose(activePosition, tone), onReplay: () => play(1, true) });

  if (finished) {
    const correct = results.filter(item => item.correct).length;
    return <section className="sentence-card tone-results" aria-labelledby="tone-pair-round-title">
      <div className="tone-results-summary">
        {results.length > 0 && <ScoreRing correct={correct} total={results.length} />}
        <div><p className="sentence-eyebrow">Round complete</p><h2 id="tone-pair-round-title" ref={headingRef} tabIndex={-1}>{results.length ? `${correct} of ${results.length} correct` : 'No answers checked'}</h2>
          {skipped > 0 && <p className="sentence-muted">{skipped} skipped</p>}</div>
      </div>
      {results.length > 0 && <div className="tone-results-table"><table><caption>Your answers this round</caption><thead><tr><th scope="col">Word</th><th scope="col">Your tones</th><th scope="col">Spoken tones</th><th scope="col">Result</th></tr></thead><tbody>{results.map(item => <tr key={item.pairId}><th scope="row"><span lang="zh-CN" className="tone-results-hanzi">{item.hanzi}</span> {item.pinyin}</th><td><span className="tone-cell"><ToneContour tone={item.selectedTones[0]} size={24} /><ToneContour tone={item.selectedTones[1]} size={24} />{spokenTones(item.selectedTones)}</span></td><td><span className="tone-cell"><ToneContour tone={item.correctTones[0]} size={24} /><ToneContour tone={item.correctTones[1]} size={24} />{spokenTones(item.correctTones)}</span>{item.toneChange && <small className="tone-pair-change"> · tone change</small>}</td><td><span className={`tone-result-pill ${item.correct ? 'is-correct' : 'is-wrong'}`}>{item.correct ? '✓ Correct' : '↻ Review'}</span></td></tr>)}</tbody></table></div>}
      <div className="sentence-actions"><button className="sentence-primary" onClick={onRestart}>Start another round</button><Link className="sentence-secondary" to="/progress">View My Progress</Link></div>
    </section>;
  }
  const characters = [...pair.hanzi];
  return <section className="sentence-card tone-stage" aria-labelledby="tone-pair-question-title">
    <div className="tone-topbar">
      <span className="tone-count">{index + 1} / {pairs.length}</span>
      <SoundToggle enabled={soundsEnabled} onToggle={() => setSoundsEnabled(value => !value)} />
    </div>
    <ProgressDots total={pairs.length} current={index} statuses={statuses} />
    <h2 id="tone-pair-question-title" ref={headingRef} tabIndex={-1} className="tone-question">Which tones do you hear?</h2>
    {element}
    <div className="tone-listen tone-listen-pair">
      <PlayButton playing={playing} onClick={() => play(1, true)} disabled={busy} label={audioError && !heard ? 'Play word' : 'Replay word'} />
      <p className="tone-pair-word"><span lang="zh-CN">{pair.hanzi}</span><span>{pair.english}</span></p>
      <SlowButton onClick={() => play(.75, true)} disabled={busy} />
    </div>
    {audioError && <p className="tone-alert" role="alert">{audioError}</p>}
    <div className="tone-pair-choices">{pair.syllables.map((syllable, position) => {
      const chosen = result ? result.correctTones[position] : selected[position];
      const slotState = result ? (result.selectedTones[position] === result.correctTones[position] ? ' is-correct' : ' is-wrong') : !selected[position] && position === activePosition && heard ? ' is-active' : '';
      return <fieldset key={position} className={`tone-choices tone-pair-row${result ? ' has-result' : ''}${slotState}`} disabled={!heard || !!result || busy}>
        <legend><span className="tone-visually-hidden">{position === 0 ? 'First' : 'Second'} syllable · </span><span className="tone-slot-step" aria-hidden="true">{position + 1}</span><span lang="zh-CN" className="tone-slot-hanzi">{characters[position]}</span> <span className="tone-slot-pinyin">{chosen ? markSyllable(syllable, chosen) : syllable}</span><ToneContour tone={chosen} size={40} className="tone-slot-contour" /></legend>
        {[1, 2, 3, 4].map(tone => {
          const isSelected = selected[position] === tone;
          const isCorrect = result && result.correctTones[position] === tone;
          const isWrong = result && isSelected && !isCorrect;
          return <label key={tone} data-tone={tone} className={`tone-choice${isSelected ? ' is-selected' : ''}${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}>
            <input type="radio" name={`tone-pair-${position}`} value={tone} checked={isSelected} aria-label={`${syllable} tone ${tone}`} onChange={() => choose(position, tone)} onClick={() => { if (error && isSelected) void submit(selected); }} />
            <ToneContour tone={tone} size={40} />
            <span className="tone-choice-mark" aria-hidden="true">{markSyllable(syllable, tone)}</span><span className="tone-choice-text"><strong>Tone {tone}</strong></span>
          </label>;
        })}
      </fieldset>;
    })}</div>
    {!result && <div className="tone-footer"><button type="button" className="tone-skip" disabled={busy} aria-label="Skip word" onClick={() => next(true)}>Skip →</button></div>}
    {error && <div className="tone-alert" role="alert"><p>{error} Your word is still here; retry saving your answer.</p><button type="button" className="sentence-primary" disabled={busy} onClick={() => submit(selected)}>Retry answer</button></div>}
    {result && <div className={`sentence-feedback tone-feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status">
      <span className="tone-feedback-icon" aria-hidden="true">{result.correct ? '✓' : '✗'}</span>
      <div><h3>{result.correct ? 'Correct!' : 'Keep practicing.'}</h3>
        <p><span lang="zh-CN">{result.hanzi}</span> {result.pinyin} · Tone {result.correctTones[0]} + Tone {result.correctTones[1]}</p>
        {result.toneChange && result.writtenPinyin && <p className="tone-shift" aria-hidden="true"><span><small>Written</small><s>{result.writtenPinyin}</s></span><b>→</b><span><small>Spoken</small><strong>{result.pinyin}</strong></span></p>}
        {note && <p className="tone-pair-note">{note}</p>}
</div>
      <AdvanceBar duration={advanceDelay} />
    </div>}
  </section>;
}
