import { useState, useEffect, useCallback } from 'react';
import CourseOverview from './CourseOverview';
import LessonDetail from './LessonDetail';
import { useLessons } from './hooks/useLessons';
import { useCourseAccess } from './hooks/useCourseAccess';

const API = window.API_BASE_URL + '/api';

function CoursePage({ course, onBack, user }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const token = localStorage.getItem('token');

  const { lessons, loading, error: lessonsError } = useLessons(course._id);
  const { hasAccess, accessExpiry, accessChecked, error: accessError } = useCourseAccess(course._id, token);

  const [completedIds, setCompletedIds] = useState([]);
  const [progressError, setProgressError] = useState(null);
  const [completeError, setCompleteError] = useState(null);
  const [showAccessMsg, setShowAccessMsg] = useState(false);

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  const loadProgress = useCallback(() => {
    if (!token) return;
    setProgressError(null);
    fetch(`${API}/progress/course/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCompletedIds(data.completedLessonIds || []))
      .catch(() => setProgressError('Could not load your progress.'));
  }, [course._id, token]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const toggleComplete = async (lessonId) => {
    if (!token) return;
    const isDone = completedIds.includes(lessonId);
    setCompleteError(null);
    try {
      const res = await fetch(`${API}/progress/lesson/${lessonId}`, {
        method: isDone ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCompletedIds((prev) =>
          isDone ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
        );
      } else {
        setCompleteError('Could not update lesson progress.');
      }
    } catch {
      setCompleteError('Could not update lesson progress.');
    }
  };

  // gate: admins always allowed; students need active access
  const canOpenLessons = isAdmin || hasAccess;

  const activeIndex = lessons.findIndex((l) => l._id === (activeLesson ? activeLesson._id : ''));
  const nextLesson = activeIndex !== -1 && activeIndex + 1 < lessons.length ? lessons[activeIndex + 1] : null;

  const handleLessonClick = (lesson) => {
    if (canOpenLessons) {
      setActiveLesson(lesson);
    } else {
      setShowAccessMsg(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (activeLesson) {
    return (
      <LessonDetail
        key={activeLesson._id}
        course={course}
        lesson={activeLesson}
        nextLesson={nextLesson}
        user={user}
        token={token}
        isCompleted={completedIds.includes(activeLesson._id)}
        completeError={completeError}
        onBack={() => setActiveLesson(null)}
        onToggleComplete={() => toggleComplete(activeLesson._id)}
        onNextLesson={nextLesson ? () => handleLessonClick(nextLesson) : undefined}
      />
    );
  }

  return (
    <CourseOverview
      course={course}
      user={user}
      token={token}
      isAdmin={isAdmin}
      lessons={lessons}
      loading={loading}
      lessonsError={lessonsError}
      completedIds={completedIds}
      progressError={progressError}
      hasAccess={hasAccess}
      accessExpiry={accessExpiry}
      accessChecked={accessChecked}
      accessError={accessError}
      canOpenLessons={canOpenLessons}
      showAccessMsg={showAccessMsg}
      onDismissAccessMsg={() => setShowAccessMsg(false)}
      onBack={onBack}
      onLessonClick={handleLessonClick}
    />
  );
}

export default CoursePage;
