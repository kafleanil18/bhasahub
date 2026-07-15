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

  // form hooks
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null); // student object
  const [selectedCourse, setSelectedCourse] = useState('');
  const [amount, setAmount] = useState(30);
  const [unit, setUnit] = useState('days');

  // list filter hooks
  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState('all'); // all, active, expired

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
        body: JSON.stringify({ userId: selectedStudent._id, courseId: selectedCourse, days }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Access granted successfully!');
        setSelectedStudent(null);
        setStudentSearch('');
        setSelectedCourse('');
        setAmount(30);
        setUnit('days');
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

  // Get User Initials for avatars
  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Filter students based on input search
  const filteredStudents = studentSearch.trim() === ''
    ? []
    : students.filter(
        (s) =>
          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.email.toLowerCase().includes(studentSearch.toLowerCase())
      );

  // Stats computation
  const activeCount = subs.filter(isActive).length;
  const expiredCount = subs.filter((s) => !isActive(s)).length;

  // Filtered subscriptions list
  const filteredSubs = subs.filter((sub) => {
    const userName = sub.user?.name || '';
    const userEmail = sub.user?.email || '';
    const courseTitle = sub.course?.title || '';
    const query = listSearch.toLowerCase();

    const matchesSearch =
      userName.toLowerCase().includes(query) ||
      userEmail.toLowerCase().includes(query) ||
      courseTitle.toLowerCase().includes(query);

    const isSubActive = isActive(sub);
    const matchesStatus =
      listStatus === 'all' ||
      (listStatus === 'active' && isSubActive) ||
      (listStatus === 'expired' && !isSubActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="admin container">
      {/* Back button */}
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      
      <h1 className="section-title" style={{ marginBottom: 8 }}>Subscriptions & Access</h1>
      <p style={{ color: 'var(--mist)', fontSize: 15, marginBottom: 24 }}>
        Audit active learning tokens and enroll students into academic modules.
      </p>

      {error && <p className="login-error" style={{ marginBottom: 20 }}>{error}</p>}
      {message && <p className="login-success" style={{ marginBottom: 20 }}>{message}</p>}

      {/* 1. Statistics Cards */}
      <div className="subs-stats-grid">
        <div className="subs-stat-card">
          <div className="subs-stat-icon active">✔</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{activeCount}</span>
            <span className="subs-stat-label">Active Enrolments</span>
          </div>
        </div>
        <div className="subs-stat-card">
          <div className="subs-stat-icon expired">⏰</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{expiredCount}</span>
            <span className="subs-stat-label">Expired Licenses</span>
          </div>
        </div>
        <div className="subs-stat-card">
          <div className="subs-stat-icon courses">📖</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{courses.length}</span>
            <span className="subs-stat-label">Total Courses</span>
          </div>
        </div>
      </div>

      {/* 2. Main layout */}
      <div className="subs-manager-grid">
        
        {/* Left Column: Grant Access Form */}
        <div className="admin-form">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
            Grant course access
          </h2>
          
          {/* Student Picker */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mist)', marginBottom: '8px' }}>
              Student Account
            </label>
            
            {!selectedStudent ? (
              <div className="student-search-container">
                <input
                  type="text"
                  placeholder="Type name or email to search..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)' }}
                />
                {filteredStudents.length > 0 && (
                  <div className="student-search-results">
                    {filteredStudents.map((s) => (
                      <div
                        key={s._id}
                        className="student-search-item"
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentSearch('');
                        }}
                      >
                        <div className="student-search-avatar">{getInitials(s.name)}</div>
                        <div className="student-search-details">
                          <span className="student-search-name">{s.name}</span>
                          <span className="student-search-email">{s.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {studentSearch.trim() !== '' && filteredStudents.length === 0 && (
                  <div className="student-search-results" style={{ padding: '12px', fontSize: '13px', color: 'var(--mist)', textAlign: 'center' }}>
                    No students match your query.
                  </div>
                )}
              </div>
            ) : (
              <div className="selected-student-card">
                <div className="info">
                  <span className="name">{selectedStudent.name}</span>
                  <span className="email">{selectedStudent.email}</span>
                </div>
                <button
                  type="button"
                  className="remove"
                  onClick={() => setSelectedStudent(null)}
                  aria-label="Remove student"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Course Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mist)', marginBottom: '8px' }}>
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)' }}
            >
              <option value="">— pick a course —</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title} ({c.level})</option>
              ))}
            </select>
          </div>

          {/* Duration Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mist)', marginBottom: '8px' }}>
              Licensing Term
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)' }}
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)', width: '100px' }}
              >
                <option value="days">days</option>
                <option value="months">months</option>
              </select>
            </div>

            {/* Quick Presets */}
            <div className="duration-presets">
              <button
                type="button"
                className={`preset-btn ${amount === 7 && unit === 'days' ? 'active' : ''}`}
                onClick={() => { setAmount(7); setUnit('days'); }}
              >
                1 Week
              </button>
              <button
                type="button"
                className={`preset-btn ${amount === 30 && unit === 'days' ? 'active' : ''}`}
                onClick={() => { setAmount(30); setUnit('days'); }}
              >
                30 Days
              </button>
              <button
                type="button"
                className={`preset-btn ${amount === 90 && unit === 'days' ? 'active' : ''}`}
                onClick={() => { setAmount(90); setUnit('days'); }}
              >
                3 Months
              </button>
              <button
                type="button"
                className={`preset-btn ${amount === 365 && unit === 'days' ? 'active' : ''}`}
                onClick={() => { setAmount(365); setUnit('days'); }}
              >
                1 Year
              </button>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={grant}
            style={{ width: '100%', padding: '12px', fontWeight: 650, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            🔑 Grant Access
          </button>
        </div>

        {/* Right Column: Audit Logs & Search */}
        <div className="admin-list">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
            All active grants
          </h2>

          {/* Filter Bar */}
          <div className="list-filter-bar">
            <input
              type="text"
              placeholder="Search by student name, email, or course..."
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
            />
            <select
              value={listStatus}
              onChange={(e) => setListStatus(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="expired">Expired only</option>
            </select>
          </div>

          {filteredSubs.length === 0 ? (
            <p className="admin-empty" style={{ textAlign: 'center', padding: '30px 0' }}>
              No subscriptions match your filter criteria.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredSubs.map((sub) => (
                <div
                  className={`admin-row ${isActive(sub) ? '' : 'sub-expired'}`}
                  key={sub._id}
                  style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}
                >
                  {/* Avatar */}
                  <div className="student-search-avatar" style={{ width: '40px', height: '40px', fontSize: '13px', background: 'var(--card)' }}>
                    {getInitials(sub.user?.name)}
                  </div>

                  {/* Student Details */}
                  <div className="row-info" style={{ flex: '1 1 200px', minWidth: '150px' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                      {sub.user ? sub.user.name : 'Deleted Student'}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '2px' }}>
                      {sub.user ? sub.user.email : ''}
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="row-info" style={{ flex: '1 1 200px', minWidth: '150px' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                      {sub.course ? sub.course.title : 'Deleted Course'}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '2px' }}>
                      {isActive(sub)
                        ? `⏱ ${daysLeft(sub)} days remaining`
                        : `⛔ Expired ${new Date(sub.expiresAt).toLocaleDateString()}`}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`pill ${isActive(sub) ? 'pill-live' : 'pill-draft'}`}>
                      {isActive(sub) ? 'Active' : 'Expired'}
                    </span>
                    
                    <button
                      className="row-delete"
                      onClick={() => revoke(sub._id)}
                      style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

export default SubscriptionManager;