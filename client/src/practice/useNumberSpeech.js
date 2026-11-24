import { useCallback, useEffect, useRef, useState } from 'react';

// Plays Chinese text with the page's Mandarin speaker (female or male) and tracks whether it was heard.
export default function useNumberSpeech(speaker) {
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const attemptRef = useRef(0);
  const watchdogRef = useRef(null);
  const speakerRef = useRef(speaker);
  speakerRef.current = speaker;
  const stop = useCallback(() => {
    attemptRef.current++;
    window.clearTimeout(watchdogRef.current);
    speakerRef.current?.stop();
  }, []);
  useEffect(() => stop, [stop]);
  const reset = useCallback(() => { stop(); setHeard(false); setPlaying(false); setError(''); }, [stop]);
  const play = useCallback((text, rate = 1) => {
    stop(); setPlaying(false); setError('');
    const attempt = attemptRef.current;
    const current = () => attempt === attemptRef.current;
    try {
      const started = speakerRef.current?.speak(text, {
        rate,
        onStart: () => { if (!current()) return; window.clearTimeout(watchdogRef.current); setHeard(true); setPlaying(true); },
        onEnd: () => { if (!current()) return; window.clearTimeout(watchdogRef.current); setHeard(true); setPlaying(false); },
        onError: () => { if (!current()) return; window.clearTimeout(watchdogRef.current); setPlaying(false); setError('Audio could not play. Tap Listen to try again, or skip this question.'); },
      });
      if (!started) { setError('Chinese audio is unavailable. Choose a Mandarin voice on the practice page and try again.'); return; }
      // The server voice may take a moment to download, so allow a little longer than the device voice.
      watchdogRef.current = window.setTimeout(() => {
        if (!current()) return;
        stop(); setPlaying(false); setError('Audio did not start. Tap Listen to try again, or skip this question.');
      }, 8000);
    } catch {
      stop(); setPlaying(false); setError('Audio could not play. Tap Listen to try again, or skip this question.');
    }
  }, [stop]);
  return { heard, playing, error, reset, play, stop };
}
