import { useEffect, useState } from 'react';
import './StudentSignIns.css';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const time = value => new Date(value).toLocaleTimeString('en-US', { timeZone: 'Asia/Kathmandu', hour: 'numeric', minute: '2-digit', second: '2-digit' });

export default function StudentSignIns() {
  const [date, setDate] = useState(today);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [sort, setSort] = useState({ key: 'lastSignIn', direction: 'desc' });
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    fetch(`${window.API_BASE_URL}/api/audit-log/student-sign-ins?date=${encodeURIComponent(date)}&page=${page}`, {
      signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load student sign-ins');
      return result;
    }).then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, page, refresh]);
  const sortedStudents = data ? [...data.students].sort((a, b) => {
    const left = a[sort.key];
    const right = b[sort.key];
    const comparison = sort.key === 'name'
      ? String(left || '').localeCompare(String(right || ''), undefined, { sensitivity: 'base' })
      : sort.key.includes('SignIn')
        ? new Date(left) - new Date(right)
        : Number(left) - Number(right);
    return sort.direction === 'asc' ? comparison : -comparison;
  }) : [];
  const sortBy = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  const sortHeading = (key, label) => <button type="button" className="sign-ins-sort" onClick={() => sortBy(key)}>{label}<span aria-hidden="true">{sort.key === key ? sort.direction === 'asc' ? '↑' : '↓' : '↕'}</span></button>;
  return <section className="student-sign-ins admin-list" aria-labelledby="student-sign-ins-title">
    <div className="sign-ins-heading"><div><h2 id="student-sign-ins-title">Student sign-ins</h2><p>Successful email and Google sign-ins · Nepal time (UTC+05:45)</p></div><button className="btn-secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button></div>
    <label className="sign-ins-date">View date<input type="date" value={date} max={today()} onChange={event => { if (event.target.value) { setDate(event.target.value); setPage(1); } }} /></label>
    <p className="sign-ins-note">Counts sign-in events, including repeat sign-ins. Students who stay signed in are not counted as a new sign-in each day. History begins when tracking is enabled.</p>
    {loading && <p role="status">Loading student sign-ins…</p>}
    {error && <div role="alert"><p className="login-error">{error}</p><button className="btn-secondary" onClick={() => setRefresh(value => value + 1)}>Try again</button></div>}
    {data && <>
      <div className="sign-ins-totals" aria-live="polite"><div><strong>{data.uniqueStudents}</strong><span>Unique students</span></div><div><strong>{data.totalSignIns}</strong><span>Total sign-ins</span></div></div>
      {!data.uniqueStudents ? <p className="admin-empty">No student sign-ins recorded for this date.</p> : <>
        <div className="sign-ins-table-wrap" role="region" aria-label="Student sign-ins table" tabIndex="0"><table><caption>Student sign-ins for {date} · All times in Nepal time</caption><thead><tr><th scope="col" aria-sort={sort.key === 'name' ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortHeading('name', 'Student')}</th><th scope="col" aria-sort={sort.key === 'count' ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortHeading('count', 'Sign-ins')}</th><th scope="col" aria-sort={sort.key === 'firstSignIn' ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortHeading('firstSignIn', 'First sign-in')}</th><th scope="col" aria-sort={sort.key === 'lastSignIn' ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortHeading('lastSignIn', 'Latest sign-in')}</th></tr></thead><tbody>{sortedStudents.map(student => <tr key={student._id}><th scope="row"><strong>{student.name || 'Unnamed student'}</strong><span>{student.email}</span></th><td className="sign-ins-count-cell">{student.count}</td><td className="sign-ins-time-cell">{time(student.firstSignIn)}</td><td className="sign-ins-time-cell">{time(student.lastSignIn)}</td></tr>)}</tbody></table></div>
        <div className="sign-ins-pagination"><button className="btn-secondary" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(data.uniqueStudents / data.pageSize)}</span><button className="btn-secondary" disabled={page * data.pageSize >= data.uniqueStudents} onClick={() => setPage(value => value + 1)}>Next</button></div>
      </>}
    </>}
  </section>;
}
