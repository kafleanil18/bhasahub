import { useState, useEffect, useCallback } from 'react';

const API = window.API_BASE_URL + '/api';

export function useLessons(courseId, token) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLessons = useCallback(async (signal, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API}/lessons/course/${courseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
        signal,
      });
      if (!res.ok) throw new Error('Could not load lessons.');
      const data = await res.json();
      setLessons(data);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') setError('Could not load lessons.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => loadLessons(controller.signal);
    setError(null);
    loadLessons(controller.signal, true);

    const refreshWhenVisible = () => {
      if (!document.hidden) refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, 30000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [courseId, loadLessons]);

  return { lessons, loading, error };
}
