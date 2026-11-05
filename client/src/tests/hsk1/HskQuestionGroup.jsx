export default function HskQuestionGroup({ group, answers, onAnswer, disabled, review }) {
  return <section className="hsk-group" aria-labelledby={`hsk-group-${group.id}`}>
    <div className="hsk-group-heading"><p className="hsk-eyebrow">Questions {group.questions[0].number}–{group.questions.at(-1).number}</p><h2 id={`hsk-group-${group.id}`}>{group.title}</h2><p>{group.instruction}</p></div>
    {group.image && <figure className="hsk-shared-pictures"><img src={group.image} width="1200" height={group.id === 'r2' ? 1600 : 1247} alt="Color illustrations: six choices labelled A to F. Choose the picture matching each sentence or dialogue."/><figcaption>Color illustrations adapted from paper H11226. Select a letter below each question.</figcaption></figure>}
    {group.choices && <ol className="hsk-word-bank" aria-label="Shared answer choices">{group.choices.map((choice, index) => <li key={index}><b>{String.fromCharCode(65 + index)}</b><span lang="zh"><small>{choice.pinyin}</small><strong>{choice.text}</strong></span></li>)}</ol>}
    {group.example && <p className="hsk-example"><strong>Example</strong><span lang="zh">{group.example}</span></p>}
    <div className="hsk-questions">{group.questions.map(question => {
      const assessment = review?.find(row => row.number === question.number);
      return <fieldset className={`hsk-question ${assessment ? assessment.answer === assessment.correctIndex ? 'is-correct' : 'is-incorrect' : ''}`} id={`hsk-question-${question.number}`} tabIndex={-1} key={question.number} disabled={disabled}>
        <legend><span className="hsk-question-number">{question.number}</span>{question.text ? <span lang="zh">{question.text}</span> : <span>{group.id === 'l1' ? 'Does the audio match this picture?' : 'Choose the matching answer'}</span>}</legend>
        {question.pinyin && <p className="hsk-pinyin" lang="zh-Latn">{question.pinyin}</p>}
        <div className={`hsk-question-body ${question.image ? 'has-picture' : ''} ${group.id === 'l2' ? 'is-wide' : ''}`}>
        {question.image && <img className={`hsk-question-image ${group.id === 'l2' ? 'is-wide' : ''}`} src={question.image} width={group.id === 'l2' ? 1400 : 720} height={group.id === 'l2' ? 467 : 540} alt={group.id === 'l2' ? `Question ${question.number}: color picture choices A, B, C` : `Illustration for question ${question.number}`}/>}
        <div className={`hsk-options option-count-${question.options.length}`}>{question.options.map((option, index) => <label className={`hsk-option ${answers[question.number - 1] === index ? 'is-selected' : ''} ${assessment?.correctIndex === index ? 'is-answer' : ''}`} key={index}><input type="radio" name={`hsk-q-${question.number}`} value={index} checked={answers[question.number - 1] === index} onChange={() => onAnswer(question.number, index)}/><span>{option.pinyin && <small lang="zh-Latn">{option.pinyin}</small>}<strong lang={option.pinyin ? 'zh' : undefined}>{option.text}</strong></span></label>)}</div>
        </div>
        {assessment && <div className="hsk-explanation"><strong>{assessment.answer === null ? 'Unanswered' : assessment.answer === assessment.correctIndex ? 'Correct' : 'Incorrect'} · Correct answer: {question.options[assessment.correctIndex].text}</strong><p>{assessment.explanation}</p></div>}
      </fieldset>;
    })}</div>
  </section>;
}
