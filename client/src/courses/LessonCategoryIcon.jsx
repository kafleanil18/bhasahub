const shapes = {
  vocabulary: <><path d="M12 6v15M3 3h5a4 4 0 0 1 4 3 4 4 0 0 1 4-3h5v15h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3H3V3Z"/><path d="M6 8h3M6 12h3M15 8h3M15 12h3"/></>,
  grammar: <><path d="M7 3H4v18h3M17 3h3v18h-3M9 8h6M9 12h6M9 16h4"/></>,
  conversation: <><path d="M16 13H8l-5 4V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><path d="M8 17v1a2 2 0 0 0 2 2h7l4 3V10a2 2 0 0 0-2-2M7 7h7M7 10h4"/></>,
};

export default function LessonCategoryIcon({ category }) {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[category] || shapes.vocabulary}</svg>;
}
