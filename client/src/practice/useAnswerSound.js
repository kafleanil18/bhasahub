import { useCallback, useEffect, useRef } from 'react';

export default function useAnswerSound(enabled) {
  const contextRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  useEffect(() => () => {
    const context = contextRef.current;
    contextRef.current = null;
    context?.close().catch(() => {});
  }, []);

  // Unlock audio during the student's click, before waiting for server grading.
  const prepare = useCallback(() => {
    if (!enabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = contextRef.current ||= new AudioContextClass();
      void context.resume().catch(() => {});
    } catch { /* Feedback text and colors still work if audio is unavailable. */ }
  }, [enabled]);

  const play = useCallback(async correct => {
    if (!enabled) return;
    try {
      const context = contextRef.current;
      if (!context) return;
      if (context.state !== 'running') await context.resume();
      if (contextRef.current !== context || !enabledRef.current || context.state !== 'running') return;
      const frequencies = correct ? [523.25, 659.25] : [220, 165];
      frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * .14;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(.08, start);
        gain.gain.exponentialRampToValueAtTime(.001, start + .18);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start); oscillator.stop(start + .2);
      });
    } catch { /* Audio feedback must not prevent advancing to the next question. */ }
  }, [enabled]);
  return { prepare, play };
}
