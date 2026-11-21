// Answer boxes with their units around them, e.g. "¥ [25.50]", "[15] : [30]", "[3] 月 [15] 号".
export default function NumberAnswerFields({ question, answer, onChange, disabled }) {
  function field(name, label, placeholder, { inputMode = 'numeric', size = 'wide' } = {}) {
    return <label key={name} className={`number-field is-${size}`}>
      <input id={`number-answer-${name}`} type="text" inputMode={inputMode} value={answer[name] || ''} disabled={disabled} maxLength={32} autoComplete="off" required placeholder={placeholder} onChange={event => onChange({ ...answer, [name]: event.target.value })} />
      <span>{label}</span>
    </label>;
  }
  const unit = text => <span className="number-unit" aria-hidden="true">{text}</span>;
  let fields;
  if (question.mode === 'time') fields = <>{field('hour', 'Hour (0–23)', '15', { size: 'short' })}{unit(':')}{field('minute', 'Minutes (0–59)', '30', { size: 'short' })}</>;
  else if (question.mode === 'dates') fields = <>{field('month', 'Month (1–12)', '3', { size: 'short' })}{unit('月')}{field('day', 'Day', '15', { size: 'short' })}{unit('号')}</>;
  else if (question.mode === 'prices') fields = <>{unit('¥')}{field('value', 'Price in yuan', '25.50', { inputMode: 'decimal' })}</>;
  else if (question.mode === 'ages') fields = <>{field('value', 'Age in years', '28', { size: 'short' })}{unit('岁')}</>;
  else fields = field('value', 'Phone number', 'Every digit', { inputMode: 'tel' });
  return <fieldset className="number-answer-fields" disabled={disabled}><legend className="tone-visually-hidden">Your answer</legend>
    <div className="number-answer-row">{fields}</div>
  </fieldset>;
}
