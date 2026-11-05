import { useCallback, useEffect, useState } from 'react';
export default function usePracticePapers() {
  const [papers, setPapers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/hsk1`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load practice papers.');
      setPapers(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { papers, error, loading, reload };
}
