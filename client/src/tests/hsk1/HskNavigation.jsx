import { useState } from 'react';

export default function HskNavigation({ groups, currentGroup, answers, sectionAnswered, onSelectGroup, onJump }) {
  const [mapOpen, setMapOpen] = useState(false);
  const questions = groups.flatMap(group => group.questions);
  const nextUnanswered = questions.find(question => answers[question.number - 1] === null);
  const jump = number => { setMapOpen(false); onJump(number); };

  return <aside className="hsk-navigation" aria-label="Question navigation">
    <div className="hsk-progress-label"><strong>{sectionAnswered} / 20</strong><span>answered in this section</span></div>
    <progress max="20" value={sectionAnswered} aria-label="Section answer progress"/>
    <p className="hsk-navigation-label">Choose a part</p>
    <div className="hsk-part-tabs">{groups.map(group => {
      const complete = group.questions.filter(question => answers[question.number - 1] !== null).length;
      return <button key={group.id} className={group.id === currentGroup.id ? 'is-current' : ''} aria-current={group.id === currentGroup.id ? 'step' : undefined} onClick={() => onSelectGroup(group)}><span>{group.title.split(' · ')[0]}{complete === 5 && <span className="hsk-part-check" aria-label="all five answered"> ✓</span>}</span><small>{complete}/5 answered</small></button>;
    })}</div>
    <button className="hsk-next-unanswered" onClick={() => jump(nextUnanswered.number)} disabled={!nextUnanswered}>{nextUnanswered ? 'Next unanswered question →' : 'All 20 questions answered ✓'}</button>
    <button className="hsk-map-toggle" aria-expanded={mapOpen} aria-controls="hsk-question-map" onClick={() => setMapOpen(open => !open)}><span>Question map · {20 - sectionAnswered} left</span><span aria-hidden="true">{mapOpen ? '−' : '+'}</span></button>
    <div className={`hsk-map ${mapOpen ? 'is-open' : ''}`} id="hsk-question-map">
      <p className="hsk-navigation-label">Jump to a question</p>
      <div className="hsk-question-nav">{questions.map(question => <button className={`${answers[question.number - 1] !== null ? 'is-answered' : ''} ${currentGroup.questions.some(row => row.number === question.number) ? 'is-in-part' : ''}`} key={question.number} aria-label={`Question ${question.number}, ${answers[question.number - 1] === null ? 'unanswered' : 'answered'}`} onClick={() => jump(question.number)}>{question.number}</button>)}</div>
      <p className="hsk-map-legend"><span><i aria-hidden="true"/>Unanswered</span><span><i aria-hidden="true"/>Answered</span></p>
    </div>
  </aside>;
}
