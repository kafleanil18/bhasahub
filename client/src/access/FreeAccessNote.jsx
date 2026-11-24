import { FREE_ACCESS_DAYS } from './practiceAccess';
import './FreeAccessNote.css';

// Makes it unmistakable that asking for practice / mock test access costs nothing.
export function FreeBadge() {
  return <span className="free-access-badge"><span aria-hidden="true">✓</span> 100% free</span>;
}

export default function FreeAccessNote({ compact = false }) {
  return <div className={`free-access-note${compact ? ' is-compact' : ''}`}>
    <FreeBadge/>
    <span><strong>{FREE_ACCESS_DAYS} days free</strong> once an admin approves your request. No payment, no card details.</span>
  </div>;
}
