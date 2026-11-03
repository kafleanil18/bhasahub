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
        <h1 id="listening-title">Listening practice</h1>
        <p>{questions ? lessonTitle : 'Train your ear, one word at a time. Practice with recordings from your lessons.'}</p>
      </div>
      {!user ? <div className="listening-card"><h2>Your lessons, ready to listen.</h2><p>Sign in to practice vocabulary from the courses you have access to.</p><button className="listening-primary" onClick={onSignIn}>Sign in to practice</button></div>
        : questions ? <><ListeningSession initialQuestions={questions} onRestart={reset} /><button className="listening-back" onClick={reset}>End practice and choose a lesson</button></>
          : <div className="listening-card" aria-busy={Boolean(loading)}>
            <h2>Choose your lesson</h2>
            <p className="listening-muted">Up to 10 words per session. Replay as often as you like.</p>
            <div className="listening-fields">
              <label htmlFor="listening-course">Course</label>
              <select id="listening-course" value={courseId} disabled={loading === 'courses'} onChange={event => { setLoading(''); setCourseId(event.target.value); setLessonId(''); setLessons([]); setWords([]); setError(''); }}>
                <option value="">Select a course</option>
                {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
              </select>
              <label htmlFor="listening-lesson">Lesson</label>
              <select id="listening-lesson" value={lessonId} disabled={!courseId || Boolean(loading)} onChange={event => { setLessonId(event.target.value); setWords([]); setError(''); }}>
                <option value="">Select a lesson</option>
                {lessons.map(lesson => <option key={lesson._id} value={lesson._id}>{lesson.title}</option>)}
              </select>
            </div>
            {loading && <p role="status" className="listening-muted">Loading {loading === 'words' ? 'recorded vocabulary' : loading}…</p>}
            {error && <div className="listening-error" role="alert"><p>{error}</p><button className="listening-secondary" onClick={() => { if (failedResource === 'courses') setCourseRetry(value => value + 1); else if (failedResource === 'lessons') setLessonRetry(value => value + 1); else setWordRetry(value => value + 1); }}>Try again</button></div>}
            {!loading && !error && !courses.length && <p role="status">No Chinese courses are available for your account yet. Ask your teacher for course access.</p>}
            {!loading && !error && courseId && !lessons.length && <p role="status">This course has no published vocabulary lessons yet.</p>}
            {!loading && !error && lessonId && <p role="status" className="listening-muted">{eligible ? `${words.length} recorded words available. Words without recordings are skipped.` : 'This lesson needs at least two recorded words with different meanings. Choose another lesson or ask your teacher to add recordings.'}</p>}
            <button className="listening-primary" disabled={!lessonId || !eligible || Boolean(loading) || Boolean(error)} onClick={() => setQuestions(createListeningQuiz(words))}>Start listening</button>
          </div>}
    </section>
  );
}
