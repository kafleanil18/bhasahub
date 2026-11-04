import { useCallback, useEffect, useRef, useState } from 'react';

export default function useNumberSpeech(voice) {
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const utteranceRef = useRef(null);
  const watchdogRef = useRef(null);
  const stop = useCallback(() => {
    utteranceRef.current = null;
    window.clearTimeout(watchdogRef.current);
    window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => stop, [stop]);
  const reset = useCallback(() => { stop(); setHeard(false); setPlaying(false); setError(''); }, [stop]);
  const play = useCallback((text, rate = 1) => {
    stop(); setPlaying(false); setError('');
    if (!voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setError('Chinese audio is unavailable. Choose a Mandarin voice on the practice page and try again.');
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = rate;
      utteranceRef.current = utterance;
      utterance.onstart = () => {
        if (utteranceRef.current !== utterance) return;
        window.clearTimeout(watchdogRef.current); setHeard(true); setPlaying(true);
      };
      utterance.onend = () => { if (utteranceRef.current === utterance) { window.clearTimeout(watchdogRef.current); setHeard(true); setPlaying(false); } };
      utterance.onerror = () => {
        if (utteranceRef.current !== utterance) return;
        window.clearTimeout(watchdogRef.current); setPlaying(false);
        setError('Audio could not play. Tap Listen to try again, or skip this question.');
      };
      watchdogRef.current = window.setTimeout(() => {
        if (utteranceRef.current !== utterance) return;
        stop(); setPlaying(false); setError('Audio did not start. Tap Listen to try again, or skip this question.');
      }, 5000);
      window.speechSynthesis.speak(utterance);
    } catch {
      stop(); setPlaying(false); setError('Audio could not play. Tap Listen to try again, or skip this question.');
    }
  }, [voice, stop]);
  return { heard, playing, error, reset, play, stop };
}
