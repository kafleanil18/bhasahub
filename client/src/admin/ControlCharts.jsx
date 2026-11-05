import { useState } from 'react';

const shortDate = key => new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export default function ControlCharts({ stats }) {
  const [selected, setSelected] = useState(null);
  const days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(); day.setDate(day.getDate() - 29 + index);
    const key = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
    return { date:key, count:stats.students.signupsByDay.find(row => row._id === key)?.count || 0 };
  });
  const max = Math.max(1,...days.map(day => day.count));
  const courses = stats.enrollments.topCourses;
  const maxCourse = Math.max(1,...courses.map(course => course.count));
  return <div className="control-charts">
    <section className="control-panel" aria-labelledby="control-growth-title">
      <div className="control-panel-heading"><div><p className="control-eyebrow">Learner growth</p><h2 id="control-growth-title">New student signups</h2></div><span className="control-chip">Last 30 days</span></div>
      <div className="control-growth-summary"><strong>{stats.students.newLast30Days.toLocaleString()}</strong><span>new students<br/>in the last 30 days</span></div>
      <div className="control-bars" aria-label="Daily student signups">{days.map(day => <button type="button" key={day.date} className={selected === day.date ? 'selected' : ''} aria-label={`${shortDate(day.date)}: ${day.count} signups`} onMouseEnter={() => setSelected(day.date)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(day.date)} onBlur={() => setSelected(null)} onClick={() => setSelected(day.date)}><span style={{height:`${day.count / max * 100}%`}} /></button>)}</div>
      <div className="control-chart-axis"><span>{shortDate(days[0].date)}</span><span>{shortDate(days.at(-1).date)}</span></div>
      <p className="control-chart-caption" aria-live="polite">{selected ? `${shortDate(selected)} · ${days.find(day => day.date === selected).count} student signups` : 'Hover or select a bar to explore daily signups.'}</p>
    </section>
    <section className="control-panel" aria-labelledby="control-courses-title">
      <div className="control-panel-heading"><div><p className="control-eyebrow">Course engagement</p><h2 id="control-courses-title">Most enrolled courses</h2></div></div>
      {courses.length === 0 ? <div className="control-empty"><span aria-hidden="true">学</span><h3>No enrollments yet.</h3><p>Course enrollments will appear here as students join.</p></div> : <ol className="control-course-ranks">{courses.map((course,index) => <li key={course.courseId}><span className="control-rank">{String(index+1).padStart(2,'0')}</span><div><div className="control-course-label"><strong>{course.title}</strong><span>{course.count} <small>students</small></span></div><div className="control-track"><span style={{width:`${course.count/maxCourse*100}%`}} /></div></div></li>)}</ol>}
    </section>
  </div>;
}
