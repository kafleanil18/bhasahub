import { useEffect, useState } from 'react';
import './HskPortal.css';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' });

export default function FeaturedPaper({ onOpen, manage = false, showHidden = false, paperId = 'h11226', title = 'HSK 1 · Listening & Reading', code, onEdit }) {
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
  return <div className="hsk-featured-test">
    <div><small>Complete practice paper · {code || paperId.toUpperCase()}</small><h2>{title}</h2><p>Take the 40-question test with colorful illustrations, pinyin, and the full listening recording. Get your result and answer review when you finish.</p><span>20 listening + 20 reading · Timed sections · Saved results</span>
      {(manage || showHidden) && <p role="status"><strong>{published ? 'Live · visible to students' : 'Hidden · staff preview only'}</strong></p>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className="hsk-featured-actions">
      <button onClick={onOpen}>{manage || !published ? 'Preview paper →' : 'Enter test portal →'}</button>
      {onEdit && <button onClick={onEdit}>Edit questions & pictures</button>}
      {manage && <button onClick={toggle} disabled={busy}>{busy ? 'Saving…' : published ? 'Hide from students' : 'Make live'}</button>}
    </div>
  </div>;
}
