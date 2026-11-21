import { recordStudioActivity } from './recordStudioActivity';
import { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import useAnswerSound from './useAnswerSound';
import { AdvanceBar, PlayButton, ProgressDots, ScoreRing, SlowButton } from './ToneVisuals';

export default function ListeningSession({ initialQuestions, onRestart, onExit }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [finished, setFinished] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const feedbackSound = useAnswerSound(true);
  const audioRef = useRef(null);
  const answeredRef = useRef(false);
  const titleRef = useRef(null);
  const nextRef = useRef(null);
  const question = questions[index];
  const checked = selection !== null;
  const correct = checked && selection === question.answer;

  useEffect(() => { titleRef.current?.focus(); }, [index, finished]);
  useEffect(() => { if (checked && !correct) nextRef.current?.focus(); }, [checked, correct]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || finished) return;
    let cancelled = false;
    audio.play().catch(error => {
      if (!cancelled) setAudioError(error.name === 'NotAllowedError'
        ? 'Automatic playback was blocked. Tap play to hear the recording.'
        : 'This recording could not play. Check your connection and try again.');
    });
    return () => { cancelled = true; audio.pause(); };
  }, [question, finished]);

  function next() {
    answeredRef.current = false;
    audioRef.current?.pause();
    if (index === questions.length - 1) setFinished(true);
    else setIndex(previous => previous + 1);
    setSelection(null); setHeard(false); setPlaying(false); setAudioError('');
  }
  // Correct answers move on by themselves; wrong answers wait for Next.
  const advanceRef = useRef(next);
  useEffect(() => { advanceRef.current = next; });
  useEffect(() => {
    if (!correct || finished) return;
    const timer = window.setTimeout(() => advanceRef.current(), 1100);
    return () => window.clearTimeout(timer);
  }, [correct, finished, index]);

  async function play(rate) {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioError(''); audio.pause(); audio.currentTime = 0; audio.playbackRate = rate;
    try { await audio.play(); }
    catch { setPlaying(false); setAudioError('This recording could not play. Check your connection and try again.'); }
  }
  function choose(option) {
    if (!heard || answeredRef.current) return;
    answeredRef.current = true;
    feedbackSound.prepare();
    audioRef.current?.pause();
    setSelection(option);
    const right = option === question.answer;
    setStatuses(previous => { const copy = [...previous]; copy[index] = right ? 'correct' : 'wrong'; return copy; });
    recordStudioActivity('listening', right, String(question._id));
    feedbackSound.play(right);
    if (!right) setMistakes(previous => [...previous, question]);
  }
  function retry() {
    answeredRef.current = false;
    setQuestions(mistakes); setMistakes([]); setStatuses([]); setIndex(0);
    setSelection(null); setFinished(false); setHeard(false); setAudioError('');
  }

  if (finished) {
    const score = questions.length - mistakes.length;
    return <section className="sentence-card listening-session" aria-labelledby="listening-result-title">
      <div className="tone-results-summary">
        <ScoreRing correct={score} total={questions.length} />
        <div><p className="sentence-eyebrow">Practice complete</p><h2 id="listening-result-title" ref={titleRef} tabIndex={-1}>{score} of {questions.length} correct</h2>
          <p>{mistakes.length ? `${mistakes.length} word${mistakes.length === 1 ? '' : 's'} to practise again.` : 'You recognized every word. Well done!'}</p></div>
      </div>
      {mistakes.length > 0 && <ul className="listening-review">{mistakes.map(word => <li key={word._id || word.word}>
        <span lang="zh-CN" className="listening-review-word">{word.word}</span><span className="listening-review-pinyin">{word.pronunciation}</span><strong>{word.answer}</strong>
      </li>)}</ul>}
      <div className="sentence-actions">
        {mistakes.length > 0 && <button className="sentence-primary" onClick={retry}>Retry missed</button>}
        <button className={mistakes.length ? 'sentence-secondary' : 'sentence-primary'} onClick={onRestart}>New round</button>
        <button className="sentence-secondary" onClick={onExit}>All lessons</button>
      </div>
    </section>;
  }

  return <section className="sentence-card tone-stage listening-session" aria-labelledby="listening-question-title">
    <div className="tone-topbar"><span className="tone-count">{index + 1} / {questions.length}</span></div>
    <ProgressDots total={questions.length} current={index} statuses={statuses} />
    <h2 id="listening-question-title" ref={titleRef} tabIndex={-1} className="tone-question">Listen. What does it mean?</h2>
    <audio key={`${index}-${question.word}`} ref={audioRef} src={mediaUrl(question.audioUrl)} preload="auto" onPlaying={() => { setPlaying(true); setHeard(true); setAudioError(''); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('The recording is unavailable. Try playing it again, or choose another lesson.'); }} />
    <div className="tone-listen listening-listen">
      <PlayButton playing={playing} onClick={() => play(1)} label="Play recording" />
      <SlowButton onClick={() => play(0.75)} />
    </div>
    {checked && <p className="listening-word" lang="zh-CN">{question.word}<span>{question.pronunciation}</span></p>}
    {audioError && <p className="tone-alert" role="alert">{audioError}</p>}
    <fieldset disabled={checked || !heard} className={`listening-options${checked ? ' has-result' : ''}`}>
      <legend className="tone-visually-hidden">Choose the meaning of the recording</legend>
      {question.options.map(option => {
        const isAnswer = checked && option === question.answer, isWrong = selection === option && option !== question.answer;
        return <label key={option} className={`listening-option${isAnswer ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}>
          <input type="radio" name="meaning" value={option} checked={selection === option} onChange={() => choose(option)} />
          <span>{option}</span>
        </label>;
      })}
    </fieldset>
    {checked && <div className={`listening-feedback ${correct ? 'correct' : 'incorrect'}`} role="status">
      <span className="tone-feedback-icon" aria-hidden="true">{correct ? '✓' : '✕'}</span>
      <div><h3>{correct ? 'Correct!' : 'Not quite'}</h3><p><span lang="zh-CN">{question.word}</span> · {question.pronunciation} · {question.answer}</p></div>
      {correct && <AdvanceBar duration={1100} />}
    </div>}
    {checked && !correct && <button ref={nextRef} className="sentence-primary listening-next" onClick={next}>{index === questions.length - 1 ? 'See results' : 'Next →'}</button>}
  </section>;
}
