import { useEffect, useState } from 'react';
import { apiJson } from '../lib/apiClient';

export const reminderApi = `${window.API_BASE_URL}/api/practice-reminders`;
export const reminderRequest = (path, options = {}) => apiJson(`${reminderApi}${path}`, {
  ...options, timeout: 20000, headers: { 'Content-Type': 'application/json' },
  fallbackError: 'Could not complete the request. Please try again.',
});

export default function usePracticeReminders() {
  const [audience, setAudience] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audienceError, setAudienceError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function load() {
      const results = await Promise.allSettled([
        reminderRequest('/audience', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }),
        reminderRequest('/campaigns', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }),
      ]);
      if (controller.signal.aborted) return;
      if (results[0].status === 'fulfilled') setAudience(results[0].value);
      if (results[1].status === 'fulfilled') setCampaigns(results[1].value);
      const failed = results.some(result => result.status === 'rejected');
      setAudienceError(results[0].status === 'rejected' ? results[0].reason.message || 'Could not load eligible students.' : '');
      setError(failed ? 'Some reminder data could not be refreshed. Please try again.' : '');
      setLoading(false);
      if (failed || results[1].value?.some(campaign => !campaign.complete)) timer = setTimeout(load, 4000);
    }
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [version]);
  return { audience, campaigns, loading, error, audienceError, refresh: () => setVersion(value => value + 1) };
}
