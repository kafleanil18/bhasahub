import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  approve: 'Approved',
  deny: 'Denied',
  grant: 'Granted',
  revoke: 'Revoked',
  'role-change': 'Role changed',
};

const ACTION_CLASS = {
  create: 'audit-badge-create',
  update: 'audit-badge-update',
  delete: 'audit-badge-delete',
  approve: 'audit-badge-create',
  deny: 'audit-badge-delete',
  grant: 'audit-badge-create',
  revoke: 'audit-badge-delete',
  'role-change': 'audit-badge-update',
};

const RESOURCE_LABELS = {
  course: 'Course',
  lesson: 'Lesson',
  test: 'Test',
  user: 'User',
  subscription: 'Subscription',
  'access-request': 'Access request',
  'team-member': 'Team member',
  testimonial: 'Testimonial',
  'pinyin-table': 'Pinyin table',
};

function AuditLog({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/audit-log`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
        else setError(data.error || 'Could not load the activity log');
      })
      .catch(() => setError('Could not reach the server'))
      .finally(() => setLoading(false));
  }, []);

  const resourceTypes = ['all', ...Array.from(new Set(entries.map((e) => e.resourceType)))];
  const filtered = resourceFilter === 'all' ? entries : entries.filter((e) => e.resourceType === resourceFilter);

  const formatWhen = (iso) => new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <section className="container" style={{ padding: '32px 0 60px' }}>
      <button className="back-btn" onClick={onBack} style={{ marginBottom: 16 }}>← Back to home</button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title" style={{ marginBottom: 4 }}>Activity log</h1>
        <p style={{ color: 'var(--mist)' }}>Who did what across the admin tools, most recent first.</p>
      </div>

      {error && <p className="login-error" style={{ marginBottom: 20 }}>{error}</p>}

      <div className="admin-list">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ marginBottom: 0 }}>Recent activity ({filtered.length})</h2>
          {entries.length > 0 && (
            <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All resource types' : (RESOURCE_LABELS[type] || type)}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty">No activity recorded yet.</p>
        ) : (
          filtered.map((entry) => (
            <div className="admin-row audit-row" key={entry._id}>
              <span className="audit-row-time">{formatWhen(entry.createdAt)}</span>
              <span className="audit-row-actor">{entry.actor ? entry.actor.name : 'Deleted user'}</span>
              <span className={`audit-badge ${ACTION_CLASS[entry.action] || 'audit-badge-update'}`}>
                {ACTION_LABELS[entry.action] || entry.action}
              </span>
              <span className="audit-row-resource">{RESOURCE_LABELS[entry.resourceType] || entry.resourceType}</span>
              <span className="audit-row-label">{entry.label}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default AuditLog;
