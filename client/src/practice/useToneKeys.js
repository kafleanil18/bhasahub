import { useEffect } from 'react';

// Number keys 1–4 answer and R replays, ignoring typing in form fields and modifier chords.
export default function useToneKeys({ enabled, onTone, onReplay }) {
  useEffect(() => {
    if (!enabled) return;
    const handler = event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input[type=text], textarea, select, [contenteditable]')) return;
      if (/^[1-4]$/.test(event.key)) { event.preventDefault(); onTone(Number(event.key)); }
      else if (event.key === 'r' || event.key === 'R') { event.preventDefault(); onReplay(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onTone, onReplay]);
}
