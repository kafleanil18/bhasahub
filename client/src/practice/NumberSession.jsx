import { recordStudioActivity } from './recordStudioActivity';
import { useEffect, useRef, useState } from 'react';
import { NUMBER_MODES, checkNumberAnswer, typedNumberAnswer } from './numberQuiz';
import { shuffleSentences } from './sentenceQuiz';
import SentenceText from './SentenceText';
import NumberAnswerFields from './NumberAnswerFields';
import useNumberSpeech from './useNumberSpeech';

export default function NumberSession({ initialQuestions, voice, onExit }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [inputError, setInputError] = useState('');
  const [results, setResults] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [finished, setFinished] = useState(false);
  const titleRef = useRef(null), checkedRef = useRef(false);
  const question = questions[index];
  const mode = NUMBER_MODES.find(mode => mode.id === question.mode);
  const { heard, playing, error, reset, play, stop } = useNumberSpeech(voice);
  const missed = results.filter(result => !result.correct);

  useEffect(() => { titleRef.current?.focus(); }, [index, questions, finished]);
  useEffect(() => {
    if (finished) return;
    reset(); play(question.speech);
    return stop;
  }, [question, finished, reset, play, stop]);

  function check(event) {
    event.preventDefault();
    if (checkedRef.current || !heard) return;
    const result = checkNumberAnswer(question, answer);
    if (!result.valid) { setInputError(result.error); return; }
    checkedRef.current = true; stop(); setInputError('');
    recordStudioActivity('numbers', result.correct, question.id);
    setFeedback(result.correct ? 'correct' : 'incorrect');
    setResults(previous => [...previous, { question, correct: result.correct, typed: typedNumberAnswer(question, answer) }]);
  }
  function next() {
    reset();
    if (index + 1 === questions.length) setFinished(true);
    else setIndex(previous => previous + 1);
    setAnswer({}); setFeedback(null); setInputError(''); checkedRef.current = false;
  }
  function retry() {
    setQuestions(shuffleSentences(missed.map(result => result.question))); setIndex(0);
    setResults([]); setSkipped(0); setAnswer({}); setFeedback(null); setInputError(''); setFinished(false); checkedRef.current = false;
  }
  if (finished) return <section className="sentence-card number-session" aria-labelledby="number-results-title">
    <p className="sentence-eyebrow">Round complete</p><h2 id="number-results-title" ref={titleRef} tabIndex={-1}>{results.length ? `${results.length - missed.length} of ${results.length} correct` : 'No answers checked'}</h2>
    <p>{results.length && !missed.length ? 'You recognized every number. Well done!' : 'Replay and practice the questions you missed.'}</p>
    {skipped > 0 && <p>{skipped} question{skipped === 1 ? '' : 's'} skipped and excluded from your score.</p>}
    {missed.length > 0 && <ul className="sentence-review">{missed.map(result => <li key={result.question.id}><SentenceText sentence={result.question} /><span>Your answer: {result.typed}</span><strong>Correct: {result.question.display}</strong></li>)}</ul>}
    <div className="sentence-actions">{missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry missed questions</button>}<button className="sentence-secondary" onClick={onExit}>Choose another mode</button></div>
  </section>;
  return <section className="sentence-card number-session" aria-labelledby="number-question-title">
    <div className="sentence-progress"><span>Question {index + 1} of {questions.length}</span><span>{mode.title}</span></div><progress value={index} max={questions.length} aria-label="Questions completed" />
    <h2 id="number-question-title" ref={titleRef} tabIndex={-1}>{mode.question}</h2>
    <div className="sentence-actions"><button className="sentence-primary" onClick={() => play(question.speech)}>▷ Listen</button><button className="sentence-secondary" onClick={() => play(question.speech, 0.75)}>Slow · 0.75×</button></div>
    <p className="sentence-muted" role="status">{playing && !feedback ? 'Speaking…' : 'Replay as often as you need. The answer appears after you submit.'}</p>
    {error && <div className="sentence-error" role="alert"><p>{error}</p>{!feedback && <button className="sentence-secondary" onClick={() => { setSkipped(previous => previous + 1); next(); }}>Skip this question</button>}</div>}
    <form onSubmit={check}>
      <NumberAnswerFields question={question} answer={answer} onChange={setAnswer} disabled={Boolean(feedback)} />
      {question.mode === 'time' && <p className="sentence-muted">Use 24-hour time: for example, 3 PM is 15.</p>}
      {inputError && <p className="sentence-error" role="alert">{inputError}</p>}
      {!feedback && <button type="submit" className="sentence-primary" disabled={!heard}>Check answer</button>}
    </form>
    {feedback && <><div className={`number-feedback ${feedback}`} role="status"><h3>{feedback === 'correct' ? '✓ Correct — nicely done!' : '✕ Incorrect — listen and compare'}</h3><p className="number-correct-answer">{question.display}</p><p className="sentence-chinese"><SentenceText sentence={question} /></p><p>{question.explanation}</p></div><button className="sentence-primary" onClick={next}>{index + 1 === questions.length ? 'See results' : 'Next question →'}</button></>}
  </section>;
}
