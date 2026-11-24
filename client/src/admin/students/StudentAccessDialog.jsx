import { useState } from 'react';
import AccessDialog from '../subscriptions/AccessDialog';
import { formatDate } from '../subscriptions/accessDates';
import { daysUntil, isLive } from './studentApi';

const FREE_DAYS = 7;
const validDays = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 3650;

function DaysField({ id, value, onChange, label = 'Days' }) {
  return <label className="student-days" htmlFor={id}>{label}<input id={id} type="number" min="1" max="3650" step="1" value={value} onChange={event => onChange(event.target.value)}/></label>;
}

// One place to grant, extend or revoke a student's free trial, plan and course access.
export default function StudentAccessDialog({ student, plans, courses, busy, error, onAction, onClose }) {
  const [trialDays, setTrialDays] = useState(FREE_DAYS);
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [planDays, setPlanDays] = useState(plans[0]?.days || 30);
  const [courseId, setCourseId] = useState('');
  const [courseDays, setCourseDays] = useState(30);
  const [confirm, setConfirm] = useState('');
  const trial = student.trial || { status: 'none' };
  const trialLive = trial.status === 'active';
  const liveCourses = (student.subscriptions || []).filter(sub => isLive(sub.expiresAt));
  const ask = (key, action) => confirm === key ? (setConfirm(''), action()) : setConfirm(key);

  return <AccessDialog title={`Access for ${student.name}`} description={student.email} busy={!!busy} onClose={onClose}>
    {error && <p className="access-feedback is-error" role="alert">{error}</p>}

    <section className="student-access-block" aria-labelledby="student-trial-title">
      <div className="student-access-head"><h3 id="student-trial-title">Free trial <span className="access-free-tag">Free</span></h3>
        <span className={`student-chip is-${trialLive ? 'trial' : trial.status === 'pending' ? 'pending' : 'muted'}`}>{trialLive ? (trial.expiresAt ? `${daysUntil(trial.expiresAt)} days left · ends ${formatDate(trial.expiresAt)}` : 'Active · no end date') : trial.status === 'expired' ? `Ended ${formatDate(trial.expiresAt)}` : trial.status === 'pending' ? 'Request waiting' : trial.status === 'denied' ? 'Declined' : 'Not started'}</span></div>
      <p className="access-help">Unlocks the practice studio and every HSK mock test.</p>
      <div className="student-access-row">
        <DaysField id="trial-days" value={trialDays} onChange={setTrialDays}/>
        <button className="access-button is-primary" disabled={!!busy || !validDays(trialDays)} onClick={() => onAction('trial', { method: 'PUT', body: { days: Number(trialDays) } }, `${trialLive ? 'Extended' : 'Granted'} free access by ${trialDays} days.`)}>{busy === 'trial' ? 'Saving…' : trialLive ? `Extend by ${trialDays} days` : `Grant ${trialDays} days free`}</button>
        {(trialLive || trial.status === 'pending') && <button className="access-link is-danger" disabled={!!busy} onClick={() => ask('trial', () => onAction('trial', { method: 'DELETE' }, 'Free access revoked.'))}>{confirm === 'trial' ? 'Confirm revoke' : 'Revoke'}</button>}
      </div>
    </section>

    <section className="student-access-block" aria-labelledby="student-plan-title">
      <div className="student-access-head"><h3 id="student-plan-title">Plan</h3>
        <span className={`student-chip is-${student.plan ? 'paid' : 'muted'}`}>{student.plan ? `${student.plan.label} · ${daysUntil(student.plan.expiresAt)} days left · ends ${formatDate(student.plan.expiresAt)}` : 'No plan'}</span></div>
      <p className="access-help">Unlocks every published course. Granting while a plan runs adds the days to it.</p>
      <div className="student-access-row">
        <label className="student-days" htmlFor="plan-choice">Plan<select id="plan-choice" value={planId} onChange={event => { setPlanId(event.target.value); setPlanDays(plans.find(plan => plan.id === event.target.value)?.days || 30); }}>{plans.map(plan => <option key={plan.id} value={plan.id}>{plan.label} · Rs {plan.price.toLocaleString()}</option>)}</select></label>
        <DaysField id="plan-days" value={planDays} onChange={setPlanDays}/>
        <button className="access-button is-primary" disabled={!!busy || !planId || !validDays(planDays)} onClick={() => onAction('plan', { method: 'PUT', body: { planId, days: Number(planDays) } }, `${student.plan ? 'Extended' : 'Granted'} the plan by ${planDays} days.`)}>{busy === 'plan' ? 'Saving…' : student.plan ? 'Extend plan' : 'Grant plan'}</button>
        {student.plan && <button className="access-link is-danger" disabled={!!busy} onClick={() => ask('plan', () => onAction('plan', { method: 'DELETE' }, 'Plan revoked.'))}>{confirm === 'plan' ? 'Confirm revoke' : 'Revoke'}</button>}
      </div>
    </section>

    <section className="student-access-block" aria-labelledby="student-course-title">
      <div className="student-access-head"><h3 id="student-course-title">Course access</h3><span className={`student-chip is-${liveCourses.length ? 'paid' : 'muted'}`}>{liveCourses.length ? `${liveCourses.length} active` : 'None'}</span></div>
      {liveCourses.length > 0 && <ul className="student-course-list">{liveCourses.map(sub => <li key={sub._id}><span><strong>{sub.course?.title || 'Deleted course'}</strong><small>{daysUntil(sub.expiresAt)} days left · ends {formatDate(sub.expiresAt)}</small></span><button className="access-link is-danger" disabled={!!busy} onClick={() => ask(sub._id, () => onAction(`course-${sub._id}`, { path: `/subscriptions/${sub._id}`, method: 'DELETE' }, `Removed access to ${sub.course?.title || 'the course'}.`))}>{busy === `course-${sub._id}` ? 'Removing…' : confirm === sub._id ? 'Confirm revoke' : 'Revoke'}</button></li>)}</ul>}
      <div className="student-access-row">
        <label className="student-days student-course-select" htmlFor="course-choice">Course<select id="course-choice" value={courseId} onChange={event => setCourseId(event.target.value)}><option value="">Choose a course…</option>{courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}</select></label>
        <DaysField id="course-days" value={courseDays} onChange={setCourseDays}/>
        <button className="access-button is-primary" disabled={!!busy || !courseId || !validDays(courseDays)} onClick={() => onAction('course', { path: '/subscriptions', method: 'POST', body: { userId: student._id, courseId, days: Number(courseDays) } }, `Granted ${courseDays} days of ${courses.find(course => course._id === courseId)?.title || 'course'} access.`).then(ok => ok && setCourseId(''))}>{busy === 'course' ? 'Saving…' : 'Grant course'}</button>
      </div>
    </section>
    <div className="access-dialog-actions"><button className="access-button" disabled={!!busy} onClick={onClose}>Done</button></div>
  </AccessDialog>;
}
