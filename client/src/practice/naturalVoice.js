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
