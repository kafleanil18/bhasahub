import { useEffect, useState } from 'react';

export default function useLearningSpace(token) {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setCourses([]); setProgress({});
    const request = async path => {
      const response = await fetch(`${window.API_BASE_URL}/api${path}`, { headers: { Authorization: `Bearer ${token || ''}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load your learning space.');
      return data;
    };
    const load = async () => {
      try {
        const list = await request('/enrollments/my');
        if (!Array.isArray(list)) throw new Error('Could not load your courses.');
        const available = list.filter(course => course?._id);
        const entries = await Promise.all(available.map(async course => {
          try {
            const value = await request(`/progress/course/${course._id}`);
            if (!Number.isInteger(value.total) || value.total < 0 || !Number.isInteger(value.completed) || value.completed < 0) throw new Error('Progress unavailable');
            return [course._id, { total: value.total, completed: Math.min(value.completed, value.total) }];
          } catch { return [course._id, null]; }
        }));
        if (!controller.signal.aborted) { setCourses(available); setProgress(Object.fromEntries(entries)); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || 'Could not load your courses. Please try again.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [token, attempt]);
  return { courses, progress, loading, error, reload: () => setAttempt(value => value + 1) };
}
