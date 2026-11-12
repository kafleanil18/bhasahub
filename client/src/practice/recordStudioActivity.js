// Account activity is independent of exercise state: a save failure never blocks practice.
export function recordStudioActivity(studio, correct = null, itemKey) {
  let token, eventId;
  try {
    token = localStorage.getItem('token');
    if (!token) return;
    eventId = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  } catch {
    window.dispatchEvent(new CustomEvent('studio-activity-save-error'));
    return;
  }
  const save = async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(`${window.API_BASE_URL}/api/studio-activity`, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ eventId, studio, correct, itemKey }),
        });
        if (response.ok) { window.dispatchEvent(new CustomEvent('studio-activity-saved')); return; }
        if (response.status < 500) break;
      } catch { /* Retry once with the same ID to avoid duplicate counts. */ }
    }
    window.dispatchEvent(new CustomEvent('studio-activity-save-error'));
  };
  void save();
}
