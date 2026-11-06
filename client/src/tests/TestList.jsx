import usePracticePapers from './hsk1/usePracticePapers';
import { useState, useEffect, useMemo } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import FeaturedPaper from './hsk1/FeaturedPaper';

const API = window.API_BASE_URL + '/api';
const LEVELS = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4'];

function TestList({ onOpenTest, onBack, user }) {
  const { papers: practicePapers, error: paperError, loading: papersLoading, reload: reloadPapers } = usePracticePapers();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('All');
  const [completionFilter, setCompletionFilter] = useState('all');
  const [completionByTest, setCompletionByTest] = useState({});
  const [completionLoading, setCompletionLoading] = useState(true);
  const [completionError, setCompletionError] = useState('');

  useEffect(() => {
    fetch(`${API}/tests`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
      .then(res => res.json())
      .then(data => { setTests(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const studentKey = user?._id || user?.id || user?.email || '';
  useEffect(() => {
    if (papersLoading || loading) return;
    let active = true;
    setCompletionLoading(true);
    setCompletionError('');
    if (!studentKey) {
      setCompletionByTest({});
      setCompletionLoading(false);
      return () => { active = false; };
    }
    const papers = practicePapers.map(paper => ({ id: paper.id, url: `${API}/hsk1/${paper.id}/attempts` }));
    const custom = tests.map(test => ({ id: test._id, url: `${API}/attempts/test/${test._id}` }));
    Promise.all([...papers, ...custom].map(async item => {
      try {
        const response = await fetch(item.url, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load test progress.');
        return [item.id, Array.isArray(data) && data.length > 0];
      } catch { return [item.id, null]; }
    })).then(rows => {
      if (active) {
        setCompletionByTest(Object.fromEntries(rows));
        if (rows.some(([, completed]) => completed === null)) setCompletionError('Some test progress could not be loaded. Refresh the page to try again.');
      }
    }).finally(() => { if (active) setCompletionLoading(false); });
    return () => { active = false; };
  }, [practicePapers, tests, studentKey, papersLoading, loading]);

  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const matchesLevel = levelFilter === 'All' || (test.level || '').toLowerCase().includes(levelFilter.toLowerCase());
      const completed = completionByTest[test._id] === true;
      const matchesCompletion = completionFilter === 'all' || (completionFilter === 'completed' ? completed : completionByTest[test._id] === false);
      return matchesLevel && matchesCompletion;
    });
  }, [tests, levelFilter, completionFilter, completionByTest]);
  const filteredPracticePapers = useMemo(() => practicePapers.filter(paper => {
    const matchesLevel = levelFilter === 'All' || levelFilter === 'HSK 1';
    const completed = completionByTest[paper.id] === true;
    const matchesCompletion = completionFilter === 'all' || (completionFilter === 'completed' ? completed : completionByTest[paper.id] === false);
    return matchesLevel && matchesCompletion;
  }), [practicePapers, levelFilter, completionFilter, completionByTest]);

  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">HSK Mock Tests</h1>

      {paperError && <div role="alert"><p>{paperError}</p><button onClick={reloadPapers}>Retry loading practice papers</button></div>}
      {papersLoading && <p role="status">Loading practice papers…</p>}
      {(practicePapers.length > 0 || (!loading && tests.length > 0)) && (
        <div className="mock-test-filters">
          {(!loading && tests.length > 0) && <div className="mock-test-filter-group" aria-label="Filter by level">
            <span>Level</span>
            {['All', ...LEVELS].map(level => <button key={level} type="button" className={levelFilter === level ? 'is-selected' : ''} aria-pressed={levelFilter === level} onClick={() => setLevelFilter(level)}>{level}</button>)}
          </div>}
          <div className="mock-test-filter-group" aria-label="Filter by test status">
            <span>Test status</span>
            {[['all', 'All'], ['completed', 'Completed'], ['not-started', 'Not started']].map(([filter, label]) => <button
              key={filter}
              type="button"
              className={completionFilter === filter ? 'is-selected' : ''}
              aria-pressed={completionFilter === filter}
              onClick={() => setCompletionFilter(filter)}
              disabled={completionLoading || !studentKey}
            >{label}</button>)}
          </div>
          {!completionLoading && <p className="mock-test-filter-count" aria-live="polite">{filteredPracticePapers.length + filteredTests.length} {filteredPracticePapers.length + filteredTests.length === 1 ? 'test' : 'tests'}</p>}
        </div>
      )}

      {completionError && <p role="status" className="test-progress-error">{completionError}</p>}
      {completionLoading && studentKey && !papersLoading && !loading && <p role="status" className="test-progress-loading">Checking your test progress…</p>}
      {!completionLoading && !completionError && filteredPracticePapers.length + filteredTests.length === 0 && <p className="courses-empty">{completionFilter === 'completed' ? 'No completed tests match this view.' : completionFilter === 'not-started' ? 'No tests are waiting to be started in this view.' : levelFilter !== 'All' ? `No ${levelFilter} tests are available yet.` : 'No mock tests are available yet.'}</p>}

      {filteredPracticePapers.map(paper => <FeaturedPaper key={paper.id} paperId={paper.id} title={paper.title} code={paper.code} completed={completionByTest[paper.id]} onOpen={() => onOpenTest(paper.id)} onRetake={() => onOpenTest(paper.id)} showHidden={['admin', 'superadmin'].includes(user?.role)} />)}

      {loading && <p className="courses-empty">Loading tests...</p>}
      <div className="course-cards">
        {filteredTests.map((t) => (
          <div className={`course-card mock-test-card${completionByTest[t._id] === true ? ' is-completed' : ''}`} key={t._id} role="button" tabIndex={0} aria-label={`Open ${t.title}${completionByTest[t._id] === true ? ', completed' : ''}`} onClick={() => onOpenTest(t._id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenTest(t._id); } }}>
            {t.image ? (
              <img className="course-card-img" src={mediaUrl(t.image)} alt={t.title} />
            ) : (
              <div className="course-card-glyph">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
            )}
            <div className="course-card-body">
              {typeof completionByTest[t._id] === 'boolean' && <span className={`mock-test-completion${completionByTest[t._id] ? ' is-done' : ''}`}>{completionByTest[t._id] ? '✓ Completed' : 'Not started'}</span>}
              <h3 className="course-card-title">{t.title}</h3>
              <p className="course-card-desc">{t.description}</p>
              <span className="tag">{t.level} · {t.questions?.length || 0} questions</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TestList;
