import { useCallback, useEffect, useRef, useState } from 'react';
import useChineseVoice, { mandarinVoices } from './useChineseVoice';
import { checkNaturalVoice, naturalVoiceUrl } from './naturalVoice';

const STORAGE_KEY = 'mandarinVoiceGender';
const CHANGE_EVENT = 'mandarin-voice-gender';
const MALE = /kangkang|yunxi|yunyang|yunjian|yunhao|yunze|li-?mu|zhiwei|male|男/i;

const readGender = () => {
  try { return localStorage.getItem(STORAGE_KEY) === 'male' ? 'male' : 'female'; } catch { return 'female'; }
};

// The student's female/male choice, remembered and shared by every practice tool.
export function useVoiceGender() {
  const [gender, setGenderState] = useState(readGender);
  useEffect(() => {
    const sync = () => setGenderState(readGender());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const setGender = useCallback(value => {
    try { localStorage.setItem(STORAGE_KEY, value === 'male' ? 'male' : 'female'); } catch { /* storage may be blocked */ }
    setGenderState(value === 'male' ? 'male' : 'female');
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [gender, setGender];
}

// The device's male Mandarin voice, if it has one (e.g. Microsoft Yunxi/Kangkang in Edge, Li-Mu on a Mac).
export const maleDeviceVoice = voices => mandarinVoices(voices).find(voice => MALE.test(voice.name)) || null;

/*
 * Speaks Mandarin in the chosen voice.
 *  - female: Google's female Mandarin voice in the browser (or the device's best Mandarin voice).
 *  - male: the server's Azure male neural voice when it is set up, else a male device voice,
 *          else the female voice (maleSource is then null so the page can say so).
 * speak(text, { rate, onStart, onEnd, onError }) starts playback and returns false if nothing can speak.
 */
export default function useMandarinSpeaker() {
  const female = useChineseVoice({ preferGoogleFemale: true });
  const [gender, setGender] = useVoiceGender();
  const [serverMale, setServerMale] = useState(false);
  const [deviceMale, setDeviceMale] = useState(null);
  const audioRef = useRef(null);
  const tokenRef = useRef(0);

  useEffect(() => { let live = true; checkNaturalVoice().then(enabled => { if (live) setServerMale(enabled); }); return () => { live = false; }; }, []);
  useEffect(() => {
    if (!female.supported) return undefined;
    const find = () => setDeviceMale(maleDeviceVoice(window.speechSynthesis.getVoices()));
    find();
    window.speechSynthesis.addEventListener?.('voiceschanged', find);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', find);
  }, [female.supported, female.voices]);

  const maleSource = serverMale ? 'server' : deviceMale ? 'device' : null;
  const usingMale = gender === 'male' && !!maleSource;

  const stop = useCallback(() => {
    tokenRef.current++;
    if (audioRef.current) { audioRef.current.onplaying = audioRef.current.onended = audioRef.current.onerror = null; audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => stop, [stop]);

  const speakWithDevice = useCallback((text, voice, { rate = 1, onStart, onEnd, onError }, token) => {
    if (!voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice; utterance.lang = voice.lang || 'zh-CN'; utterance.rate = rate;
    utterance.onstart = () => { if (token === tokenRef.current) onStart?.(); };
    utterance.onend = () => { if (token === tokenRef.current) onEnd?.(); };
    utterance.onerror = event => { if (token === tokenRef.current && !['interrupted', 'canceled'].includes(event.error)) onError?.(event.error); };
    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

  const speak = useCallback((text, options = {}) => {
    stop();
    const token = tokenRef.current;
    if (gender === 'male' && serverMale) {
      const audio = new Audio(naturalVoiceUrl(text, { speaker: 'B', speed: (options.rate ?? 1) < 0.7 ? 'slow' : 'normal' }));
      audioRef.current = audio;
      audio.onplaying = () => { if (token === tokenRef.current) options.onStart?.(); };
      audio.onended = () => { if (token === tokenRef.current) options.onEnd?.(); };
      // If the server voice fails, say it with the device instead of going silent.
      const fallback = () => { if (token !== tokenRef.current) return; audioRef.current = null; if (!speakWithDevice(text, deviceMale || female.voice, options, token)) options.onError?.('audio'); };
      audio.onerror = fallback;
      audio.play().catch(error => { if (error?.name === 'NotAllowedError') options.onError?.('not-allowed'); else fallback(); });
      return true;
    }
    return speakWithDevice(text, usingMale ? deviceMale : female.voice, options, token);
  }, [gender, serverMale, deviceMale, usingMale, female.voice, speakWithDevice, stop]);

  return {
    gender, setGender, speak, stop,
    // True when something can speak Mandarin right now.
    available: (gender === 'male' && serverMale) || !!(usingMale ? deviceMale : female.voice),
    loading: female.loading,
    supported: female.supported || serverMale,
    refresh: female.refresh,
    femaleVoice: female.voice,
    maleSource,
    maleUnavailable: gender === 'male' && !maleSource,
  };
}
