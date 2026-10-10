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
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
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
          background: rgba(200, 54, 42, 0.1);
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
          background: linear-gradient(135deg, var(--seal) 0%, #a6281e 100%);
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
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal);
          border-color: rgba(200, 54, 42, 0.2);
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
      `}</style>

      {/* Header and navigation */}
      <div className="um-header-section">
        <div className="um-title-group">
          <button className="btn-back-pill" onClick={onBack}>
            ← Back to control panel
          </button>
          <h1 className="section-title" style={{ margin: 0, marginTop: 12 }}>Admin Directory</h1>
          <p className="um-subtitle">Audit credentials, search registry files, and configure role privileges.</p>
        </div>
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
          <div className="um-metric-icon seal">🛡</div>
          <div className="um-metric-details">
            <span className="um-metric-value">{stats.superAdmins}</span>
            <span className="um-metric-label">Super Admins</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="um-controls-row">
        <div className="um-search-wrapper">
          <input
            className="um-search-input-g"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search administrators by name or email..."
          />
        </div>

        <div className="um-filter-tabs">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'superadmin', label: 'Super Admins' },
            { id: 'admin', label: 'Admins' },
            { id: 'student', label: 'Students' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn-filter-pill ${roleFilter === tab.id ? 'active' : ''}`}
              onClick={() => setRoleFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
                  <span style={{ fontSize: '11px', color: 'var(--mist)', fontWeight: 500 }}>System Access:</span>
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