import { useCallback, useEffect, useRef, useState } from 'react';

const resources = {
  students: { path: '/subscriptions/students', label: 'students' },
  courses: { path: '/courses', label: 'courses' },
  subs: { path: '/subscriptions/all', label: 'student access' },
  requests: { path: '/access-requests', label: 'access requests' },
};
export async function accessRequest(path, options = {}) {
  const response = await fetch(`${window.API_BASE_URL}/api${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export default function useSubscriptionData() {
  const [data, setData] = useState({ students: [], courses: [], subs: [], requests: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const mounted = useRef(false);
  const pending = useRef(new Map());
  const load = useCallback(async (keys = Object.keys(resources)) => {
    if (mounted.current) setRefreshing(count => count + 1);
    try { await Promise.all(keys.map(key => {
      if (pending.current.has(key)) return pending.current.get(key);
      const task = (async () => {
        try {
          const value = await accessRequest(resources[key].path);
          if (!Array.isArray(value)) throw new Error('Unexpected response');
          if (mounted.current) {
            setData(previous => ({ ...previous, [key]: value }));
            if (key === 'subs') setUpdatedAt(new Date());
            setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
          }
        } catch {
          if (mounted.current) setErrors(previous => ({ ...previous, [key]: `Couldn’t load ${resources[key].label}. Please retry.` }));
        } finally { pending.current.delete(key); }
      })();
      pending.current.set(key, task);
      return task;
    })); } finally { if (mounted.current) setRefreshing(count => Math.max(0, count - 1)); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load().finally(() => { if (mounted.current) setLoading(false); });
    const refresh = () => { void load(['requests', 'subs']); };
    const refreshOnFocus = () => { void load(); };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refreshOnFocus);
    return () => { mounted.current = false; window.clearInterval(interval); window.removeEventListener('focus', refreshOnFocus); };
  }, [load]);
  return { ...data, errors, loading, refreshing: refreshing > 0, updatedAt, reload: load };
}
