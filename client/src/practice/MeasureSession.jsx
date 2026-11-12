import { recordStudioActivity } from './recordStudioActivity';
import { useEffect, useRef, useState } from 'react';
import { MEASURE_GROUPS, isCorrectMeasure } from './measureQuiz';
import { shuffleSentences } from './sentenceQuiz';
import SentenceText, { PinyinText } from './SentenceText';
import useNumberSpeech from './useNumberSpeech';

export default function MeasureSession({ initialQuestions, voice, onExit }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState(null);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const lockedRef = useRef(false), titleRef = useRef(null);
  const question = questions[index];
  const { play, reset, error } = useNumberSpeech(voice);
  const missed = results.filter(result => !result.correct);
  const correct = selection !== null && isCorrectMeasure(question, selection);
  useEffect(() => { titleRef.current?.focus(); }, [index, questions, finished]);

  function choose(word) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    recordStudioActivity('measures', isCorrectMeasure(question, word), question.id);
    setSelection(word);
    setResults(previous => [...previous,{ question, selected:word, correct:isCorrectMeasure(question,word) }]);
    if (voice) play(question.chinese);
  }
  function next() {
    reset();
    if (index + 1 === questions.length) setFinished(true);
    else setIndex(previous => previous + 1);
    setSelection(null); lockedRef.current = false;
  }
  function retry() {
    reset(); setQuestions(shuffleSentences(missed.map(result => ({ ...result.question, options:shuffleSentences(result.question.options) }))));
    setIndex(0); setResults([]); setSelection(null); setFinished(false); lockedRef.current = false;
  }
  if (finished) return <section className="sentence-card measure-session" aria-labelledby="measure-results-title">
    <p className="sentence-eyebrow">Round complete</p><h2 ref={titleRef} tabIndex={-1} id="measure-results-title">{results.length - missed.length} of {results.length} correct</h2>
    <p>{missed.length ? 'Review the word pairs, then give the missed phrases another try.' : 'Well done! You chose every measure word correctly.'}</p>
    {missed.length > 0 && <ul className="sentence-review">{missed.map(result => <li key={result.question.id}><SentenceText sentence={result.question} /><span>{result.question.english}</span><span>You chose {result.selected}. Correct: {result.question.measure}.</span></li>)}</ul>}
    <div className="sentence-actions">{missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry missed phrases</button>}<button className="sentence-secondary" onClick={onExit}>Choose another topic</button></div>
  </section>;
  return <section className="sentence-card measure-session" aria-labelledby="measure-question-title">
    <div className="sentence-progress"><span>Question {index + 1} of {questions.length}</span><span>Measure words</span></div><progress value={index} max={questions.length} aria-label="Questions completed" />
    <h2 id="measure-question-title" ref={titleRef} tabIndex={-1}>Choose the missing measure word.</h2><p className="measure-meaning">{question.english}</p>
    <div className={`measure-prompt${selection !== null ? correct ? ' correct' : ' incorrect' : ''}`} aria-label="Phrase to complete">
      {selection === null ? <><PinyinText text={question.quantity} readings={question.quantityPinyin} /><span className="measure-gap" aria-label="Missing measure word">?</span><PinyinText text={question.noun} readings={question.nounPinyin} /></> : <SentenceText sentence={question} />}
    </div>
    <div className="measure-options" role="group" aria-label="Choose a measure word">{question.options.map(word => {
      const group = MEASURE_GROUPS.find(group => group.word === word);
      return <button key={word} className={`measure-option${selection !== null && word === question.measure ? ' correct' : ''}${selection === word && word !== question.measure ? ' incorrect' : ''}`} aria-label={word} aria-pressed={selection === word} disabled={selection !== null} onClick={() => choose(word)}><PinyinText text={word} readings={[group.pinyin]} />{selection !== null && (word === question.measure ? <small>✓ Correct</small> : word === selection ? <small>✕ Your choice</small> : null)}</button>;
    })}</div>
    {selection !== null && <>
      <div className={`measure-feedback ${correct ? 'correct' : 'incorrect'}`} role="status"><h3>{correct ? '✓ Correct — nicely done!' : `✕ Incorrect — use ${question.measure} here`}</h3><p>{question.explanation}</p><p>{question.english}</p></div>
      {voice && <div className="sentence-actions"><button className="sentence-secondary" onClick={() => play(question.chinese)}>▷ Listen to the phrase</button><button className="sentence-secondary" onClick={() => play(question.chinese,0.75)}>Slow · 0.75×</button></div>}
      {error && <p className="sentence-error" role="alert">Audio could not play. You can replay it or continue practicing with the pinyin.</p>}
      <button className="sentence-primary" onClick={next}>{index + 1 === questions.length ? 'See results' : 'Next phrase →'}</button>
    </>}
  </section>;
}
