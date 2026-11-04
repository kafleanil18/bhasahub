export default function NumberAnswerFields({ question, answer, onChange, disabled }) {
  function field(name, label, placeholder, inputMode = 'numeric') {
    return <label key={name}>{label}<input id={`number-answer-${name}`} type="text" inputMode={inputMode} value={answer[name] || ''} disabled={disabled} maxLength={32} autoComplete="off" required placeholder={placeholder} onChange={event => onChange({ ...answer, [name]: event.target.value })} /></label>;
  }
  return <fieldset className="number-answer-fields" disabled={disabled}><legend>Your answer</legend>
    {question.mode === 'time' ? <>{field('hour', 'Hour (0–23)', '15')}{field('minute', 'Minutes (0–59)', '30')}</>
      : question.mode === 'dates' ? <>{field('month', 'Month (1–12)', '3')}{field('day', 'Day', '15')}</>
        : question.mode === 'prices' ? field('value', 'Price in yuan', '25.50', 'decimal')
          : question.mode === 'ages' ? field('value', 'Age in years', '28') : field('value', 'Phone number', 'Enter every digit', 'tel')}
  </fieldset>;
}
