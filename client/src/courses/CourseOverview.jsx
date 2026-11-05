import { supportsConversation } from '../utils/courseFeatures';
import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import LessonCategoryIcon from './LessonCategoryIcon';
import './CourseOverview.css';

const API = window.API_BASE_URL + '/api';

function CourseOverview({
  course,
  user,
  token,
  isAdmin,
  lessons,
  loading,
  lessonsError,
  completedIds,
  progressError,
  hasAccess,
  accessExpiry,
  accessChecked,
  accessError,
  canOpenLessons,
  showAccessMsg,
  onDismissAccessMsg,
  onBack,
  onLessonClick,
}) {
  const [catFilter, setCatFilter] = useState('all');
  const [lessonSearch, setLessonSearch] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const mutationRef = useRef(false);

  const [enrolled, setEnrolled] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null); // null | 'pending' | 'denied'
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessRequestError, setAccessRequestError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/enrollments/status/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setEnrolled(data.enrolled))
      .catch(() => setEnrollError('Could not load your enrollment status.'));
  }, [course._id, token]);

  const loadRequestStatus = useCallback(() => {
    if (!token) return;
    fetch(`${API}/access-requests/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        const mine = (Array.isArray(data) ? data : []).filter(r => r.course && r.course._id === course._id);
        const pending = mine.find(r => r.status === 'pending');
        if (pending) { setRequestStatus('pending'); return; }
        const latest = mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setRequestStatus(latest && latest.status === 'denied' ? 'denied' : null);
      })
      .catch(() => setAccessRequestError('Could not load your access request status.'));
  }, [course._id, token]);

  useEffect(() => {
    loadRequestStatus();
    if (!token || hasAccess) return;
    const interval = window.setInterval(loadRequestStatus, 15000);
    window.addEventListener('focus', loadRequestStatus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', loadRequestStatus);
    };
  }, [loadRequestStatus, token, hasAccess]);

  const requestAccess = async () => {
    if (!token || mutationRef.current || requestStatus === 'pending') return;
    mutationRef.current = true;
    setRequestingAccess(true);
    setAccessRequestError(null);
    try {
      const res = await fetch(`${API}/access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: course._id }),
      });
      if (res.ok) {
        setRequestStatus('pending');
      } else {
        const data = await res.json();
        setAccessRequestError(data.error || 'Could not send your subscription request.');
      }
    } catch {
      setAccessRequestError('Could not send your access request.');
    } finally {
      setRequestingAccess(false);
      mutationRef.current = false;
    }
  };

  const toggleEnroll = async () => {
    if (!token || mutationRef.current) return;
    mutationRef.current = true;
    setEnrolling(true);
    setEnrollError(null);
    try {
      const res = await fetch(`${API}/enrollments/${course._id}`, {
        method: enrolled ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEnrolled(!enrolled);
      } else {
        setEnrollError('Could not update your enrollment.');
      }
    } catch {
      setEnrollError('Could not update your enrollment.');
    } finally { setEnrolling(false); mutationRef.current = false; }
  };

  const courseLessons = lessons.filter(lesson => supportsConversation(course) || lesson.category !== 'conversation');
  const lessonQuery = lessonSearch.trim().toLocaleLowerCase();
  const visibleLessons = courseLessons.filter(lesson => (catFilter === 'all' || (lesson.category || 'vocabulary') === catFilter) && (!lessonQuery || `${lesson.title} ${lesson.order || ''}`.toLocaleLowerCase().includes(lessonQuery)));
  const currentCourseCompleted = courseLessons.filter(lesson => completedIds.includes(lesson._id)).length;
  const progressPercent = courseLessons.length ? Math.round(currentCourseCompleted / courseLessons.length * 100) : 0;
  const progressReady = !loading && !progressError && !lessonsError;
  const nextLesson = courseLessons.find(lesson => !completedIds.includes(lesson._id)) || courseLessons[0];
  const courseComplete = courseLessons.length > 0 && currentCourseCompleted === courseLessons.length;
  const categories = [{ id: 'all', label: 'All lessons' }, { id: 'vocabulary', label: 'Vocabulary' }, ...(supportsConversation(course) ? [{ id: 'conversation', label: 'Conversation' }] : []), { id: 'grammar', label: 'Grammar' }];
  const readableExpiry = accessExpiry ? new Date(accessExpiry).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return <section className="container course-page course-overview" aria-labelledby="course-overview-title">
    <button className="back-btn" onClick={onBack}>← Back to courses</button>
    <div className="overview-hero">
      <div className="overview-hero-copy"><p className="overview-eyebrow">Your learning path{course.level ? ` · ${course.level}` : ''}</p><h1 id="course-overview-title">{course.title}</h1><p className="overview-description">{course.description}</p><div className="overview-course-tags">{course.level && <span>{course.level}</span>}<span>{loading ? 'Preparing lessons…' : lessonsError ? 'Lesson count unavailable' : `${courseLessons.length} lessons`}</span><span>Learn at your own pace</span></div><div className="overview-hero-actions">{canOpenLessons && nextLesson && !loading && !lessonsError && <button className="overview-button is-primary" onClick={() => onLessonClick(nextLesson)}>{isAdmin ? 'Preview a lesson' : courseComplete ? 'Review course' : currentCourseCompleted ? 'Continue learning' : 'Start first lesson'}<span aria-hidden="true">↗</span></button>}<a className="overview-text-link" href="#course-lesson-library">{canOpenLessons ? 'Browse lessons' : 'Explore the syllabus'}<span aria-hidden="true">↓</span></a></div></div>
      <aside className="overview-course-card" aria-label={isAdmin ? 'Course at a glance' : 'Your course progress'}><div className="overview-course-art"><img src={course.image ? mediaUrl(course.image) : '/images/chinese-ink-landscape.jpg'} width="1200" height="800" alt="" decoding="async"/><span>One lesson. One step forward.</span></div><div className="overview-progress"><p className="overview-eyebrow">{isAdmin ? 'Course at a glance' : 'Your course progress'}</p>{isAdmin ? <><strong>{loading ? 'Preparing lessons…' : lessonsError ? 'Lessons unavailable' : `${courseLessons.length} lessons to explore`}</strong><p>Preview the learning experience before sharing it with students.</p></> : progressReady ? <><div className="overview-progress-numbers"><strong>{progressPercent}%</strong><span>{currentCourseCompleted} of {courseLessons.length} lessons completed</span></div><progress value={currentCourseCompleted} max={courseLessons.length || 1} aria-label="Course completion"/><p>{courseComplete ? 'You’ve completed every lesson. Come back whenever you want to review.' : currentCourseCompleted ? 'Keep going. Your next lesson is ready when you are.' : 'Your progress will appear here as you complete lessons.'}</p></> : <p role="status">{progressError || lessonsError || 'Loading your progress…'}</p>}</div></aside>
    </div>

    {user && !isAdmin && <div className={`overview-access ${accessError ? 'is-error' : hasAccess ? 'is-active' : 'is-pending'}`} role={accessError ? 'alert' : 'status'}><div><strong>{!accessChecked ? 'Checking your course access…' : accessError ? 'We couldn’t check your access' : hasAccess ? 'Your course access is active' : requestStatus === 'pending' ? 'Your access request is under review' : requestStatus === 'denied' ? 'Your previous request was declined' : 'Ready to start this course?'}</strong><p>{!accessChecked ? 'Your lesson access will update shortly.' : accessError ? accessError : hasAccess ? readableExpiry ? `You can open lessons until ${readableExpiry}.` : 'Choose a lesson below to begin.' : requestStatus === 'pending' ? 'An admin will review your request. This page checks for updates automatically.' : requestStatus === 'denied' ? 'You can send a new request when you’re ready.' : 'Browse the syllabus below, then request course access to unlock the lessons.'}</p></div>{accessChecked && !hasAccess && !accessError && requestStatus !== 'pending' && <button className="overview-button is-primary" disabled={requestingAccess} onClick={requestAccess}>{requestingAccess ? 'Sending request…' : requestStatus === 'denied' ? 'Request access again' : 'Request course access'}</button>}{accessError && <button className="overview-button" onClick={() => window.location.reload()}>Refresh page</button>}{accessRequestError && <p className="overview-feedback is-error" role="alert">{accessRequestError}</p>}</div>}
    {user && canOpenLessons && <div className="overview-enrollment"><div><strong>{enrolled ? 'Saved to your learning dashboard' : 'Keep this course in your learning dashboard'}</strong><p>{enrolled ? 'Find this course in My learning whenever you return.' : 'Add it to My learning so it’s easy to find next time.'}</p></div><button className="overview-button" disabled={enrolling} onClick={toggleEnroll}>{enrolling ? 'Updating…' : enrolled ? 'Remove from My learning' : 'Add to My learning'}</button>{enrollError && <p className="overview-feedback is-error" role="alert">{enrollError}</p>}</div>}
    {showAccessMsg && !canOpenLessons && <div className="overview-feedback" role="alert"><p>This lesson needs active course access. Use <strong>Request course access</strong> above to ask an admin to unlock it.</p><button className="overview-button" onClick={onDismissAccessMsg}>Got it</button></div>}

    <section className="overview-lesson-library" id="course-lesson-library" aria-labelledby="course-lessons-title"><div className="overview-library-heading"><div><p className="overview-eyebrow">Your course syllabus</p><h2 id="course-lessons-title">What will you learn today?</h2><p>{isAdmin ? 'Explore each lesson just as your students will see it.' : 'Build your knowledge one lesson at a time.'}</p></div>{!loading && !lessonsError && <span className="overview-lesson-count">{visibleLessons.length} of {courseLessons.length} lessons</span>}</div><div className="overview-lesson-filters"><div className="overview-category-tabs" aria-label="Lesson categories">{categories.map(category => <button key={category.id} aria-pressed={catFilter === category.id} onClick={() => setCatFilter(category.id)}>{category.label}</button>)}</div><label><span className="overview-visually-hidden">Search lessons</span><input type="search" placeholder="Find a lesson…" value={lessonSearch} onChange={event => setLessonSearch(event.target.value)}/></label></div>
      {loading ? <p className="overview-empty" role="status">Preparing your lessons…</p> : lessonsError ? <p className="overview-feedback is-error" role="alert">{lessonsError}</p> : !visibleLessons.length ? <div className="overview-empty"><h3>No lessons match this view</h3><p>Try another category or search term.</p><button className="overview-button" onClick={() => { setCatFilter('all'); setLessonSearch(''); }}>View all lessons</button></div> : <div className="overview-lesson-grid">{visibleLessons.map((lesson, index) => {
        const done = completedIds.includes(lesson._id);
        const category = lesson.category || 'vocabulary';
        return <button key={lesson._id} className={`overview-lesson-card category-${category} ${done ? 'is-complete' : ''}`} onClick={() => onLessonClick(lesson)} aria-label={`${lesson.title}, ${!canOpenLessons ? 'access required' : done ? 'completed, review lesson' : 'start lesson'}`}><span className="overview-lesson-top"><span className="overview-lesson-symbol"><LessonCategoryIcon category={category}/></span><span className="overview-lesson-order">{String(lesson.order ?? index + 1).padStart(2, '0')}</span></span><span className="overview-lesson-category">{category}</span><h3>{lesson.title}</h3><span className="overview-lesson-action"><span>{!canOpenLessons ? 'Access required' : done ? 'Review lesson' : 'Start lesson'}</span><span aria-hidden="true">{!canOpenLessons ? '↗' : done ? '✓' : '→'}</span></span></button>;
      })}</div>}
    </section>
  </section>;
}

export default CourseOverview;
