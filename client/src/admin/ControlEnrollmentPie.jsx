import ControlPie from './ControlPie';

const LEVEL_COLORS = { 'HSK 1': 'var(--pie-jade)', 'HSK 2': 'var(--pie-gold)', 'HSK 3': 'var(--pie-seal)' };
const LEVEL_ORDER = ['HSK 1', 'HSK 2', 'HSK 3'];

export default function ControlEnrollmentPie({ enrollments }) {
  const byLevel = enrollments.byHskLevel || [];
  const slices = LEVEL_ORDER.map(level => ({
    label: level,
    count: byLevel.find(row => row.level === level)?.count || 0,
    color: LEVEL_COLORS[level],
  }));

  return (
    <ControlPie
      slices={slices}
      centerValue={slices.reduce((sum, slice) => sum + slice.count, 0)}
      centerLabel="enrollments"
      emptyTitle="No enrollments yet"
      emptyBody="The HSK 1 / HSK 2 / HSK 3 breakdown will appear here as students enroll."
    />
  );
}
