import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';

function SubscriptionManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // grant form
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [amount, setAmount] = useState(30);
  const [unit, setUnit] = useState('days');

  const loadStudents = async () => {
    try {
      const res = await fetch(`${API}/subscriptions/students`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setStudents(data);
      else setError(data.error || 'Could not load students');
    } catch {
      setError('Could not reach the server');
    }
  };

  const loadCourses = async () => {
    try {
      const res = await fetch(`${API}/courses`);
      const data = await res.json();
      if (res.ok) setCourses(data);
    } catch {
      // ignore
    }
  };

  const loadSubs = async () => {
    try {
      const res = await fetch(`${API}/subscriptions/all`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setSubs(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStudents();
    loadCourses();
    loadSubs();
  }, []);

  const grant = async () => {
    setError('');
    setMessage('');
    if (!selectedStudent || !selectedCourse) {
      return setError('Please pick a student and a course');
    }
    const days = unit === 'months' ? Number(amount) * 30 : Number(amount);
    try {
      const res = await fetch(`${API}/subscriptions`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ userId: selectedStudent, courseId: selectedCourse, days }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Access granted!');
        loadSubs();
      } else {
        setError(data.error || 'Could not grant access');
      }
    } catch {
      setError('Could not reach the server');
    }
  };

  const revoke = async (id) => {
    if (!confirm('Revoke this access?')) return;
    await fetch(`${API}/subscriptions/${id}`, { method: 'DELETE', headers: authHeaders });
    loadSubs();
  };

  const isActive = (sub) => new Date(sub.expiresAt) > new Date();

  const daysLeft = (sub) => {
    const ms = new Date(sub.expiresAt) - new Date();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Subscriptions & Access</h1>
      {error && <p className="login-error">{error}</p>}
      {message && <p className="login-success">{message}</p>}

      {/* Grant access */}
      <div className="admin-form" style={{ maxWidth: 720, marginBottom: 32 }}>
        <h2>Grant course access</h2>
        <label>Student
          <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
            <option value="">— pick a student —</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </label>
        <label>Course
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">— pick a course —</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title} ({c.level})</option>
            ))}
          </select>
        </label>
        <label>Duration
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="days">days</option>
              <option value="months">months</option>
            </select>
          </div>
        </label>
        <button className="btn-primary" onClick={grant}>Grant access</button>
      </div>

      {/* Current subscriptions */}
      <div className="admin-list">
        <h2>All access grants ({subs.length})</h2>
        {subs.length === 0 && <p className="admin-empty">No access granted yet.</p>}
        {subs.map((sub) => (
          <div className={`admin-row ${isActive(sub) ? '' : 'sub-expired'}`} key={sub._id}>
            <div className="row-info">
              <strong>{sub.user ? sub.user.name : 'Unknown'}</strong>
              <span>{sub.user ? sub.user.email : ''}</span>
            </div>
            <div className="row-info">
              <strong>{sub.course ? sub.course.title : 'Unknown course'}</strong>
              <span>
                {isActive(sub)
                  ? `${daysLeft(sub)} days left · expires ${new Date(sub.expiresAt).toLocaleDateString()}`
                  : `Expired ${new Date(sub.expiresAt).toLocaleDateString()}`}
              </span>
            </div>
            <span className={isActive(sub) ? 'pill pill-live' : 'pill pill-draft'}>
              {isActive(sub) ? 'Active' : 'Expired'}
            </span>
            <button className="row-delete" onClick={() => revoke(sub._id)}>Revoke</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SubscriptionManager;