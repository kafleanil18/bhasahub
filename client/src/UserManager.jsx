import { useState, useEffect } from 'react';

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

  const roleBadge = (role) => {
    if (role === 'superadmin') return <span className="pill pill-super">Super Admin</span>;
    if (role === 'admin') return <span className="pill pill-live">Admin</span>;
    return <span className="pill pill-draft">Student</span>;
  };

  return (
    <section className="admin container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Manage Admins</h1>
      <p className="course-desc">Promote a user to admin (subscriptions access) or set them back to student.</p>
      {error && <p className="login-error">{error}</p>}
      {message && <p className="login-success">{message}</p>}

      <input
        className="user-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        style={{ maxWidth: 360, margin: '16px 0' }}
      />

      {loading && <p className="courses-empty">Loading users...</p>}
      {!loading && visible.length === 0 && <p className="courses-empty">No users found.</p>}

      <div className="admin-list">
        {visible.map((u) => (
          <div className="admin-row" key={u._id}>
            <div className="row-info">
              <strong>{u.name}</strong>
              <span>{u.email}</span>
            </div>
            {roleBadge(u.role)}
            {u.role === 'superadmin' ? (
              <span className="user-locked-note">— protected —</span>
            ) : u.role === 'admin' ? (
              <button className="nav-btn" onClick={() => setRole(u._id, 'student')}>
                Demote to student
              </button>
            ) : (
              <button className="btn-primary" onClick={() => setRole(u._id, 'admin')}>
                Promote to admin
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default UserManager;