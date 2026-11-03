import { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
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
  const sentence = sentences[index];

  useEffect(() => { titleRef.current?.focus(); }, [index, finished, sentences]);
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
  }

  function advance() {
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
    if (!audio) return;
    setAudioError('');
    audio.pause();
    audio.currentTime = 0;
    try { await audio.play(); }
    catch { setAudioError('Could not play the recording. Please try again.'); }
  }

  if (finished) return <section className="sentence-card sentence-results" aria-labelledby="sentence-results-title">
    <p className="sentence-eyebrow">Session complete</p>
    <h2 id="sentence-results-title" tabIndex={-1} ref={titleRef}>{sentences.length - missed.length} of {sentences.length} correct</h2>
    <p>{missed.length ? 'A little more practice will help these sentences stick.' : 'Well done! You built every sentence correctly.'}</p>
    {missed.length > 0 && <ul className="sentence-review">{missed.map(item => <li key={item.id}><span lang="zh-CN">{item.chinese}</span><span>{item.english}</span></li>)}</ul>}
    <div className="sentence-actions">{missed.length > 0 && <button className="sentence-primary" onClick={retry}>Retry {missed.length} missed sentences</button>}<button className="sentence-secondary" onClick={onExit}>Choose a topic</button></div>
  </section>;

  return <section className="sentence-card" aria-labelledby="sentence-prompt">
    <div className="sentence-progress"><span>Sentence {index + 1} of {sentences.length}</span><span>HSK 1 · #{String(sentence.number).padStart(3, '0')}</span></div>
    <progress value={index} max={sentences.length} aria-label="Sentences completed" />
    <p className="sentence-eyebrow">Build the sentence</p>
    <h2 id="sentence-prompt" tabIndex={-1} ref={titleRef}>{sentence.english}</h2>
    <p className="sentence-muted">Tap the words in order. Tap a word in your answer to put it back.</p>
    <div className="sentence-answer" role="group" aria-label="Your sentence">
      {selected.length === 0 && <span className="sentence-muted">Your sentence starts here…</span>}
      {selected.map((id, position) => <button key={id} lang="zh-CN" className="sentence-tile" disabled={Boolean(feedback)} aria-label={`Remove word ${position + 1}: ${sentence.tokens[id]}`} onClick={() => setSelected(previous => previous.filter(value => value !== id))}>{sentence.tokens[id]}</button>)}
      <span className="sentence-punctuation" aria-hidden="true">{sentence.chinese.endsWith('？') ? '？' : '。'}</span>
    </div>
    <div className="sentence-bank" role="group" aria-label="Available words">
      {tiles.map(tile => <button key={tile.id} className="sentence-tile" lang="zh-CN" disabled={Boolean(feedback) || selected.includes(tile.id)} onClick={() => setSelected(previous => previous.includes(tile.id) ? previous : [...previous, tile.id])}>{tile.text}</button>)}
    </div>
    {!feedback && <div className="sentence-actions"><button className="sentence-primary" disabled={selected.length !== tiles.length} onClick={check}>Check sentence</button><button className="sentence-secondary" disabled={!selected.length} onClick={() => setSelected([])}>Clear</button></div>}
    {feedback && <div className={`sentence-feedback ${feedback}`} role="status">
      <h3>{feedback === 'correct' ? 'Correct — nicely done!' : 'Here is one correct order'}</h3>
      <p className="sentence-chinese" lang="zh-CN">{sentence.chinese}</p>
      <p lang="zh-Latn">{sentence.pinyin}</p>
      <p>{sentence.explanation}</p>
    </div>}
    {sentence.audioUrl ? <div className="sentence-recording"><audio ref={audioRef} src={mediaUrl(sentence.audioUrl)} preload="none" onError={() => setAudioError('The recording is unavailable. Please try again later.')} /><button className="sentence-secondary" onClick={listen}>▷ Listen to the sentence</button>{audioError && <p role="alert" className="sentence-error">{audioError}</p>}</div> : <p className="sentence-muted sentence-recording">Audio has not been added for this sentence yet.</p>}
    {feedback && <button className="sentence-primary" onClick={advance}>{index === sentences.length - 1 ? 'See results' : 'Next sentence →'}</button>}
  </section>;
}
