import { useEffect, useState } from 'react';
import ListeningSession from './ListeningSession';
import { createListeningQuiz, recordedVocabulary } from './listeningQuiz';
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
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [words, setWords] = useState([]);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [courseRetry, setCourseRetry] = useState(0);
  const [lessonRetry, setLessonRetry] = useState(0);
  const [wordRetry, setWordRetry] = useState(0);
  const [failedResource, setFailedResource] = useState('courses');

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setLoading('courses');
    setFailedResource('courses');
    setError('');
    const admin = ['admin', 'superadmin'].includes(user.role);
    Promise.all([readApi('/courses', controller.signal), admin ? Promise.resolve(null) : readApi('/subscriptions/my', controller.signal)])
      .then(([all, subscriptions]) => {
        const ids = new Set((subscriptions || []).map(sub => sub.course?._id));
        setCourses(all.filter(course => course.language === 'chinese' && (admin || ids.has(course._id))));
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(''); });
    return () => controller.abort();
  }, [user, courseRetry]);

  useEffect(() => {
    if (!courseId) return;
    const controller = new AbortController();
    setLoading('lessons');
    setFailedResource('lessons');
    setError('');
    readApi(`/lessons/course/${courseId}`, controller.signal)
      .then(data => setLessons(data.filter(lesson => (lesson.category || 'vocabulary') === 'vocabulary')))
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(''); });
    return () => controller.abort();
  }, [courseId, lessonRetry]);

  useEffect(() => {
    if (!lessonId) return;
    const controller = new AbortController();
    setLoading('words');
    setFailedResource('words');
    setError('');
    readApi(`/lessons/${lessonId}/vocabulary`, controller.signal)
      .then(data => setWords(recordedVocabulary(data)))
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(''); });
    return () => controller.abort();
  }, [lessonId, wordRetry]);

  const eligible = new Set(words.map(word => word.meaning.trim().toLocaleLowerCase().replace(/\s+/g, ' '))).size >= 2;
  const selectedCourse = courses.find(course => course._id === courseId);
  const lessonTitle = lessons.find(lesson => lesson._id === lessonId)?.title;

  function reset() {
    setQuestions(null);
    setLessonId('');
    setWords([]);
  }

  return (
    <section className="listening-page" aria-labelledby="listening-title">
      <button className="listening-back" onClick={onBack}>← Back to home</button>
      <div className="listening-heading">
        <span className="listening-kicker"><span aria-hidden="true">♫</span> PRACTICE STUDIO <span aria-hidden="true">·</span> LISTENING</span>
        <h1 id="listening-title">Listening practice</h1>
        <p>{questions ? lessonTitle : 'Train your ear, one word at a time. Practice with recordings from your lessons.'}</p>
      </div>
      {!user ? <div className="listening-card"><h2>Your lessons, ready to listen.</h2><p>Sign in to practice vocabulary from the courses you have access to.</p><button className="listening-primary" onClick={onSignIn}>Sign in to practice</button></div>
        : questions ? <><ListeningSession initialQuestions={questions} onRestart={reset} /><button className="listening-back" onClick={reset}>← End practice and choose a lesson</button></>
          : <div className="listening-setup" aria-busy={Boolean(loading)}>
            <div className="listening-setup-top"><div><span className="listening-setup-icon" aria-hidden="true">♫</span><div><h2>Set up a listening session</h2><p>Choose a course and lesson. We’ll build a short quiz from its recorded words.</p></div></div><span className="listening-session-tag">ABOUT 10 WORDS</span></div>
            <div className="listening-steps" aria-label="Session setup steps">
              <div className={courseId ? 'is-complete' : 'is-current'}><span>{courseId ? '✓' : '1'}</span><div><strong>Choose a course</strong><small>{selectedCourse?.title || 'Pick your course'}</small></div></div>
              <i aria-hidden="true" />
              <div className={lessonId ? 'is-complete' : courseId ? 'is-current' : ''}><span>{lessonId ? '✓' : '2'}</span><div><strong>Choose a lesson</strong><small>{lessonTitle || 'Select a lesson'}</small></div></div>
              <i aria-hidden="true" />
              <div className={eligible ? 'is-current' : ''}><span>3</span><div><strong>Listen & learn</strong><small>{eligible ? 'Your session is ready' : 'Start your practice'}</small></div></div>
            </div>
            <div className="listening-card listening-picker">
              <div className="listening-fields">
                <label htmlFor="listening-course"><span>01</span> Course</label>
                <select id="listening-course" value={courseId} disabled={loading === 'courses'} onChange={event => { setLoading(''); setCourseId(event.target.value); setLessonId(''); setLessons([]); setWords([]); setError(''); }}>
                  <option value="">Choose a course you have access to</option>
                  {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
                </select>
                <label htmlFor="listening-lesson"><span>02</span> Lesson</label>
                <select id="listening-lesson" value={lessonId} disabled={!courseId || Boolean(loading)} onChange={event => { setLessonId(event.target.value); setWords([]); setError(''); }}>
                  <option value="">{courseId ? 'Choose a lesson to practice' : 'Choose a course first'}</option>
                  {lessons.map(lesson => <option key={lesson._id} value={lesson._id}>{lesson.title}</option>)}
                </select>
              </div>
              {loading && <p role="status" className="listening-inline-status"><span className="listening-loader" aria-hidden="true" />Loading {loading === 'words' ? 'recorded vocabulary' : loading}…</p>}
              {error && <div className="listening-error" role="alert"><p>{error}</p><button className="listening-secondary" onClick={() => { if (failedResource === 'courses') setCourseRetry(value => value + 1); else if (failedResource === 'lessons') setLessonRetry(value => value + 1); else setWordRetry(value => value + 1); }}>Try again</button></div>}
              {!loading && !error && !courses.length && <p role="status" className="listening-inline-status">No Chinese courses are available for your account yet. Ask your teacher for course access.</p>}
              {!loading && !error && courseId && !lessons.length && <p role="status" className="listening-inline-status">This course has no published vocabulary lessons yet.</p>}
            </div>
            <div className={`listening-ready${lessonId && !loading ? ' has-lesson' : ''}`} aria-live="polite">
              <div className="listening-ready-copy"><span className="listening-ready-icon" aria-hidden="true">{eligible ? '✓' : '♫'}</span><div><strong>{lessonId ? (eligible ? 'Ready when you are' : 'Lesson needs more recordings') : 'Your practice session'}</strong><p>{lessonId ? (eligible ? `${words.length} recorded words · Replay audio as often as you like.` : 'Choose another lesson with at least two recorded words.') : 'Select a course and lesson to see your session details.'}</p></div></div>
              <button className="listening-primary" disabled={!lessonId || !eligible || Boolean(loading) || Boolean(error)} onClick={() => setQuestions(createListeningQuiz(words))}><span aria-hidden="true">▶</span> Start listening</button>
            </div>
          </div>}
    </section>
  );
}
