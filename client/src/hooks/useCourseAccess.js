import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

export function useCourseAccess(courseId, token) {
  const [hasAccess, setHasAccess] = useState(false);
  const [accessExpiry, setAccessExpiry] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setAccessChecked(true); return; }
    setError(null);
    fetch(`${API}/subscriptions/check/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setHasAccess(!!data.hasAccess);
        setAccessExpiry(data.expiresAt || null);
        setAccessChecked(true);
      })
      .catch(() => {
        setError('Could not check your course access.');
        setAccessChecked(true);
      });
  }, [courseId, token]);

  return { hasAccess, accessExpiry, accessChecked, error };
}
