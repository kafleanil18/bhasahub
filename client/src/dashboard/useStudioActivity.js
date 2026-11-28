import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

// Loads the student's practice studio activity and HSK test completions.
// `settled` turns true once the first request has finished (with data or an error), so
// My Progress can keep its loading screen up until this section is ready too.
export default function useStudioActivity(refreshKey) {
  const [state, setState] = useState({ loading: true });
  const [settled, setSettled] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    apiFetch(`${window.API_BASE_URL}/api/studio-activity/me`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    }).then(async response => {
      if (!response.ok) throw new Error('Analytics unavailable');
      const data = await response.json();
      if (!Array.isArray(data.studios) || !Array.isArray(data.hsk) || !Array.isArray(data.otherTests)) throw new Error('Invalid analytics');
      if (!controller.signal.aborted) setState({ data });
    }).catch(() => { if (!controller.signal.aborted) setState({ error: true }); })
      .finally(() => { if (!controller.signal.aborted) setSettled(true); });
    return () => controller.abort();
  }, [refreshKey, attempt]);
  return { state, setState, settled, retry: () => setAttempt(value => value + 1) };
}
