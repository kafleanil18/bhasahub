// Keep word tiles intact while annotating each character separately.
export function PinyinText({ text, readings = [] }) {
  return <span className="sentence-ruby-word" lang="zh-CN">{Array.from(text).map((character, index) => readings[index]
    ? <ruby key={index}>{character}<rt lang="zh-Latn">{readings[index]}</rt></ruby>
    : <span key={index}>{character}</span>)}</span>;
}

export default function SentenceText({ sentence }) {
  return <span className="sentence-annotated" lang="zh-CN">{sentence.tokens.map((token, index) => <PinyinText key={index} text={token} readings={sentence.tokenPinyin?.[index]} />)}<span>{sentence.chinese.slice(-1)}</span></span>;
}
