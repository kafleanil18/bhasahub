import { useEffect, useRef, useState } from 'react';
import useHskExam, { clock } from './useHskExam';
import HskQuestionGroup from './HskQuestionGroup';
import HskNavigation from './HskNavigation';
import HskResult from './HskResult';
import './HskPortal.css';

function Confirmation({ action, onClose, onConfirm }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog className="hsk-confirm" ref={ref} aria-labelledby="hsk-confirm-title" onCancel={onClose}><h2 id="hsk-confirm-title">{action.title}</h2><p>{action.description}</p><div className="hsk-actions"><button className="hsk-button" autoFocus onClick={onClose}>Keep working</button><button className="hsk-button hsk-button-primary" onClick={onConfirm}>{action.label}</button></div></dialog>;
}
export default function HskPortal({ user, onBack, paperId = 'h11226' }) {
  const exam = useHskExam(user, paperId);
  const { paper, session, result, loading, busy, error, remaining } = exam;
  const [confirmation, setConfirmation] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const audio = useRef(null);
  const content = useRef(null);
  const previousGroup = useRef(null);
  const listening = session && ['ready', 'listening', 'transfer'].includes(session.stage);
  const groups = paper?.groups.filter(group => group.section === (listening ? 'listening' : 'reading')) || [];
  const currentGroup = paper?.groups[session?.group || 0];
  const answered = session?.answers.filter(value => value !== null).length || 0;
  const sectionAnswered = session?.answers.slice(listening ? 0 : 20, listening ? 20 : 40).filter(value => value !== null).length || 0;
  const ask = (title, description, label, action) => setConfirmation({ title, description, label, action });
  const back = () => {
    if (!session || result) onBack();
    else ask('Leave this attempt?', 'Your answers are saved in this browser. The section timer keeps running while you are away.', 'Leave test', onBack);
  };
  const sessionId = session?.id;
  useEffect(() => {
    if (sessionId || result) content.current?.focus({ preventScroll: true });
    if (sessionId) {
      if (previousGroup.current !== null && previousGroup.current !== session?.group) content.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      previousGroup.current = session?.group;
    }
  }, [sessionId, session?.group, session?.stage, result]);
  useEffect(() => {
    if (result) audio.current?.pause();
  }, [result]);

  return <main className="container hsk-portal">
    <button className="hsk-back" onClick={back} disabled={busy}>← Back to mock tests</button>
    {error && <div className="hsk-error" role="alert"><strong>{error}</strong>{!paper && <button className="hsk-button" onClick={exam.retry}>Try again</button>}</div>}
    {loading ? <div className="hsk-loading" role="status">Preparing your HSK 1 test…</div> : paper && <>
      {result ? <div ref={content} tabIndex={-1}><HskResult paper={paper} result={result} user={user} onRetake={() => { setAudioError(false); exam.start(); }} onBack={onBack} busy={busy}/></div> : !session ? <>
        <section className="hsk-intro"><p className="hsk-eyebrow">HanziGo examination room · {paper.code || paperId.toUpperCase()}</p><h1>Your next step in Chinese.</h1><p>A complete HSK 1 practice test with colorful illustrations, questions and pinyin, and the full listening recording.</p><div className="hsk-intro-stats"><div><strong>40</strong><span>questions</span></div><div><strong>2</strong><span>sections</span></div><div><strong>~{Math.ceil((paper.listeningSeconds + paper.transferSeconds + paper.readingSeconds) / 60)} min</strong><span>answering & review time</span></div></div><button className="hsk-button hsk-button-gold" onClick={exam.start} disabled={busy}>{busy ? 'Preparing attempt…' : 'Enter test room →'}</button></section>
        <section className="hsk-instructions" aria-labelledby="hsk-instructions-title"><h2 id="hsk-instructions-title">Before you begin</h2><ol><li><strong>Listening · about {Math.ceil(paper.listeningSeconds / 60)} minutes.</strong> Press Play to start the recording and timer. Each question is spoken twice in the recording. You can pause or replay audio, but the timer keeps running.</li><li><strong>Check listening answers · {Math.ceil(paper.transferSeconds / 60)} minutes.</strong> Review your selections before continuing. Listening answers lock when reading begins.</li><li><strong>Reading · {Math.ceil(paper.readingSeconds / 60)} minutes.</strong> Complete 20 questions with pinyin support. Submit early or let the timer submit your answers.</li><li><strong>Get your result.</strong> Your listening score, reading score, and answer review are saved privately to your account after submission.</li></ol><p className="hsk-muted">Answers are saved on this browser while you work. Keep the same account and browser to resume. A network connection is needed to start and save the final result. This is timed practice, not a proctored official exam.</p><label className="hsk-sound-check">Check your sound before starting<audio controls preload="metadata" src={paper.audioUrl}>Your browser does not support audio playback.</audio></label></section>
        <section className="hsk-history"><h2>Your previous results</h2>{exam.historyError ? <p role="status">{exam.historyError}</p> : exam.history.length ? <ul>{exam.history.map(row => <li key={row._id}><div><strong>{row.score} / 40</strong><span>{new Date(row.submittedAt).toLocaleString()} · Listening {row.listening}/20 · Reading {row.reading}/20</span></div><button className="hsk-button" onClick={() => exam.openResult(row._id)} disabled={busy}>View result →</button></li>)}</ul> : <p className="hsk-muted">Your completed attempts will appear here.</p>}</section>
      </> : <>
        <div className="hsk-exam-heading"><div><p className="hsk-eyebrow">{paper.title}</p><h1>{listening ? 'Listening' : 'Reading'}</h1></div><div className={`hsk-timer ${remaining < 60 && session.stage !== 'ready' ? 'is-urgent' : ''}`} role="timer" aria-label="Section time remaining"><span>{session.stage === 'ready' ? 'Start the audio' : session.stage === 'transfer' ? 'Answer review' : session.stage === 'review' ? 'Time is up' : 'Time remaining'}</span><strong>{session.stage === 'ready' ? 'Ready' : clock(remaining)}</strong></div></div>
        <div className="hsk-steps" aria-label="Test sections"><span className={listening ? 'is-current' : 'is-complete'}>{listening ? '1' : '✓'} Listening</span><span aria-hidden="true">→</span><span className={!listening ? 'is-current' : ''}>2 Reading</span><span aria-hidden="true">→</span><span>3 Your result</span></div>
        {exam.storageError && <p className="hsk-error" role="status">Browser storage is unavailable. Keep this page open until you submit to preserve your answers.</p>}
        {(session.stage === 'ready' || session.stage === 'listening') && <div className="hsk-audio"><div><strong>{session.stage === 'ready' ? 'Start with the recording' : 'Listening recording'}</strong><span>{session.stage === 'ready' ? 'Press play to start the timer and unlock your answers.' : 'Follow the spoken question numbers. The timer continues if you pause.'}</span></div>{session.stage === 'ready' && <button className="hsk-button hsk-button-primary hsk-start-audio" disabled={busy} onClick={() => { setAudioError(false); audio.current?.play().catch(() => setAudioError(true)); }}><span aria-hidden="true">▶</span> Start listening</button>}<audio ref={audio} controls preload="auto" src={paper.audioUrl} onPlay={exam.beginAudio} onLoadedMetadata={() => { if (session.audioTime) audio.current.currentTime = Math.min(session.audioTime, audio.current.duration); }} onTimeUpdate={() => exam.saveAudio(audio.current.currentTime)} onError={() => setAudioError(true)}>Your browser does not support audio playback.</audio>{audioError && <div role="alert"><p>Audio could not load. Check your connection and try again.</p><button className="hsk-button" onClick={() => { setAudioError(false); audio.current?.load(); }}>Reload recording</button></div>}</div>}
        {session.stage === 'transfer' && <div className="hsk-transfer" role="status"><strong>Check your listening answers.</strong><p>You have up to {Math.ceil(paper.transferSeconds / 60)} minutes. Reading will begin automatically when this timer ends, or you can continue early.</p></div>}
        {session.stage === 'review' && <div className="hsk-transfer" role="status"><strong>Time is up. Your answers are locked.</strong><p>{busy ? 'Saving your result…' : 'Submit your answers to save your result. If the connection failed, you can retry below.'}</p></div>}
        <div className="hsk-exam-layout"><HskNavigation groups={groups} currentGroup={currentGroup} answers={session.answers} sectionAnswered={sectionAnswered} onSelectGroup={group => exam.selectGroup(paper.groups.indexOf(group))} onJump={number => {
          const targetGroup = paper.groups.find(group => group.questions.some(question => question.number === number));
          exam.selectGroup(paper.groups.indexOf(targetGroup));
          requestAnimationFrame(() => { const target = document.getElementById(`hsk-question-${number}`); target?.scrollIntoView({ block: 'center', behavior: 'instant' }); target?.focus({ preventScroll: true }); });
        }}/>
        <div className="hsk-active-group" ref={content} tabIndex={-1}><HskQuestionGroup group={currentGroup} answers={session.answers} onAnswer={exam.answer} disabled={busy || session.stage === 'review' || session.stage === 'ready'}/><div className="hsk-group-pagination"><button className="hsk-button" disabled={session.group === (listening ? 0 : 4)} onClick={() => exam.selectGroup(session.group - 1)}>← Previous part</button><button className="hsk-button" disabled={session.group === (listening ? 3 : 7)} onClick={() => exam.selectGroup(session.group + 1)}>Next part →</button></div></div></div>
        <div className="hsk-submit-bar"><span><strong>{answered} / 40</strong> questions answered<small>{session.stage === 'ready' ? 'Start the recording to begin' : listening ? 'Listening first, then reading' : 'Submit when you have finished reviewing'}</small></span>{listening ? <button className="hsk-button hsk-button-primary" disabled={busy || session.stage === 'ready'} onClick={() => ask(session.stage === 'transfer' ? 'Begin reading?' : 'Finish listening?', `${20 - sectionAnswered} listening questions are unanswered. ${session.stage === 'transfer' ? 'You cannot change listening answers after reading begins.' : 'You will have time to check your listening answers.'}`, session.stage === 'transfer' ? 'Begin reading' : 'Review listening answers', exam.advance)}>{session.stage === 'transfer' ? 'Begin reading →' : 'Finish listening →'}</button> : <button className="hsk-button hsk-button-primary" disabled={busy} onClick={() => session.stage === 'review' ? exam.submit() : ask('Submit your test?', `${40 - answered} questions are unanswered. Your result will be saved and your answers will be final.`, 'Submit & see result', exam.submit)}>{busy ? 'Saving result…' : 'Submit & see result →'}</button>}</div>
      </>}
    </>}
    {confirmation && <Confirmation action={confirmation} onClose={() => setConfirmation(null)} onConfirm={() => { confirmation.action(); setConfirmation(null); }}/> }
  </main>;
}
