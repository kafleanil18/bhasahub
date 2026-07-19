import { useState, useEffect, useRef } from 'react';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

const INITIALS = ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS = [
  'a', 'o', 'e', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong',
  'i', 'ia', 'iao', 'ie', 'iu', 'ian', 'in', 'iang', 'ing', 'iong',
  'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng',
  'ü', 'üe', 'üan', 'ün',
];

const VALID_SYLLABLES = new Set([
  'a', 'ai', 'an', 'ang', 'ao', 'ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng', 'bi', 'bian', 'biao', 'bie', 'bin', 'bing', 'bo', 'bu',
  'ca', 'cai', 'can', 'cang', 'cao', 'ce', 'cei', 'cen', 'ceng', 'cha', 'chai', 'chan', 'chang', 'chao', 'che', 'chen', 'cheng', 'chi', 'chong', 'chou', 'chu', 'chua', 'chuai', 'chuan', 'chuang', 'chui', 'chun', 'chuo', 'ci', 'cong', 'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo',
  'da', 'dai', 'dan', 'dang', 'dao', 'de', 'dei', 'deng', 'di', 'dian', 'diao', 'die', 'ding', 'diu', 'dong', 'dou', 'du', 'duan', 'dui', 'dun', 'duo',
  'e', 'ei', 'en', 'eng', 'er', 'fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fo', 'fou', 'fu',
  'ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong', 'gou', 'gu', 'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo',
  'ha', 'hai', 'han', 'hang', 'hao', 'he', 'hei', 'hen', 'heng', 'hong', 'hou', 'hu', 'hua', 'huai', 'huan', 'huang', 'hui', 'hun', 'huo',
  'ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin', 'jing', 'jiong', 'jiu', 'ju', 'juan', 'jue', 'jun',
  'ka', 'kai', 'kan', 'kang', 'kao', 'ke', 'ken', 'keng', 'kong', 'kou', 'ku', 'kua', 'kuai', 'kuan', 'kuang', 'kui', 'kun', 'kuo',
  'la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei', 'leng', 'li', 'lia', 'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'lo', 'long', 'lou', 'lu', 'luan', 'lun', 'luo', 'lü', 'lüe',
  'ma', 'mai', 'man', 'mang', 'mao', 'me', 'mei', 'men', 'meng', 'mi', 'mian', 'miao', 'mie', 'min', 'ming', 'miu', 'mo', 'mou', 'mu',
  'na', 'nai', 'nan', 'nang', 'nao', 'ne', 'nei', 'nen', 'neng', 'ni', 'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu', 'nong', 'nou', 'nu', 'nuan', 'nuo', 'nü', 'nüe',
  'o', 'ou', 'pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian', 'piao', 'pie', 'pin', 'ping', 'po', 'pou', 'pu',
  'qi', 'qia', 'qian', 'qiang', 'qiao', 'qie', 'qin', 'qing', 'qiong', 'qiu', 'qu', 'quan', 'que', 'qun',
  'ran', 'rang', 'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru', 'ruan', 'rui', 'run', 'ruo',
  'sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'sha', 'shai', 'shan', 'shang', 'shao', 'she', 'shen', 'sheng', 'shi', 'shou', 'shu', 'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo', 'si', 'song', 'sou', 'su', 'suan', 'sui', 'sun', 'suo',
  'ta', 'tai', 'tan', 'tang', 'tao', 'te', 'teng', 'ti', 'tian', 'tiao', 'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui', 'tun', 'tuo',
  'wa', 'wai', 'wan', 'wang', 'wei', 'wen', 'weng', 'wo', 'wu',
  'xi', 'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong', 'xiu', 'xu', 'xuan', 'xue', 'xun',
  'ya', 'yan', 'yang', 'yao', 'ye', 'yi', 'yin', 'ying', 'yo', 'yong', 'you', 'yu', 'yuan', 'yue', 'yun',
  'za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei', 'zen', 'zeng', 'zha', 'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhen', 'zheng', 'zhi', 'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang', 'zhui', 'zhun', 'zhuo', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo',
]);

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

const GRID = INITIALS.map((initial) => ({
  initial,
  cells: FINALS.map((final) => {
    const syllable = normalizeSyllable(initial, final);
    return { final, syllable, valid: VALID_SYLLABLES.has(syllable) };
  }),
}));

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
  }, []);

  const handleToneClick = (tone) => {
    const rec = recordings[keyFor(selected, tone)];
    if (rec && audioPlayerRef.current) {
      audioPlayerRef.current.src = `${SERVER}${rec.audioUrl}`;
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
      `}</style>

      <div className="container">
        <button className="back-btn" onClick={onBack} style={{ marginBottom: 16 }}>← Back to home</button>

        <div className="pinyin-card">
          <h1 className="pinyin-h1"> (Mandarin Pinyin Table)</h1>
          <p className="pinyin-subtitle">Click and  listen to all four tones.</p>

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
                  {FINALS.map((final) => <th key={final}>{final}</th>)}
                </tr>
              </thead>
              <tbody>
                {GRID.map(({ initial, cells }) => (
                  <tr key={initial || 'zero'}>
                    <td className="pinyin-initial-col">{initial === '' ? 'Ø (zero)' : initial}</td>
                    {cells.map(({ final, syllable, valid }) => (
                      valid ? (
                        <td
                          key={final}
                          className="pinyin-syllable"
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
