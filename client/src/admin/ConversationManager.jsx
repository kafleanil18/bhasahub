import { useEffect, useMemo, useState } from 'react';
import { bookLessons } from '../practice/conversationLessons';
import './ConversationManager.css';

const API = `${window.API_BASE_URL}/api/settings`;
const tokenHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' });
const clone = value => JSON.parse(JSON.stringify(value));

export default function ConversationManager({ onBack }) {
  const [savedLessons, setSavedLessons] = useState(bookLessons);
  const [selectedId, setSelectedId] = useState(bookLessons[0]?.id);
  const [draft, setDraft] = useState(() => clone(bookLessons[0]));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selected = useMemo(() => savedLessons.find(lesson => lesson.id === selectedId), [savedLessons, selectedId]);

  useEffect(() => {
    fetch(API).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load conversation lessons.');
      const stored = Array.isArray(data.conversationLessons) ? data.conversationLessons : [];
      const merged = bookLessons.map(item => stored.find(saved => saved.id === item.id) || item);
      setSavedLessons(merged);
      setDraft(clone(merged.find(item => item.id === selectedId) || merged[0]));
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const chooseLesson = id => {
    if (selected && JSON.stringify(draft) !== JSON.stringify(selected) && !window.confirm('Discard unsaved changes to this lesson?')) return;
    setSelectedId(id);
    setDraft(clone(savedLessons.find(item => item.id === id)));
    setError(''); setNotice('');
  };
  const patchDraft = patch => setDraft(current => ({ ...current, ...patch }));
  const updateExchange = (index, patch) => patchDraft({ exchanges: draft.exchanges.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const updateTurn = (exchangeIndex, turnIndex, patch) => patchDraft({ exchanges: draft.exchanges.map((item, i) => i === exchangeIndex ? { ...item, turns: item.turns.map((turn, j) => j === turnIndex ? { ...turn, ...patch } : turn) } : item) });
  const updateWord = (index, patch) => patchDraft({ words: draft.words.map((word, i) => i === index ? { ...word, ...patch } : word) });

  const save = async event => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const next = savedLessons.map(item => item.id === draft.id ? draft : item);
      const response = await fetch(API, { method: 'PUT', headers: tokenHeaders(), body: JSON.stringify({ conversationLessons: next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save the lesson.');
      setSavedLessons(next); setNotice(`Lesson ${draft.number} saved. Updates are now visible in Conversation Practice.`);
    } catch (err) { setError(err.message || 'Could not save the lesson.'); }
    finally { setSaving(false); }
  };

  if (loading) return <main className="container conversation-manager"><p role="status">Loading conversation lessons…</p></main>;
  if (!draft) return <main className="container conversation-manager"><p role="alert">No editable conversation lessons are available.</p></main>;

  return <main className="container conversation-manager">
    <button className="conversation-manager-back" type="button" onClick={() => { if (!selected || JSON.stringify(draft) === JSON.stringify(selected) || window.confirm('Discard unsaved changes to this lesson?')) onBack(); }}>← Back to control center</button>
    <header className="conversation-manager-hero"><div><p className="conversation-manager-kicker">CONTENT WORKSPACE</p><h1>Conversation Studio</h1><p>Edit the HSK 1 conversation lessons shown to students.</p></div><button className="conversation-manager-save" form="conversation-editor" disabled={saving}>{saving ? 'Saving…' : 'Save lesson'}</button></header>
    {error && <p className="conversation-manager-message is-error" role="alert">{error}</p>}{notice && <p className="conversation-manager-message is-success" role="status">{notice}</p>}
    <div className="conversation-manager-layout">
      <nav className="conversation-manager-lessons" aria-label="Choose a lesson to edit"><h2>Lessons 4–15</h2>{savedLessons.map(item => <button key={item.id} className={selectedId === item.id ? 'is-selected' : ''} type="button" onClick={() => chooseLesson(item.id)}><span>{item.number}</span><strong>{item.title}</strong><small>{item.subtitle}</small></button>)}</nav>
      <form id="conversation-editor" className="conversation-editor" onSubmit={save}>
        <section className="conversation-editor-section"><div className="conversation-editor-heading"><div><p>LESSON DETAILS</p><h2>Student-facing introduction</h2></div><span>Lesson {draft.number}</span></div>
          <div className="conversation-editor-fields">
            {[["title", "Chinese title"], ["subtitle", "English title"], ["topic", "Topic"], ["heroTitle", "Hero headline"], ["kicker", "Hero label"], ["caption", "Image caption"], ["image", "Image path"], ["imageAlt", "Image description"]].map(([key, label]) => <label key={key}>{label}<input value={draft[key] || ''} onChange={event => patchDraft({ [key]: event.target.value })}/></label>)}
            <label className="is-wide">Lesson guidance<textarea rows="2" value={draft.intro || ''} onChange={event => patchDraft({ intro: event.target.value })}/></label>
          </div>
        </section>
        <section className="conversation-editor-section"><div className="conversation-editor-heading"><div><p>DIALOGUE</p><h2>Conversation exchanges</h2></div><button type="button" onClick={() => patchDraft({ exchanges: [...draft.exchanges, { number: String(draft.exchanges.length + 1).padStart(2, '0'), title: 'New conversation', tone: 'hello', turns: [{ speaker: 'A', chinese: '', pinyin: '', english: '' }, { speaker: 'B', chinese: '', pinyin: '', english: '' }] }] })}>＋ Add exchange</button></div>
          {draft.exchanges.map((exchange, exchangeIndex) => <article className="conversation-edit-exchange" key={`${exchange.number}-${exchangeIndex}`}><div className="conversation-edit-exchange-head"><label>Exchange title<input value={exchange.title} onChange={event => updateExchange(exchangeIndex, { title: event.target.value })}/></label><label>Accent<select value={exchange.tone} onChange={event => updateExchange(exchangeIndex, { tone: event.target.value })}><option value="hello">Warm red</option><option value="polite">Golden</option><option value="sorry">Green</option></select></label><button type="button" className="conversation-remove" onClick={() => patchDraft({ exchanges: draft.exchanges.filter((_, i) => i !== exchangeIndex) })}>Remove exchange</button></div>
            {exchange.turns.map((turn, turnIndex) => <div className="conversation-edit-turn" key={`${turn.speaker}-${turnIndex}`}><div className="conversation-edit-turn-title">Turn {turnIndex + 1}<select aria-label="Speaker" value={turn.speaker} onChange={event => updateTurn(exchangeIndex, turnIndex, { speaker: event.target.value })}><option>A</option><option>B</option></select><button type="button" onClick={() => updateExchange(exchangeIndex, { turns: exchange.turns.filter((_, i) => i !== turnIndex) })}>Remove</button></div><div className="conversation-editor-fields"><label>Chinese characters<input value={turn.chinese} onChange={event => updateTurn(exchangeIndex, turnIndex, { chinese: event.target.value })}/></label><label>Pinyin<input value={turn.pinyin} onChange={event => updateTurn(exchangeIndex, turnIndex, { pinyin: event.target.value })}/></label><label className="is-wide">English meaning<input value={turn.english} onChange={event => updateTurn(exchangeIndex, turnIndex, { english: event.target.value })}/></label></div></div>)}
            <button type="button" className="conversation-add-turn" onClick={() => updateExchange(exchangeIndex, { turns: [...exchange.turns, { speaker: exchange.turns.at(-1)?.speaker === 'A' ? 'B' : 'A', chinese: '', pinyin: '', english: '' }] })}>＋ Add dialogue turn</button>
          </article>)}
        </section>
        <section className="conversation-editor-section"><div className="conversation-editor-heading"><div><p>VOCABULARY</p><h2>New words</h2></div><button type="button" onClick={() => patchDraft({ words: [...draft.words, { chinese: '', pinyin: '', type: 'noun', meaning: '' }] })}>＋ Add word</button></div>
          <div className="conversation-word-editor">{draft.words.map((word, index) => <div className="conversation-word-edit-row" key={`${word.chinese}-${index}`}>{[["chinese", "Characters"], ["pinyin", "Pinyin"], ["type", "Part of speech"], ["meaning", "Meaning"]].map(([key, label]) => <label key={key}>{label}<input value={word[key] || ''} onChange={event => updateWord(index, { [key]: event.target.value })}/></label>)}<button className="conversation-remove" type="button" onClick={() => patchDraft({ words: draft.words.filter((_, i) => i !== index) })}>Remove</button></div>)}</div>
        </section>
        <div className="conversation-editor-footer"><span>Only super admins can save changes. Existing lessons remain available to students.</span><button className="conversation-manager-save" disabled={saving}>{saving ? 'Saving…' : 'Save lesson'}</button></div>
      </form>
    </div>
  </main>;
}
