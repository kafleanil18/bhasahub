const GAP_PCT = 0.6;

export default function ControlPie({ slices, centerLabel, centerValue, emptyTitle, emptyBody }) {
  const positive = slices.filter(slice => slice.count > 0);
  const total = positive.reduce((sum, slice) => sum + slice.count, 0);
  if (!total) {
    return <div className="control-empty"><strong>{emptyTitle}</strong><p>{emptyBody}</p></div>;
  }

  let cursor = 0;
  const stops = positive.map(slice => {
    const pct = slice.count / total * 100;
    const start = cursor;
    const end = cursor + Math.max(pct - GAP_PCT, 0);
    cursor += pct;
    return { ...slice, pct, start, end };
  });
  const gradient = `conic-gradient(${stops.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')}, var(--line) ${cursor}% 100%)`;

  return (
    <div className="control-pie-wrap">
      <div className="control-pie" style={{ backgroundImage: gradient }} aria-hidden="true">
        <div className="control-pie-center">
          <strong>{(centerValue ?? total).toLocaleString()}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="control-pie-legend">
        {stops.map(s => (
          <li key={s.label}>
            <span className="control-pie-dot" style={{ background: s.color }} aria-hidden="true" />
            <span className="control-pie-legend-label">{s.label}</span>
            <span className="control-pie-legend-value">{s.count.toLocaleString()} <small>({Math.round(s.pct)}%)</small></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
