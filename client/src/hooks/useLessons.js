import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

export function useLessons(courseId) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/lessons/course/${courseId}`)
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId]);

  return { lessons, loading };
}
