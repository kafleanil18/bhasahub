import { recordStudioActivity } from './recordStudioActivity';
import { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import SentenceText, { PinyinText } from './SentenceText';
import { isCorrectSentence, sentenceTiles, shuffleSentences } from './sentenceQuiz';

export default function SentenceSession({ initialSentences, onExit, onMastered }) {
  const [sentences, setSentences] = useState(initialSentences);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [missed, setMissed] = useState([]);
  const [finished, setFinished] = useState(false);
  const [tiles, setTiles] = useState(() => sentenceTiles(initialSentences[0]));
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef(null);
  const titleRef = useRef(null);
  const lockedRef = useRef(false);
  const playbackRef = useRef(0);
  const feedbackRef = useRef(null);
  const sentence = sentences[index];

  useEffect(() => { titleRef.current?.focus(); }, [index, finished, sentences]);
  useEffect(() => {
    if (!feedback) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    feedbackRef.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }, [feedback]);
  useEffect(() => {
    const audio = audioRef.current;
    return () => { audio?.pause(); };
  }, [sentence, finished]);

  function check() {
    if (lockedRef.current || selected.length !== tiles.length) return;
    lockedRef.current = true;
    const correct = isCorrectSentence(sentence, selected.map(id => sentence.tokens[id]));
    setFeedback(correct ? 'correct' : 'incorrect');
    if (correct) onMastered(sentence.id);
    else setMissed(previous => [...previous, sentence]);
    void listen();
    recordStudioActivity('sentences', correct, sentence.id);
  }

  function advance() {
    if (!lockedRef.current) return;
    playbackRef.current++;
    audioRef.current?.pause();
    if (index === sentences.length - 1) setFinished(true);
    else { setIndex(index + 1); setTiles(sentenceTiles(sentences[index + 1])); }
    setSelected([]);
    setFeedback(null);
    setAudioError('');
    lockedRef.current = false;
  }

  function retry() {
    const review = shuffleSentences(missed);
    setSentences(review);
    setTiles(sentenceTiles(review[0]));
    setIndex(0);
    setMissed([]);
    setSelected([]);
    setFeedback(null);
    setFinished(false);
    setAudioError('');
    lockedRef.current = false;
  }

  async function listen() {
    const audio = audioRef.current;
    if (!audio || !lockedRef.current) return;
    const attempt = ++playbackRef.current;
    setAudioError('');
    audio.pause();
    audio.currentTime = 0;
    try { await audio.play(); }
    catch {
      if (audioRef.current === audio && attempt === playbackRef.current) setAudioError('Could not play the recording. Tap Replay sentence to try again.');
    }
  }

  const removeLast = () => setSelected(previous => previous.slice(0, -1));

  if (finished) {
    const correct = sentences.length - missed.length;
    const pct = Math.round(correct / sentences.length * 100);
    return <section className="sentence-card sentence-results sb-results" aria-labelledby="sentence-results-title">
      <div className="sb-results-summary">
        <div className="sb-score" aria-hidden="true" style={{ '--pct': pct }}><span><strong>{pct}%</strong><small>correct</small></span></div>
        <div><p className="sentence-eyebrow">Session complete</p>
          <h2 id="sentence-results-title" tabIndex={-1} ref={titleRef}>{correct} of {sentences.length} correct</h2>
          <p>{missed.length ? 'A little more practice will help these sentences stick.' : 'Well done! You built every sentence correctly.'}</p></div>
      </div>
      {missed.length > 0 && <><h3 className="sb-review-title">Sentences to review</h3><ul className="sentence-review sb-review">{missed.map(item => <li key={item.id}><SentenceText sentence={item} /><span>{item.english}</span></li>)}</ul></>}
      <div className="sentence-actions">{missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry {missed.length} missed sentences</button>}<button className="sentence-secondary" onClick={onExit}>Choose a topic</button></div>
    </section>;
  }

  // On a wrong answer, mark each placed word against the main correct order.
  const placement = feedback === 'incorrect' ? selected.map((id, position) => sentence.tokens[id] === sentence.tokens[position]) : null;
  const remaining = tiles.length - selected.length;
  return <section className="sentence-card sb-session" aria-labelledby="sentence-prompt">
    <div className="sentence-progress"><span>Sentence {index + 1} of {sentences.length}</span><span>HSK 1 · #{String(sentence.number).padStart(3, '0')}</span></div>
    <ol className="sb-steps" aria-hidden="true">{sentences.map((item, i) => <li key={item.id} className={i < index ? 'is-done' : i === index ? 'is-current' : ''} />)}</ol>
    <p className="sentence-eyebrow sb-eyebrow">Build the sentence</p>
    <h2 id="sentence-prompt" tabIndex={-1} ref={titleRef} className="sb-prompt">{sentence.english}</h2>
    <div className={`sentence-answer sb-answer${feedback ? ` ${feedback}` : ''}`} role="group" aria-label="Your sentence">
      {selected.map((id, position) => <button key={id} lang="zh-CN" className={`sentence-tile sb-placed${placement ? placement[position] ? ' is-right' : ' is-wrong' : ''}`} disabled={Boolean(feedback)} aria-label={`Remove word ${position + 1}: ${sentence.tokens[id]}`} onClick={() => setSelected(previous => previous.filter(value => value !== id))}><PinyinText text={sentence.tokens[id]} readings={sentence.tokenPinyin?.[id]} /></button>)}
      {!feedback && Array.from({ length: remaining }, (_, i) => <span key={`slot-${i}`} className={`sb-slot${i === 0 ? ' is-next' : ''}`} aria-hidden="true">{selected.length + i + 1}</span>)}
      <span className="sentence-punctuation" aria-hidden="true">{sentence.chinese.endsWith('？') ? '？' : '。'}</span>
    </div>
    {!feedback && <p className="sentence-muted sb-hint">{selected.length === 0 ? `Tap the ${tiles.length} words below in order.` : remaining ? `${remaining} more ${remaining === 1 ? 'word' : 'words'} to go · tap a placed word to take it back.` : 'All words placed. Check your sentence!'}</p>}
    {!feedback && <div className="sentence-bank sb-bank" role="group" aria-label="Available words">
      {tiles.map(tile => <button key={tile.id} className="sentence-tile" lang="zh-CN" aria-label={tile.text} disabled={Boolean(feedback) || selected.includes(tile.id)} onClick={() => setSelected(previous => previous.includes(tile.id) ? previous : [...previous, tile.id])}><PinyinText text={tile.text} readings={sentence.tokenPinyin?.[tile.id]} /></button>)}
    </div>}
    {feedback && <div ref={feedbackRef} className={`sentence-feedback sb-feedback ${feedback}`} role="status">
      <h3 className="sentence-result-heading">
        <svg className="sentence-result-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="16" cy="16" r="14" />
          {feedback === 'correct' ? <path d="m9 16 5 5 9-10" /> : <path d="m11 11 10 10m0-10L11 21" />}
        </svg>
        <span>{feedback === 'correct' ? 'Correct — nicely done!' : 'Incorrect — check the word order'}</span>
      </h3>
      {feedback === 'incorrect' && <p>Compare your answer with this correct sentence:</p>}
      <p className="sentence-chinese"><SentenceText sentence={sentence} /></p>
      <p className="sb-explanation"><span aria-hidden="true">💡 </span>{sentence.explanation}</p>
      {sentence.audioUrl ? <div className="sentence-recording sb-recording"><button className="sentence-secondary" onClick={listen}>▷ Replay sentence</button>{audioError && <p role="alert" className="sb-audio-error">{audioError}</p>}</div> : <p className="sentence-muted sentence-recording">Audio has not been added for this sentence yet.</p>}
    </div>}
    {sentence.audioUrl && <audio key={sentence.id} ref={audioRef} src={mediaUrl(sentence.audioUrl)} preload="none" onError={() => setAudioError('The recording is unavailable. Please try again later.')} />}
    <div className="sb-actionbar">
      {!feedback ? <>
        <button className="sentence-secondary sb-icon-action" disabled={!selected.length} onClick={removeLast} aria-label="Undo last word" title="Undo last word"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 14 4 9l5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg></button>
        <button className="sentence-secondary" disabled={!selected.length} onClick={() => setSelected([])}>Clear</button>
        <button className="sentence-primary sb-main-action" disabled={selected.length !== tiles.length} onClick={check}>Check sentence</button>
      </> : <button className={`sentence-primary sb-main-action${feedback === 'correct' ? ' is-correct' : ''}`} onClick={advance}>{index === sentences.length - 1 ? 'See results' : 'Next sentence →'}</button>}
    </div>
  </section>;
}
