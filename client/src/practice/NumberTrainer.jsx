import { useState } from 'react';
import { NUMBER_MODES, NUMBER_QUESTIONS, numberRound } from './numberQuiz';
import useChineseVoice, { voiceKey } from './useChineseVoice';
import NumberSession from './NumberSession';
import './SentencePractice.css';
import './NumberTrainer.css';

export default function NumberTrainer({ onBack }) {
  const [session, setSession] = useState(null);
  const { supported, loading, voices, selected, setSelected, refresh, voice } = useChineseVoice();
  return <section className="sentence-page number-trainer" aria-labelledby="number-trainer-title">
    <button className="sentence-back" onClick={onBack}>← Back to home</button>
    <div className="sentence-heading"><p className="sentence-eyebrow">Listen · Recognize · Respond</p><h1 id="number-trainer-title">Everyday Chinese Numbers</h1><p>From a price at the shop to a time to meet: turn the Chinese you hear into numbers you understand.</p></div>
    {session ? <><button className="sentence-back" onClick={() => setSession(null)}>← Choose another mode</button><NumberSession initialQuestions={session} voice={voice} onExit={() => setSession(null)} /></> : <>
      <div className="sentence-overview"><div><strong>5</strong><span>everyday skills</span></div><div><strong>10</strong><span>questions per round</span></div><div><strong>{NUMBER_QUESTIONS.length}</strong><span>listening prompts</span></div></div>
      <div className="number-voice-settings">{voices.length > 0 ? <label>Chinese voice<select value={selected} onChange={event => setSelected(event.target.value)}>{voices.map(voice => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} · {voice.lang}</option>)}</select></label>
        : loading ? <p role="status">Loading Chinese voices…</p> : <div role="status"><p>{supported ? 'A Mandarin speech voice is needed. Add a Chinese (Mandarin) voice in your device’s speech settings, then refresh the voices here.' : 'Speech playback is unavailable in this browser. Use a browser with speech playback and a Mandarin voice to practice.'}</p>{supported && <button className="sentence-secondary" onClick={refresh}>Refresh voices</button>}</div>}<p className="sentence-muted">Audio uses your device's Chinese speech voice.</p></div>
      <div className="sentence-topics">{NUMBER_MODES.map(mode => <button className="sentence-topic" key={mode.id} disabled={!voice} onClick={() => setSession(numberRound(mode.id))}><span className="number-mode-symbol" aria-hidden="true">{mode.symbol}</span><span><strong>{mode.title}</strong><small>{mode.description}</small></span><span aria-hidden="true">↗</span></button>)}</div>
    </>}
  </section>;
}
