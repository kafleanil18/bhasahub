import { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';

export default function ListeningSession({ initialQuestions, onRestart }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState(null);
  const [checked, setChecked] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [finished, setFinished] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const audioRef = useRef(null);
  const titleRef = useRef(null);
  const question = questions[index];
  const correctCount = questions.length - mistakes.length;
  const correctPercent = Math.round(correctCount / questions.length * 100);

  useEffect(() => {
    titleRef.current?.focus();
  }, [index, finished]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => { if (audio) { audio.pause(); } };
  }, [question, finished]);

  async function play(rate) {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioError('');
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = rate;
    try { await audio.play(); }
    catch { setPlaying(false); setAudioError('This recording could not play. Check your connection and try again.'); }
  }

  function checkAnswer(event) {
    event.preventDefault();
    if (selection === null || checked) return;
    setChecked(true);
    if (selection !== question.answer) setMistakes(previous => [...previous, question]);
  }

  function next() {
    audioRef.current?.pause();
    if (index === questions.length - 1) setFinished(true);
    else setIndex(previous => previous + 1);
    setSelection(null);
    setChecked(false);
    setHeard(false);
    setPlaying(false);
    setAudioError('');
  }

  function retry() {
    setQuestions(mistakes);
    setMistakes([]);
    setIndex(0);
    setSelection(null);
    setChecked(false);
    setFinished(false);
    setHeard(false);
    setAudioError('');
  }

  if (finished) return (
    <section className="listening-card listening-results" aria-labelledby="listening-result-title">
      <h2 id="listening-result-title" ref={titleRef} tabIndex={-1}>Practice complete</h2>
      <p className="listening-score">{questions.length - mistakes.length}<span> / {questions.length}</span></p>
      <div className="listening-result-breakdown" role="group" aria-label="Answer breakdown">
        <div className="listening-result-bar" role="img" aria-label={`${correctCount} correct (${correctPercent}%), ${mistakes.length} incorrect (${100 - correctPercent}%)`}>
          <span className="listening-result-correct" style={{ flexGrow: correctCount }} />
          <span className="listening-result-incorrect" style={{ flexGrow: mistakes.length }} />
        </div>
        <div className="listening-result-labels">
          <span><i className="listening-result-dot listening-result-correct" aria-hidden="true" />Correct <strong>{correctCount}</strong> · {correctPercent}%</span>
          <span><i className="listening-result-dot listening-result-incorrect" aria-hidden="true" />Incorrect <strong>{mistakes.length}</strong> · {100 - correctPercent}%</span>
        </div>
      </div>
      <p>{mistakes.length ? `${mistakes.length} word${mistakes.length === 1 ? '' : 's'} to practice again.` : 'You recognized every word. Well done!'}</p>
      {mistakes.length > 0 && <ul className="listening-review">{mistakes.map((word, i) => <li key={i}><span className="zh">{word.word}</span> <span>{word.pronunciation}</span><strong>{word.answer}</strong></li>)}</ul>}
      <div className="listening-actions">
        {mistakes.length > 0 && <button className="listening-primary" onClick={retry}>Retry missed words</button>}
        <button className="listening-secondary" onClick={onRestart}>Choose another lesson</button>
      </div>
      <p className="listening-note">This score is for this practice session.</p>
    </section>
  );

  return (
    <section className="listening-card" aria-labelledby="listening-question-title">
      <div className="listening-progress-label"><span>Question {index + 1} of {questions.length}</span><span>{Math.round(index / questions.length * 100)}% complete</span></div>
      <progress value={index} max={questions.length} aria-label="Questions completed" />
      <h2 id="listening-question-title" ref={titleRef} tabIndex={-1}>Listen. What does it mean?</h2>
      <p className="listening-muted">Play the recording, then choose the matching meaning.</p>
      <audio key={index + '-' + question.word} ref={audioRef} src={mediaUrl(question.audioUrl)} preload="none" onPlaying={() => { setPlaying(true); setHeard(true); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('The recording is unavailable. Try playing it again, or choose another lesson.'); }} />
      <div className="listening-playback">
        <button className="listening-play" onClick={() => play(1)} aria-label="Play recording at normal speed"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 4v16l13-8z" /></svg>{playing ? 'Play again' : 'Listen'}</button>
        <button className="listening-secondary" onClick={() => play(0.75)}>Slow · 0.75×</button>
      </div>
      {audioError && <p className="listening-error" role="alert">{audioError}</p>}
      <form onSubmit={checkAnswer}>
        <fieldset disabled={checked} className="listening-options">
          <legend className="listening-sr-only">Choose the meaning of the recording</legend>
          {question.options.map((option, optionIndex) => <label key={option} className={`listening-option${selection === option ? ' is-selected' : ''}${checked && option === question.answer ? ' is-correct' : ''}${checked && option === selection && option !== question.answer ? ' is-wrong' : ''}`}>
            <input type="radio" name="meaning" value={option} checked={selection === option} onChange={() => setSelection(option)} />
            <span className="listening-option-letter" aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>
            {checked && option === question.answer && <strong className="listening-option-status">Correct answer</strong>}
            {checked && option === selection && option !== question.answer && <strong className="listening-option-status">Your answer</strong>}
          </label>)}
        </fieldset>
        {checked && <div className="listening-feedback" role="status"><strong>{selection === question.answer ? 'Correct!' : 'Keep practicing.'}</strong><p><span className="zh">{question.word}</span> · {question.pronunciation}</p><p>{question.answer}</p></div>}
        <div className="listening-actions">
          {checked ? <button type="button" className="listening-primary" onClick={next}>{index === questions.length - 1 ? 'See results' : 'Next word'}</button> : <button type="submit" className="listening-primary" disabled={selection === null || !heard}>Check answer</button>}
        </div>
      </form>
      {!heard && <p className="listening-note">Listen to the recording before checking your answer.</p>}
    </section>
  );
}
