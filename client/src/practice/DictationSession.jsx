import { recordStudioActivity } from './recordStudioActivity';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import SentenceText from './SentenceText';
import DictationFeedback from './DictationFeedback';
import { compareDictation, normalizeDictation } from './dictationQuiz';
import { shuffleSentences } from './sentenceQuiz';
import { PlayButton, ProgressDots, ScoreRing, SlowButton } from './ToneVisuals';

export default function DictationSession({ initialSentences, onRestart, onExit }) {
  const [sentences, setSentences] = useState(initialSentences);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [finished, setFinished] = useState(false);
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef(null);
  const titleRef = useRef(null);
  const nextRef = useRef(null);
  const lockedRef = useRef(false);
  const composingRef = useRef(false);
  const playAttemptRef = useRef(0);
  const sentence = sentences[index];
  const missed = results.filter(result => !result.comparison.correct);

  const play = useCallback(async (rate = 1) => {
    const audio = audioRef.current;
    if (!audio) return;
    const attempt = ++playAttemptRef.current;
    setAudioError('');
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = rate;
    try { await audio.play(); }
    catch (err) {
      if (audioRef.current === audio && attempt === playAttemptRef.current) setAudioError(err.name === 'NotAllowedError'
        ? 'Tap Play recording to hear the sentence.' : 'Could not play this recording. Try again or skip it.');
    }
  }, []);

  const stopAudio = useCallback(audio => {
    playAttemptRef.current++;
    audio?.pause();
  }, []);

  useEffect(() => { titleRef.current?.focus(); }, [index, finished, sentences]);
  useEffect(() => { if (feedback) nextRef.current?.focus(); }, [feedback]);
  useEffect(() => {
    if (finished) return;
    const audio = audioRef.current;
    void play();
    return () => stopAudio(audio);
  }, [sentence, finished, play, stopAudio]);

  const mark = status => setStatuses(previous => { const copy = [...previous]; copy[index] = status; return copy; });
  function check(event) {
    event.preventDefault();
    if (composingRef.current || lockedRef.current || !heard || !normalizeDictation(answer)) return;
    lockedRef.current = true;
    playAttemptRef.current++;
    audioRef.current?.pause();
    const comparison = compareDictation(sentence.chinese, answer);
    recordStudioActivity('dictation', comparison.correct, sentence.id);
    setFeedback(comparison); mark(comparison.correct ? 'correct' : 'wrong');
    setResults(previous => [...previous, { sentence, answer, comparison }]);
  }

  function next() {
    playAttemptRef.current++;
    audioRef.current?.pause();
    if (index + 1 === sentences.length) setFinished(true);
    else setIndex(previous => previous + 1);
    setAnswer(''); setFeedback(null); setHeard(false); setPlaying(false); setAudioError('');
    lockedRef.current = false; composingRef.current = false;
  }
  function skip() { mark('skipped'); setSkipped(previous => previous + 1); next(); }

  function retry() {
    const review = shuffleSentences(missed.map(result => result.sentence));
    setSentences(review); setIndex(0); setResults([]); setStatuses([]); setSkipped(0);
    setAnswer(''); setFeedback(null); setHeard(false); setAudioError(''); setFinished(false);
    lockedRef.current = false; composingRef.current = false;
  }

  if (finished) {
    const correctCharacters = results.reduce((sum, result) => sum + result.comparison.correctCharacters, 0);
    const totalCharacters = results.reduce((sum, result) => sum + result.comparison.totalCharacters, 0);
    const correct = results.length - missed.length;
    return <section className="sentence-card dictation-session" aria-labelledby="dictation-results-title">
      <div className="tone-results-summary">
        {results.length > 0 && <ScoreRing correct={correct} total={results.length} />}
        <div><p className="sentence-eyebrow">Session complete</p><h2 id="dictation-results-title" ref={titleRef} tabIndex={-1}>{results.length ? `${correct} of ${results.length} sentences correct` : 'No answers checked'}</h2>
          {results.length > 0 && <p>{Math.round(correctCharacters / totalCharacters * 100)}% of characters right</p>}
          {skipped > 0 && <p className="sentence-muted">{skipped} skipped</p>}</div>
      </div>
      {missed.length > 0 && <ul className="dictation-review">{missed.map(result => <li key={result.sentence.id}>
        <SentenceText sentence={result.sentence} />
        <span className="dictation-review-yours">You wrote <s lang="zh-CN">{result.answer}</s> · {result.comparison.accuracy}%</span>
        <small>{result.sentence.english}</small>
      </li>)}</ul>}
      <div className="sentence-actions">
        {missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry missed</button>}
        <button className={missed.length ? 'sentence-secondary' : 'sentence-primary'} onClick={onRestart}>New round</button>
        <button className="sentence-secondary" onClick={onExit}>All topics</button>
      </div>
    </section>;
  }

  return <section className="sentence-card tone-stage dictation-session" aria-labelledby="dictation-question-title">
    <div className="tone-topbar"><span className="tone-count">{index + 1} / {sentences.length}</span></div>
    <ProgressDots total={sentences.length} current={index} statuses={statuses} />
    <h2 id="dictation-question-title" ref={titleRef} tabIndex={-1} className="tone-question">Listen, then write what you hear.</h2>
    <audio key={sentence.id} ref={audioRef} src={mediaUrl(sentence.audioUrl)} preload="none" onPlaying={() => { setHeard(true); setPlaying(true); setAudioError(''); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('This recording is unavailable. Try again or skip it.'); }} />
    <div className="tone-listen dictation-listen">
      <PlayButton playing={playing} onClick={() => play(1)} label="Play recording" />
      <SlowButton onClick={() => play(0.75)} />
    </div>
    {audioError && <div className="tone-alert" role="alert"><p>{audioError}</p>{!feedback && <button type="button" className="tone-skip" onClick={skip}>Skip this recording →</button>}</div>}
    <form className="dictation-form" onSubmit={check}>
      <label className="tone-visually-hidden" htmlFor="dictation-answer">Your answer in Chinese characters</label>
      <textarea id="dictation-answer" lang="zh-CN" value={answer} disabled={Boolean(feedback)} maxLength={200} rows={2} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="用中文写…" aria-describedby="dictation-input-help" onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }} onChange={event => setAnswer(event.target.value)} />
      <p id="dictation-input-help" className="dictation-hint">Use your Chinese keyboard · spaces and punctuation aren’t graded</p>
      {!feedback && <button className="sentence-primary dictation-check" type="submit" disabled={!heard || !normalizeDictation(answer)}>Check answer</button>}
    </form>
    {feedback && <><DictationFeedback sentence={sentence} comparison={feedback} /><button ref={nextRef} className="sentence-primary dictation-check" onClick={next}>{index + 1 === sentences.length ? 'See results' : 'Next →'}</button></>}
  </section>;
}
