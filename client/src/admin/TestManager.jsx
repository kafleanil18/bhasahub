import { useState } from 'react';
import FeaturedPaper from '../tests/hsk1/FeaturedPaper';
import usePracticePapers from '../tests/hsk1/usePracticePapers';
import PracticePaperEditor from './PracticePaperEditor';
import './TestManager.css';
import { useInitialLoad } from '../navigation/pageLoad';

import RefreshButton from '../components/RefreshButton';
import { apiFetch } from '../lib/apiClient';

export default function TestManager({ onBack, onPreviewTest, user }) {
  const { papers, error, loading, reload } = usePracticePapers();
  useInitialLoad(loading, 'Loading practice papers…');
  const [editor, setEditor] = useState(null);
  const [editError, setEditError] = useState('');
  const [opening, setOpening] = useState(false);
  const [working, setWorking] = useState('');
  const [notice, setNotice] = useState('');
  const canEdit = user?.role === 'superadmin';
  // Paper order: by when each was added (oldest first by default), or by HSK paper number.
  const [sort, setSort] = useState('oldest');
  const edit = async id => {
    setOpening(true); setEditError(''); setNotice('');
    try {
      const res = await apiFetch(`${window.API_BASE_URL}/api/hsk1/${id}/editor`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load the editor.');
      setEditor({ id, content: data });
    } catch (err) { setEditError(err.message); }
    finally { setOpening(false); }
  };
  // Runs one paper action (delete, restore, restore original) after the superadmin confirms it.
  const act = async (paper, { confirm, method, path = '', done }) => {
    if (!window.confirm(confirm)) return;
    setWorking(paper.id); setEditError(''); setNotice('');
    try {
      const res = await apiFetch(`${window.API_BASE_URL}/api/hsk1/${paper.id}${path}`, { method });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update the paper.');
      setNotice(done); reload();
    } catch (err) { setEditError(err.message); }
    finally { setWorking(''); }
  };
  const remove = paper => act(paper, { method: 'DELETE', confirm: `Delete “${paper.title}”? Students will no longer see it or their past results for it. You can restore it later from Deleted papers.`, done: `${paper.title} deleted. Restore it from Deleted papers below if needed.` });
  const restore = paper => act(paper, { method: 'POST', path: '/restore', confirm: `Restore “${paper.title}”? It comes back hidden so you can check it before making it live.`, done: `${paper.title} restored as hidden. Preview it, then choose Make live.` });
  const makeFree = paper => act(paper, { method: 'PUT', path: '/free', confirm: `Make “${paper.title}” the free mock test? Every signed-in student can take it without a free week or plan, and the current free paper needs access again.`, done: `${paper.title} is now the free mock test for all signed-in users.` });
  const restoreOriginal = paper => act(paper, { method: 'DELETE', path: '/content', confirm: `Discard all edits to “${paper.title}” and go back to the original built-in version?`, done: `${paper.title} restored to its original version.` });
  const saved = data => {
    setEditor(null); reload();
    setNotice(data?.notice || (data?.published ? 'Changes saved. The paper is still live for students.' : 'Paper saved as a hidden draft. Preview it, then choose Make live when ready.'));
  };
  const paperNumber = paper => { const digits = String(paper.code || paper.id).replace(/\D/g, ''); return digits ? Number(digits) : Infinity; };
  const added = paper => (paper.addedAt ? new Date(paper.addedAt).getTime() : 0);
  const order = { number: (a, b) => paperNumber(a) - paperNumber(b), latest: (a, b) => added(b) - added(a), oldest: (a, b) => added(a) - added(b) }[sort];
  const active = papers.filter(paper => !paper.deleted).sort(order);
  const freePaper = active.find(paper => paper.free);
  const deleted = papers.filter(paper => paper.deleted);
  const busy = Boolean(opening || working);
  return (
    <section className="container test-studio" aria-labelledby="test-studio-title">
      {!editor && <button className="back-btn" onClick={onBack}>Back</button>}
      <header className="test-studio-heading">
        <h1 id="test-studio-title">Test Studio</h1>
        <p>Create, edit and delete practice papers, upload pictures and audio, and control when students can take them.</p>
      </header>
      {editor ? <PracticePaperEditor initial={editor.content} paperId={editor.id} onCancel={() => setEditor(null)} onSaved={saved} /> : <>
        {canEdit && <button className="paper-create-button" disabled={busy} onClick={() => { setNotice(''); setEditor({}); }}>Create complete practice paper</button>}
        {notice && <p role="status">{notice}</p>}
        {(error || editError) && <div className="paper-error" role="alert"><p>{error || editError}</p>{error && <RefreshButton onClick={reload}>Retry loading papers</RefreshButton>}</div>}
        {loading && <p role="status">Loading practice papers…</p>}
        {opening && <p role="status">Opening paper editor…</p>}
        {!loading && active.length > 0 && <div className="paper-toolbar">
          <label className="paper-sort">Sort papers
            <select value={sort} onChange={event => setSort(event.target.value)}>
              <option value="oldest">Oldest uploaded</option>
              <option value="latest">Latest uploaded</option>
              <option value="number">HSK paper number</option>
            </select>
          </label>
          {freePaper && <p className="paper-free-summary"><span className="mock-test-free-tag">Free</span> {freePaper.code} is free for all signed-in users.{canEdit && ' Choose “Make this the free paper” on another live paper to change it.'}</p>}
        </div>}
        {active.map(paper => <FeaturedPaper key={`${paper.id}-${paper.published}-${paper.edited}`} paperId={paper.id} title={paper.title} code={paper.code} edited={paper.edited} free={paper.free} manage onPublishedChange={reload} onOpen={() => onPreviewTest(paper.id)} onEdit={canEdit && !busy ? () => edit(paper.id) : undefined}>
          {canEdit && !paper.free && paper.published && <button className="paper-free-button" onClick={() => makeFree(paper)} disabled={busy}>{working === paper.id ? 'Saving…' : 'Make this the free paper'}</button>}
          {canEdit && paper.edited && <button onClick={() => restoreOriginal(paper)} disabled={busy}>Restore original</button>}
          {canEdit && <button className="paper-delete-button" onClick={() => remove(paper)} disabled={busy}>{working === paper.id ? 'Deleting…' : 'Delete paper'}</button>}
        </FeaturedPaper>)}
        {deleted.length > 0 && <section className="paper-deleted" aria-labelledby="paper-deleted-title">
          <h2 id="paper-deleted-title">Deleted papers</h2>
          <p>Hidden from students and closed to new attempts. Restore a paper to bring it back as hidden.</p>
          <ul>{deleted.map(paper => <li key={paper.id}>
            <span><small>{paper.code}</small> {paper.title}</span>
            <span>
              <button onClick={() => onPreviewTest(paper.id)}>Preview</button>
              {canEdit && <button onClick={() => restore(paper)} disabled={busy}>{working === paper.id ? 'Restoring…' : 'Restore'}</button>}
            </span>
          </li>)}</ul>
        </section>}
      </>}
    </section>
  );
}
