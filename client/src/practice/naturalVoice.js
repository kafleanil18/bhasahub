// Azure neural Mandarin voice served (and cached) by our API. Falls back to the browser voice when not set up.
let statusPromise;

// The hosted API can take a while to wake up, so allow time before falling back to device voices.
// A failed check is not remembered, so the next page asks again.
export function checkNaturalVoice() {
  statusPromise ||= fetch(`${window.API_BASE_URL}/api/tts/status`, { signal: AbortSignal.timeout(30000) })
    .then(response => response.ok ? response.json() : {})
    .then(data => data?.enabled === true)
    .catch(() => { statusPromise = null; return false; });
  return statusPromise;
}

export function naturalVoiceUrl(text, { speaker = 'A', speed = 'normal' } = {}) {
  const params = new URLSearchParams({ text: text.trim(), speaker: speaker === 'B' ? 'B' : 'A', speed });
  return `${window.API_BASE_URL}/api/tts?${params}`;
}

// Plays one Chinese word or phrase: the Azure voice (in the student's chosen gender) when it is set up,
// otherwise the browser's Mandarin voice. Used for word audio in lessons, reviews and progress.
let current;
export async function playMandarin(text, { rate = 1 } = {}) {
  if (!text?.trim()) return;
  current?.pause(); current = null;
  window.speechSynthesis?.cancel();
  if (await checkNaturalVoice()) {
    let male = false;
    try { male = localStorage.getItem('mandarinVoiceGender') === 'male'; } catch { /* storage may be blocked */ }
    const audio = new Audio(naturalVoiceUrl(text, { speaker: male ? 'B' : 'A', speed: rate < 0.9 ? 'slow' : 'normal' }));
    current = audio;
    try { await audio.play(); return; } catch (error) { if (error?.name === 'NotAllowedError') return; }
  }
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
