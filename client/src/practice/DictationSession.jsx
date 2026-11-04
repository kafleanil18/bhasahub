import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import SentenceText from './SentenceText';
import DictationFeedback from './DictationFeedback';
import { compareDictation, normalizeDictation } from './dictationQuiz';
import { shuffleSentences } from './sentenceQuiz';

export default function DictationSession({ initialSentences, onExit }) {
  const [sentences, setSentences] = useState(initialSentences);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [finished, setFinished] = useState(false);
  const [heard, setHeard] = useState(false);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef(null);
  const titleRef = useRef(null);
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
  useEffect(() => {
    if (finished) return;
    const audio = audioRef.current;
    void play();
    return () => stopAudio(audio);
  }, [sentence, finished, play, stopAudio]);

  function check(event) {
    event.preventDefault();
    if (composingRef.current || lockedRef.current || !heard || !normalizeDictation(answer)) return;
    lockedRef.current = true;
    playAttemptRef.current++;
    audioRef.current?.pause();
    const comparison = compareDictation(sentence.chinese, answer);
    setFeedback(comparison);
    setResults(previous => [...previous, { sentence, answer, comparison }]);
  }

  function next() {
    playAttemptRef.current++;
    audioRef.current?.pause();
    if (index + 1 === sentences.length) setFinished(true);
    else setIndex(previous => previous + 1);
    setAnswer(''); setFeedback(null); setHeard(false); setAudioError('');
    lockedRef.current = false; composingRef.current = false;
  }

  function retry() {
    const review = shuffleSentences(missed.map(result => result.sentence));
    setSentences(review); setIndex(0); setResults([]); setSkipped(0);
    setAnswer(''); setFeedback(null); setHeard(false); setAudioError(''); setFinished(false);
    lockedRef.current = false; composingRef.current = false;
  }

  if (finished) {
    const correctCharacters = results.reduce((sum, result) => sum + result.comparison.correctCharacters, 0);
    const totalCharacters = results.reduce((sum, result) => sum + result.comparison.totalCharacters, 0);
    return <section className="sentence-card dictation-session" aria-labelledby="dictation-results-title">
      <p className="sentence-eyebrow">Session complete</p>
      <h2 id="dictation-results-title" ref={titleRef} tabIndex={-1}>{results.length ? `${results.length - missed.length} of ${results.length} sentences correct` : 'No answers checked'}</h2>
      {results.length > 0 && <p>{Math.round(correctCharacters / totalCharacters * 100)}% character accuracy across this session.</p>}
      {skipped > 0 && <p>{skipped} recording{skipped === 1 ? '' : 's'} skipped. Skipped recordings are not graded.</p>}
      {missed.length > 0 && <ul className="sentence-review">{missed.map(result => <li key={result.sentence.id}><SentenceText sentence={result.sentence} /><span>Your answer: <span lang="zh-CN">{result.answer}</span></span><span>{result.sentence.english}</span></li>)}</ul>}
      <div className="sentence-actions">{missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry missed sentences</button>}<button className="sentence-secondary" onClick={onExit}>Choose another topic</button></div>
    </section>;
  }

  return <section className="sentence-card dictation-session" aria-labelledby="dictation-question-title">
    <div className="sentence-progress"><span>Sentence {index + 1} of {sentences.length}</span><span>HSK 1 · Listening dictation</span></div>
    <progress value={index} max={sentences.length} aria-label="Sentences completed" />
    <h2 id="dictation-question-title" ref={titleRef} tabIndex={-1}>Listen, then write what you hear.</h2>
    <audio key={sentence.id} ref={audioRef} src={mediaUrl(sentence.audioUrl)} preload="none" onPlaying={() => { setHeard(true); setAudioError(''); }} onError={() => setAudioError('This recording is unavailable. Try again or skip it.')} />
    <div className="sentence-actions dictation-playback"><button className="sentence-primary" onClick={() => play(1)}>▷ Play recording</button><button className="sentence-secondary" onClick={() => play(0.75)}>Slow · 0.75×</button></div>
    <p className="sentence-muted">Replay as often as you need. The answer appears after you check your writing.</p>
    {audioError && <div className="sentence-error" role="alert"><p>{audioError}</p>{!feedback && <button className="sentence-secondary" onClick={() => { setSkipped(previous => previous + 1); next(); }}>Skip this recording</button>}</div>}
    <form onSubmit={check}>
      <label className="dictation-input-label" htmlFor="dictation-answer">Your answer in Chinese characters</label>
      <textarea id="dictation-answer" lang="zh-CN" value={answer} disabled={Boolean(feedback)} maxLength={200} rows={3} autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="dictation-input-help" onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }} onChange={event => setAnswer(event.target.value)} />
      <p id="dictation-input-help" className="sentence-muted">Use your Chinese keyboard. Spaces and punctuation are not graded.</p>
      {!feedback && <button className="sentence-primary" type="submit" disabled={!heard || !normalizeDictation(answer)}>Check answer</button>}
    </form>
    {feedback && <><DictationFeedback sentence={sentence} comparison={feedback} /><button className="sentence-primary" onClick={next}>{index + 1 === sentences.length ? 'See results' : 'Next sentence →'}</button></>}
  </section>;
}
