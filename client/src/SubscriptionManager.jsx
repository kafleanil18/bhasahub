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
      {/* Scoped CSS override block to elevate layouts to premium BhashaHub standards */}
      <style>{`
        .admin.container {
          padding-top: 40px;
          padding-bottom: 80px;
        }

        .sm-header-row {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--line);
          padding-bottom: 1.5rem;
        }

        .sm-header-row h1 {
          font-family: 'Fraunces', serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: var(--ink);
          margin: 0;
        }

        .sm-header-row p {
          color: var(--mist);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        /* Metrics grid */
        .subs-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin: 0 0 2.5rem 0;
        }

        .subs-stat-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 12px rgba(42, 35, 32, 0.02);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .subs-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
        }

        .subs-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
        }
        .subs-stat-icon.active {
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade);
        }
        .subs-stat-icon.expired {
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal);
        }
        .subs-stat-icon.courses {
          background: rgba(201, 154, 60, 0.08);
          color: var(--gold);
        }

        .subs-stat-number {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
        }

        /* Workspaces layout */
        .subs-manager-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (min-width: 992px) {
          .subs-manager-grid {
            grid-template-columns: 380px 1fr;
          }
        }

        .admin-form, .admin-list {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 6px 20px rgba(42, 35, 32, 0.02);
        }

        .admin-form h2, .admin-list h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--line);
          padding-bottom: 0.75rem;
        }

        .admin-form label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* inputs override */
        .admin-form input[type=text],
        .admin-form input[type=number],
        .admin-form select {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid var(--line);
          background: var(--paper);
          border-radius: 10px;
          font-size: 0.95rem;
          color: var(--ink);
          box-sizing: border-box;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .admin-form input:focus, .admin-form select:focus {
          outline: none;
          border-color: var(--jade);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        /* Student Search dropdown results override */
        .student-search-results {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background: #ffffff;
          border: 1px solid var(--line);
          border-radius: 10px;
          max-height: 220px;
          overflow-y: auto;
          z-index: 10;
          box-shadow: 0 10px 25px rgba(42, 35, 32, 0.08);
        }

        .student-search-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--line);
          transition: background 0.15s ease;
        }
        .student-search-item:hover {
          background: var(--paper);
        }

        .student-search-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--jade) 0%, var(--gold) 100%);
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .student-search-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--ink);
        }

        .student-search-email {
          font-size: 0.75rem;
          color: var(--mist);
        }

        /* Selected card */
        .selected-student-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid var(--line);
          padding: 10px 14px;
          border-radius: 10px;
          margin-top: 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }
        .selected-student-card .name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--ink);
        }
        .selected-student-card .email {
          font-size: 0.75rem;
          color: var(--mist);
        }
        .selected-student-card button.remove {
          background: none;
          border: none;
          color: var(--seal);
          cursor: pointer;
          font-weight: 700;
          font-size: 1rem;
          padding: 4px 8px;
          transition: transform 0.2s;
        }
        .selected-student-card button.remove:hover {
          transform: scale(1.15);
        }

        /* Presets pill tags */
        .duration-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .preset-btn {
          background: var(--paper);
          border: 1px solid var(--line);
          color: var(--ink);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-btn:hover {
          border-color: var(--jade);
          color: var(--jade);
          background: transparent;
        }
        .preset-btn.active {
          background: var(--jade);
          border-color: var(--jade);
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(46, 107, 87, 0.25);
        }

        /* Action buttons override */
        .admin-form button.btn-primary {
          width: 100%;
          background-color: var(--jade);
          color: white;
          border: none;
          padding: 0.85rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          box-shadow: 0 4px 14px rgba(46, 107, 87, 0.2);
        }
        .admin-form button.btn-primary:hover {
          background-color: #245444;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(46, 107, 87, 0.3);
        }

        /* Filter bar layout */
        .list-filter-bar {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .list-filter-bar input {
          flex-grow: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--line);
          background: var(--paper);
          border-radius: 10px;
          font-size: 0.9rem;
          color: var(--ink);
          outline: none;
          transition: all 0.2s;
        }
        .list-filter-bar input:focus {
          border-color: var(--jade);
          background: #ffffff;
        }
        .list-filter-bar select {
          padding: 0.75rem 1rem;
          border: 1px solid var(--line);
          background: #ffffff;
          border-radius: 10px;
          font-size: 0.9rem;
          color: var(--ink);
          outline: none;
          cursor: pointer;
        }

        /* Active list override card items */
        .admin-row {
          background: #ffffff !important;
          border: 1px solid var(--line) !important;
          border-radius: 14px !important;
          padding: 1.25rem !important;
          display: flex !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          gap: 1.25rem !important;
          transition: all 0.2s ease;
        }
        .admin-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
          border-color: var(--jade);
        }
        .admin-row.sub-expired {
          background: rgba(122, 114, 102, 0.02) !important;
          opacity: 0.75;
          border-color: var(--line) !important;
        }
        .admin-row.sub-expired:hover {
          transform: none;
          box-shadow: none;
        }

        .admin-row .student-search-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--jade) 0%, var(--gold) 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          flex-shrink: 0;
        }
        .admin-row.sub-expired .student-search-avatar {
          background: var(--line) !important;
          color: var(--mist) !important;
        }

        .row-info strong {
          font-family: 'Fraunces', serif;
          font-size: 1.1rem;
          font-weight: 750;
          color: var(--ink);
          display: block;
          margin-bottom: 0.15rem;
        }

        .row-info span {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--mist);
        }

        /* Status Pills override */
        .pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          text-align: center;
        }
        .pill-live {
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade);
          border-color: rgba(46, 107, 87, 0.2);
        }
        .pill-draft {
          background: rgba(122, 114, 102, 0.08);
          color: var(--mist);
          border-color: rgba(122, 114, 102, 0.15);
        }

        /* Revoke button override */
        .row-delete {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--seal);
          background: rgba(200, 54, 42, 0.04);
          border: 1px solid rgba(200, 54, 42, 0.08);
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          text-align: center;
        }
        .row-delete:hover {
          background: rgba(200, 54, 42, 0.08);
          border-color: var(--seal);
          text-decoration: none;
        }

        .admin-empty {
          text-align: center;
          color: var(--mist);
          padding: 3rem 1rem;
          font-style: italic;
        }
      `}</style>

      {/* Back button */}
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      
      <div className="sm-header-row">
        <h1>Subscriptions & Access</h1>
        <p>Audit active learning tokens, grant course licenses, and manage access logs</p>
      </div>

      {error && <p className="login-error" style={{ marginBottom: 20 }}>{error}</p>}
      {message && <p className="login-success" style={{ marginBottom: 20 }}>{message}</p>}

      {/* 1. Statistics Cards */}
      <div className="subs-stats-grid">
        <div className="subs-stat-card">
          <div className="subs-stat-icon active">✔</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{activeCount}</span>
            <span className="subs-stat-label">Active Licenses</span>
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
            <span className="subs-stat-label">Total Paths</span>
          </div>
        </div>
      </div>

      {/* 2. Main layout */}
      <div className="subs-manager-grid">
        
        {/* Left Column: Grant Access Form */}
        <div className="admin-form">
          <h2>Grant course access</h2>
          
          {/* Student Picker */}
          <div className="tm-form-group">
            <label className="ap-label">Student Account</label>
            
            {!selectedStudent ? (
              <div className="student-search-container">
                <input
                  type="text"
                  placeholder="Type name or email to search..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
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
          <div className="tm-form-group">
            <label className="ap-label">Select Course Path</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">— pick a course path —</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title} ({c.level || 'General'})</option>
              ))}
            </select>
          </div>

          {/* Duration Input */}
          <div className="tm-form-group">
            <label className="ap-label">Licensing Term</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ width: '110px' }}
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
          >
            🔑 Grant Course Access
          </button>
        </div>

        {/* Right Column: Audit Logs & Search */}
        <div className="admin-list">
          <h2>All active grants</h2>

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
            <p className="admin-empty">
              No subscriptions match your filter criteria.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredSubs.map((sub) => (
                <div
                  className={`admin-row ${isActive(sub) ? '' : 'sub-expired'}`}
                  key={sub._id}
                >
                  {/* Avatar */}
                  <div className="student-search-avatar">
                    {getInitials(sub.user?.name)}
                  </div>

                  {/* Student Details */}
                  <div className="row-info">
                    <strong>
                      {sub.user ? sub.user.name : 'Deleted Student'}
                    </strong>
                    <span>
                      {sub.user ? sub.user.email : ''}
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="row-info">
                    <strong>
                      {sub.course ? sub.course.title : 'Deleted Course'}
                    </strong>
                    <span style={{ color: isActive(sub) ? 'var(--jade)' : 'var(--mist)', fontWeight: 600 }}>
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