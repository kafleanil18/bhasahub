import { recordStudioActivity } from './recordStudioActivity';
import { useEffect, useRef, useState } from 'react';
import { NUMBER_MODES, checkNumberAnswer, typedNumberAnswer } from './numberQuiz';
import { shuffleSentences } from './sentenceQuiz';
import SentenceText from './SentenceText';
import NumberAnswerFields from './NumberAnswerFields';
import useNumberSpeech from './useNumberSpeech';
import { PlayButton, ProgressDots, ScoreRing, SlowButton } from './ToneVisuals';

export default function NumberSession({ initialQuestions, voice, onRestart, onExit }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [inputError, setInputError] = useState('');
  const [results, setResults] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [finished, setFinished] = useState(false);
  const titleRef = useRef(null), checkedRef = useRef(false), nextRef = useRef(null);
  const question = questions[index];
  const mode = NUMBER_MODES.find(item => item.id === question.mode);
  const { heard, playing, error, reset, play, stop } = useNumberSpeech(voice);
  const missed = results.filter(result => !result.correct);

  useEffect(() => { titleRef.current?.focus(); }, [index, questions, finished]);
  useEffect(() => { if (feedback) nextRef.current?.focus(); }, [feedback]);
  useEffect(() => {
    if (finished) return;
    reset(); play(question.speech);
    return stop;
  }, [question, finished, reset, play, stop]);

  const mark = status => setStatuses(previous => { const copy = [...previous]; copy[index] = status; return copy; });
  function check(event) {
    event.preventDefault();
    if (checkedRef.current || !heard) return;
    const result = checkNumberAnswer(question, answer);
    if (!result.valid) { setInputError(result.error); return; }
    checkedRef.current = true; stop(); setInputError('');
    recordStudioActivity('numbers', result.correct, question.id);
    setFeedback(result.correct ? 'correct' : 'incorrect'); mark(result.correct ? 'correct' : 'wrong');
    setResults(previous => [...previous, { question, correct: result.correct, typed: typedNumberAnswer(question, answer) }]);
  }
  function next() {
    reset();
    if (index + 1 === questions.length) setFinished(true);
    else setIndex(previous => previous + 1);
    setAnswer({}); setFeedback(null); setInputError(''); checkedRef.current = false;
  }
  function skip() { mark('skipped'); setSkipped(previous => previous + 1); next(); }
  function retry() {
    setQuestions(shuffleSentences(missed.map(result => result.question))); setIndex(0); setStatuses([]);
    setResults([]); setSkipped(0); setAnswer({}); setFeedback(null); setInputError(''); setFinished(false); checkedRef.current = false;
  }

  if (finished) {
    const correct = results.length - missed.length;
    return <section className="sentence-card number-session number-results" aria-labelledby="number-results-title">
      <div className="tone-results-summary">
        {results.length > 0 && <ScoreRing correct={correct} total={results.length} />}
        <div><p className="sentence-eyebrow">Round complete</p><h2 id="number-results-title" ref={titleRef} tabIndex={-1}>{results.length ? `${correct} of ${results.length} correct` : 'No answers checked'}</h2>
          <p>{results.length && !missed.length ? 'You recognized every number. Well done!' : 'Replay the ones you missed.'}</p>
          {skipped > 0 && <p className="sentence-muted">{skipped} skipped</p>}</div>
      </div>
      {missed.length > 0 && <ul className="number-review">{missed.map(result => <li key={result.question.id}>
        <span className="number-review-chinese"><SentenceText sentence={result.question} /></span>
        <span className="number-review-answers"><s>{result.typed || '—'}</s><strong>{result.question.display}</strong></span>
      </li>)}</ul>}
      <div className="sentence-actions">
        {missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry missed</button>}
        <button className={missed.length ? 'sentence-secondary' : 'sentence-primary'} onClick={onRestart}>New round</button>
        <button className="sentence-secondary" onClick={onExit}>All modes</button>
      </div>
    </section>;
  }

  return <section className="sentence-card tone-stage number-session" aria-labelledby="number-question-title">
    <div className="tone-topbar"><span className="tone-count">{index + 1} / {questions.length}</span></div>
    <ProgressDots total={questions.length} current={index} statuses={statuses} />
    <h2 id="number-question-title" ref={titleRef} tabIndex={-1} className="tone-question">{mode.question}</h2>
    <div className="tone-listen number-listen">
      <PlayButton playing={playing && !feedback} onClick={() => play(question.speech)} label="Listen" />
      <SlowButton onClick={() => play(question.speech, 0.75)} />
    </div>
    {error && <div className="tone-alert" role="alert"><p>{error}</p>{!feedback && <button type="button" className="tone-skip" onClick={skip}>Skip this question →</button>}</div>}
    <form className="number-form" onSubmit={check}>
      <NumberAnswerFields question={question} answer={answer} onChange={setAnswer} disabled={Boolean(feedback)} />
      {question.mode === 'time' && <p className="number-hint">24-hour time · 3 PM is 15</p>}
      {inputError && <p className="tone-alert" role="alert">{inputError}</p>}
      {!feedback && <button type="submit" className="sentence-primary number-check" disabled={!heard}>Check answer</button>}
    </form>
    {feedback && <>
      <div className={`number-feedback ${feedback}`} role="status">
        <div className="number-feedback-head"><span className="tone-feedback-icon" aria-hidden="true">{feedback === 'correct' ? '✓' : '✕'}</span><h3>{feedback === 'correct' ? 'Correct!' : 'Not quite'}</h3></div>
        <p className="number-correct-answer">{question.display}</p>
        <p className="number-feedback-chinese"><SentenceText sentence={question} /></p>
        <p className="number-explain">{question.explanation}</p>
      </div>
      <button ref={nextRef} className="sentence-primary number-check" onClick={next}>{index + 1 === questions.length ? 'See results' : 'Next →'}</button>
    </>}
  </section>;
}
