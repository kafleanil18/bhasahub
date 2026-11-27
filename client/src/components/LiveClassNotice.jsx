import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ContactLinks from './ContactLinks';
import { CONTACT_PHONE } from './contactPhone';
import './LiveClassNotice.css';

// A corner card telling guests and students that live classes are available. It appears after a few
// seconds on pages where people browse, never during a lesson, practice or test, and never for staff.
// After "Later" it stays away for a week; after someone messages us, for a month.
const KEY = 'liveClassNotice';
const DAY = 24 * 60 * 60 * 1000;
export const LIVE_CLASS_NOTICE_DELAY = 8000;
const PAGES = new Set(['/', '/about-hsk', '/pricing', '/my-courses', '/progress']);

function snoozedUntil() {
  try { return Number(JSON.parse(localStorage.getItem(KEY))?.until) || 0; } catch { return 0; }
}
function snooze(days) {
  try { localStorage.setItem(KEY, JSON.stringify({ until: Date.now() + days * DAY })); } catch { /* Storage is off: it may show again next visit. */ }
}

export default function LiveClassNotice({ user, blocked = false }) {
  const { pathname } = useLocation();
  const [stage, setStage] = useState('waiting');
  const audience = !user ? 'guest' : user.role === 'student' ? 'student' : null;
  const ready = !!CONTACT_PHONE && !!audience && PAGES.has(pathname) && !blocked;

  useEffect(() => {
    if (!ready || stage !== 'waiting' || snoozedUntil() > Date.now()) return;
    const timer = setTimeout(() => setStage('open'), LIVE_CLASS_NOTICE_DELAY);
    return () => clearTimeout(timer);
  }, [ready, stage]);

  if (!ready || stage !== 'open') return null;
  const close = days => { snooze(days); setStage('closed'); };
  return <aside className="live-class-notice" aria-labelledby="live-class-notice-title" onKeyDown={event => { if (event.key === 'Escape') close(7); }}>
    <span className="live-class-notice-mark" lang="zh-CN" aria-hidden="true">师</span>
    <div>
      <p className="live-class-notice-title" id="live-class-notice-title">Live classes available</p>
      <p className="live-class-notice-text">{audience === 'student' ? 'Practise speaking with a teacher alongside your course.' : 'Learn Chinese with a teacher, live.'} Message us to join, and we’ll tell you about upcoming classes.</p>
      {/* The chat opens in a new tab or app; the card closes just after, so the link still follows. */}
      <div className="live-class-notice-actions" onClickCapture={event => { if (event.target.closest('a')) { snooze(30); setTimeout(() => setStage('closed')); } }}>
        <ContactLinks label="Message us to join live classes" />
        <button type="button" className="live-class-notice-later" onClick={() => close(7)}>Later</button>
      </div>
    </div>
  </aside>;
}
