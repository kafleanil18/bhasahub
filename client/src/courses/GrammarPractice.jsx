import { useState } from 'react';
import { sentenceCharacters, shuffledTiles } from './grammarContent';

export function ReflectionQuestion({ question, number }) {
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);
  return (
    <article className="gs-reflection">
      <label htmlFor={`gs-answer-${number}`}><span className="gs-question-number">{String(number).split('-').at(-1)}</span>{question.prompt}</label>
      <textarea id={`gs-answer-${number}`} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write your answer here…" rows={2} />
      <button type="button" className="gs-text-button" aria-expanded={revealed} onClick={() => setRevealed(value => !value)}>{revealed ? 'Hide model answer' : 'Compare with the model'} <span aria-hidden="true">{revealed ? '−' : '+'}</span></button>
      {revealed && <div className="gs-model-answer"><strong>{question.answer}</strong><p>{question.explanation}</p><small>Other grammatically correct answers may also work.</small></div>}
    </article>
  );
}

function ReadingChallenge({ example, alternatives, onSuccess }) {
  const options = [...new Set([example.pinyin, ...alternatives.map(item => item.pinyin)])];
  const [choices] = useState(() => shuffledTiles(options));
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  function check() {
    const correct = selected === example.pinyin;
    setResult(correct ? 'correct' : 'incorrect');
    if (correct) onSuccess();
  }
  return <div className="gs-challenge">
    <p className="gs-eyebrow">Sound check</p><h4>Match the pronunciation.</h4>
    <p className="gs-reading-character zh">{example.chinese}</p>
    <fieldset className="gs-reading-options"><legend className="gs-sr-only">Choose the pinyin for {example.chinese}</legend>{choices.map(option => <label key={option.id} className={selected === option.text ? 'is-selected' : ''}><input type="radio" name="reading" value={option.text} checked={selected === option.text} onChange={() => { setSelected(option.text); setResult(null); }} />{option.text}</label>)}</fieldset>
    <button type="button" className="gs-primary" onClick={check} disabled={selected === null || result === 'correct'}>Check answer</button>
    {result && <p className={`gs-feedback ${result}`} role="status">{result === 'correct' ? `Correct! ${example.chinese} is ${example.pinyin}.` : 'Not quite. Read the tone marks again, then try another answer.'}</p>}
  </div>;
}

export default function GrammarPractice({ point, allExamples, onSuccess }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  return <div className="gs-practice-panel">
    <div className="gs-panel-heading"><div><p className="gs-eyebrow">Put it into practice</p><h3>Build it. Check it. Remember it.</h3></div><span className="gs-small-count">{exampleIndex + 1} / {point.examples.length}</span></div>
    {sentenceCharacters(point.examples[exampleIndex].chinese).length < 3 ? <ReadingChallenge key={point.id + exampleIndex} example={point.examples[exampleIndex]} alternatives={allExamples.filter(example => example.pinyin !== point.examples[exampleIndex].pinyin).slice(0, 3)} onSuccess={onSuccess} /> : <SentenceBuilder key={point.id + exampleIndex} example={point.examples[exampleIndex]} onSuccess={onSuccess} />}
    {point.examples.length > 1 && <button className="gs-text-button gs-another-example" type="button" onClick={() => setExampleIndex(index => (index + 1) % point.examples.length)}>Try the other example <span aria-hidden="true">↻</span></button>}
    <div className="gs-reflection-heading"><h4>Make it your own</h4><p>Try the original exercises, then compare your thinking with the model.</p></div>
    {point.questions.map((question, index) => <ReflectionQuestion key={point.id + index} question={question} number={`${point.id}-${index + 1}`} />)}
  </div>;
}

function SentenceBuilder({ example, onSuccess }) {
  const [tiles] = useState(() => shuffledTiles(sentenceCharacters(example.chinese)));
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [solution, setSolution] = useState(false);
  const selectedIds = new Set(selected.map(tile => tile.id));
  const target = sentenceCharacters(example.chinese).join('');
  function check() {
    const correct = selected.map(tile => tile.text).join('') === target;
    setResult(correct ? 'correct' : 'incorrect');
    if (correct) onSuccess();
  }
  return <div className="gs-challenge">
    <p className="gs-eyebrow">Sentence builder</p><h4>{example.english}</h4><p className="gs-challenge-hint">Tap the characters in order to rebuild the example. Tap a placed character to take it back.</p>
    <div className={`gs-sentence-tray ${result === 'correct' ? 'is-correct' : ''}`} role="group" aria-label="Your sentence">
      {selected.length ? selected.map(tile => <button type="button" className="gs-tile is-placed" key={tile.id} disabled={result === 'correct'} aria-label={`Remove ${tile.text}, position ${selected.indexOf(tile) + 1}`} onClick={() => { setSelected(value => value.filter(item => item.id !== tile.id)); setResult(null); }}>{tile.text}</button>) : <span className="gs-tray-placeholder">Your sentence starts here</span>}
    </div>
    <div className="gs-tile-bank" role="group" aria-label="Available characters">{tiles.map(tile => <button type="button" key={tile.id} className="gs-tile" aria-label={`Add ${tile.text}, tile ${tile.id + 1}`} disabled={selectedIds.has(tile.id) || result === 'correct'} onClick={() => { setSelected(value => [...value, tile]); setResult(null); }}>{tile.text}</button>)}</div>
    <div className="gs-challenge-actions"><button className="gs-primary" type="button" disabled={selected.length !== tiles.length || result === 'correct'} onClick={check}>Check sentence <span aria-hidden="true">→</span></button><button className="gs-secondary" type="button" onClick={() => { setSelected([]); setResult(null); setSolution(false); }}>Start again</button></div>
    {result && <div className={`gs-feedback ${result}`} role="status"><strong>{result === 'correct' ? 'You’ve got it!' : 'Almost. Let’s try that order again.'}</strong><p>{result === 'correct' ? `${example.chinese} · ${example.pinyin}` : 'Think about the sentence pattern above. You can take back a character or start again.'}</p></div>}
    <button className="gs-text-button" type="button" aria-expanded={solution} onClick={() => setSolution(value => !value)}>{solution ? 'Hide the example' : 'Need a hint? See the example'}</button>
    {solution && <p className="gs-solution"><span className="zh">{example.chinese}</span><span>{example.pinyin}</span></p>}
  </div>;
}
