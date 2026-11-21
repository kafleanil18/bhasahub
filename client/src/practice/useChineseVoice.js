import { useCallback, useEffect, useState } from 'react';

export function mandarinVoices(voices) {
  return voices.filter(voice => {
    const language = voice.lang.toLowerCase().replaceAll('_', '-');
    return language === 'zh' || /^zh-(cn|sg|tw|hans|hant)(-|$)/.test(language) || /^cmn(-|$)/.test(language);
  }).sort((a, b) => Number(/^zh-(CN|Hans)/i.test(b.lang)) - Number(/^zh-(CN|Hans)/i.test(a.lang)));
}
const FEMALE = /tingting|meijia|lili|yu-?shu|xiaoxiao|xiaoyi|xiaohan|xiaomo|xiaochen|huihui|yaoyao|hanhan|female|女/i;
const MALE = /kangkang|yunxi|yunyang|yunjian|li-?mu|zhiwei|male|男/i;
// Google's female mainland voice first; otherwise the device's best female Mandarin voice, so audio plays on every browser.
export function rankGoogleFemale(voices) {
  const score = voice => {
    const google = /google/i.test(voice.name), mainland = /^zh-(cn|hans)/i.test(voice.lang.replaceAll('_', '-'));
    return (google && mainland ? 100 : 0) + (google ? 40 : 0) + (FEMALE.test(voice.name) ? 20 : 0) - (MALE.test(voice.name) ? 20 : 0) + (mainland ? 10 : 0);
  };
  return mandarinVoices(voices).map((voice, index) => ({ voice, index, score: score(voice) }))
    .sort((a, b) => b.score - a.score || a.index - b.index).map(item => item.voice);
}
export const voiceKey = voice => voice.voiceURI || `${voice.name}-${voice.lang}`;
export default function useChineseVoice({ preferGoogleFemale = false } = {}) {
  const supported = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(supported);
  const refresh = useCallback(() => {
    if (!supported) return;
    const all = window.speechSynthesis.getVoices();
    const available = preferGoogleFemale ? rankGoogleFemale(all) : mandarinVoices(all);
    setVoices(previous => available.map(voice => previous.find(old => voiceKey(old) === voiceKey(voice) && old.name === voice.name && old.lang === voice.lang) || voice));
    setSelected(previous => available.some(voice => voiceKey(voice) === previous) ? previous : available[0] ? voiceKey(available[0]) : '');
    if (available.length) setLoading(false);
  }, [supported, preferGoogleFemale]);
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
