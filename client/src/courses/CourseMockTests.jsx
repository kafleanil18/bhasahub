import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { isStaff, usePracticeAccess } from '../access/practiceAccess';
import usePracticePapers from '../tests/hsk1/usePracticePapers';
import { hskLevelNumber, paperLevel } from '../tests/mockTests';
import { testPath } from '../navigation/paths';
import { apiFetch } from '../lib/apiClient';
import './CourseMockTests.css';

const API = `${window.API_BASE_URL}/api`;

// The mock tests for this course's HSK level, near the top of the course page. Every one is open
// with a free week, a plan or a course subscription (staff always); otherwise only the free paper
// is, and the rest point to how to unlock them. Levels without a mock test show nothing.
export default function CourseMockTests({ course, user }) {
  const level = hskLevelNumber(course.level) ?? hskLevelNumber(course.title);
  const { papers, loading: papersLoading, error: papersError } = usePracticePapers();
  const [custom, setCustom] = useState({ loading: true, tests: [] });
  const [completion, setCompletion] = useState({});
  const { status } = usePracticeAccess(user);
  const allOpen = isStaff(user) || status === 'approved';

  useEffect(() => {
    let active = true;
    apiFetch(`${API}/tests`)
      .then(response => response.ok ? response.json() : [])
      .then(data => { if (active) setCustom({ loading: false, tests: Array.isArray(data) ? data : [] }); })
      .catch(() => { if (active) setCustom({ loading: false, tests: [] }); });
    return () => { active = false; };
  }, []);

  const items = useMemo(() => {
    if (!level) return [];
    const fromPapers = papers
      .filter(paper => paper.published !== false && !paper.deleted && paperLevel(paper) === level)
      .sort((a, b) => Number(!!b.free) - Number(!!a.free))
      .map(paper => ({ id: paper.id, attempts: `${API}/hsk1/${paper.id}/attempts`, label: `Paper ${paper.code || paper.id.toUpperCase()}`, title: String(paper.title || '').replace(/ · /g, ' '), meta: level === 1 ? '40 questions: 20 listening and 20 reading, timed' : 'Timed listening and reading paper', free: !!paper.free }));
    const fromTests = custom.tests
      .filter(test => hskLevelNumber(test.level) === level)
      .map(test => ({ id: test._id, attempts: `${API}/attempts/test/${test._id}`, label: `HSK ${level} test`, title: test.title, meta: `${test.questions?.length || 0} questions`, free: false }));
    return [...fromPapers, ...fromTests];
  }, [papers, custom.tests, level]);

  const ids = items.map(item => item.id).join(',');
  useEffect(() => {
    if (!items.length) return undefined;
    let active = true;
    Promise.all(items.map(item => apiFetch(item.attempts)
      .then(response => response.ok ? response.json() : null)
      .then(data => [item.id, Array.isArray(data) ? data.length > 0 : null])
      .catch(() => [item.id, null])))
      .then(rows => { if (active) setCompletion(Object.fromEntries(rows)); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const loading = papersLoading || custom.loading;
  if (!level || (!loading && !items.length && !papersError)) return null;

  return <section className="course-mock-tests" aria-labelledby="course-mock-tests-title">
    <div className="course-mock-head">
      <div>
        <p className="course-mock-eyebrow">Ready for your HSK exam?</p>
        <h2 id="course-mock-tests-title">HSK {level} mock tests</h2>
        <p>Timed papers set out like the real exam. Afterwards, review every answer you missed.</p>
      </div>
      {!loading && items.length > 0 && <span className="course-mock-count">{items.length} {items.length === 1 ? 'paper' : 'papers'}</span>}
    </div>
    {!allOpen && status !== 'loading' && <p className="course-mock-note">The free paper is open now. <Link to="/tests">Unlock every mock test</Link> with a free week or a plan.</p>}
    {loading ? <p className="course-mock-status" role="status">Loading mock tests…</p>
      : papersError && !items.length ? <p className="course-mock-status" role="alert">{papersError}</p>
        : <ul className="course-mock-list">
          {items.map(item => {
            const open = allOpen || item.free;
            const done = completion[item.id] === true;
            return <li key={item.id} className={`course-mock-card${open ? '' : ' is-locked'}${done ? ' is-done' : ''}`}>
              <div className="course-mock-tags">
                {item.free && !allOpen && <span className="course-mock-tag is-free">Free</span>}
                {!open && <span className="course-mock-tag is-locked"><Icon name="lock" /> Locked</span>}
                {done && <span className="course-mock-tag is-done">Completed</span>}
              </div>
              <p className="course-mock-code">{item.label}</p>
              <h3>{item.title}</h3>
              <p className="course-mock-meta">{item.meta}</p>
              {open
                ? <Link className="course-mock-start" to={testPath(item.id)}>{done ? 'View results' : 'Start test'}</Link>
                : <Link className="course-mock-unlock" to="/tests">How to unlock</Link>}
            </li>;
          })}
        </ul>}
  </section>;
}
