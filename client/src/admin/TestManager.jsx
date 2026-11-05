import { useState } from 'react';
import FeaturedPaper from '../tests/hsk1/FeaturedPaper';
import usePracticePapers from '../tests/hsk1/usePracticePapers';
import PracticePaperEditor from './PracticePaperEditor';
import './TestManager.css';

export default function TestManager({ onBack, onPreviewTest, user }) {
  const { papers, error, loading, reload } = usePracticePapers();
  const [editor, setEditor] = useState(null);
  const [editError, setEditError] = useState('');
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState('');
  const canEdit = user?.role === 'superadmin';
  const edit = async id => {
    setOpening(true); setEditError('');
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/hsk1/${id}/editor`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load the editor.');
      setEditor({ id, content: data });
    } catch (err) { setEditError(err.message); }
    finally { setOpening(false); }
  };
  return (
    <section className="container test-studio" aria-labelledby="test-studio-title">
      {!editor && <button className="back-btn" onClick={onBack}>← Back</button>}
      <header className="test-studio-heading">
        <h1 id="test-studio-title">Test Studio</h1>
        <p>Create complete practice papers, upload pictures and audio, and control when students can take them.</p>
      </header>
      {editor ? <PracticePaperEditor initial={editor.content} paperId={editor.id} onCancel={() => setEditor(null)} onSaved={() => { setEditor(null); setNotice('Paper saved as a hidden draft. Preview it, then choose Make live when ready.'); reload(); }} /> : <>
        {canEdit && <button className="paper-create-button" disabled={opening} onClick={() => { setNotice(''); setEditor({}); }}>Create complete practice paper</button>}
        {notice && <p role="status">{notice}</p>}
        {(error || editError) && <div className="paper-error" role="alert"><p>{error || editError}</p>{error && <button onClick={reload}>Retry loading papers</button>}</div>}
        {loading && <p role="status">Loading practice papers…</p>}
        {opening && <p role="status">Opening paper editor…</p>}
        {papers.map(paper => <FeaturedPaper key={`${paper.id}-${paper.published}`} paperId={paper.id} title={paper.title} code={paper.code} manage onOpen={() => onPreviewTest(paper.id)} onEdit={canEdit && paper.custom && !opening ? () => edit(paper.id) : undefined} />)}
      </>}
    </section>
  );
}
