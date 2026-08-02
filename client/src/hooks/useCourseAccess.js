import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

export function useCourseAccess(courseId, token) {
  const [hasAccess, setHasAccess] = useState(false);
  const [accessExpiry, setAccessExpiry] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (!token) { setAccessChecked(true); return; }
    fetch(`${API}/subscriptions/check/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setHasAccess(!!data.hasAccess);
        setAccessExpiry(data.expiresAt || null);
        setAccessChecked(true);
      })
      .catch(() => setAccessChecked(true));
  }, [courseId, token]);

  return { hasAccess, accessExpiry, accessChecked };
}
