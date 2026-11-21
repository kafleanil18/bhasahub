import { useState } from 'react';
import AccessDialog from './subscriptions/AccessDialog';
import { markSyllable } from '../practice/tonePairs';

const toneOptions = [1, 2, 3, 4];
const ruleOptions = [{ value: '', label: 'None' }, { value: 'third', label: 'Two 3rd tones' }, { value: 'bu', label: '不 tone change' }, { value: 'yi', label: '一 tone change' }];
const clean = value => value.trim().toLowerCase().replace(/u:|v/g, 'ü').normalize('NFD').replace(/[̀-̂̄̌]/g, '').normalize('NFC').replace(/[1-5]$/, '');

// Lets the super admin add a two-syllable word, optionally with an audio file to upload straight away.
export default function AddTonePairDialog({ busy, error, onSave, onClose }) {
  const [hanzi, setHanzi] = useState('');
  const [syllables, setSyllables] = useState(['', '']);
  const [tones, setTones] = useState([1, 1]);
  const [changed, setChanged] = useState(false);
  const [writtenTones, setWrittenTones] = useState([1, 1]);
  const [rule, setRule] = useState('');
  const [english, setEnglish] = useState('');
  const [file, setFile] = useState(null);
  const set = (setter, index, value) => setter(previous => previous.map((item, i) => i === index ? value : item));
  const cleaned = syllables.map(clean);
  const spoken = cleaned.every(Boolean) ? cleaned.map((syllable, i) => markSyllable(syllable, tones[i])).join(' ') : '';
  const written = changed && cleaned.every(Boolean) ? cleaned.map((syllable, i) => markSyllable(syllable, writtenTones[i])).join(' ') : '';
  const canSave = /^\p{Script=Han}{2}$/u.test(hanzi.trim()) && cleaned.every(syllable => /^[a-zü]{1,6}$/.test(syllable)) && english.trim();

  const submit = event => {
    event.preventDefault();
    if (!canSave || busy) return;
    onSave({ hanzi: hanzi.trim(), syllables: cleaned, tones, writtenTones: changed ? writtenTones : tones, rule: changed && rule ? rule : null, english: english.trim() }, file);
  };

  return <AccessDialog title="Add a tone pair word" description="Students hear the word and choose the tone of each syllable. Enter the tones as they are spoken." busy={busy} onClose={onClose}>
    <form className="access-grant-form tone-pair-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>Chinese (two characters)<input lang="zh-CN" value={hanzi} maxLength={4} placeholder="你好" onChange={event => setHanzi(event.target.value)} required /></label>
        <div className="tone-pair-form-syllables">{[0, 1].map(i => <div key={i} className="tone-pair-form-syllable">
          <label>Syllable {i + 1} pinyin<input value={syllables[i]} placeholder={i ? 'hao' : 'ni'} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={event => set(setSyllables, i, event.target.value)} required /></label>
          <label>Spoken tone<select value={tones[i]} onChange={event => set(setTones, i, Number(event.target.value))}>{toneOptions.map(tone => <option key={tone} value={tone}>Tone {tone}</option>)}</select></label>
        </div>)}</div>
        <p className="access-help">Type pinyin without tone marks. Use “v” for ü (lv → lü).</p>
        <label className="tone-pair-form-check"><input type="checkbox" checked={changed} onChange={event => { setChanged(event.target.checked); if (event.target.checked) setWrittenTones(tones); }} /> The written tones are different (tone change)</label>
        {changed && <div className="tone-pair-form-syllables">
          {[0, 1].map(i => <label key={i}>Written tone {i + 1}<select value={writtenTones[i]} onChange={event => set(setWrittenTones, i, Number(event.target.value))}>{toneOptions.map(tone => <option key={tone} value={tone}>Tone {tone}</option>)}</select></label>)}
          <label className="tone-pair-form-wide">Tone change rule<select value={rule} onChange={event => setRule(event.target.value)}>{ruleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>}
        <label>English meaning<input value={english} maxLength={80} placeholder="hello" onChange={event => setEnglish(event.target.value)} required /></label>
        <label>Audio file (optional)<input type="file" accept=".mp3,.m4a,.wav,.ogg,.webm,audio/*" onChange={event => setFile(event.target.files?.[0] || null)} />
          <span className="access-help">MP3, M4A, WAV, OGG or WebM, up to 15 MB. Leave empty to record it after saving.</span></label>
        {spoken && <div className="tone-pair-form-preview" aria-live="polite"><span lang="zh-CN">{hanzi.trim() || '··'}</span><strong>{spoken}</strong>{written && written !== spoken && <small>written {written}</small>}</div>}
      </fieldset>
      {error && <p className="access-feedback is-error" role="alert">{error}</p>}
      <div className="access-dialog-actions">
        <button type="button" className="access-button" disabled={busy} onClick={onClose}>Cancel</button>
        <button type="submit" className="access-button is-primary" disabled={!canSave || busy}>{busy ? 'Saving…' : file ? 'Add word & upload' : 'Add word & record'}</button>
      </div>
    </form>
  </AccessDialog>;
}
