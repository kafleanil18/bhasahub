import { mediaUrl } from '../utils/mediaUrl';

export default function HomeCourses({ loaded = true, filteredCourses, hskLevels, levelFilter, onOpenCourse, setLevelFilter }) {
  return (
    <section className="courses-section" id="courses" aria-labelledby="courses-heading">
            <div className="container">
              <div className="section-header-center">
                <p className="home-section-kicker">HSK courses</p>
                <h2 className="section-title" id="courses-heading">Start with a guided course</h2>
              </div>
              {hskLevels.length > 2 && (
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
              )}

              {!loaded ? (
                <div className="course-cards course-cards--placeholder" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="course-card course-card-placeholder" />)}</div>
              ) : filteredCourses.length === 0 ? (
                <p className="courses-empty">No courses in this level yet.</p>
              ) : (
                <div className={`course-cards${filteredCourses.length === 1 ? ' course-cards--single' : ''}`}>
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
                          onOpenCourse(c);
                        }}
                      >
                        {c.image ? (
                          <img className="course-card-img" src={mediaUrl(c.image)} alt={c.title} />
                        ) : (
                          <div className="course-card-glyph">
                            <span className={c.language === 'chinese' ? 'zh' : 'en'}>
                              {c.glyph && c.glyph.trim().length > 0 && c.glyph.trim().length <= 2
                                ? c.glyph
                                : (c.language === 'chinese' ? '中' : 'EN')}
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
