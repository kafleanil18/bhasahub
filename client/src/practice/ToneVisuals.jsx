// Pitch contours on the 5-level Chao scale (5 = high, 1 = low), drawn in a 48×36 box.
const CONTOURS = {
  1: 'M6 7 L42 7',
  2: 'M6 19 L42 7',
  3: 'M6 21 L22 31 L42 11',
  4: 'M6 7 L42 31',
};

export function ToneContour({ tone, size = 48, className = '' }) {
  return <svg className={`tone-contour ${className}`} data-tone={tone || undefined} width={size} height={size * .75} viewBox="0 0 48 36" aria-hidden="true" focusable="false">
    {[7, 13, 19, 25, 30].map(y => <line key={y} x1="4" x2="44" y1={y} y2={y} className="tone-contour-grid" />)}
    {tone ? <path d={CONTOURS[tone]} className="tone-contour-line" />
      : <path d="M6 19 L42 19" className="tone-contour-line is-empty" />}
  </svg>;
}

export function PlayButton({ playing, onClick, disabled, label }) {
  return <button type="button" className={`tone-play${playing ? ' is-playing' : ''}`} onClick={onClick} disabled={disabled} aria-label={label}>
    <span className="tone-play-ring" aria-hidden="true" /><span className="tone-play-ring" aria-hidden="true" />
    {playing
      ? <span className="tone-play-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      : <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>}
  </button>;
}

export function SlowButton({ onClick, disabled }) {
  return <button type="button" className="tone-pill" onClick={onClick} disabled={disabled}>
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    Slow · 0.75×
  </button>;
}

export function SoundToggle({ enabled, onToggle }) {
  return <button type="button" className="tone-icon-button" aria-pressed={!enabled} aria-label={enabled ? 'Mute answer sounds' : 'Unmute answer sounds'} title={enabled ? 'Mute answer sounds' : 'Unmute answer sounds'} onClick={onToggle}>
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {enabled ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        : <path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  </button>;
}

// One dot per question: done ones show the result, the current one is highlighted.
export function ProgressDots({ total, current, statuses }) {
  return <ol className="tone-dots" aria-hidden="true">
    {Array.from({ length: total }, (_, i) => <li key={i} className={statuses[i] ? `is-${statuses[i]}` : i === current ? 'is-current' : ''} />)}
  </ol>;
}

export function ScoreRing({ correct, total }) {
  const pct = total ? Math.round(correct / total * 100) : 0;
  const r = 52, c = 2 * Math.PI * r;
  return <div className="tone-score" aria-hidden="true">
    <svg viewBox="0 0 120 120" width="132" height="132">
      <circle cx="60" cy="60" r={r} className="tone-score-track" />
      <circle cx="60" cy="60" r={r} className="tone-score-value" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
    </svg>
    <span><strong>{pct}%</strong><small>accuracy</small></span>
  </div>;
}

export function AdvanceBar({ duration }) {
  return <span className="tone-advance" style={{ '--advance': `${duration}ms` }} aria-hidden="true" />;
}
