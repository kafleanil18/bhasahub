import { useState, useRef, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

// Keep ids in sync with TOPIC_IDS in server/models/ConversationRecording.js
const TOPICS = [
  { id: 'introduction', icon: '👋', title: 'Introducing Yourself', subtitle: '打招呼 · greetings & small talk' },
  {
    id: 'restaurant', icon: '🍜', title: 'Ordering Food', subtitle: '点餐 · at a restaurant',
    script: [
      { speaker: 'waiter', zh: '欢迎光临,请问几位?', pinyin: 'Huānyíng guānglín, qǐngwèn jǐ wèi?', en: 'Welcome! How many people?' },
      { speaker: 'you', zh: '两位,谢谢。', pinyin: 'Liǎng wèi, xièxiè.', en: 'Two, thanks.' },
      { speaker: 'waiter', zh: '好的,这边请。你们想喝点什么?', pinyin: 'Hǎo de, zhè biān qǐng. Nǐmen xiǎng hē diǎn shénme?', en: 'This way please. What would you like to drink?' },
      { speaker: 'you', zh: '我要一杯绿茶,谢谢。', pinyin: 'Wǒ yào yì bēi lǜchá, xièxiè.', en: "I'd like a green tea, thanks." },
      { speaker: 'waiter', zh: '好,准备好点菜了吗?', pinyin: 'Hǎo, zhǔnbèi hǎo diǎn cài le ma?', en: 'Okay, are you ready to order?' },
      { speaker: 'you', zh: '我要一份宫保鸡丁,不要太辣。', pinyin: 'Wǒ yào yí fèn gōngbǎo jīdīng, bú yào tài là.', en: "I'll have the Kung Pao chicken, not too spicy." },
    ],
  },
  { id: 'shopping', icon: '🛍️', title: 'Shopping', subtitle: '购物 · at a market' },
  { id: 'directions', icon: '🗺️', title: 'Asking Directions', subtitle: '问路 · on the street' },
  { id: 'taxi', icon: '🚕', title: 'Taking a Taxi', subtitle: '打车 · giving directions to a driver' },
  { id: 'hotel', icon: '🏨', title: 'Hotel Check-in', subtitle: '入住酒店 · at the front desk' },
  { id: 'phone', icon: '📞', title: 'Phone Call', subtitle: '打电话 · making plans' },
  { id: 'friend', icon: '😊', title: 'Making Friends', subtitle: '交朋友 · casual conversation' },
];

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

// Downscale so photo uploads stay reasonably sized.
function resizeImageToBlob(file, maxDim = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read that image'))), 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ConversationPracticePage({ onBack }) {
  const [topic, setTopic] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingBlob, setPendingBlob] = useState(null);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [revealActive, setRevealActive] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => () => {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [pendingUrl, photoPreview]);

  const fetchRecordings = async (topicId) => {
    setLoadingRecordings(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/conversation-practice/recordings?topic=${topicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setRecordings(data);
    } catch {
      // leave whatever was already loaded
    }
    setLoadingRecordings(false);
  };

  const selectTopic = (t) => {
    setError('');
    setTopic(t);
    setActiveTurnIndex(0);
    setRevealActive(false);
    fetchRecordings(t.id);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const goToTurn = (idx) => {
    clearPending();
    setActiveTurnIndex(idx);
    setRevealActive(false);
  };

  const clearPending = () => {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPendingBlob(null);
    setPendingUrl(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const endTopic = () => {
    clearPending();
    setTopic(null);
    setRecordings([]);
    setError('');
    setActiveTurnIndex(0);
  };

  const startRecording = async () => {
    setError('');
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
        setPendingBlob(blob);
        setPendingUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError('Could not access the microphone. Check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const saveRecording = async () => {
    if (!pendingBlob) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('topic', topic.id);
      if (topic.script) form.append('turnIndex', String(activeTurnIndex));
      form.append('audio', pendingBlob, `${topic.id}-${Date.now()}.${extForMimeType(pendingBlob.type)}`);
      if (photoFile) {
        const resized = await resizeImageToBlob(photoFile);
        form.append('photo', resized, 'photo.jpg');
      }
      const res = await fetch(`${API}/conversation-practice/recordings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your recording');
      setRecordings((prev) => [data, ...prev]);
      clearPending();
      if (topic.script) {
        setActiveTurnIndex((idx) => idx + 1);
        setRevealActive(false);
      }
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const deleteRecording = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/conversation-practice/recordings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Could not delete the recording');
      setRecordings((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <style>{`
        .conv-container { max-width: 720px; margin: 0 auto; padding: 24px 16px 60px; }
        .conv-header { margin-bottom: 20px; }
        .conv-header h1 { font-size: 1.6rem; margin: 4px 0; }
        .conv-header p { color: var(--line); margin: 0; }
        .conv-scenario-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }
        .conv-scenario-card {
          border: 1.5px solid var(--line, #ddd); border-radius: 14px; padding: 16px;
          text-align: left; cursor: pointer; background: var(--paper, #fff);
          transition: transform 0.15s, border-color 0.15s;
        }
        .conv-scenario-card:hover { transform: translateY(-2px); border-color: var(--seal, #b3423a); }
        .conv-scenario-icon { font-size: 1.8rem; display: block; margin-bottom: 8px; }
        .conv-scenario-title { font-weight: 600; display: block; }
        .conv-scenario-subtitle { color: var(--line); font-size: 0.85rem; }

        .conv-chat-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px; gap: 12px;
        }
        .conv-chat-title { font-weight: 600; font-size: 1.1rem; }
        .conv-end-btn {
          border: 1.5px solid var(--line, #ddd); background: transparent; border-radius: 8px;
          padding: 6px 12px; cursor: pointer; font-size: 0.85rem;
        }

        .conv-recorder {
          border: 1.5px solid var(--line, #ddd); border-radius: 14px; padding: 18px;
          margin-bottom: 24px; background: var(--paper, #f4f1ea);
        }
        .conv-record-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .conv-record-btn {
          border: none; border-radius: 999px; width: 64px; height: 64px; font-size: 1.6rem;
          background: var(--seal, #b3423a); color: #fff; cursor: pointer;
        }
        .conv-record-btn.recording { animation: conv-pulse 1.2s infinite; }
        .conv-record-hint { color: var(--line); font-size: 0.85rem; }
        @keyframes conv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

        .conv-photo-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
        .conv-photo-btn {
          border: 1.5px dashed var(--line, #ddd); background: transparent; border-radius: 10px;
          padding: 8px 14px; cursor: pointer; font-size: 0.85rem;
        }
        .conv-photo-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
        .conv-photo-remove { border: none; background: transparent; color: var(--seal, #b3423a); cursor: pointer; font-size: 0.8rem; }

        .conv-pending { margin-top: 16px; }
        .conv-pending audio { width: 100%; }
        .conv-pending-actions { display: flex; gap: 10px; margin-top: 10px; }
        .conv-save-btn {
          border: none; background: var(--seal, #b3423a); color: #fff; border-radius: 10px;
          padding: 10px 18px; font-weight: 600; cursor: pointer;
        }
        .conv-save-btn:disabled { opacity: 0.5; cursor: default; }
        .conv-discard-btn {
          border: 1.5px solid var(--line, #ddd); background: transparent; border-radius: 10px;
          padding: 10px 18px; cursor: pointer;
        }

        .conv-error-banner {
          color: #a33; background: rgba(163, 51, 51, 0.08); border: 1px solid rgba(163, 51, 51, 0.3);
          border-radius: 8px; padding: 8px 12px; font-size: 0.9rem; margin-top: 12px;
        }

        .conv-construction-banner {
          color: #8a6d1a; background: rgba(212, 160, 23, 0.1); border: 1px solid rgba(212, 160, 23, 0.35);
          border-radius: 8px; padding: 8px 12px; font-size: 0.9rem; margin-bottom: 16px;
        }

        .conv-script-progress { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; color: var(--line); margin-bottom: 16px; }
        .conv-script-dots { display: flex; gap: 6px; }
        .conv-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--line, #ddd); opacity: 0.4; }
        .conv-dot.done { background: var(--jade, #3a8f78); opacity: 1; }
        .conv-dot.active { background: var(--seal, #b3423a); opacity: 1; transform: scale(1.3); }

        .conv-dialogue { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
        .conv-bubble { border-radius: 14px; padding: 14px 16px; max-width: 84%; border: 1.5px solid var(--line, #ddd); }
        .conv-bubble.waiter { align-self: flex-start; background: var(--paper, #f4f1ea); }
        .conv-bubble.you { align-self: flex-end; background: rgba(179, 66, 58, 0.06); border-color: var(--seal, #b3423a); }
        .conv-bubble.done { opacity: 0.7; }
        .conv-bubble.active { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .conv-bubble-role { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--line); margin-bottom: 4px; }
        .conv-bubble-zh { font-size: 1.25rem; font-weight: 600; margin-bottom: 2px; }
        .conv-bubble-pinyin { font-size: 0.85rem; color: var(--line); margin-bottom: 4px; }
        .conv-bubble-en { font-size: 0.85rem; font-style: italic; color: var(--line); margin-top: 6px; }
        .conv-bubble-actions { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .conv-listen-btn, .conv-reveal-btn {
          border: 1.5px solid var(--line, #ddd); background: transparent; border-radius: 8px;
          padding: 5px 10px; cursor: pointer; font-size: 0.8rem;
        }
        .conv-next-btn {
          border: none; background: var(--seal, #b3423a); color: #fff; border-radius: 8px;
          padding: 6px 14px; cursor: pointer; font-size: 0.8rem; font-weight: 600; margin-top: 10px;
        }
        .conv-bubble-recording { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .conv-bubble-recording audio { height: 32px; }
        .conv-redo-btn { border: none; background: transparent; color: var(--seal, #b3423a); cursor: pointer; font-size: 0.8rem; padding: 0; }
        .conv-complete-banner {
          text-align: center; padding: 20px; border-radius: 14px; background: rgba(58, 143, 120, 0.08);
          border: 1.5px solid var(--jade, #3a8f78); margin-bottom: 24px; font-weight: 600;
        }

        .conv-recordings-title { font-weight: 600; margin-bottom: 12px; }
        .conv-recording-list { display: flex; flex-direction: column; gap: 12px; }
        .conv-recording-item {
          display: flex; align-items: center; gap: 12px; border: 1px solid var(--line, #ddd);
          border-radius: 12px; padding: 10px 12px; background: var(--paper, #fff);
        }
        .conv-recording-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .conv-recording-thumb-placeholder {
          width: 44px; height: 44px; border-radius: 8px; flex-shrink: 0;
          background: var(--paper, #f4f1ea); border: 1px solid var(--line, #ddd);
          display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .conv-recording-body { flex: 1; min-width: 0; }
        .conv-recording-date { font-size: 0.75rem; color: var(--line); margin-bottom: 4px; }
        .conv-recording-body audio { width: 100%; height: 32px; }
        .conv-recording-delete { border: none; background: transparent; color: var(--line); cursor: pointer; font-size: 0.85rem; }
        .conv-empty { color: var(--line); font-size: 0.9rem; }
      `}</style>

      <div className="conv-container">
        <button className="back-btn" onClick={topic ? endTopic : onBack} style={{ marginBottom: 16 }}>
          ← Back to {topic ? 'topics' : 'home'}
        </button>

        {!topic ? (
          <>
            <div className="conv-header">
              <h1>💬 Conversation Practice</h1>
              <p>Pick a topic, then record yourself speaking Mandarin about it — add a photo if it helps.</p>
            </div>

            <div className="conv-construction-banner">🚧 Scripted practice is ready for "Ordering Food" — other topics are still freeform while we build them out.</div>

            {error && <div className="conv-error-banner">{error}</div>}

            <div className="conv-scenario-grid">
              {TOPICS.map((t) => (
                <button key={t.id} type="button" className="conv-scenario-card" onClick={() => selectTopic(t)}>
                  <span className="conv-scenario-icon">{t.icon}</span>
                  <span className="conv-scenario-title">{t.title}</span>
                  <span className="conv-scenario-subtitle">{t.subtitle}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="conv-chat-header">
              <span className="conv-chat-title">{topic.icon} {topic.title}</span>
              <button type="button" className="conv-end-btn" onClick={endTopic}>Done</button>
            </div>

            {topic.script ? (
              <>
                <div className="conv-script-progress">
                  Turn {Math.min(activeTurnIndex + 1, topic.script.length)} of {topic.script.length}
                  <div className="conv-script-dots">
                    {topic.script.map((_, i) => (
                      <span key={i} className={`conv-dot ${i < activeTurnIndex ? 'done' : i === activeTurnIndex ? 'active' : ''}`} />
                    ))}
                  </div>
                </div>

                <div className="conv-dialogue">
                  {topic.script.slice(0, Math.min(activeTurnIndex + 1, topic.script.length)).map((turn, i) => {
                    const isActive = i === activeTurnIndex;
                    const savedRecording = recordings.find((r) => r.turnIndex === i);

                    if (turn.speaker === 'waiter') {
                      return (
                        <div key={i} className={`conv-bubble waiter ${isActive ? 'active' : 'done'}`}>
                          <div className="conv-bubble-role">🧑‍🍳 Waiter</div>
                          <div className="conv-bubble-zh">{turn.zh}</div>
                          <div className="conv-bubble-pinyin">{turn.pinyin}</div>
                          <div className="conv-bubble-en">{turn.en}</div>
                          <div className="conv-bubble-actions">
                            <button type="button" className="conv-listen-btn" onClick={() => speak(turn.zh)}>🔊 Listen</button>
                          </div>
                          {isActive && (
                            <button type="button" className="conv-next-btn" onClick={() => goToTurn(i + 1)}>Continue →</button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={i} className={`conv-bubble you ${isActive ? 'active' : 'done'}`}>
                        <div className="conv-bubble-role">🗣️ You say</div>
                        <div className="conv-bubble-zh">{turn.zh}</div>
                        <div className="conv-bubble-pinyin">{turn.pinyin}</div>

                        {isActive ? (
                          <>
                            <div className="conv-bubble-actions">
                              <button type="button" className="conv-listen-btn" onClick={() => speak(turn.zh)}>🔊 Hear it</button>
                              <button type="button" className="conv-reveal-btn" onClick={() => setRevealActive((v) => !v)}>
                                {revealActive ? 'Hide meaning' : 'Show meaning'}
                              </button>
                            </div>
                            {revealActive && <div className="conv-bubble-en">{turn.en}</div>}

                            {!pendingBlob ? (
                              <div className="conv-record-row" style={{ marginTop: 10 }}>
                                <button
                                  type="button"
                                  className={`conv-record-btn ${isRecording ? 'recording' : ''}`}
                                  onClick={isRecording ? stopRecording : startRecording}
                                  title={isRecording ? 'Stop recording' : 'Start recording'}
                                >
                                  {isRecording ? '⏹' : '🎤'}
                                </button>
                                <span className="conv-record-hint">
                                  {isRecording ? 'Recording… say the line above' : 'Tap to record yourself saying this line'}
                                </span>
                              </div>
                            ) : (
                              <div className="conv-pending">
                                <audio controls src={pendingUrl} />
                                <div className="conv-pending-actions">
                                  <button type="button" className="conv-save-btn" disabled={saving} onClick={saveRecording}>
                                    {saving ? 'Saving…' : 'Save & continue'}
                                  </button>
                                  <button type="button" className="conv-discard-btn" disabled={saving} onClick={clearPending}>Discard & re-record</button>
                                </div>
                              </div>
                            )}
                            {error && <div className="conv-error-banner">{error}</div>}
                          </>
                        ) : (
                          savedRecording && (
                            <div className="conv-bubble-recording">
                              <audio controls src={savedRecording.audioUrl} />
                              <button type="button" className="conv-redo-btn" onClick={() => goToTurn(i)}>🔁 Re-record</button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {activeTurnIndex >= topic.script.length && (
                  <div className="conv-complete-banner">
                    🎉 Nice work — you've completed this conversation!
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className="conv-save-btn" onClick={() => goToTurn(0)}>Practice again</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
            <>
            <div className="conv-recorder">
              {!pendingBlob ? (
                <>
                  <div className="conv-record-row">
                    <button
                      type="button"
                      className={`conv-record-btn ${isRecording ? 'recording' : ''}`}
                      onClick={isRecording ? stopRecording : startRecording}
                      title={isRecording ? 'Stop recording' : 'Start recording'}
                    >
                      {isRecording ? '⏹' : '🎤'}
                    </button>
                    <span className="conv-record-hint">
                      {isRecording ? 'Recording… speak about ' + topic.subtitle.split(' · ')[1] : 'Tap to record yourself speaking about this topic'}
                    </span>
                  </div>

                  <div className="conv-photo-row">
                    <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
                    {photoPreview ? (
                      <>
                        <img src={photoPreview} alt="Attached" className="conv-photo-thumb" />
                        <button type="button" className="conv-photo-remove" onClick={removePhoto}>Remove photo</button>
                      </>
                    ) : (
                      <button type="button" className="conv-photo-btn" onClick={() => photoInputRef.current?.click()}>
                        📷 Add a photo (optional)
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="conv-pending">
                  <audio controls src={pendingUrl} />
                  {photoPreview && <img src={photoPreview} alt="Attached" className="conv-photo-thumb" style={{ marginTop: 10 }} />}
                  <div className="conv-pending-actions">
                    <button type="button" className="conv-save-btn" disabled={saving} onClick={saveRecording}>
                      {saving ? 'Saving…' : 'Save recording'}
                    </button>
                    <button type="button" className="conv-discard-btn" disabled={saving} onClick={clearPending}>Discard & re-record</button>
                  </div>
                </div>
              )}

              {error && <div className="conv-error-banner">{error}</div>}
            </div>

            <div className="conv-recordings-title">Your recordings for this topic</div>
            {loadingRecordings ? (
              <div className="conv-empty">Loading…</div>
            ) : recordings.length === 0 ? (
              <div className="conv-empty">No recordings yet — record your first one above.</div>
            ) : (
              <div className="conv-recording-list">
                {recordings.map((r) => (
                  <div key={r._id} className="conv-recording-item">
                    {r.photoUrl ? (
                      <img src={r.photoUrl} alt="" className="conv-recording-thumb" />
                    ) : (
                      <div className="conv-recording-thumb-placeholder">{topic.icon}</div>
                    )}
                    <div className="conv-recording-body">
                      <div className="conv-recording-date">{formatDate(r.createdAt)}</div>
                      <audio controls src={r.audioUrl} />
                    </div>
                    <button type="button" className="conv-recording-delete" onClick={() => deleteRecording(r._id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
            </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default ConversationPracticePage;
