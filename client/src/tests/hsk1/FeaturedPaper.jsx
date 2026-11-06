import { useEffect, useState } from 'react';
import './HskPortal.css';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' });

export default function FeaturedPaper({ onOpen, onRetake, manage = false, showHidden = false, paperId = 'h11226', title = 'HSK 1 · Listening & Reading', code, onEdit, completed }) {
  const API = `${window.API_BASE_URL}/api/hsk1/${paperId}/publication`;
  const [published, setPublished] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch(API, { headers: headers(), signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load paper visibility.');
        if (!controller.signal.aborted) setPublished(data.published);
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [reload, API]);

  const toggle = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch(API, { method: 'PUT', headers: headers(), body: JSON.stringify({ published: !published }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update paper visibility.');
      setPublished(data.published);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (published === false && !showHidden && !manage) return null;
  if (published === null) return <div className="hsk-featured-status" role="status">{error ? <><p>{error}</p><button onClick={() => setReload(value => value + 1)}>Retry loading practice paper</button></> : 'Loading practice paper…'}</div>;
  return <div className={`hsk-featured-test${completed === true ? ' is-completed' : ''}`}>
    <div>{typeof completed === 'boolean' && <span className={`mock-test-completion${completed ? ' is-done' : ''}`}>{completed ? '✓ Completed' : 'Not started'}</span>}<small>{code || paperId.toUpperCase()} · HSK 1</small><h2>{title}</h2><p className="hsk-featured-meta">40 questions <span>·</span> 20 listening <span>·</span> 20 reading <span>·</span> Timed</p>
      {(manage || showHidden) && <p role="status"><strong>{published ? 'Live · visible to students' : 'Hidden · staff preview only'}</strong></p>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className="hsk-featured-actions">
      <button onClick={onOpen}>{manage || !published ? 'Preview paper →' : completed ? 'View results →' : 'Start test →'}</button>
      {completed === true && !manage && <button className="hsk-retake-button" onClick={onRetake || onOpen}>↻ Retake test</button>}
      {onEdit && <button onClick={onEdit}>Edit questions & pictures</button>}
      {manage && <button onClick={toggle} disabled={busy}>{busy ? 'Saving…' : published ? 'Hide from students' : 'Make live'}</button>}
    </div>
  </div>;
}
