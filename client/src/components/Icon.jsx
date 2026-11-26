import './Icon.css';

// Line icons in the site's ink style. They draw in the surrounding text colour, so they follow the
// seal-red / ink palette and dark mode. Decorative by default; pass `label` when the icon is the only content.
const paths = {
  lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  hourglass: <><path d="M6 3h12M6 21h12"/><path d="M7 3c0 5 10 5 10 9s-10 4-10 9"/><path d="M17 3c0 5-10 5-10 9s10 4 10 9"/></>,
  hourglassDone: <><path d="M6 3h12M6 21h12"/><path d="M7 3c0 4 4 6 5 9 1-3 5-5 5-9"/><path d="M7 21c0-3 2-5 5-6 3 1 5 3 5 6z" fill="currentColor" stroke="none"/><path d="M7 21c0-4 4-6 5-9 1 3 5 5 5 9"/></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>,
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" stroke="none"/>,
  speaker: <><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></>,
  speakerOff: <><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6M22 9l-5 6"/></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.2-4.4A8 8 0 1 1 21 12z"/>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/></>,
  bulb: <><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></>,
  // A paper lantern: celebration in the site's Chinese theme.
  lantern: <><path d="M12 2v2M9 4h6"/><path d="M8 6h8c2 2 2 9 0 11H8C6 15 6 8 8 6z"/><path d="M12 6c-1.5 2-1.5 9 0 11M9 17v1h6v-1M12 18v4"/></>,
  download: <><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></>,
  upload: <><path d="M12 15V4M7 9l5-5 5 5M5 20h14"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  chevronLeft: <path d="m15 6-6 6 6 6"/>,
  chevronRight: <path d="m9 6 6 6-6 6"/>,
  chevronUp: <path d="m6 15 6-6 6 6"/>,
  // An open ink circle with an arrow, like the ensō in the loading animation: reload.
  refresh: <><path d="M19.5 14.7A8 8 0 1 1 17.7 6.3L20 8.6"/><path d="M20 4v4.6h-4.6"/></>,
  warning: <><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  heart: <path d="M12 20s-7.5-4.5-9.3-9.3A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 9.3 4.1C19.5 15.5 12 20 12 20z"/>,
  key: <><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M15 8l2 2"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M2 20h20"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  book: <><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v17H5.5A2.5 2.5 0 0 0 3 22.5z"/><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v17h5.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></>,
  cards: <><rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/></>,
  // An ink brush: writing practice.
  brush: <><path d="M20 3c-3 1-8 6-10.5 9.5l2 2C15 12 20 7 21 4z"/><path d="M9.5 12.5c-2 0-4 1.5-4 4 0 1.5-1 3-2.5 3.5 3 1 7.5.5 8.5-3.5z"/></>,
  shuffle: <><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></>,
  thumbsUp: <><path d="M7 10v11H3V10z"/><path d="M7 10l4-7a2.5 2.5 0 0 1 3 3l-1 4h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7"/></>,
  headphones: <><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></>,
  file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></>,
  timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>,
  female: <><circle cx="12" cy="9" r="5"/><path d="M12 14v8M9 19h6"/></>,
  male: <><circle cx="10" cy="14" r="5"/><path d="M13.5 10.5 20 4M15 4h5v5"/></>,
  // A compass: finding your way around (the studio tour).
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></>,
  // A sprouting seedling: first steps.
  seedling: <><path d="M12 21v-9"/><path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7zM12 10c0-3 2.5-6 8-6 0 4-3 6.5-8 6.5"/></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>,
  pencil: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></>,
};

export default function Icon({ name, size = '1.1em', label, className = '', strokeWidth = 1.8 }) {
  const shape = paths[name];
  if (!shape) return null;
  return <svg className={`ui-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" focusable="false" {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}>
    {label && <title>{label}</title>}
    {shape}
  </svg>;
}
