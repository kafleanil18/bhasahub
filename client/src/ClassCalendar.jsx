import { useState, useEffect, useCallback, useMemo } from 'react';

const API = window.API_BASE_URL + '/api';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// yyyy-mm-dd using local date parts, so it lines up with what's shown on screen
function localKey(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// Inverse of localKey — builds a local midnight Date from a 'yyyy-mm-dd' string
function parseLocalDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Formats a stored date using the same local-day interpretation as localKey,
// so an entry's displayed date always matches the grid day it's filed under.
function formatDateLabel(dateValue, opts) {
  return parseLocalDateKey(localKey(dateValue)).toLocaleDateString(undefined, opts);
}

// '19:00' -> '7:00 PM'
function formatTime(t) {
  if (!t) return null;
  const [hStr, mStr] = t.split(':');
  const h = Number(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

// --- Calendar Export Helpers (Feature 2) ---
function getCalendarDates(u) {
  const dateKey = localKey(u.date);
  const [y, m, d] = dateKey.split('-').map(Number);

  if (u.time) {
    const [h, min] = u.time.split(':').map(Number);
    const start = new Date(y, m - 1, d, h, min, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour duration

    const toIsoClean = (dt) => dt.toISOString().replace(/-|:|\.\d+/g, '');
    return {
      isAllDay: false,
      gcalDates: `${toIsoClean(start)}/${toIsoClean(end)}`,
      icsStart: toIsoClean(start),
      icsEnd: toIsoClean(end),
    };
  } else {
    const start = new Date(y, m - 1, d);
    const end = new Date(y, m - 1, d + 1);

    const toYmd = (dt) => {
      const yr = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, '0');
      const da = String(dt.getDate()).padStart(2, '0');
      return `${yr}${mo}${da}`;
    };

    return {
      isAllDay: true,
      gcalDates: `${toYmd(start)}/${toYmd(end)}`,
      icsStart: `;VALUE=DATE:${toYmd(start)}`,
      icsEnd: `;VALUE=DATE:${toYmd(end)}`,
    };
  }
}

function getGoogleCalendarUrl(u) {
  const { gcalDates } = getCalendarDates(u);
  const details = u.note ? `${u.note}${u.course ? '\nCourse: ' + u.course.title : ''}` : (u.course ? 'Course: ' + u.course.title : '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: u.title,
    dates: gcalDates,
    details: details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcsFile(u) {
  const { icsStart, icsEnd } = getCalendarDates(u);
  const title = (u.title || 'Class Event').replace(/\n/g, ' ');
  const description = (u.note || '').replace(/\n/g, '\\n');

  const startLine = icsStart.startsWith(';') ? `DTSTART${icsStart}` : `DTSTART:${icsStart}`;
  const endLine = icsEnd.startsWith(';') ? `DTEND${icsEnd}` : `DTEND:${icsEnd}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BhashaHub//LMS Class Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    startLine,
    endLine,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadAllEventsIcs(updates, label = 'bhashahub-class-schedule') {
  if (!updates || updates.length === 0) return;

  const vevents = updates.map((u) => {
    const { icsStart, icsEnd } = getCalendarDates(u);
    const title = (u.title || 'Class Event').replace(/\n/g, ' ');
    const description = (u.note || '').replace(/\n/g, '\\n');
    const startLine = icsStart.startsWith(';') ? `DTSTART${icsStart}` : `DTSTART:${icsStart}`;
    const endLine = icsEnd.startsWith(';') ? `DTEND${icsEnd}` : `DTEND:${icsEnd}`;

    return [
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      startLine,
      endLine,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BhashaHub//LMS Class Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${label}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function EntryCard({ u, isAdmin, onEdit, onDelete, showDate }) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const timeFormatted = formatTime(u.time);
  const dateFormatted = showDate ? formatDateLabel(u.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="cal-card-item">
      <div className="cal-card-inner">
        <div className="cal-card-content">
          {/* Badges / Header Metadata */}
          <div className="cal-card-meta-row">
            {showDate && (
              <span className="cal-badge cal-badge-date">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {dateFormatted}
              </span>
            )}
            {timeFormatted && (
              <span className="cal-badge cal-badge-time">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {timeFormatted}
              </span>
            )}
            {u.course && (
              <span className="cal-badge cal-badge-course">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                {u.course.title}
              </span>
            )}
          </div>

          <h3 className="cal-card-title">{u.title}</h3>
          {u.note && <div className="cal-card-note">{u.note}</div>}
        </div>

        {/* Card Actions */}
        <div className="cal-card-actions">
          <div className="cal-dropdown-container">
            <button
              type="button"
              className="cal-btn cal-btn-export"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Add to personal calendar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
              <span>Add to Calendar</span>
              <svg className={`cal-chevron ${showExportMenu ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </button>

            {showExportMenu && (
              <div className="cal-dropdown-menu">
                <a
                  className="cal-dropdown-item"
                  href={getGoogleCalendarUrl(u)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowExportMenu(false)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Google Calendar</span>
                </a>
                <button
                  type="button"
                  className="cal-dropdown-item"
                  onClick={() => { downloadIcsFile(u); setShowExportMenu(false); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>iCal / Outlook (.ics)</span>
                </button>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="cal-admin-actions">
              <button type="button" className="cal-btn cal-btn-edit" onClick={() => onEdit(u)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button type="button" className="cal-btn cal-btn-delete" onClick={() => onDelete(u._id)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassCalendarPage({ onBack, user }) {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders };
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  const [updates, setUpdates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [courseId, setCourseId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await fetch(`${API}/calendar`, { headers: authHeaders });
      const data = await res.json();
      if (res.status === 403) { setForbidden(true); setUpdates([]); }
      else if (res.ok) setUpdates(data);
      else setError(data.error || 'Could not load the calendar');
    } catch {
      setError('Could not reach the server');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${API}/courses`)
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isAdmin]);

  const resetForm = () => {
    setEditingId(null);
    setDate(todayIso());
    setTime('');
    setTitle('');
    setNote('');
    setCourseId('');
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setDate(new Date(u.date).toISOString().slice(0, 10));
    setTime(u.time || '');
    setTitle(u.title);
    setNote(u.note || '');
    setCourseId(u.course ? u.course._id : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    setError('');
    if (!date || !title.trim()) return setError('Date and title are required');
    setSaving(true);
    try {
      const isEditing = editingId !== null;
      const res = await fetch(
        isEditing ? `${API}/calendar/${editingId}` : `${API}/calendar`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ date, time, title, note, course: courseId || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the update');
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const updatesByDate = useMemo(() => {
    const map = {};
    updates.forEach((u) => {
      const key = localKey(u.date);
      (map[key] = map[key] || []).push(u);
    });
    return map;
  }, [updates]);

  const gridCells = useMemo(() => {
    const firstWeekday = viewMonth.getDay();
    const total = daysInMonth(viewMonth);
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= total; day++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
    }
    return cells;
  }, [viewMonth]);

  const selectDay = (cellDate) => {
    const key = localKey(cellDate);
    setSelectedDate((prev) => (prev === key ? null : key));
  };

  const goToday = () => {
    setViewMonth(startOfMonth(new Date()));
    setSelectedDate(todayIso());
  };

  const displayedUpdates = selectedDate ? (updatesByDate[selectedDate] || []) : updates;

  // when a single day is selected, split its updates into time slots so a
  // 7 PM class and a 10 PM class don't get shown as one combined feed
  const timeGroups = useMemo(() => {
    if (!selectedDate) return null;
    const groups = {};
    (updatesByDate[selectedDate] || []).forEach((u) => {
      const key = u.time || '';
      (groups[key] = groups[key] || []).push(u);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === '') return -1;
      if (b === '') return 1;
      return a.localeCompare(b);
    });
  }, [selectedDate, updatesByDate]);

  const remove = async (id) => {
    if (!confirm('Delete this update?')) return;
    try {
      const res = await fetch(`${API}/calendar/${id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error('Could not delete the entry');
      setUpdates((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="cal-page-wrapper">
      <style>{`
        /* Dynamic Redesign Styles for Class Calendar */
        .cal-page-wrapper {
          min-height: 100vh;
          background: linear-gradient(180deg, rgba(250, 246, 236, 0.6) 0%, var(--paper, #faf6ec) 100%);
          padding: 32px 20px 80px;
        }

        .cal-container {
          max-width: 920px;
          margin: 0 auto;
        }

        /* Top Header */
        .cal-header-section {
          margin-bottom: 32px;
        }

        .cal-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--card, #ffffff);
          color: var(--ink, #2a2320);
          border: 1px solid var(--line, #e6dcc6);
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          margin-bottom: 20px;
        }

        .cal-back-btn:hover {
          background: var(--rice, #f3ebd8);
          border-color: var(--mist, #7a7266);
          transform: translateX(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .cal-header-card {
          background: var(--card, #ffffff);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 20px;
          padding: 28px 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
        }

        .cal-header-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, var(--seal, #c8362a) 0%, var(--gold, #c99a3c) 50%, var(--jade, #2e6b57) 100%);
        }

        .cal-title-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal, #c8362a);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 99px;
          margin-bottom: 12px;
        }

        .cal-main-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--ink, #2a2320);
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cal-header-desc {
          color: var(--mist, #7a7266);
          font-size: 0.95rem;
          margin: 0;
          max-width: 640px;
          line-height: 1.5;
        }

        .cal-summary-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--line, #e6dcc6);
          flex-wrap: wrap;
        }

        .cal-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--ink, #2a2320);
          background: var(--paper, #faf6ec);
          padding: 6px 14px;
          border-radius: 12px;
          border: 1px solid var(--line, #e6dcc6);
        }

        /* Error Banner */
        .cal-alert-error {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(200, 54, 42, 0.08);
          border: 1px solid rgba(200, 54, 42, 0.3);
          color: var(--seal, #c8362a);
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 24px;
        }

        /* Admin Creator Panel */
        .cal-admin-panel {
          background: var(--card, #ffffff);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 20px;
          padding: 24px 28px;
          margin-bottom: 32px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
        }

        .cal-admin-panel-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cal-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .cal-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cal-form-group.full-width {
          grid-column: 1 / -1;
        }

        .cal-form-group label {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .cal-form-group input,
        .cal-form-group select,
        .cal-form-group textarea {
          background: var(--paper, #faf6ec);
          border: 1.5px solid var(--line, #e6dcc6);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.92rem;
          font-family: inherit;
          color: var(--ink, #2a2320);
          transition: all 0.2s ease;
          outline: none;
        }

        .cal-form-group input:focus,
        .cal-form-group select:focus,
        .cal-form-group textarea:focus {
          border-color: var(--jade, #2e6b57);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(46, 107, 87, 0.12);
        }

        .cal-form-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }

        .cal-btn-submit {
          background: linear-gradient(135deg, var(--jade, #2e6b57) 0%, #204c3d 100%);
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(46, 107, 87, 0.25);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cal-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(46, 107, 87, 0.35);
        }

        .cal-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .cal-btn-cancel-edit {
          background: transparent;
          color: var(--mist, #7a7266);
          border: 1px solid var(--line, #e6dcc6);
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cal-btn-cancel-edit:hover {
          background: rgba(0, 0, 0, 0.04);
          color: var(--ink, #2a2320);
        }

        /* Calendar Widget Card */
        .cal-widget-card {
          background: var(--card, #ffffff);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 20px;
          padding: 24px 28px;
          margin-bottom: 32px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
        }

        .cal-month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .cal-month-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--ink, #2a2320);
          letter-spacing: -0.01em;
        }

        .cal-nav-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--line, #e6dcc6);
          background: var(--paper, #faf6ec);
          color: var(--ink, #2a2320);
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cal-nav-btn:hover {
          background: var(--card, #ffffff);
          border-color: var(--jade, #2e6b57);
          color: var(--jade, #2e6b57);
          transform: translateY(-1px);
        }

        .cal-weekdays-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin-bottom: 10px;
        }

        .cal-weekday-cell {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--mist, #7a7266);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 6px 0;
        }

        .cal-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .cal-day-cell {
          aspect-ratio: 1;
          border-radius: 12px;
          border: 1.5px solid var(--line, #e6dcc6);
          background: var(--paper, #faf6ec);
          color: var(--ink, #2a2320);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 2px;
        }

        .cal-day-cell:hover:not(.empty-blank) {
          border-color: var(--jade, #2e6b57);
          transform: translateY(-2px);
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
        }

        .cal-day-cell.is-today {
          border-color: var(--seal, #c8362a);
          font-weight: 800;
        }

        .cal-day-cell.is-selected {
          background: linear-gradient(135deg, var(--seal, #c8362a) 0%, #a3291f 100%);
          border-color: var(--seal, #c8362a);
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(200, 54, 42, 0.35);
          transform: scale(1.02);
        }

        .cal-event-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--seal, #c8362a);
          margin-top: 4px;
          transition: background 0.2s ease;
        }

        .cal-day-cell.is-selected .cal-event-dot {
          background: #ffffff;
        }

        .cal-grid-footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid var(--line, #e6dcc6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .cal-footer-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cal-action-pill {
          background: var(--paper, #faf6ec);
          color: var(--ink, #2a2320);
          border: 1px solid var(--line, #e6dcc6);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .cal-action-pill:hover {
          background: #ffffff;
          border-color: var(--jade, #2e6b57);
          color: var(--jade, #2e6b57);
        }

        .cal-action-pill.export-all {
          background: rgba(46, 107, 87, 0.08);
          border-color: rgba(46, 107, 87, 0.25);
          color: var(--jade, #2e6b57);
          margin-left: auto;
        }

        .cal-action-pill.export-all:hover {
          background: var(--jade, #2e6b57);
          color: #ffffff;
        }

        .cal-filter-status {
          font-size: 0.85rem;
          color: var(--mist, #7a7266);
          font-weight: 500;
          flex-basis: 100%;
          margin-top: 4px;
        }

        /* Feed Cards */
        .cal-feed-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cal-time-group-header {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--seal, #c8362a);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cal-time-group-header::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--line, #e6dcc6);
        }

        .cal-card-item {
          background: var(--card, #ffffff);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .cal-card-item:hover {
          border-color: rgba(46, 107, 87, 0.3);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        .cal-card-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cal-card-content {
          flex: 1;
          min-width: 240px;
        }

        .cal-card-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .cal-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .cal-badge-date {
          background: var(--paper, #faf6ec);
          color: var(--mist, #7a7266);
          border: 1px solid var(--line, #e6dcc6);
        }

        .cal-badge-time {
          background: rgba(201, 154, 60, 0.12);
          color: #926715;
          border: 1px solid rgba(201, 154, 60, 0.25);
        }

        .cal-badge-course {
          background: rgba(46, 107, 87, 0.1);
          color: var(--jade, #2e6b57);
          border: 1px solid rgba(46, 107, 87, 0.2);
        }

        .cal-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ink, #2a2320);
          margin: 0 0 6px 0;
          line-height: 1.4;
        }

        .cal-card-note {
          font-size: 0.92rem;
          color: var(--ink, #2a2320);
          background: var(--paper, #faf6ec);
          padding: 10px 14px;
          border-radius: 10px;
          border-left: 3px solid var(--jade, #2e6b57);
          margin-top: 8px;
          line-height: 1.5;
        }

        .cal-card-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .cal-dropdown-container {
          position: relative;
        }

        .cal-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .cal-btn-export {
          background: var(--paper, #faf6ec);
          color: var(--ink, #2a2320);
          border-color: var(--line, #e6dcc6);
        }

        .cal-btn-export:hover {
          background: #ffffff;
          border-color: var(--jade, #2e6b57);
          color: var(--jade, #2e6b57);
        }

        .cal-chevron {
          transition: transform 0.2s ease;
        }

        .cal-chevron.open {
          transform: rotate(180deg);
        }

        .cal-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 6px);
          z-index: 100;
          min-width: 190px;
          background: var(--card, #ffffff);
          border: 1px solid var(--line, #e6dcc6);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: calFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes calFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cal-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--ink, #2a2320);
          text-decoration: none;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.15s ease;
        }

        .cal-dropdown-item:hover {
          background: var(--paper, #faf6ec);
          color: var(--jade, #2e6b57);
        }

        .cal-admin-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cal-btn-edit {
          background: rgba(46, 107, 87, 0.08);
          color: var(--jade, #2e6b57);
          border-color: rgba(46, 107, 87, 0.2);
        }

        .cal-btn-edit:hover {
          background: var(--jade, #2e6b57);
          color: #ffffff;
        }

        .cal-btn-delete {
          background: rgba(200, 54, 42, 0.08);
          color: var(--seal, #c8362a);
          border-color: rgba(200, 54, 42, 0.2);
        }

        .cal-btn-delete:hover {
          background: var(--seal, #c8362a);
          color: #ffffff;
        }

        /* Empty / Loading State */
        .cal-empty-card {
          text-align: center;
          padding: 48px 24px;
          background: var(--card, #ffffff);
          border: 1px dashed var(--line, #e6dcc6);
          border-radius: 20px;
          color: var(--mist, #7a7266);
        }

        .cal-empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: var(--line, #e6dcc6);
        }

        .cal-empty-text {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }
      `}</style>

      <div className="cal-container">
        {/* Header Section */}
        <div className="cal-header-section">
          <button type="button" className="cal-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <div className="cal-header-card">
            <div className="cal-title-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
              </svg>
              <span>Class Schedule & Calendar</span>
            </div>

            <h1 className="cal-main-title">📅 Class Calendar</h1>
            <p className="cal-header-desc">
              {isAdmin
                ? 'Post daily updates or announcements for your students — optionally link to a course.'
                : 'Stay up to date with class schedules, announcements, and notes from your teacher.'}
            </p>

            <div className="cal-summary-bar">
              <div className="cal-stat-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{updates.length} Total Schedule {updates.length === 1 ? 'Update' : 'Updates'}</span>
              </div>
              {selectedDate && (
                <div className="cal-stat-pill" style={{ borderColor: 'var(--seal)', color: 'var(--seal)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span>Filtered by selected day</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="cal-alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Admin Form Panel */}
        {isAdmin && (
          <div className="cal-admin-panel">
            <div className="cal-admin-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>{editingId ? 'Edit Entry' : "Add Today's Update"}</span>
            </div>

            <div className="cal-form-grid">
              <div className="cal-form-group">
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="cal-form-group">
                <label>Class Time (Optional)</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="cal-form-group full-width">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lesson 3: Ordering food, new vocabulary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="cal-form-group full-width">
                <label>Course (Optional)</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">General — not tied to a specific course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="cal-form-group full-width">
                <label>Message / Note (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Anything else students should know for this day..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="cal-form-actions">
              <button type="button" className="cal-btn-submit" onClick={save} disabled={saving}>
                {saving ? (
                  <>Saving...</>
                ) : editingId ? (
                  <>Save Changes</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Post Update
                  </>
                )}
              </button>
              {editingId && (
                <button type="button" className="cal-btn-cancel-edit" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Month Calendar Grid View */}
        {!forbidden && !loading && (
          <div className="cal-widget-card">
            {/* Navigation Header */}
            <div className="cal-month-nav">
              <button type="button" className="cal-nav-btn" onClick={() => setViewMonth((m) => addMonths(m, -1))}>
                ‹
              </button>
              <div className="cal-month-title">
                {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </div>
              <button type="button" className="cal-nav-btn" onClick={() => setViewMonth((m) => addMonths(m, 1))}>
                ›
              </button>
            </div>

            {/* Weekdays */}
            <div className="cal-weekdays-grid">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w} className="cal-weekday-cell">
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div className="cal-days-grid">
              {gridCells.map((cellDate, i) => {
                if (!cellDate) return <div key={`blank-${i}`} className="cal-day-cell empty-blank" style={{ opacity: 0, pointerEvents: 'none' }} />;
                const key = localKey(cellDate);
                const dayUpdates = updatesByDate[key] || [];
                const isSelected = selectedDate === key;
                const isToday = key === todayIso();

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDay(cellDate)}
                    className={`cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                    title={`${cellDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}${dayUpdates.length ? ` - ${dayUpdates.length} updates` : ''}`}
                  >
                    <span>{cellDate.getDate()}</span>
                    {dayUpdates.length > 0 && <span className="cal-event-dot" />}
                  </button>
                );
              })}
            </div>

            {/* Grid Controls Footer */}
            <div className="cal-grid-footer">
              <div className="cal-footer-controls">
                <button type="button" className="cal-action-pill" onClick={goToday}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Today</span>
                </button>
                {selectedDate && (
                  <button type="button" className="cal-action-pill" onClick={() => setSelectedDate(null)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Show All Dates</span>
                  </button>
                )}
              </div>

              {displayedUpdates.length > 0 && (
                <button
                  type="button"
                  className="cal-action-pill export-all"
                  onClick={() => downloadAllEventsIcs(displayedUpdates, selectedDate ? `bhashahub-schedule-${selectedDate}` : 'bhashahub-all-classes')}
                  title="Export schedule to calendar file"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Export Schedule (.ics)</span>
                </button>
              )}

              {selectedDate && (
                <div className="cal-filter-status">
                  Showing entries for <strong>{parseLocalDateKey(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Updates Feed Section */}
        <div className="cal-feed-container">
          {forbidden ? (
            <div className="cal-empty-card">
              <svg className="cal-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <p className="cal-empty-text">Enroll in a course to view the class calendar.</p>
            </div>
          ) : loading ? (
            <div className="cal-empty-card">
              <svg className="cal-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'spin 1s linear infinite' }}>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              <p className="cal-empty-text">Loading schedule...</p>
            </div>
          ) : displayedUpdates.length === 0 ? (
            <div className="cal-empty-card">
              <svg className="cal-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <p className="cal-empty-text">
                {selectedDate ? 'No updates on this day.' : 'No updates posted yet — check back soon.'}
              </p>
            </div>
          ) : selectedDate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {timeGroups.map(([timeKey, group]) => (
                <div key={timeKey || 'general'}>
                  <div className="cal-time-group-header">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{timeKey ? `${formatTime(timeKey)} class` : 'General (no specific time)'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {group.map((u) => (
                      <EntryCard key={u._id} u={u} isAdmin={isAdmin} onEdit={startEdit} onDelete={remove} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {displayedUpdates.map((u) => (
                <EntryCard key={u._id} u={u} isAdmin={isAdmin} onEdit={startEdit} onDelete={remove} showDate />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassCalendarPage;
