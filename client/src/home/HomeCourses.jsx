import { mediaUrl } from '../utils/mediaUrl';

export default function HomeCourses({ filteredCourses, hskLevels, levelFilter, openLogin, setActiveCourse, setLevelFilter, user }) {
  return (
    <section className="courses-section" id="courses">
            <div className="container">
              <div className="section-header-center">
                <span className="section-kicker">Your next chapter</span>
                <h2 className="section-title">A clear path. One lesson at a time.</h2>
                <p className="section-sublead">Start with the foundations or build on what you know. Choose your HSK level below.</p>
              </div>

              <div className="level-pills">
                {hskLevels.map((lvl) => (
                  <button
                    key={lvl}
                    className={`level-pill ${levelFilter === lvl ? 'active' : ''}`}
                    aria-pressed={levelFilter === lvl}
                    onClick={() => setLevelFilter(lvl)}
                  >
                    {lvl === 'all' ? 'All Courses' : lvl}
                  </button>
                ))}
              </div>

              {filteredCourses.length === 0 ? (
                <p className="courses-empty">No courses in this level yet.</p>
              ) : (
                <div className="course-cards">
                  {filteredCourses.map((c) => {
                    return (
                      <div
                        className="course-card"
                        key={c._id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${c.title}, view course`}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}
                        onClick={() => {
                          if (!user) { openLogin(); return; }
                          setActiveCourse(c);
                        }}
                      >
                        {c.image ? (
                          <img className="course-card-img" src={mediaUrl(c.image)} alt={c.title} />
                        ) : (
                          <div className="course-card-glyph">
                            <span className={c.language === 'chinese' ? 'zh' : 'ne'}>
                              {c.glyph && c.glyph.trim().length > 0 && c.glyph.trim().length <= 2
                                ? c.glyph
                                : (c.language === 'chinese' ? '中' : 'ने')}
                            </span>
                          </div>
                        )}
                        <div className="course-card-body">
                          <span className="course-card-eyebrow">{c.level} · Guided learning</span>
                          <h3 className="course-card-title">{c.title}</h3>
                          <p className="course-card-desc">{c.description}</p>
                          <span className="tag">{c.level}</span>
                          <span className="course-card-link">View course <span aria-hidden="true">↗</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
  );
}
