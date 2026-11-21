import SentenceText, { PinyinText } from './SentenceText';

const labels = { missing: 'Missing', extra: 'Extra' };

export default function DictationFeedback({ sentence, comparison }) {
  const readings = sentence.tokenPinyin?.flat() || [];
  return <div className={`dictation-feedback ${comparison.correct ? 'correct' : 'incorrect'}`} role="status">
    <div className="dictation-feedback-head">
      <span className="tone-feedback-icon" aria-hidden="true">{comparison.correct ? '✓' : '✕'}</span>
      <h3>{comparison.correct ? 'Correct!' : 'Not quite'}</h3>
      <span className="dictation-accuracy">{comparison.accuracy}% characters</span>
    </div>
    {!comparison.correct && <ul className="dictation-characters" aria-label="Character feedback">
      {comparison.characters.map((character, index) => <li key={index} className={`dictation-character ${character.type}`}>
        {character.expected ? <PinyinText text={character.expected} readings={[readings[character.expectedIndex]]} /> : <span className="dictation-extra-character" lang="zh-CN">{character.actual}</span>}
        {character.type !== 'correct' && <small>{labels[character.type] || <>You: <span lang="zh-CN">{character.actual}</span></>}</small>}
      </li>)}
    </ul>}
    <p className="dictation-answer-sentence"><SentenceText sentence={sentence} /></p>
    <p className="dictation-english">{sentence.english}</p>
  </div>;
}
