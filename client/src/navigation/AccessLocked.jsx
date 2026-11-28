import { Link } from 'react-router-dom';

// Shown to a student who opens My Courses without course access, or My Progress without practice
// access, instead of an empty page.
const PAGES = {
  courses: {
    title: 'My Courses opens with a plan',
    text: 'Once you have a plan or a course subscription, My Courses shows your HSK courses and your progress in each one.',
    links: [['/pricing', 'See plans', true], ['/#courses', 'Browse HSK courses']],
  },
  recorded: {
    title: 'Recorded sessions are for live class students',
    text: 'Recordings of live classes open when you join live classes: add them when you pay for a plan, or message us and we’ll add you.',
    links: [['/pricing', 'Add live classes to a plan', true], ['/', 'Back to home']],
  },
  practice: {
    title: 'My Progress opens with practice access',
    text: 'My Progress tracks your practice studio activity and mock test results. It opens with a free week of practice, a plan or a course subscription.',
    links: [['/tests', 'Get a free week', true], ['/pricing', 'See plans']],
  },
};

export default function AccessLocked({ need }) {
  const page = PAGES[need];
  return <section className="container page-locked" aria-labelledby="page-locked-title">
    <h1 id="page-locked-title">{page.title}</h1>
    <p>{page.text}</p>
    <div className="page-locked-actions">{page.links.map(([to, label, primary]) => <Link key={to} to={to} className={primary ? 'page-locked-primary' : undefined}>{label}</Link>)}</div>
  </section>;
}
