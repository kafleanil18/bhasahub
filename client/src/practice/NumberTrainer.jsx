import { useState } from 'react';
import { NUMBER_MODES, numberRound } from './numberQuiz';
import useChineseVoice from './useChineseVoice';
import NumberSession from './NumberSession';
import './SentencePractice.css';
import './TonePractice.css';
import './NumberTrainer.css';

// A sample of what each mode sounds like, shown on its card.
const examples = {
  prices: ['¥25.50', '二十五块五角'], time: ['15:30', '下午三点半'], dates: ['3月15号', '三月十五号'],
  ages: ['28岁', '二十八岁'], phones: ['138…', '幺三八…'],
};

export default function NumberTrainer({ onBack }) {
  const [session, setSession] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  // Google's female Mandarin voice when the browser has it, otherwise the device's best female Mandarin voice.
  const { supported, loading, refresh, voice } = useChineseVoice({ preferGoogleFemale: true });
  const mode = session && NUMBER_MODES.find(item => item.id === session.mode);
  const start = id => { setSession({ mode: id, questions: numberRound(id) }); setSessionKey(value => value + 1); };

  return <main className="sentence-page tone-practice number-trainer" aria-labelledby="number-trainer-title">
    <div className="number-header">
      <button className="sentence-back" onClick={session ? () => setSession(null) : onBack}>{session ? '← All number modes' : '← Back to home'}</button>
      {mode && <span className="number-mode-chip"><span aria-hidden="true">{mode.symbol}</span> {mode.title}</span>}
    </div>
    <h1 id="number-trainer-title" className={session ? 'tone-visually-hidden' : 'number-title'}>Everyday Chinese Numbers</h1>
    {session ? <NumberSession key={sessionKey} initialQuestions={session.questions} voice={voice} onRestart={() => start(session.mode)} onExit={() => setSession(null)} /> : <>
      <p className="number-intro">Hear a number in Chinese, then type what you heard.</p>
      {!voice && <div className="number-voice-warning" role="status">{loading ? <p>Loading Chinese voices…</p> : <>
        <p>{supported ? 'No Mandarin voice was found on this device. Add a Chinese (Mandarin) voice in your device’s speech settings, or open this page in Google Chrome, then refresh.' : 'Speech playback is unavailable in this browser. Open this page in Google Chrome.'}</p>
        {supported && <button className="sentence-secondary" onClick={refresh}>Refresh voices</button>}
      </>}</div>}
      <div className="number-mode-cards">{NUMBER_MODES.map(item => <button type="button" key={item.id} className="number-mode-card" disabled={!voice} onClick={() => start(item.id)} aria-label={item.title} aria-describedby={`number-mode-${item.id}`}>
        <span className="number-mode-art" aria-hidden="true"><b>{examples[item.id][0]}</b><small lang="zh-CN">{examples[item.id][1]}</small></span>
        <span className="number-mode-body"><strong>{item.title}</strong><span id={`number-mode-${item.id}`}>{item.description}</span></span>
      </button>)}</div>
    </>}
  </main>;
}
