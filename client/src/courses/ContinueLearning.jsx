import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { coursePath } from '../navigation/paths';
import { supportsConversation } from '../utils/courseFeatures';

export default function ContinueLearning() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const courseId = params.get('course');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    const request = async path => {
      const response = await fetch(`${window.API_BASE_URL}/api${path}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      if (!response.ok) throw new Error('Could not load your next lesson.');
      return response.json();
    };
    const load = async () => {
      try {
        const [courses, subscriptions] = await Promise.all([request('/courses'), request('/subscriptions/my')]);
        if (!Array.isArray(courses) || !Array.isArray(subscriptions)) throw new Error('Invalid course data');
        const active = new Set(subscriptions.filter(sub => new Date(sub.expiresAt) > new Date()).map(sub => sub.course?._id));
        const available = courses.filter(course => active.has(course._id) && (!courseId || course._id === courseId));
        const candidates = await Promise.all(available.map(async course => {
          const [lessons, progress] = await Promise.all([
            request(`/lessons/course/${course._id}`), request(`/progress/course/${course._id}`),
          ]);
          if (!Array.isArray(lessons) || !Array.isArray(progress.completedLessonIds)) throw new Error('Invalid lesson progress');
          const completed = new Set(progress.completedLessonIds);
          const visible = lessons.filter(lesson => supportsConversation(course) || lesson.category !== 'conversation')
            .sort((a, b) => (a.order || 0) - (b.order || 0) || a._id.localeCompare(b._id));
          return { course, lesson: visible.find(lesson => !completed.has(lesson._id)), started: visible.some(lesson => completed.has(lesson._id)) };
        }));
        if (controller.signal.aborted) return;
        const next = candidates.find(item => item.started && item.lesson) || candidates.find(item => item.lesson);
        if (next) {
          navigate(`${coursePath(next.course._id)}/lessons/${encodeURIComponent(next.lesson._id)}`, { replace: true });
        } else {
          setState({ available: available.length > 0, hasLessons: candidates.some(item => item.started) });
        }
      } catch {
        if (!controller.signal.aborted) setState({ error: true });
      }
    };
    void load();
    return () => controller.abort();
  }, [courseId, attempt, navigate]);

  return <main className="container" aria-labelledby="continue-learning-title">
    <h1 id="continue-learning-title">{state.loading ? 'Finding your next lesson…' : state.error ? 'Your next lesson couldn’t load' : state.hasLessons ? 'You’re all caught up!' : state.available ? 'Your lessons are coming soon' : 'Find your next course'}</h1>
    {state.loading ? <p role="status">Checking your course access and saved progress.</p> : state.error ? <><p role="alert">Please try again to resume from your saved progress.</p><button className="btn-primary" onClick={() => setAttempt(value => value + 1)}>Try again</button></> : <p>{state.hasLessons ? 'You’ve completed every available lesson in your active courses. Review a course or explore something new.' : state.available ? 'There are no available lessons in your active courses yet.' : 'Choose a course and request access to start learning.'}</p>}
    {!state.loading && <p><Link to="/my-courses">View my courses</Link> · <Link to="/#courses">Explore courses</Link></p>}
  </main>;
}
