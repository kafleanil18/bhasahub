const shapes = {
  pinyin: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"/></>,
  trace: <><path d="m14 5 5 5M5 19l4-1 12-12a2.1 2.1 0 0 0-3-3L6 15l-1 4ZM3 3h4M3 3v4M3 12v2M12 21h2M17 21h4v-4"/></>,
  listening: <><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/></>,
  sentences: <><rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="13" y="4" width="8" height="6" rx="1.5"/><rect x="3" y="14" width="11" height="6" rx="1.5"/><path d="M18 14l3 3-3 3M17 17h4"/></>,
  measures: <><path d="m12 2 7 4-7 4-7-4 7-4ZM5 6v7l7 4 7-4V6M12 10v7M5 13l-3 2 7 4 3-2M2 15v5l7 4 7-4v-5" transform="translate(0 -1)"/></>,
  numbers: <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h1M12 10h1M16 10h0M8 14h1M12 14h1M16 14h0M8 18h1M12 18h1M16 18h0"/></>,
  dictation: <><path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M7 8h4M7 12h3M7 16h8M16 3v6M19 1v10M22 4v4"/></>,
  conversation: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.5-.8L4 20l1.8-4.2A7.4 7.4 0 0 1 5 12.5 7.5 7.5 0 0 1 12.5 5H13a7.5 7.5 0 0 1 7 6.5Z"/><path d="M9 11h.01M13 11h.01M17 11h.01"/></>,
  tests: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10l2 2 4-4M9 16h6"/></>,
};

export default function PracticeToolIcon({ tool }) {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[tool]}</svg>;
}
