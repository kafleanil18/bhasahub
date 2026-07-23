import { useState, useEffect, useRef } from 'react';
import { mediaUrl } from './utils/mediaUrl';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

const DEFAULT_INITIALS = ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const DEFAULT_FINALS = [
  'a', 'o', 'e', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong',
  'i', 'ia', 'iao', 'ie', 'iu', 'ian', 'in', 'iang', 'ing', 'iong',
  'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng',
  'ü', 'üe', 'üan', 'ün',
];

const TONE_MARKS = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

function applyTone(syllable, toneNum) {
  let targetChar = '';
  if (syllable.includes('a')) targetChar = 'a';
  else if (syllable.includes('o')) targetChar = 'o';
  else if (syllable.includes('e')) targetChar = 'e';
  else if (syllable.includes('ui')) targetChar = 'i';
  else if (syllable.includes('iu')) targetChar = 'u';
  else if (syllable.includes('i')) targetChar = 'i';
  else if (syllable.includes('u')) targetChar = 'u';
  else if (syllable.includes('ü')) targetChar = 'ü';

  if (targetChar && TONE_MARKS[targetChar]) {
    return syllable.replace(targetChar, TONE_MARKS[targetChar][toneNum - 1]);
  }
  return syllable;
}

function normalizeSyllable(initial, final) {
  let rawSyllable = initial + final;

  if (initial === '') {
    if (final === 'i') rawSyllable = 'yi';
    else if (final === 'u') rawSyllable = 'wu';
    else if (final === 'ü') rawSyllable = 'yu';
    else if (final.startsWith('i') && final !== 'i') rawSyllable = 'y' + final.slice(1);
    else if (final.startsWith('u') && final !== 'u') rawSyllable = 'w' + final.slice(1);
    else if (final.startsWith('ü') && final !== 'ü') rawSyllable = 'yu' + final.slice(2);
  } else if (['j', 'q', 'x'].includes(initial) && final.startsWith('ü')) {
    rawSyllable = initial + 'u' + final.slice(1);
  }

  return rawSyllable;
}

function playTone(syllable, tone) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const audioCtx = new AudioContextClass();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sine';
  const now = audioCtx.currentTime;
  const duration = 0.5;

  if (tone === 1) {
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(350, now + duration);
  } else if (tone === 2) {
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(360, now + duration);
  } else if (tone === 3) {
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(200, now + duration * 0.4);
    osc.frequency.linearRampToValueAtTime(300, now + duration);
  } else if (tone === 4) {
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.linearRampToValueAtTime(210, now + duration);
  }

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}

function keyFor(syllable, tone) {
  return `${syllable}-${tone}`;
}

function getSupportedMimeType() {
  if (!window.MediaRecorder) return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function extForMimeType(mimeType) {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

function PinyinPage({ onBack, isSuperAdmin }) {
  const [selected, setSelected] = useState(null);
  const [recordings, setRecordings] = useState({});
  const [recordingTone, setRecordingTone] = useState(null);
  const [uploadingTone, setUploadingTone] = useState(null);
  const [micError, setMicError] = useState('');

  const [initials, setInitials] = useState(DEFAULT_INITIALS);
  const [finals, setFinals] = useState(DEFAULT_FINALS);
  const [syllables, setSyllables] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [newInitial, setNewInitial] = useState('');
  const [newFinal, setNewFinal] = useState('');
  const [tableError, setTableError] = useState('');
  const [savingTable, setSavingTable] = useState(false);

  const audioPlayerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/pinyin-recordings`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const map = {};
        data.forEach((rec) => { map[keyFor(rec.syllable, rec.tone)] = rec; });
        setRecordings(map);
      })
      .catch(() => {});

    fetch(`${API}/pinyin-table`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.initials)) setInitials(data.initials);
        if (Array.isArray(data.finals)) setFinals(data.finals);
        if (Array.isArray(data.syllables)) setSyllables(data.syllables);
      })
      .catch(() => {});
  }, []);

  const syllableMap = {};
  syllables.forEach((s) => { syllableMap[`${s.initial}|${s.final}`] = s.syllable; });

  const highlightMap = {};
  syllables.forEach((s) => { highlightMap[`${s.initial}|${s.final}`] = !!s.highlighted; });

  const GRID = initials.map((initial) => ({
    initial,
    cells: finals.map((final) => {
      const syllable = syllableMap[`${initial}|${final}`];
      return { final, syllable: syllable || '', valid: !!syllable, highlighted: !!highlightMap[`${initial}|${final}`] };
    }),
  }));

  // Each mutation hits a dedicated endpoint that applies one targeted Mongo
  // array operation and returns the fresh document, instead of PUTting the
  // whole table from a possibly-stale local copy (which let one tab's save
  // silently wipe out another tab's concurrent edits).
  const applyTableUpdate = async (request) => {
    setSavingTable(true);
    setTableError('');
    try {
      const activeToken = localStorage.getItem('token');
      const res = await request(activeToken);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the table');
      setInitials(data.initials);
      setFinals(data.finals);
      setSyllables(data.syllables);
    } catch (err) {
      setTableError(err.message || 'Could not save the table');
    } finally {
      setSavingTable(false);
    }
  };

  const addInitial = () => {
    const value = newInitial.trim().toLowerCase();
    if (!value || initials.includes(value)) return;
    setNewInitial('');
    applyTableUpdate((token) => fetch(`${API}/pinyin-table/initials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value }),
    }));
  };

  const removeInitial = (initial) => {
    applyTableUpdate((token) => fetch(`${API}/pinyin-table/initials/${encodeURIComponent(initial)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }));
  };

  const addFinal = () => {
    const value = newFinal.trim().toLowerCase();
    if (!value || finals.includes(value)) return;
    setNewFinal('');
    applyTableUpdate((token) => fetch(`${API}/pinyin-table/finals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value }),
    }));
  };

  const removeFinal = (final) => {
    applyTableUpdate((token) => fetch(`${API}/pinyin-table/finals/${encodeURIComponent(final)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }));
  };

  const setCellSyllable = (initial, final, text) => {
    const value = text.trim();
    const current = syllableMap[`${initial}|${final}`] || '';
    if (value === current) return;
    applyTableUpdate((token) => fetch(`${API}/pinyin-table/syllable`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ initial, final, syllable: value }),
    }));
  };

  const toggleHighlight = (initial, final) => {
    const highlighted = !highlightMap[`${initial}|${final}`];
    applyTableUpdate((token) => fetch(`${API}/pinyin-table/syllable/highlight`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ initial, final, highlighted }),
    }));
  };

  const handleToneClick = (tone) => {
    const rec = recordings[keyFor(selected, tone)];
    if (rec && audioPlayerRef.current) {
      audioPlayerRef.current.src = mediaUrl(rec.audioUrl);
      audioPlayerRef.current.play();
    } else {
      playTone(selected, tone);
    }
  };

  const startRecording = async (tone) => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        uploadRecording(tone, blob, recorder.mimeType || 'audio/webm');
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingTone(tone);
    } catch {
      setMicError('Could not access the microphone. Check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingTone(null);
  };

  const uploadRecording = async (tone, blob, mimeType) => {
    setUploadingTone(tone);
    try {
      const activeToken = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${activeToken}` };
      const ext = extForMimeType(mimeType);
      const fd = new FormData();
      fd.append('file', blob, `${selected}-${tone}-${Date.now()}.${ext}`);
      const uploadRes = await fetch(`${API}/upload`, { method: 'POST', headers, body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      const saveRes = await fetch(`${API}/pinyin-recordings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllable: selected, tone, audioUrl: uploadData.url }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'Could not save recording');

      setRecordings((prev) => ({ ...prev, [keyFor(selected, tone)]: saveData }));
    } catch (err) {
      setMicError(err.message || 'Could not save the recording');
    } finally {
      setUploadingTone(null);
    }
  };

  const deleteRecording = async (tone, id) => {
    try {
      const activeToken = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${activeToken}` };
      await fetch(`${API}/pinyin-recordings/${id}`, { method: 'DELETE', headers });
      setRecordings((prev) => {
        const next = { ...prev };
        delete next[keyFor(selected, tone)];
        return next;
      });
    } catch {
      setMicError('Could not delete the recording');
    }
  };

  return (
    <section className="pinyin-table-page">
      <style>{`
        .pinyin-table-page {
          padding: 24px 0 60px;
          background: var(--paper);
          color: var(--ink);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .pinyin-card {
          max-width: 1200px;
          margin: 0 auto;
          background: var(--card);
          padding: 30px;
          border-radius: 8px;
          border: 1px solid var(--line);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .pinyin-h1 {
          text-align: center;
          color: var(--seal);
          margin-bottom: 5px;
          font-family: 'Fraunces', serif;
        }
        .pinyin-subtitle {
          text-align: center;
          color: var(--mist);
          margin-bottom: 30px;
        }
        .pinyin-dashboard {
          position: sticky;
          top: 84px;
          background: var(--card);
          padding: 15px;
          border: 2px solid var(--seal);
          border-radius: 6px;
          margin-bottom: 25px;
          z-index: 40;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 80px;
          justify-content: center;
        }
        .pinyin-dashboard-placeholder {
          color: var(--mist);
          font-style: italic;
        }
        .pinyin-tone-container {
          text-align: center;
        }
        .pinyin-selected-syllable {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 10px;
          color: var(--seal);
        }
        .pinyin-tone-buttons {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .pinyin-tone-btn {
          background: var(--card);
          border: 2px solid var(--seal);
          color: var(--seal);
          padding: 8px 16px;
          font-size: 1.3rem;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pinyin-tone-btn:hover {
          background: var(--seal);
          color: #fff;
        }
        .pinyin-table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--line);
          border-radius: 4px;
        }
        .pinyin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-size: 0.95rem;
        }
        .pinyin-table th,
        .pinyin-table td {
          border: 1px solid var(--line);
          padding: 10px 6px;
          min-width: 60px;
          color: var(--ink);
        }
        .pinyin-table th {
          background-color: var(--rice);
          font-weight: 600;
          position: sticky;
          top: 0;
        }
        .pinyin-initial-header {
          background-color: var(--rice) !important;
          left: 0;
          z-index: 10;
        }
        .pinyin-initial-col {
          background-color: var(--rice);
          font-weight: bold;
          position: sticky;
          left: 0;
          z-index: 5;
          border-right: 2px solid var(--line);
        }
        .pinyin-syllable {
          background-color: var(--card);
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.15s, color 0.15s;
        }
        .pinyin-syllable:hover {
          background-color: var(--rice);
          color: var(--seal);
        }
        .pinyin-empty-cell {
          background-color: var(--paper);
          color: var(--line);
        }
        .pinyin-tone-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .pinyin-tone-recorded-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #d62828;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
          vertical-align: middle;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .pinyin-tone-recorded-badge::after {
          content: '';
          margin-left: 2px;
          border-style: solid;
          border-width: 4.5px 0 4.5px 7px;
          border-color: transparent transparent transparent #fff;
        }
        .pinyin-tone-btn:hover .pinyin-tone-recorded-badge {
          background: #ff3b3b;
          transform: scale(1.1);
        }
        .pinyin-record-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pinyin-record-btn {
          background: var(--card);
          border: 1px solid var(--jade);
          color: var(--jade);
          padding: 3px 8px;
          font-size: 0.7rem;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
        }
        .pinyin-record-btn:hover:not(:disabled) {
          background: var(--jade);
          color: #fff;
        }
        .pinyin-record-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pinyin-record-btn.recording {
          background: var(--seal);
          border-color: var(--seal);
          color: #fff;
          animation: pinyin-pulse 1s ease-in-out infinite;
        }
        @keyframes pinyin-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .pinyin-record-delete {
          background: none;
          border: 1px solid var(--line);
          color: var(--mist);
          padding: 3px 6px;
          font-size: 0.7rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .pinyin-record-delete:hover {
          border-color: var(--seal);
          color: var(--seal);
        }
        .pinyin-mic-error {
          color: var(--seal);
          font-size: 0.85rem;
          margin-top: 10px;
          text-align: center;
        }
        .pinyin-admin-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .pinyin-edit-toggle {
          background: var(--seal);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .pinyin-edit-toggle:hover {
          opacity: 0.9;
        }
        .pinyin-saving {
          color: var(--mist);
          font-size: 0.8rem;
          font-style: italic;
        }
        .pinyin-manage-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .pinyin-manage-col {
          flex: 1;
          min-width: 240px;
        }
        .pinyin-manage-col h4 {
          margin: 0 0 10px;
          color: var(--seal);
          font-size: 0.9rem;
        }
        .pinyin-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .pinyin-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 3px 6px 3px 10px;
          font-size: 0.8rem;
        }
        .pinyin-chip button {
          background: none;
          border: none;
          color: var(--mist);
          cursor: pointer;
          font-size: 0.9rem;
          line-height: 1;
          padding: 2px 4px;
        }
        .pinyin-chip button:hover {
          color: var(--seal);
        }
        .pinyin-add-row {
          display: flex;
          gap: 6px;
        }
        .pinyin-add-row input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--line);
          border-radius: 4px;
          background: var(--card);
          color: var(--ink);
          font-size: 0.85rem;
        }
        .pinyin-add-row button {
          background: var(--jade);
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
        .pinyin-manage-hint {
          width: 100%;
          margin: 0;
          font-size: 0.8rem;
          color: var(--mist);
          font-style: italic;
        }
        .pinyin-edit-cell {
          padding: 4px !important;
          position: relative;
        }
        .pinyin-cell-input {
          width: 100%;
          min-width: 56px;
          box-sizing: border-box;
          text-align: center;
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 6px 4px;
          background: var(--card);
          color: var(--ink);
          font-size: 0.9rem;
        }
        .pinyin-cell-input:focus {
          outline: none;
          border-color: var(--seal);
        }
        .pinyin-highlighted {
          background-color: rgba(201, 154, 60, 0.25) !important;
          box-shadow: inset 0 0 0 2px var(--gold);
        }
        .pinyin-highlight-toggle {
          position: absolute;
          top: 1px;
          right: 1px;
          background: none;
          border: none;
          color: var(--line);
          font-size: 0.75rem;
          line-height: 1;
          padding: 2px;
          cursor: pointer;
        }
        .pinyin-highlight-toggle:hover {
          color: var(--gold);
        }
        .pinyin-highlight-toggle.is-on {
          color: var(--gold);
        }
      `}</style>

      <div className="container">
        <button className="back-btn" onClick={onBack} style={{ marginBottom: 16 }}>← Back to home</button>

        <div className="pinyin-card">
          <h1 className="pinyin-h1"> (Mandarin Pinyin Table)</h1>
          <p className="pinyin-subtitle">Click and  listen to all four tones.</p>

          {isSuperAdmin && (
            <div className="pinyin-admin-bar">
              <button
                type="button"
                className="pinyin-edit-toggle"
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? '✓ Done editing' : '✎ Edit table'}
              </button>
              {savingTable && <span className="pinyin-saving">Saving…</span>}
              {tableError && <span className="pinyin-mic-error">{tableError}</span>}
            </div>
          )}

          {isSuperAdmin && editMode && (
            <div className="pinyin-manage-panel">
              <div className="pinyin-manage-col">
                <h4>Consonants (initials)</h4>
                <div className="pinyin-chip-list">
                  {initials.map((initial) => (
                    <span className="pinyin-chip" key={initial || 'zero'}>
                      {initial === '' ? 'Ø' : initial}
                      {initial !== '' && (
                        <button type="button" onClick={() => removeInitial(initial)} title="Remove initial">×</button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="pinyin-add-row">
                  <input
                    type="text"
                    value={newInitial}
                    onChange={(e) => setNewInitial(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addInitial(); }}
                    placeholder="e.g. zh"
                  />
                  <button type="button" onClick={addInitial}>Add</button>
                </div>
              </div>

              <div className="pinyin-manage-col">
                <h4>Vowels (finals)</h4>
                <div className="pinyin-chip-list">
                  {finals.map((final) => (
                    <span className="pinyin-chip" key={final}>
                      {final}
                      <button type="button" onClick={() => removeFinal(final)} title="Remove final">×</button>
                    </span>
                  ))}
                </div>
                <div className="pinyin-add-row">
                  <input
                    type="text"
                    value={newFinal}
                    onChange={(e) => setNewFinal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addFinal(); }}
                    placeholder="e.g. iang"
                  />
                  <button type="button" onClick={addFinal}>Add</button>
                </div>
              </div>
              <p className="pinyin-manage-hint">
                Edit a syllable directly in the table below by typing in its cell, or clear a cell to remove it.
                Click the ★ on a filled cell to highlight it for everyone.
              </p>
            </div>
          )}

          <div className="pinyin-dashboard">
            {!selected ? (
              <div className="pinyin-dashboard-placeholder">Select a syllable below to practice tones</div>
            ) : (
              <div className="pinyin-tone-container">
                <div className="pinyin-selected-syllable">Syllable: {selected}</div>
                <div className="pinyin-tone-buttons">
                  {[1, 2, 3, 4].map((tone) => {
                    const rec = recordings[keyFor(selected, tone)];
                    const isRecordingThis = recordingTone === tone;
                    const isUploadingThis = uploadingTone === tone;
                    return (
                      <div key={tone} className="pinyin-tone-slot">
                        <button
                          type="button"
                          className="pinyin-tone-btn"
                          onClick={() => handleToneClick(tone)}
                        >
                          {applyTone(selected, tone)}
                          {rec && (
                            <span className="pinyin-tone-recorded-badge" title="Play the recording" />
                          )}
                        </button>
                        {isSuperAdmin && (
                          <div className="pinyin-record-controls">
                            {isRecordingThis ? (
                              <button type="button" className="pinyin-record-btn recording" onClick={stopRecording}>
                                ⏹ Stop
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="pinyin-record-btn"
                                onClick={() => startRecording(tone)}
                                disabled={recordingTone !== null || uploadingTone !== null}
                              >
                                {isUploadingThis ? 'Saving…' : rec ? ' Re-record' : ' Record'}
                              </button>
                            )}
                            {rec && !isRecordingThis && !isUploadingThis && (
                              <button
                                type="button"
                                className="pinyin-record-delete"
                                onClick={() => deleteRecording(tone, rec._id)}
                                title="Remove recording"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {micError && <p className="pinyin-mic-error">{micError}</p>}
                <audio ref={audioPlayerRef} style={{ display: 'none' }} />
              </div>
            )}
          </div>

          <div className="pinyin-table-wrapper">
            <table className="pinyin-table">
              <thead>
                <tr>
                  <th className="pinyin-initial-header">Initials \ Finals</th>
                  {finals.map((final) => <th key={final}>{final}</th>)}
                </tr>
              </thead>
              <tbody>
                {GRID.map(({ initial, cells }) => (
                  <tr key={initial || 'zero'}>
                    <td className="pinyin-initial-col">{initial === '' ? 'Ø (zero)' : initial}</td>
                    {cells.map(({ final, syllable, valid, highlighted }) => (
                      editMode ? (
                        <td
                          key={final}
                          className={[
                            valid ? 'pinyin-syllable' : 'pinyin-empty-cell',
                            'pinyin-edit-cell',
                            highlighted ? 'pinyin-highlighted' : '',
                          ].join(' ').trim()}
                        >
                          <input
                            type="text"
                            className="pinyin-cell-input"
                            key={syllable}
                            defaultValue={syllable}
                            placeholder={normalizeSyllable(initial, final)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            onBlur={(e) => setCellSyllable(initial, final, e.target.value)}
                          />
                          {valid && (
                            <button
                              type="button"
                              className={`pinyin-highlight-toggle ${highlighted ? 'is-on' : ''}`}
                              onClick={() => toggleHighlight(initial, final)}
                              title={highlighted ? 'Remove highlight' : 'Highlight this syllable'}
                            >
                              ★
                            </button>
                          )}
                        </td>
                      ) : valid ? (
                        <td
                          key={final}
                          className={`pinyin-syllable ${highlighted ? 'pinyin-highlighted' : ''}`}
                          onClick={() => setSelected(syllable)}
                        >
                          {syllable}
                        </td>
                      ) : (
                        <td key={final} className="pinyin-empty-cell">-</td>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PinyinPage;
