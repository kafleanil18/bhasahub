import { useState, useEffect, useMemo } from 'react';

const API = 'http://localhost:5001/api';

function UserManager({ onBack }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`${API}/users`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setUsers(data);
      else setError(data.error || 'Could not load users');
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setRole = async (id, role) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API}/users/${id}/role`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Role updated to ${role}.`);
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
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length;
    const superAdmins = users.filter((u) => u.role === 'superadmin').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const students = total - superAdmins - admins;
    return { total, superAdmins, admins, students };
  }, [users]);

  const roleBadge = (role) => {
    if (role === 'superadmin') return <span className="um-badge super">Super Admin</span>;
    if (role === 'admin') return <span className="um-badge admin">Admin</span>;
    return <span className="um-badge student">Student</span>;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <section className="admin container">
      {/* Scoped CSS override styling block */}
      <style>{`
        .admin.container {
          padding-top: 40px;
          padding-bottom: 80px;
        }

        .um-header-row {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--line);
          padding-bottom: 1.5rem;
        }

        .um-header-row h1 {
          font-family: 'Fraunces', serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: var(--ink);
          margin: 0;
        }

        .um-header-row p {
          color: var(--mist);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        /* Metrics Grid */
        .um-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .um-metric-card {
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
        .um-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
        }

        .um-metric-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        .um-metric-icon.gold {
          background: rgba(201, 154, 60, 0.08);
          color: var(--gold);
        }
        .um-metric-icon.seal {
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal);
        }

        .um-metric-details {
          display: flex;
          flex-direction: column;
        }

        .um-metric-value {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
        }

        .um-metric-label {
          font-size: 0.8rem;
          color: var(--mist);
          font-weight: 500;
          margin-top: 0.25rem;
        }

        /* Search input styling */
        .um-search-container {
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .um-search-input {
          width: 100%;
          max-width: 420px;
          padding: 0.8rem 1.2rem;
          border: 1px solid var(--line);
          background: var(--card);
          border-radius: 10px;
          font-size: 0.95rem;
          color: var(--ink);
          transition: all 0.2s;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }
        .um-search-input:focus {
          outline: none;
          border-color: var(--jade);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(46, 107, 87, 0.08);
        }

        /* Admin user cards list */
        .admin-list {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 6px 20px rgba(42, 35, 32, 0.02);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .admin-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #ffffff;
          margin-bottom: 0px;
          transition: all 0.2s ease;
        }
        .admin-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(42, 35, 32, 0.04);
          border-color: var(--jade);
        }

        .um-user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--jade) 0%, var(--gold) 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          flex-shrink: 0;
        }

        .row-info {
          flex-grow: 1;
          min-width: 0;
        }

        .row-info strong {
          font-family: 'Fraunces', serif;
          font-size: 1.15rem;
          font-weight: 750;
          color: var(--ink);
          display: block;
          margin-bottom: 0.15rem;
        }

        .row-info span {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--mist);
        }

        /* Role Badges */
        .um-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
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

        .user-locked-note {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--mist);
          font-style: italic;
          padding: 6px 12px;
          flex-shrink: 0;
        }

        /* Action buttons */
        .um-btn-action {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
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

      <button className="back-btn" onClick={onBack}>← Back to home</button>
      
      <div className="um-header-row">
        <h1>Admin Directory</h1>
        <p>Audit credentials, search registry files, and configure role privileges</p>
      </div>

      {error && <p className="login-error">{error}</p>}
      {message && <p className="login-success">{message}</p>}

      {/* Metrics Section */}
      <div className="um-metrics-grid">
        <div className="um-metric-card">
          <div className="um-metric-icon">👥</div>
          <div className="um-metric-details">
            <span className="um-metric-value">{stats.total}</span>
            <span className="um-metric-label">Registered Profiles</span>
          </div>
        </div>
        <div className="um-metric-card">
          <div className="um-metric-icon gold">🛠</div>
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

      <div className="um-search-container">
        <input
          className="um-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search administrators by name or email..."
        />
      </div>

      {loading && <p className="um-empty-state">Loading registry records...</p>}
      {!loading && visible.length === 0 && <p className="um-empty-state">No users match your query.</p>}

      {!loading && visible.length > 0 && (
        <div className="admin-list">
          {visible.map((u) => (
            <div className="admin-row" key={u._id}>
              <div className="um-user-avatar">
                {getInitials(u.name)}
              </div>
              
              <div className="row-info">
                <strong>{u.name}</strong>
                <span>{u.email}</span>
              </div>
              
              {roleBadge(u.role)}
              
              {u.role === 'superadmin' ? (
                <span className="user-locked-note">— protected —</span>
              ) : u.role === 'admin' ? (
                <button className="um-btn-action demote" onClick={() => setRole(u._id, 'student')}>
                  Demote to student
                </button>
              ) : (
                <button className="um-btn-action promote" onClick={() => setRole(u._id, 'admin')}>
                  Promote to admin
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default UserManager;