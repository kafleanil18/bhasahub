import { recordStudioActivity } from './recordStudioActivity';
import { useEffect, useRef, useState } from 'react';
import { MEASURE_GROUPS, isCorrectMeasure } from './measureQuiz';
import { shuffleSentences } from './sentenceQuiz';
import SentenceText, { PinyinText } from './SentenceText';
import useNumberSpeech from './useNumberSpeech';
import { PlayButton, ProgressDots, ScoreRing, SlowButton } from './ToneVisuals';

const groupFor = word => MEASURE_GROUPS.find(group => group.word === word);

// speaker is the page's Mandarin speaker (female or male voice), or null when nothing can speak.
export default function MeasureSession({ initialQuestions, speaker, onRestart, onExit }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState(null);
  const [results, setResults] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [finished, setFinished] = useState(false);
  const lockedRef = useRef(false), titleRef = useRef(null), nextRef = useRef(null);
  const question = questions[index];
  const { play, reset, error, playing } = useNumberSpeech(speaker);
  const missed = results.filter(result => !result.correct);
  const answered = selection !== null;
  const correct = answered && isCorrectMeasure(question, selection);
  useEffect(() => { titleRef.current?.focus(); }, [index, questions, finished]);
  useEffect(() => { if (answered) nextRef.current?.focus(); }, [answered]);

  function choose(word) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    const right = isCorrectMeasure(question, word);
    recordStudioActivity('measures', right, question.id);
    setSelection(word);
    setStatuses(previous => { const copy = [...previous]; copy[index] = right ? 'correct' : 'wrong'; return copy; });
    setResults(previous => [...previous, { question, selected: word, correct: right }]);
    if (speaker) play(question.chinese);
  }
  function next() {
    reset();
    if (index + 1 === questions.length) setFinished(true);
    else setIndex(previous => previous + 1);
    setSelection(null); lockedRef.current = false;
  }
  function retry() {
    reset(); setQuestions(shuffleSentences(missed.map(result => ({ ...result.question, options: shuffleSentences(result.question.options) }))));
    setIndex(0); setResults([]); setStatuses([]); setSelection(null); setFinished(false); lockedRef.current = false;
  }

  if (finished) {
    const score = results.length - missed.length;
    return <section className="sentence-card measure-session" aria-labelledby="measure-results-title">
      <div className="tone-results-summary">
        <ScoreRing correct={score} total={results.length} />
        <div><p className="sentence-eyebrow">Round complete</p><h2 ref={titleRef} tabIndex={-1} id="measure-results-title">{score} of {results.length} correct</h2>
          <p>{missed.length ? 'Review these, then try the missed phrases again.' : 'Well done! You chose every measure word correctly.'}</p></div>
      </div>
      {missed.length > 0 && <ul className="measure-review">{missed.map(result => <li key={result.question.id}>
        <span className="measure-review-phrase"><SentenceText sentence={result.question} /><small>{result.question.english}</small></span>
        <span className="measure-review-answers"><s lang="zh-CN">{result.selected}</s><strong lang="zh-CN">{result.question.measure}</strong></span>
      </li>)}</ul>}
      <div className="sentence-actions">
        {missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry missed</button>}
        <button className={missed.length ? 'sentence-secondary' : 'sentence-primary'} onClick={onRestart}>New round</button>
        <button className="sentence-secondary" onClick={onExit}>All topics</button>
      </div>
    </section>;
  }

  const shown = answered ? question.measure : null;
  return <section className="sentence-card tone-stage measure-session" aria-labelledby="measure-question-title">
    <div className="tone-topbar"><span className="tone-count">{index + 1} / {questions.length}</span></div>
    <ProgressDots total={questions.length} current={index} statuses={statuses} />
    <h2 id="measure-question-title" ref={titleRef} tabIndex={-1} className="tone-visually-hidden">Choose the missing measure word.</h2>
    <p className="measure-meaning">{question.english}</p>
    <div className={`measure-prompt${answered ? correct ? ' correct' : ' incorrect' : ''}`} aria-label="Phrase to complete" lang="zh-CN">
      <PinyinText text={question.quantity} readings={question.quantityPinyin} />
      <span className="measure-gap" aria-label={shown ? `Measure word ${shown}` : 'Missing measure word'}>{shown ? <PinyinText text={shown} readings={[question.tokenPinyin[1][0]]} /> : '?'}</span>
      <PinyinText text={question.noun} readings={question.nounPinyin} />
    </div>
    <div className="measure-options" role="group" aria-label="Choose a measure word">{question.options.map(word => {
      const isAnswer = answered && word === question.measure, isWrong = selection === word && word !== question.measure;
      return <button key={word} className={`measure-option${isAnswer ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`} aria-label={word} aria-pressed={selection === word} disabled={answered} onClick={() => choose(word)}>
        <PinyinText text={word} readings={[groupFor(word).pinyin]} />
      </button>;
    })}</div>
    {answered && <>
      <div className={`measure-feedback ${correct ? 'correct' : 'incorrect'}`} role="status">
        <div className="measure-feedback-head"><span className="tone-feedback-icon" aria-hidden="true">{correct ? '✓' : '✕'}</span><h3>{correct ? 'Correct!' : `Use ${question.measure} here`}</h3>
          {speaker && <span className="measure-listen"><PlayButton playing={playing} onClick={() => play(question.chinese)} label="Listen to the phrase" /><SlowButton onClick={() => play(question.chinese, 0.75)} /></span>}</div>
        <p>{question.explanation}</p>
      </div>
      {error && <p className="tone-alert" role="alert">Audio could not play. You can replay it or keep going.</p>}
      <button ref={nextRef} className="sentence-primary measure-next" onClick={next}>{index + 1 === questions.length ? 'See results' : 'Next'}</button>
    </>}
  </section>;
}
