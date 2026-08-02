import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

export function useLessons(courseId) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/lessons/course/${courseId}`)
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load lessons.');
        setLoading(false);
      });
  }, [courseId]);

  return { lessons, loading, error };
}
