export const inactivityFilters = [
  ['all', 'All students'], ['3', 'Inactive 3+ days'], ['7', 'Inactive 7+ days'],
  ['14', 'Inactive 14+ days'], ['unrecorded', 'No recorded practice'], ['selected', 'Selected'],
];

export function matchesActivity(student, filter, selected) {
  if (filter === 'all') return true;
  if (filter === 'selected') return selected.has(student.user);
  if (filter === 'unrecorded') return student.lastPracticeAt === null;
  return Number.isFinite(student.inactiveDays) && student.inactiveDays >= Number(filter);
}

export function filterStudents(students, filter, query, selected, sort = 'inactive') {
  const needle = query.trim().toLowerCase();
  return students.filter(student => matchesActivity(student, filter, selected) && `${student.name} ${student.email}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name) || a.email.localeCompare(b.email);
      const key = sort === 'reminder' ? 'lastReminderAt' : 'lastPracticeAt';
      return (a[key] ? new Date(a[key]).getTime() : 0) - (b[key] ? new Date(b[key]).getTime() : 0) || a.name.localeCompare(b.name);
    });
}

export function practiceLabel(student) {
  if (student.lastPracticeAt === null) return 'No recorded practice';
  if (student.inactiveDays === 0) return 'Within 24 hours';
  return `${student.inactiveDays} ${student.inactiveDays === 1 ? 'day' : 'days'} ago`;
}

export const studentDate = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
