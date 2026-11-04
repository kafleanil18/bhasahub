import { useCallback, useEffect, useState } from 'react';

export function mandarinVoices(voices) {
  return voices.filter(voice => {
    const language = voice.lang.toLowerCase().replaceAll('_', '-');
    return language === 'zh' || /^zh-(cn|sg|tw|hans|hant)(-|$)/.test(language) || /^cmn(-|$)/.test(language);
  }).sort((a, b) => Number(/^zh-(CN|Hans)/i.test(b.lang)) - Number(/^zh-(CN|Hans)/i.test(a.lang)));
}
export const voiceKey = voice => voice.voiceURI || `${voice.name}-${voice.lang}`;
export default function useChineseVoice() {
  const supported = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(supported);
  const refresh = useCallback(() => {
    if (!supported) return;
    const available = mandarinVoices(window.speechSynthesis.getVoices());
    setVoices(previous => available.map(voice => previous.find(old => voiceKey(old) === voiceKey(voice) && old.name === voice.name && old.lang === voice.lang) || voice));
    setSelected(previous => available.some(voice => voiceKey(voice) === previous) ? previous : available[0] ? voiceKey(available[0]) : '');
    if (available.length) setLoading(false);
  }, [supported]);
  useEffect(() => {
    if (!supported) return;
    refresh();
    const synth = window.speechSynthesis;
    synth.addEventListener('voiceschanged', refresh);
    const timer = window.setTimeout(() => { refresh(); setLoading(false); }, 2000);
    return () => { synth.removeEventListener('voiceschanged', refresh); window.clearTimeout(timer); };
  }, [supported, refresh]);
  return { supported, loading, voices, selected, setSelected, refresh, voice: voices.find(voice => voiceKey(voice) === selected) };
}
