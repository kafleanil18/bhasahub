import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';

function Dashboard({ user, onOpenCourse, onBrowse }) {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({}); // { courseId: { total, completed } }
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API}/enrollments/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        const entries = await Promise.all(
          list.map(async (c) => {
            try {
              const r = await fetch(`${API}/progress/course/${c._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const p = await r.json();
              return [c._id, p];
            } catch {
              return [c._id, { total: 0, completed: 0 }];
            }
          })
        );
        setProgress(Object.fromEntries(entries));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <section className="course-page container">
      <p className="eyebrow">My learning</p>
      <h1 className="section-title">Welcome back, {user.name}</h1>

      {loading && <p className="courses-empty">Loading your courses...</p>}

      {!loading && courses.length === 0 && (
        <div className="dash-empty">
          <p>You haven't enrolled in any courses yet.</p>
          <button className="btn-primary" onClick={onBrowse}>Browse courses</button>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="courses">
          {courses.map((c) => {
            const p = progress[c._id] || { total: 0, completed: 0 };
            const percent = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            return (
              <div className="card" key={c._id} onClick={() => onOpenCourse(c)}>
                <span className={`glyph ${c.language === 'chinese' ? 'zh' : 'ne'}`}>
                  {c.glyph && c.glyph.trim().length > 0 && c.glyph.trim().length <= 2 
                    ? c.glyph 
                    : (c.language === 'chinese' ? '中' : 'ने')}
                </span>
                <h2>{c.title}</h2>
                <p>{c.description}</p>
                <div className="progress-wrap">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="progress-label">
                    {p.completed} of {p.total} lessons · {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Dashboard;