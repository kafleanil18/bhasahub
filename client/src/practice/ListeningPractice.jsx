import { useEffect, useState } from 'react';
import ListeningSession from './ListeningSession';
import { createListeningQuiz } from './listeningQuiz';
import useChineseVoice from './useChineseVoice';
import './SentencePractice.css';
import './TonePractice.css';
import './ListeningPractice.css';

async function readApi(path, signal) {
  const response = await fetch(`${window.API_BASE_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load listening practice. Please try again.');
  return data;
}

export default function ListeningPractice({ user, onBack, onSignIn }) {
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [lessons, setLessons] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [opening, setOpening] = useState('');
  const [notReady, setNotReady] = useState({});
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  // For now every word is read by Google's female Mandarin voice (Google 普通话（中国大陆）), not teacher recordings.
  const speech = useChineseVoice({ googleOnly: true });

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setError(''); setCourses(null);
    const admin = ['admin', 'superadmin'].includes(user.role);
    Promise.all([readApi('/courses', controller.signal), admin ? Promise.resolve(null) : readApi('/subscriptions/my', controller.signal)])
      .then(([all, subscriptions]) => {
        const ids = new Set((subscriptions || []).map(sub => sub.course?._id));
        const list = all.filter(course => course.language === 'chinese' && (admin || ids.has(course._id)));
        setCourses(list);
        if (list.length === 1) setCourseId(list[0]._id);
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [user, retry]);

  useEffect(() => {
    if (!courseId) return;
    const controller = new AbortController();
    setError(''); setLessons(null); setNotReady({});
    readApi(`/lessons/course/${courseId}`, controller.signal)
      .then(data => setLessons(data.filter(lesson => (lesson.category || 'vocabulary') === 'vocabulary')))
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [courseId, retry]);

  async function openLesson(lesson) {
    if (opening) return;
    setOpening(lesson._id); setError('');
    try {
      const words = await readApi(`/lessons/${lesson._id}/vocabulary`);
      const questions = createListeningQuiz(words);
      if (!questions.length) { setNotReady(previous => ({ ...previous, [lesson._id]: true })); return; }
      setSession({ lesson, words, questions }); setSessionKey(value => value + 1);
    } catch (err) { setError(err.message); }
    finally { setOpening(''); }
  }
  const restart = () => { setSession(previous => ({ ...previous, questions: createListeningQuiz(previous.words) })); setSessionKey(value => value + 1); };
  const course = courses?.find(item => item._id === courseId);
  const loading = user && !error && (!courses || (courseId && !lessons));

  return <main className="sentence-page tone-practice listening-page" aria-labelledby="listening-title">
    <div className="listening-header">
      <button className="sentence-back" onClick={session ? () => setSession(null) : onBack}>{session ? '← All lessons' : '← Back to home'}</button>
      {session && <span className="listening-chip">{session.lesson.title}</span>}
    </div>
    <h1 id="listening-title" className={session ? 'tone-visually-hidden' : 'listening-title'}>Listening practice</h1>
    {!user ? <div className="listening-empty"><h2>Your lessons, ready to listen</h2><p>Sign in to practise vocabulary from the courses you have access to.</p><button className="sentence-primary" onClick={onSignIn}>Sign in to practise</button></div>
      : session ? <ListeningSession key={sessionKey} initialQuestions={session.questions} voice={speech.voice} onRestart={restart} onExit={() => setSession(null)} />
      : <>
        <p className="listening-intro">Train your ear, one word at a time. Practise with recordings from your lessons.</p>
        {!speech.voice && <div className="listening-voice-warning" role="status">{speech.loading ? <p>Loading Google’s Mandarin voice…</p> : <>
          <p>{speech.supported ? 'Listening practice uses Google’s Mandarin voice, which comes with Google Chrome on computers and Android phones. Open this page in Chrome, then refresh.' : 'Speech playback is unavailable in this browser. Open this page in Google Chrome on a computer or Android phone.'}</p>
          {speech.supported && <button className="sentence-secondary" onClick={speech.refresh}>Refresh voices</button>}
        </>}</div>}
        {error && <div className="tone-alert listening-alert" role="alert"><p>{error}</p><button className="sentence-secondary" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
        {courses && !courses.length && <div className="listening-empty"><p>No Chinese courses are available for your account yet. Ask your teacher for course access.</p></div>}
        {courses && courses.length > 1 && <>
          <h2 className="listening-section-title">Choose a course</h2>
          <div className="listening-courses">{courses.map(item => <button type="button" key={item._id} className={`listening-course${item._id === courseId ? ' is-selected' : ''}`} aria-pressed={item._id === courseId} onClick={() => setCourseId(item._id)}>
            <span className="listening-course-art" aria-hidden="true"><b>听</b></span>
            <strong>{item.title}</strong>
          </button>)}</div>
        </>}
        {courseId && <>
          <h2 className="listening-section-title">{courses?.length > 1 ? 'Choose a lesson' : `${course?.title || 'Your course'} · choose a lesson`}</h2>
          {lessons && !lessons.length && <div className="listening-empty"><p>This course has no published vocabulary lessons yet.</p></div>}
          {lessons?.length > 0 && <div className="listening-lessons">{lessons.map((lesson, index) => <button type="button" key={lesson._id} className={`listening-lesson${notReady[lesson._id] ? ' is-unavailable' : ''}`} disabled={!speech.voice || Boolean(opening) || notReady[lesson._id]} aria-busy={opening === lesson._id} onClick={() => openLesson(lesson)} aria-describedby={`listening-lesson-${lesson._id}`}>
            <span className="listening-lesson-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{lesson.title}</strong>
            <small id={`listening-lesson-${lesson._id}`}>{opening === lesson._id ? 'Loading recordings…' : notReady[lesson._id] ? 'Needs at least two words' : 'About 10 words · Start →'}</small>
          </button>)}</div>}
        </>}
        {!courseId && courses?.length > 1 && <p className="listening-hint">Pick a course to see its lessons.</p>}
        {loading && <p className="listening-hint" role="status">Loading…</p>}
      </>}
  </main>;
}
