const paths = {
  students: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  courses: <><path d="M12 7v14M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z"/></>,
  subscriptions: <><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20m-15 5h3"/></>,
  lessons: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  audio: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/></>,
  inbox: <><path d="M4 4h16v16H4zM4 13h5l2 3h2l2-3h5"/></>,
  tests: <><rect x="4" y="3" width="16" height="19" rx="2"/><path d="M9 3V1h6v2M8 9h8m-8 5h8m-8 4h4"/></>,
  audit: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6"/></>,
};
export default function ControlIcon({ name }) { return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.lessons}</svg>; }
