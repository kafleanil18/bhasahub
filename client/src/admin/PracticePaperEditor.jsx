import { useEffect, useState } from 'react';
import { blankPaper } from './paperTemplate';
import { apiFetch } from '../lib/apiClient';

const API = `${window.API_BASE_URL}/api`;
// Recommended upload sizes keep picture file sizes small: a full paper's pictures should total roughly 1 MB.
const MEDIA_HINTS = {
  single: 'Recommended: WebP (or JPG), 960 × 720 px (4:3), under 60 KB.',
  strip: 'Recommended: one WebP (or JPG) strip with panels A, B, C, 1500 × 640 px, under 100 KB.',
  sheet: 'Recommended: one portrait WebP (or JPG) sheet with panels A–F, 1200 × 1600 px, under 150 KB.',
  example: 'Recommended: WebP (or JPG), about 1200 px wide, under 150 KB.',
  audio: 'Recommended: MP3, mono, 64 kbps (about 7 MB for 15 minutes).',
};
const LARGE_IMAGE_BYTES = 300 * 1024;
function MediaUpload({ label, value, onChange, audio = false, onBusy, hint }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const upload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Large pictures still upload, but slow the test down on phones and weak connections.
    setWarning(!audio && file.size > LARGE_IMAGE_BYTES ? `This picture is ${Math.round(file.size / 1024)} KB. For a fast-loading test, compress it to WebP at the recommended size first.` : '');
    setBusy(true); onBusy(1); setError('');
    try {
      const body = new FormData(); body.append('file', file);
      const res = await apiFetch(`${API}/upload`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      onChange(data.url);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); onBusy(-1); event.target.value = ''; }
  };
  return <div className="paper-media"><label>{label}<input type="file" accept={audio ? '.mp3,.m4a,.wav,.ogg,.webm' : '.webp,.jpg,.jpeg,.png'} onChange={upload} disabled={busy}/></label>
    {hint && <p className="paper-media-hint">{hint}</p>}
    {busy && <p role="status">Uploading…</p>}{error && <p className="paper-error" role="alert">{error}</p>}{warning && <p className="paper-media-warning" role="status">{warning}</p>}
    {value && <>{audio ? <audio controls src={value}/> : <img src={value} alt={`${label} preview`}/>}<button type="button" onClick={() => onChange('')} disabled={busy}>Remove {audio ? 'recording' : 'picture'}</button></>}
  </div>;
}
export default function PracticePaperEditor({ initial, paperId, onSaved, onCancel }) {
  const [paper, setPaper] = useState(() => initial || blankPaper());
  const [part, setPart] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const change = update => { setPaper(previous => ({ ...previous, ...update })); setDirty(true); };
  const changeGroup = update => { setPaper(previous => ({ ...previous, groups: previous.groups.map((group, index) => index === part ? { ...group, ...update } : group) })); setDirty(true); };
  const changeQuestion = (qi, update) => { setPaper(previous => ({ ...previous, groups: previous.groups.map((group, index) => index === part ? { ...group, questions: group.questions.map((q, i) => i === qi ? { ...q, ...update } : q) } : group) })); setDirty(true); };
  const group = paper.groups[part];
  const uploadBusy = delta => setUploads(value => value + delta);
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const res = await apiFetch(`${API}/hsk1${paperId ? `/${paperId}/content` : ''}`, { method: paperId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paper) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the paper.');
      setDirty(false); onSaved(data);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <form className="paper-editor" onSubmit={save} aria-labelledby="paper-editor-title">
    <div className="paper-editor-heading"><div><h2 id="paper-editor-title">{paperId ? 'Edit practice paper' : 'New complete practice paper'}</h2><p>20 listening + 20 reading questions. Save at any point. A live paper stays live when its content is still complete; otherwise it is saved as hidden.</p></div></div>
    {error && <p className="paper-error" role="alert">{error}</p>}
    <fieldset disabled={busy} className="paper-fields"><legend>Paper details</legend>
      <label>Paper title *<input required maxLength={150} value={paper.title} onChange={e => change({ title: e.target.value })} placeholder="HSK 1 Listening & Reading"/></label>
      <label>Paper label<input maxLength={60} value={paper.code || ''} onChange={e => change({ code: e.target.value })} placeholder="e.g. Practice 02"/></label>
      <div className="paper-timers">{[['listeningSeconds', 'Listening (seconds)'], ['transferSeconds', 'Listening review (seconds)'], ['readingSeconds', 'Reading (seconds)']].map(([key, label]) => <label key={key}>{label}<input type="number" required min="30" max="7200" value={paper[key]} onChange={e => change({ [key]: Number(e.target.value) })}/></label>)}</div>
      <MediaUpload label="Full listening recording" audio hint={MEDIA_HINTS.audio} value={paper.audioUrl} onChange={audioUrl => change({ audioUrl })} onBusy={uploadBusy}/>
      <p className="paper-help"><strong>Use small image files.</strong> Upload WebP (or JPG, not PNG) pictures compressed to the file size shown under each upload, usually under 60–150 KB each. Large files (1–3 MB straight from an AI tool or camera) make the test slow to open on phones. A complete paper's pictures should total about 1 MB.</p>
      <p className="paper-help">Upload a recording covering questions 1–20 in order, with each question spoken twice. Set the listening timer long enough to play the complete recording.</p>
    </fieldset>
    <nav className="paper-part-tabs" aria-label="Paper parts">{paper.groups.map((g, index) => <button key={g.id} type="button" aria-pressed={index === part} onClick={() => setPart(index)}>{index < 4 ? 'Listening' : 'Reading'} {index % 4 + 1}<small>Q{index * 5 + 1}–{index * 5 + 5}</small></button>)}</nav>
    <fieldset disabled={busy || uploads > 0} className="paper-fields" key={group.id}><legend>{group.section === 'listening' ? 'Listening' : 'Reading'}, part {part % 4 + 1}</legend>
      <label>Part title<input value={group.title} onChange={e => changeGroup({ title: e.target.value })}/></label>
      <label>Instructions<textarea value={group.instruction} onChange={e => changeGroup({ instruction: e.target.value })}/></label>
      <label>Example (optional)<textarea value={group.example || ''} onChange={e => changeGroup({ example: e.target.value })}/></label>
      <MediaUpload label="Example picture (optional)" hint={MEDIA_HINTS.example} value={group.exampleImage} onChange={exampleImage => changeGroup({ exampleImage })} onBusy={uploadBusy}/>
      {group.exampleImage && <label>Example picture description (for screen readers)<input maxLength={500} value={group.exampleImageAlt || ''} onChange={e => changeGroup({ exampleImageAlt: e.target.value })}/></label>}
      {['l3','r2'].includes(group.id) && <><MediaUpload label="Shared A–F picture sheet" hint={MEDIA_HINTS.sheet} value={group.image} onChange={image => changeGroup({ image })} onBusy={uploadBusy}/><label>Picture caption<input value={group.imageCaption || ''} onChange={e => changeGroup({ imageCaption: e.target.value })}/></label><p className="paper-help">Upload one sheet containing six clearly labelled pictures, A–F.</p></>}
      {group.choices && <div className="paper-word-bank"><h3>Shared answer bank A–F</h3>{group.choices.map((choice, index) => <div key={index} className="paper-option-row"><strong>{String.fromCharCode(65 + index)}</strong><label>Chinese text<input value={choice.text} onChange={e => changeGroup({ choices: group.choices.map((c, i) => i === index ? { ...c, text: e.target.value } : c) })}/></label><label>Pinyin<input value={choice.pinyin || ''} onChange={e => changeGroup({ choices: group.choices.map((c, i) => i === index ? { ...c, pinyin: e.target.value } : c) })}/></label></div>)}</div>}
      {group.questions.map((q, qi) => <fieldset key={q.number} className="paper-question-editor"><legend>Question {q.number}</legend>
        <label>{group.section === 'reading' ? 'Chinese question text' : 'Question text (optional; leave blank for audio-only prompts)'}<textarea value={q.text} onChange={e => changeQuestion(qi, { text: e.target.value })}/></label>
        <label>Pinyin<input value={q.pinyin} onChange={e => changeQuestion(qi, { pinyin: e.target.value })}/></label>
        {group.section === 'listening' && <label>Listening script (private teacher notes)<textarea value={q.listeningText || ''} onChange={e => changeQuestion(qi, { listeningText: e.target.value })}/></label>}
        <MediaUpload label={group.id === 'l2' ? `Question ${q.number}: picture sheet with A, B, C` : `Question ${q.number} picture`} hint={group.id === 'l2' ? MEDIA_HINTS.strip : MEDIA_HINTS.single} value={q.image} onChange={image => changeQuestion(qi, { image })} onBusy={uploadBusy}/>
        <div className="paper-answer-options"><h4>Answer choices</h4>{q.options.map((option, oi) => <div className="paper-option-row" key={oi}><strong>{String.fromCharCode(65 + oi)}</strong><label>Text<input value={option.text} onChange={e => changeQuestion(qi, { options: q.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o) })}/></label><label>Pinyin<input value={option.pinyin || ''} onChange={e => changeQuestion(qi, { options: q.options.map((o, i) => i === oi ? { ...o, pinyin: e.target.value } : o) })}/></label></div>)}</div>
        <label>Correct answer<select value={q.correctIndex ?? ''} onChange={e => changeQuestion(qi, { correctIndex: e.target.value === '' ? null : Number(e.target.value) })}><option value="">Select the correct answer</option>{q.options.map((o, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}. {o.text || 'Empty choice'}</option>)}</select></label>
        <label>Answer explanation<textarea value={q.explanation} onChange={e => changeQuestion(qi, { explanation: e.target.value })} placeholder="Explain why this answer is correct. Shown after submission."/></label>
      </fieldset>)}
    </fieldset>
    <div className="paper-editor-actions"><button type="submit" disabled={busy || uploads > 0}>{busy ? 'Saving…' : paperId ? 'Save changes' : 'Save hidden draft'}</button><button type="button" disabled={busy || uploads > 0} onClick={() => { if (!dirty || window.confirm('Discard unsaved changes to this paper?')) onCancel(); }}>Cancel</button><span>{paperId ? 'Live papers stay live if still complete. Students already taking it keep the version they started.' : 'New papers save as hidden until you choose Make live.'}</span></div>
  </form>;
}
