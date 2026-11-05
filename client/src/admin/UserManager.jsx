import { useState, useEffect, useMemo, useCallback } from 'react';

const API = window.API_BASE_URL + '/api';

function UserManager({ onBack }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const authHeaders = { Authorization: `Bearer ${token}` };
    try {
      const res = await fetch(`${API}/users`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setUsers(data);
      else setError(data.error || 'Could not load users');
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setRole = async (id, role) => {
    setError('');
    setMessage('');
    const token = localStorage.getItem('token');
    const authHeaders = { Authorization: `Bearer ${token}` };
    const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };
    try {
      const res = await fetch(`${API}/users/${id}/role`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Role updated successfully to ${role}.`);
        load();
      } else {
        setError(data.error || 'Could not update role');
      }
    } catch {
      setError('Could not reach the server');
    }
  };

  const visible = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length;
    const superAdmins = users.filter((u) => u.role === 'superadmin').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const students = users.filter((u) => u.role === 'student' || (!u.role || (u.role !== 'admin' && u.role !== 'superadmin'))).length;
    return { total, superAdmins, admins, students };
  }, [users]);

  const roleBadge = (role) => {
    if (role === 'superadmin') return <span className="um-badge super">Super Admin</span>;
    if (role === 'admin') return <span className="um-badge admin">Admin</span>;
    return <span className="um-badge student">Student</span>;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <section className="admin container">
      {/* Scoped CSS override styling block */}
      <style>{`
        .admin.container {
          padding-top: 32px;
          padding-bottom: 80px;
        }

        .um-header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 20px;
        }

        .um-title-group {
          flex: 1;
        }

        .um-subtitle {
          font-size: 14px;
          color: var(--mist);
          margin-top: 4px;
        }

        /* Metrics Grid */
        .um-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .um-metric-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(42, 35, 32, 0.02);
        }
        .um-metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(42, 35, 32, 0.06);
          border-color: var(--mist);
        }

        .um-metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(46, 107, 87, 0.1);
          color: var(--jade);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .um-metric-icon.gold {
          background: rgba(201, 154, 60, 0.1);
          color: var(--gold);
        }
        .um-metric-icon.seal {
          background: rgba(169, 35, 22, 0.1);
          color: var(--seal);
        }

        .um-metric-details {
          display: flex;
          flex-direction: column;
        }

        .um-metric-value {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
        }

        .um-metric-label {
          font-size: 12px;
          color: var(--mist);
          font-weight: 600;
          margin-top: 4px;
        }

        /* Filter Controls */
        .um-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .um-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 280px;
          max-width: 440px;
        }

        .um-search-input-g {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid var(--line);
          background: var(--card);
          border-radius: 20px;
          font-size: 14px;
          color: var(--ink);
          transition: all 0.2s ease;
        }
        .um-search-input-g:focus {
          outline: none;
          border-color: var(--jade);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        .um-filter-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .btn-filter-pill {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--mist);
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-filter-pill:hover {
          color: var(--ink);
          background: var(--rice);
        }
        .btn-filter-pill.active {
          background: var(--ink);
          color: var(--paper);
          border-color: var(--ink);
        }

        /* Directory Cards list */
        .admin-directory-deck {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .admin-row-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(42, 35, 32, 0.02);
          position: relative;
        }
        .admin-row-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 18px rgba(42, 35, 32, 0.05);
          border-color: var(--mist);
        }

        .admin-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .um-user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          color: #ffffff;
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          flex-shrink: 0;
        }
        .um-user-avatar.superadmin {
          background: linear-gradient(135deg, var(--seal) 0%, #a92316 100%);
        }
        .um-user-avatar.admin {
          background: linear-gradient(135deg, var(--jade) 0%, #1e4d3e 100%);
        }
        .um-user-avatar.student {
          background: linear-gradient(135deg, var(--mist) 0%, #595248 100%);
        }

        .card-details-group {
          min-width: 0;
          flex: 1;
        }

        .card-name-text {
          font-family: 'Fraunces', serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }

        .card-email-text {
          font-size: 12px;
          color: var(--mist);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
          margin-top: 2px;
        }

        /* Role Badges */
        .um-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
        }
        .um-badge.super {
          background: rgba(169, 35, 22, 0.08);
          color: var(--seal);
          border-color: rgba(169, 35, 22, 0.2);
        }
        .um-badge.admin {
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade);
          border-color: rgba(46, 107, 87, 0.2);
        }
        .um-badge.student {
          background: rgba(122, 114, 102, 0.08);
          color: var(--mist);
          border-color: rgba(122, 114, 102, 0.15);
        }

        .card-actions-wrapper {
          border-top: 1px dashed var(--line);
          padding-top: 14px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: auto;
        }

        .user-locked-note {
          font-size: 11px;
          font-weight: 600;
          color: var(--mist);
          font-style: italic;
        }

        /* Action buttons */
        .um-btn-action {
          width: 100%;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .um-btn-action.promote {
          background-color: var(--jade);
          color: white;
          border: none;
          box-shadow: 0 4px 10px rgba(46, 107, 87, 0.15);
        }
        .um-btn-action.promote:hover {
          background-color: #245444;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(46, 107, 87, 0.25);
        }

        .um-btn-action.demote {
          background-color: var(--paper);
          color: var(--ink);
          border: 1px solid var(--line);
        }
        .um-btn-action.demote:hover {
          background-color: var(--rice);
          border-color: var(--mist);
        }

        .um-empty-state {
          text-align: center;
          color: var(--mist);
          padding: 3rem 1rem;
          font-style: italic;
        }

        .um-header-section { border: 0; padding: 28px 0 24px; margin-bottom: 24px; }
        .um-refresh-button { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 46px; padding: 10px 15px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
        .um-refresh-button:hover:not(:disabled) { border-color: var(--seal); color: var(--seal); }
        .um-refresh-button:disabled { opacity: .6; cursor: wait; }
        .um-title-group { min-width: 0; }
        .um-title-group .section-title { font-size: clamp(36px, 4vw, 48px); letter-spacing: -.035em; }
        .um-subtitle { margin-top: 8px; font-size: 16px; line-height: 1.65; max-width: 680px; }
        .um-metrics-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 28px; }
        .um-metric-card { border-radius: 12px; padding: 18px; box-shadow: none; }
        .um-metric-card:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(42,35,32,.06); border-color: var(--line); }
        .um-metric-icon { width: 42px; height: 42px; border-radius: 10px; }
        .um-metric-value { font-size: 30px; }
        .um-metric-label { font-size: 14px; }
        .um-controls-row { align-items: stretch; padding: 18px; border: 1px solid var(--line); border-radius: 12px 12px 0 0; background: var(--card); margin: 0; gap: 14px; }
        .um-search-wrapper { max-width: none; min-width: min(280px, 100%); }
        .um-search-input-g { min-height: 48px; padding: 10px 16px; border-radius: 8px; font: inherit; }
        .um-search-input-g:focus { border-color: var(--seal); box-shadow: 0 0 0 3px color-mix(in srgb, var(--seal) 12%, transparent); }
        .um-filter-tabs { align-items: center; gap: 8px; }
        .btn-filter-pill { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 7px 12px; font: inherit; }
        .btn-filter-pill.active { background: var(--seal); border-color: var(--seal); }
        .um-filter-count { display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding-inline: 5px; border-radius: 99px; background: color-mix(in srgb, currentColor 12%, transparent); font-size: 12px; font-weight: 700; }
        .um-results-summary { padding: 14px 18px; border-inline: 1px solid var(--line); background: var(--card); color: var(--mist); font-size: 14px; }
        .um-results-summary strong { color: var(--ink); }
        .admin-directory-deck { grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 14px; padding: 0 18px 18px; border: 1px solid var(--line); border-top: 0; border-radius: 0 0 12px 12px; background: var(--card); }
        .admin-row-card { gap: 14px; padding: 20px; border-radius: 10px; box-shadow: none; }
        .admin-row-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--seal) 38%, var(--line)); box-shadow: 0 10px 24px rgba(42,35,32,.05); }
        .um-user-avatar { border-radius: 12px; width: 50px; height: 50px; }
        .um-user-avatar.superadmin { background: color-mix(in srgb, var(--seal) 12%, var(--card)); color: var(--seal); box-shadow: none; }
        .um-user-avatar.admin { background: color-mix(in srgb, var(--jade) 12%, var(--card)); color: var(--jade); box-shadow: none; }
        .um-user-avatar.student { background: var(--rice); color: var(--ink); box-shadow: none; }
        .card-name-text { font-family: var(--font-body, 'Inter', sans-serif); font-size: 18px; }
        .card-email-text { font-size: 14px; }
        .um-badge { font-size: 12px; padding: 5px 10px; border-radius: 999px; }
        .um-btn-action { min-height: 44px; padding: 9px 14px; font: inherit; }
        .um-btn-action.promote { background: var(--seal); box-shadow: none; }
        .um-btn-action.promote:hover { background: #8f1d14; box-shadow: none; }
        .card-actions-wrapper { border-top-style: solid; }
        @media (max-width: 900px) { .um-metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 680px) {
          .admin.container { padding-top: 20px; }
          .um-header-section { padding-top: 12px; }
          .um-refresh-button { width: 100%; }
          .um-controls-row { padding: 14px; }
          .um-search-wrapper { min-width: 100%; }
          .um-filter-tabs { width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
          .btn-filter-pill { white-space: nowrap; }
          .admin-directory-deck { padding: 0 12px 12px; }
        }
      `}</style>

      {/* Header and navigation */}
      <div className="um-header-section">
        <div className="um-title-group">
          <button className="btn-back-pill" onClick={onBack}>
            ← Back to control panel
          </button>
          <h1 className="section-title" style={{ margin: 0, marginTop: 12 }}>Admin Directory</h1>
          <p className="um-subtitle">Find people quickly, see their access level, and update administrator permissions.</p>
        </div>
        <button className="um-refresh-button" type="button" onClick={load} disabled={loading}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></svg>
          {loading ? 'Updating…' : 'Refresh directory'}
        </button>
      </div>

      {error && <p className="login-error" style={{ marginBottom: 20 }}>{error}</p>}
      {message && <p className="login-success" style={{ marginBottom: 20 }}>{message}</p>}

      {/* Metrics Cards */}
      <div className="um-metrics-grid">
        <div className="um-metric-card">
          <div className="um-metric-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="um-metric-details">
            <span className="um-metric-value">{stats.total}</span>
            <span className="um-metric-label">Registered Profiles</span>
          </div>
        </div>
        <div className="um-metric-card">
          <div className="um-metric-icon gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div className="um-metric-details">
            <span className="um-metric-value">{stats.admins}</span>
            <span className="um-metric-label">Active Admins</span>
          </div>
        </div>
        <div className="um-metric-card">
          <div className="um-metric-icon seal" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div className="um-metric-details">
            <span className="um-metric-value">{stats.superAdmins}</span>
            <span className="um-metric-label">Super Admins</span>
          </div>
        </div>
        <div className="um-metric-card">
          <div className="um-metric-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>
          </div>
          <div className="um-metric-details">
            <span className="um-metric-value">{stats.students}</span>
            <span className="um-metric-label">Student Accounts</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="um-controls-row">
        <div className="um-search-wrapper">
          <input
            type="search"
            aria-label="Search people by name or email"
            className="um-search-input-g"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people by name or email…"
          />
        </div>

        <div className="um-filter-tabs">
          {[
            { id: 'all', label: 'Everyone', count: stats.total },
            { id: 'superadmin', label: 'Super admins', count: stats.superAdmins },
            { id: 'admin', label: 'Admins', count: stats.admins },
            { id: 'student', label: 'Students', count: stats.students }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn-filter-pill ${roleFilter === tab.id ? 'active' : ''}`}
              onClick={() => setRoleFilter(tab.id)}
            >
              {tab.label}<span className="um-filter-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {!loading && <div className="um-results-summary" aria-live="polite"><strong>{visible.length}</strong> {visible.length === 1 ? 'person' : 'people'} {search || roleFilter !== 'all' ? 'match your search' : 'in the directory'}</div>}

      {loading && <p className="um-empty-state">Loading registry records...</p>}
      {!loading && visible.length === 0 && <p className="um-empty-state">No users match your filters.</p>}

      {/* Grid List of cards */}
      {!loading && visible.length > 0 && (
        <div className="admin-directory-deck">
          {visible.map((u) => {
            const initials = getInitials(u.name);
            const userRole = u.role || 'student';

            return (
              <div className="admin-row-card" key={u._id}>
                <div className="admin-card-header">
                  <div className={`um-user-avatar ${userRole}`}>
                    {initials}
                  </div>
                  
                  <div className="card-details-group">
                    <span className="card-name-text" title={u.name}>{u.name}</span>
                    <span className="card-email-text" title={u.email}>{u.email}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: '14px', color: 'var(--mist)', fontWeight: 500 }}>System Access:</span>
                  {roleBadge(userRole)}
                </div>

                <div className="card-actions-wrapper">
                  {userRole === 'superadmin' ? (
                    <span className="user-locked-note">🔒 System Protected</span>
                  ) : userRole === 'admin' ? (
                    <button className="um-btn-action demote" onClick={() => setRole(u._id, 'student')}>
                      Demote to Student
                    </button>
                  ) : (
                    <button className="um-btn-action promote" onClick={() => setRole(u._id, 'admin')}>
                      Promote to Admin
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default UserManager;
