import { useCallback, useEffect, useRef, useState } from 'react';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' });
async function requestPaper(paperId, path = '', options = {}) {
  const API = `${window.API_BASE_URL}/api/hsk1/${paperId}`;
  const response = await fetch(API + path, { ...options, headers: auth(), signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request failed. Please try again.');
  return data;
}
const readDraft = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
export const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function useHskExam(user, paperId = 'h11226') {
  const request = useCallback((path, options) => requestPaper(paperId, path, options), [paperId]);
  const key = `hanzigo:${paperId}:v1:${user?._id || user?.id || user?.email}`;
  const [paper, setPaper] = useState(null);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [attempt, setAttempt] = useState(0);
  const sending = useRef(false);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const load = async () => {
      try {
        const data = await request();
        if (!active) return;
        setPaper(data);
        const saved = readDraft(key);
        if (saved?.id) {
          try {
            const existing = await request(`/attempts/${saved.id}`);
            if (!active) return;
            if (existing.paperDefinition) setPaper(existing.paperDefinition);
            if (existing.status === 'submitted') setResult(existing);
            else if (['ready', 'listening', 'transfer', 'reading', 'review'].includes(saved.stage) && Array.isArray(saved.answers) && saved.answers.length === 40 && Number.isFinite(saved.deadline)) setSession(saved);
          } catch (err) { if (active) setError(`Could not restore the previous attempt: ${err.message}`); }
        }
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    };
    load();
    request('/attempts').then(data => { if (active) { setHistory(data); setHistoryError(''); } }).catch(() => { if (active) setHistoryError('Past results could not be loaded.'); });
    return () => { active = false; };
  }, [key, attempt, request]);

  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(key, JSON.stringify(session)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [key, session]);
  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId || result) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => { clearInterval(timer); window.removeEventListener('beforeunload', warn); };
  }, [sessionId, result]); // Answers do not restart the clock.

  const start = async () => {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      const created = await request('/attempts', { method: 'POST' });
      if (created.paperDefinition) setPaper(created.paperDefinition);
      autoSubmitted.current = false;
      const time = Date.now();
      setNow(time); setResult(null);
      setSession({ id: created._id, stage: 'ready', deadline: 0, answers: Array(40).fill(null), group: 0, audioTime: 0 });
    } catch (err) { setError(err.message); }
    finally { sending.current = false; setBusy(false); }
  };
  const submit = useCallback(async () => {
    if (!session || sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      const saved = await request(`/attempts/${session.id}/submit`, { method: 'POST', body: JSON.stringify({ answers: session.answers }) });
      setResult(saved); setHistory(previous => [saved, ...previous.filter(row => row._id !== saved._id)]);
    } catch (err) { setError(err.message); }
    finally { sending.current = false; setBusy(false); }
  }, [session, request]);

  useEffect(() => {
    if (!session || !paper || result || busy || now < session.deadline) return;
    if (session.stage === 'listening') setSession(current => ({ ...current, stage: 'transfer', deadline: current.deadline + paper.transferSeconds * 1000 }));
    else if (session.stage === 'transfer') setSession(current => ({ ...current, stage: 'reading', group: 4, deadline: current.deadline + paper.readingSeconds * 1000 }));
    else if (session.stage === 'reading') setSession(current => ({ ...current, stage: 'review' }));
    else if (session.stage === 'review' && !autoSubmitted.current) { autoSubmitted.current = true; submit(); }
  }, [now, session, paper, result, busy, submit]);

  const beginAudio = () => {
    if (session?.stage !== 'ready') return;
    setNow(Date.now());
    setSession(current => ({ ...current, stage: 'listening', deadline: Date.now() + paper.listeningSeconds * 1000 }));
  };
  const advance = () => {
    setNow(Date.now());
    setSession(current => current.stage === 'listening'
      ? { ...current, stage: 'transfer', deadline: Date.now() + paper.transferSeconds * 1000 }
      : { ...current, stage: 'reading', group: 4, deadline: Date.now() + paper.readingSeconds * 1000 });
  };
  const answer = (number, value) => {
    if (busy || result || !session || session.stage === 'review' || (session.stage !== 'ready' && Date.now() >= session.deadline)) return;
    setSession(current => ({ ...current, answers: current.answers.map((old, i) => i === number - 1 ? value : old) }));
  };
  const selectGroup = group => setSession(current => ({ ...current, group }));
  const saveAudio = time => setSession(current => current && Math.abs((current.audioTime || 0) - time) >= 3 ? { ...current, audioTime: time } : current);
  const openResult = async id => {
    setBusy(true); setError('');
    try { const saved = await request(`/attempts/${id}`); if (saved.paperDefinition) setPaper(saved.paperDefinition); setResult(saved); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return { paper, session, result, history, historyError, loading, busy, error, storageError, remaining: Math.max(0, Math.ceil(((session?.deadline || now) - now) / 1000)), start, submit, advance, beginAudio, answer, selectGroup, saveAudio, openResult, retry: () => setAttempt(value => value + 1) };
}
