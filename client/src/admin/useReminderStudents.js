import { useEffect, useState } from 'react';
import { reminderRequest } from './usePracticeReminders';

export default function useReminderStudents() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    reminderRequest('/students', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setError('Could not refresh student activity. Please try again before selecting recipients.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);
  return { students: data?.students || [], asOf: data?.asOf, loading, error, refresh: () => setVersion(value => value + 1) };
}
