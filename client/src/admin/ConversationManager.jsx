import { useEffect, useRef, useState } from 'react';
import { bookLessons } from '../practice/conversationLessons';
import SentenceRecorder from './SentenceRecorder';
import { recordingExtension, MAX_RECORDING_BYTES } from './sentenceRecording';
import { mediaUrl } from '../utils/mediaUrl';
import './ConversationManager.css';

const API = `${window.API_BASE_URL}/api/settings`;
const tokenHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' });
const clone = value => JSON.parse(JSON.stringify(value));

export default function ConversationManager({ onBack }) {
  const [savedLessons, setSavedLessons] = useState(bookLessons);
  const [selectedId, setSelectedId] = useState(bookLessons[0]?.id);
  const [draft, setDraft] = useState(() => clone(bookLessons[0]));
  const [baseline, setBaseline] = useState(() => clone(bookLessons[0]));
  const [isNewLesson, setIsNewLesson] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordingTurn, setRecordingTurn] = useState(null);
  const [uploadingTurn, setUploadingTurn] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const undoStack = useRef([]);
  const [undoMessage, setUndoMessage] = useState('');
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
  useEffect(() => {
    fetch(API).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load conversation lessons.');
      const stored = Array.isArray(data.conversationLessons) ? data.conversationLessons : [];
      const merged = [
        ...bookLessons.map(item => stored.find(saved => saved.id === item.id) || item),
        ...stored.filter(saved => !bookLessons.some(item => item.id === saved.id)),
      ].sort((a, b) => Number(a.number) - Number(b.number));
      setSavedLessons(merged);
      const initial = clone(merged.find(item => item.id === selectedId) || merged[0]);
      setDraft(initial); setBaseline(clone(initial));
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const chooseLesson = id => {
    if ((isNewLesson || JSON.stringify(draft) !== JSON.stringify(baseline)) && !window.confirm('Discard unsaved changes to this lesson?')) return;
    undoStack.current = []; setUndoMessage('');
    setSelectedId(id);
    const next = clone(savedLessons.find(item => item.id === id));
    setDraft(next); setBaseline(clone(next)); setIsNewLesson(false);
    setError(''); setNotice('');
  };
  const createLesson = () => {
    if ((isNewLesson || JSON.stringify(draft) !== JSON.stringify(baseline)) && !window.confirm('Discard unsaved changes to this lesson?')) return;
    const nextNumber = Math.max(15, ...savedLessons.map(item => Number(item.number) || 0)) + 1;
    if (nextNumber > 59) { setError('The conversation studio supports lessons up to 59.'); return; }
    undoStack.current = []; setUndoMessage('');
    const number = String(nextNumber).padStart(2, '0');
    const next = {
      id: `lesson-${nextNumber}`, number, title: '', subtitle: '', topic: '',
      image: '/images/conversation-lesson-04.png', imageAlt: 'Conversation lesson illustration',
      caption: 'A conversation · 对话练习', kicker: 'CONVERSATION PRACTICE', heroTitle: 'Practice a new conversation.',
      intro: '', exchanges: [{ number: '01', title: 'First conversation', tone: 'hello', turns: [
        { speaker: 'A', chinese: '', pinyin: '', english: '', audioUrl: '' },
        { speaker: 'B', chinese: '', pinyin: '', english: '', audioUrl: '' },
      ] }], words: [],
    };
    setSelectedId(next.id); setDraft(next); setBaseline(clone(next)); setIsNewLesson(true); setError(''); setNotice('');
  };
  const patchDraft = patch => setDraft(current => ({ ...current, ...patch }));
  const updateExchange = (index, patch) => patchDraft({ exchanges: draft.exchanges.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const updateTurn = (exchangeIndex, turnIndex, patch) => patchDraft({ exchanges: draft.exchanges.map((item, i) => i === exchangeIndex ? { ...item, turns: item.turns.map((turn, j) => j === turnIndex ? { ...turn, ...patch } : turn) } : item) });
  const updateWord = (index, patch) => patchDraft({ words: draft.words.map((word, i) => i === index ? { ...word, ...patch } : word) });

  const removeWithUndo = (type, label, item, index, exchangeIndex) => {
    undoStack.current.push({ type, label, item: clone(item), index, exchangeIndex });
    setUndoMessage(`Removed ${label}.`);
    if (type === 'exchange') patchDraft({ exchanges: draft.exchanges.filter((_, i) => i !== index) });
    if (type === 'word') patchDraft({ words: draft.words.filter((_, i) => i !== index) });
    if (type === 'turn') updateExchange(exchangeIndex, { turns: draft.exchanges[exchangeIndex].turns.filter((_, i) => i !== index) });
  };

  const undoDelete = () => {
    const removed = undoStack.current.pop();
    if (!removed) return;
    setDraft(current => {
      if (removed.type === 'exchange') {
        const exchanges = [...current.exchanges]; exchanges.splice(Math.min(removed.index, exchanges.length), 0, removed.item);
        return { ...current, exchanges };
      }
      if (removed.type === 'word') {
        const words = [...current.words]; words.splice(Math.min(removed.index, words.length), 0, removed.item);
        return { ...current, words };
      }
      const exchanges = [...current.exchanges];
      const exchange = exchanges[removed.exchangeIndex];
      if (!exchange) return current;
      const turns = [...exchange.turns]; turns.splice(Math.min(removed.index, turns.length), 0, removed.item);
      exchanges[removed.exchangeIndex] = { ...exchange, turns };
      return { ...current, exchanges };
    });
    setUndoMessage(`Restored ${removed.label}.`);
  };

  useEffect(() => {
    const handleUndo = event => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z' || event.shiftKey || !undoStack.current.length) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault(); undoDelete();
    };
    window.addEventListener('keydown', handleUndo);
    return () => window.removeEventListener('keydown', handleUndo);
  }, []);

  const save = async event => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    if (!draft.title.trim() || !draft.subtitle.trim()) { setError('Add both the Chinese and English lesson titles before saving.'); setSaving(false); return; }
    if (!draft.exchanges.length || draft.exchanges.some(exchange => !exchange.turns.length || !exchange.turns.some(turn => turn.chinese.trim()))) { setError('Add at least one exchange with a Chinese dialogue line before saving.'); setSaving(false); return; }
    try {
      const next = savedLessons.some(item => item.id === draft.id)
        ? savedLessons.map(item => item.id === draft.id ? draft : item)
        : [...savedLessons, draft].sort((a, b) => Number(a.number) - Number(b.number));
      const response = await fetch(API, { method: 'PUT', headers: tokenHeaders(), body: JSON.stringify({ conversationLessons: next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save the lesson.');
      setSavedLessons(next); setBaseline(clone(draft)); setIsNewLesson(false); setNotice(`Lesson ${draft.number} saved. Updates are now visible in Conversation Practice.`);
      undoStack.current = []; setUndoMessage('');
    } catch (err) { setError(err.message || 'Could not save the lesson.'); }
    finally { setSaving(false); }
  };

  const saveVoice = async (_sentence, recording) => {
    const { exchangeIndex, turnIndex } = recordingTurn;
    if (!recording?.size || recording.size > MAX_RECORDING_BYTES) throw new Error('Voice recordings must be smaller than 15 MB.');
    const form = new FormData();
    form.append('file', recording, `conversation-${draft.number}-${exchangeIndex + 1}-${turnIndex + 1}.${recordingExtension(recording.type)}`);
    const response = await fetch(`${window.API_BASE_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not save the voice recording.');
    updateTurn(exchangeIndex, turnIndex, { audioUrl: data.url });
    setNotice('Voice recording added. Save the lesson to publish it for students.');
  };

  const uploadVoiceFile = async (exchangeIndex, turnIndex, file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') || file.size > MAX_RECORDING_BYTES) { setError('Choose an audio file smaller than 15 MB.'); return; }
    const key = `${exchangeIndex}-${turnIndex}`; setUploadingTurn(key); setError('');
    const form = new FormData(); form.append('file', file);
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not upload this voice recording.');
      updateTurn(exchangeIndex, turnIndex, { audioUrl: data.url });
      setNotice('Voice recording added. Save the lesson to publish it for students.');
    } catch (err) { setError(err.message || 'Could not upload this voice recording.'); }
    finally { setUploadingTurn(''); }
  };

  if (loading) return <main className="container conversation-manager"><p role="status">Loading conversation lessons…</p></main>;
  if (!draft) return <main className="container conversation-manager"><p role="alert">No editable conversation lessons are available.</p></main>;

  return <main className="container conversation-manager">
    <button className="conversation-manager-back" type="button" onClick={() => { if ((!isNewLesson && JSON.stringify(draft) === JSON.stringify(baseline)) || window.confirm('Discard unsaved changes to this lesson?')) onBack(); }}>← Back to control center</button>
    <header className="conversation-manager-hero"><div><p className="conversation-manager-kicker">CONTENT WORKSPACE</p><h1>Conversation Studio</h1><p>Create a lesson, build the dialogue, then add voice recordings for students.</p></div><div className="conversation-manager-hero-actions"><button className="conversation-manager-new" type="button" onClick={createLesson}>＋ Create lesson</button><button className="conversation-manager-save" form="conversation-editor" disabled={saving}>{saving ? 'Saving…' : isNewLesson ? 'Publish lesson' : 'Save changes'}</button></div></header>
    {error && <p className="conversation-manager-message is-error" role="alert">{error}</p>}{notice && <p className="conversation-manager-message is-success" role="status">{notice}</p>}{undoMessage && <div className="conversation-undo-notice" role="status" aria-live="polite"><span>{undoMessage} <small>Press {isMac ? '⌘ Z' : 'Ctrl + Z'} to undo.</small></span><button type="button" onClick={undoDelete} disabled={!undoStack.current.length}>Undo</button></div>}
    <div className="conversation-manager-layout">
      <nav className="conversation-manager-lessons" aria-label="Choose a lesson to edit"><div className="conversation-manager-lesson-head"><p>LESSON LIBRARY</p><h2>Your lessons <span>{savedLessons.length}</span></h2></div>{isNewLesson && <div className="conversation-library-draft"><span>{draft.number}</span><div><strong>New lesson</strong><small>Unsaved draft</small></div></div>}{savedLessons.map(item => <button key={item.id} className={selectedId === item.id ? 'is-selected' : ''} type="button" onClick={() => chooseLesson(item.id)}><span>{item.number}</span><strong>{item.title || 'Untitled lesson'}</strong><small>{item.subtitle || 'HSK 1 conversation'}</small></button>)}</nav>
      <form id="conversation-editor" className="conversation-editor" onSubmit={save}>
        <section className="conversation-editor-section conversation-step"><div className="conversation-step-heading"><span>1</span><div><p>START WITH THE BASICS</p><h2>Lesson details</h2><small>Give students a clear name and topic for this conversation.</small></div><span className="conversation-lesson-badge">LESSON {draft.number}</span></div>
          <div className="conversation-editor-fields">
            {["title", "subtitle", "topic"].map((key, index) => { const label = ["Chinese lesson title", "English title", "Topic"][index]; const placeholder = ["例如：你叫什么名字", "For example: What’s your name?", "Introducing yourself"][index]; return <label key={key}>{label}<input placeholder={placeholder} value={draft[key] || ''} onChange={event => patchDraft({ [key]: event.target.value })}/>{index < 2 && <small>{index === 0 ? 'Main lesson title.' : 'Shown beside the Chinese title.'}</small>}</label>; })}
            <label className="is-wide">Student guidance<textarea rows="2" placeholder="A short note about what students will practice." value={draft.intro || ''} onChange={event => patchDraft({ intro: event.target.value })}/></label>
          </div>
          <details className="conversation-advanced-details"><summary>Optional lesson artwork and display text</summary><div className="conversation-editor-fields">{[["heroTitle", "Hero headline"], ["kicker", "Hero label"], ["caption", "Image caption"], ["image", "Image path"], ["imageAlt", "Image description"]].map(([key, label]) => <label key={key}>{label}<input value={draft[key] || ''} onChange={event => patchDraft({ [key]: event.target.value })}/></label>)}</div></details>
        </section>
        <section className="conversation-editor-section conversation-step"><div className="conversation-step-heading"><span>2</span><div><p>BUILD THE DIALOGUE</p><h2>What will they say?</h2><small>Add each line in Chinese, then pair it with pinyin and its meaning.</small></div></div>
          {draft.exchanges.map((exchange, exchangeIndex) => <article className={`conversation-edit-exchange is-${exchange.tone}`} key={`${exchange.number}-${exchangeIndex}`}><div className="conversation-edit-exchange-head"><div className="conversation-exchange-title"><span>CONVERSATION {String(exchangeIndex + 1).padStart(2, '0')}</span><label>Conversation title<input placeholder="Ask and answer a name" value={exchange.title} onChange={event => updateExchange(exchangeIndex, { title: event.target.value })}/></label></div><label className="conversation-accent-label">Palette<select aria-label="Conversation color palette" value={exchange.tone} onChange={event => updateExchange(exchangeIndex, { tone: event.target.value })}><option value="hello">Terracotta</option><option value="polite">Saffron</option><option value="sorry">Jade</option><option value="ocean">Slate blue</option><option value="plum">Mulberry</option></select></label><button type="button" className="conversation-remove" onClick={() => removeWithUndo('exchange', `conversation “${exchange.title || exchangeIndex + 1}”`, exchange, exchangeIndex)}>Remove</button></div>
            {exchange.turns.map((turn, turnIndex) => <div className="conversation-edit-turn" key={`${turn.speaker}-${turnIndex}`}><div className="conversation-edit-turn-title">Turn {turnIndex + 1}<select aria-label="Speaker" value={turn.speaker} onChange={event => updateTurn(exchangeIndex, turnIndex, { speaker: event.target.value })}><option>A</option><option>B</option></select><button type="button" onClick={() => removeWithUndo('turn', `dialogue line ${turnIndex + 1}`, turn, turnIndex, exchangeIndex)}>Remove</button></div><div className="conversation-editor-fields"><label>Chinese characters<input value={turn.chinese} onChange={event => updateTurn(exchangeIndex, turnIndex, { chinese: event.target.value })}/></label><label>Pinyin<input value={turn.pinyin} onChange={event => updateTurn(exchangeIndex, turnIndex, { pinyin: event.target.value })}/></label><label className="is-wide">English meaning<input value={turn.english} onChange={event => updateTurn(exchangeIndex, turnIndex, { english: event.target.value })}/></label></div><div className="conversation-turn-voice"><div><strong>Voice recording</strong><span>{turn.audioUrl ? 'A saved voice will play for students.' : 'Add a teacher voice; Chinese speech is used until then.'}</span></div>{turn.audioUrl && <audio controls preload="none" src={mediaUrl(turn.audioUrl)} aria-label={`Voice recording for turn ${turnIndex + 1}`}/>}<button type="button" className="conversation-add-turn" disabled={Boolean(uploadingTurn) || Boolean(recordingTurn)} onClick={() => setRecordingTurn({ exchangeIndex, turnIndex, sentence: { id: `conversation-${draft.number}-${exchangeIndex}-${turnIndex}`, number: `${draft.number}.${exchangeIndex + 1}.${turnIndex + 1}`, tokens: [turn.chinese || '你好'], chinese: turn.chinese || '你好', english: turn.english || 'Conversation practice', audioUrl: turn.audioUrl || '' } })}>{turn.audioUrl ? 'Record again' : 'Record voice'}</button><label className="conversation-voice-upload">Upload audio<input type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm" disabled={Boolean(uploadingTurn) || Boolean(recordingTurn)} onChange={event => { uploadVoiceFile(exchangeIndex, turnIndex, event.target.files?.[0]); event.target.value = ''; }}/></label>{uploadingTurn === `${exchangeIndex}-${turnIndex}` && <span role="status">Uploading…</span>}{turn.audioUrl && <button type="button" className="conversation-remove" onClick={() => updateTurn(exchangeIndex, turnIndex, { audioUrl: '' })}>Remove voice</button>}</div></div>)}
            <button type="button" className="conversation-add-turn" onClick={() => updateExchange(exchangeIndex, { turns: [...exchange.turns, { speaker: exchange.turns.at(-1)?.speaker === 'A' ? 'B' : 'A', chinese: '', pinyin: '', english: '' }] })}>＋ Add dialogue turn</button>
          </article>)}
          <button type="button" className="conversation-add-exchange" onClick={() => patchDraft({ exchanges: [...draft.exchanges, { number: String(draft.exchanges.length + 1).padStart(2, '0'), title: '', tone: 'hello', turns: [{ speaker: 'A', chinese: '', pinyin: '', english: '' }, { speaker: 'B', chinese: '', pinyin: '', english: '' }] }] })}><span>＋</span><span><strong>Add another conversation</strong><small>Start a new short exchange in this lesson</small></span></button>
        </section>
        <section className="conversation-editor-section conversation-step"><div className="conversation-step-heading"><span>3</span><div><p>OPTIONAL</p><h2>Key vocabulary</h2><small>Add useful words students will see in the conversation.</small></div><button type="button" onClick={() => patchDraft({ words: [...draft.words, { chinese: '', pinyin: '', type: 'noun', meaning: '' }] })}>＋ Add a word</button></div>
          <div className="conversation-word-editor">{draft.words.map((word, index) => <div className="conversation-word-edit-row" key={`${word.chinese}-${index}`}>{[["chinese", "Characters"], ["pinyin", "Pinyin"], ["type", "Part of speech"], ["meaning", "Meaning"]].map(([key, label]) => <label key={key}>{label}<input value={word[key] || ''} onChange={event => updateWord(index, { [key]: event.target.value })}/></label>)}<button className="conversation-remove" type="button" onClick={() => removeWithUndo('word', `vocabulary word ${word.chinese || index + 1}`, word, index)}>Remove</button></div>)}</div>
        </section>
        <div className="conversation-editor-footer"><span>{isNewLesson ? 'This lesson becomes available to students after publishing.' : 'Changes appear in Conversation Practice after saving.'}</span><button className="conversation-manager-save" disabled={saving}>{saving ? 'Saving…' : isNewLesson ? 'Publish lesson' : 'Save changes'}</button></div>
      </form>
    </div>
    {recordingTurn && <SentenceRecorder key={`${draft.id}-${recordingTurn.exchangeIndex}-${recordingTurn.turnIndex}`} sentence={recordingTurn.sentence} onSave={saveVoice} onClose={() => setRecordingTurn(null)}/>}
  </main>;
}
