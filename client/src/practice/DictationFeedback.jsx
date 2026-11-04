import SentenceText, { PinyinText } from './SentenceText';

export default function DictationFeedback({ sentence, comparison }) {
  const readings = sentence.tokenPinyin?.flat() || [];
  return <div className={`dictation-feedback ${comparison.correct ? 'correct' : 'incorrect'}`} role="status">
    <h3>{comparison.correct ? '✓ Correct — you heard it!' : '✕ Incorrect — compare the characters'}</h3>
    <p>{comparison.accuracy}% character accuracy. Spaces and punctuation are not graded.</p>
    <ul className="dictation-characters" aria-label="Character feedback">
      {comparison.characters.map((character, index) => <li key={index} className={`dictation-character ${character.type}`}>
        {character.expected ? <PinyinText text={character.expected} readings={[readings[character.expectedIndex]]} /> : <span className="dictation-extra-character" lang="zh-CN">{character.actual}</span>}
        <small>{character.type === 'correct' ? '✓ Correct' : character.type === 'missing' ? 'Missing' : character.type === 'extra' ? 'Extra' : `You typed ${character.actual}`}</small>
      </li>)}
    </ul>
    <p className="sentence-chinese"><SentenceText sentence={sentence} /></p>
    <p>{sentence.english}</p>
  </div>;
}
