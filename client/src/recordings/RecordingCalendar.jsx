import { useId, useState } from 'react';
import { formatSessionDate, localDate } from './recordingMedia';

const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecordingCalendar({ date, sessions, onSelect, onAdd, disabled = false }) {
  const titleId = useId();
  const [month, setMonth] = useState(() => (date || localDate()).slice(0, 7));
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(year, monthNumber - 1, 1, 12);
  const today = localDate();
  const counts = new Map();
  sessions.forEach(session => counts.set(session.sessionDate, (counts.get(session.sessionDate) || 0) + 1));
  const days = Array.from({ length: 42 }, (_, index) => new Date(year, monthNumber - 1, 1 - first.getDay() + index, 12));
  const moveMonth = amount => setMonth(dateKey(new Date(year, monthNumber - 1 + amount, 1, 12)).slice(0, 7));
  const select = key => { setMonth(key.slice(0, 7)); onSelect(key); };
  const keyboardMove = (event, day) => {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = dateKey(new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset, 12));
    setMonth(next.slice(0, 7));
    // Move focus without opening a recording or an admin form; Enter selects the day.
    const calendar = event.currentTarget.closest('.recording-calendar');
    requestAnimationFrame(() => calendar.querySelector(`[data-date="${next}"]`)?.focus());
  };
  return <section className="recording-calendar" aria-labelledby={titleId}>
    <div className="recording-calendar-heading">
      <h2 id={titleId} aria-live="polite">{monthLabel.format(first)}</h2>
      <div><button type="button" className="access-button" onClick={() => { setMonth(today.slice(0, 7)); onSelect(today); }} disabled={disabled}>Today</button><button type="button" className="access-button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button><button type="button" className="access-button" aria-label="Next month" onClick={() => moveMonth(1)}>›</button></div>
    </div>
    <table className="recording-calendar-table"><thead><tr>{weekdays.map(day => <th key={day} scope="col">{day}</th>)}</tr></thead><tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map(day => {
      const key = dateKey(day); const count = counts.get(key) || 0;
      return <td key={key} className={day.getMonth() === monthNumber - 1 ? '' : 'is-outside'}><button type="button" data-date={key} disabled={disabled} className={`recording-calendar-day${date === key ? ' is-selected' : ''}${key === today ? ' is-today' : ''}`} aria-label={`${formatSessionDate(key)}, ${count} ${count === 1 ? 'recording' : 'recordings'}`} aria-pressed={date === key} aria-current={key === today ? 'date' : undefined} onClick={() => select(key)} onKeyDown={event => keyboardMove(event, day)}><span>{day.getDate()}</span>{count > 0 && <span className="recording-calendar-count"><span aria-hidden="true">●</span><span className="recording-calendar-count-text"> {count} {count === 1 ? 'video' : 'videos'}</span></span>}</button></td>;
    })}</tr>)}</tbody></table>
    <div className="recording-calendar-caption"><p>Marked days have recordings.{onAdd ? ' Select a day to view or add a video.' : ' Select a day to watch.'}</p>{onAdd && <button className="access-button is-primary" disabled={disabled} onClick={() => onAdd(date)}>Add video for {formatSessionDate(date)}</button>}</div>
  </section>;
}
