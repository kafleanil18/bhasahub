import { mediaUrl } from '../utils/mediaUrl';

export default function HomeTestimonials({ scrollTestimonials, setShowTestimonial, testimonials, testimonialsScrollRef, user }) {
  return (
    <section className="worlds">
            <div className="container">
              <div className="section-header-center">
                <h2 className="student-review-title">STUDENT REVIEW</h2>
              </div>
              {testimonials.length === 0 ? (
                <p className="courses-empty">Be the first to share your experience!</p>
              ) : (
                <div className="testimonials-slider">
                  {testimonials.length > 1 && (
                    <button
                      type="button"
                      className="testimonials-arrow testimonials-arrow-left"
                      onClick={() => scrollTestimonials(-1)}
                      aria-label="Scroll testimonials left"
                    >
                      ‹
                    </button>
                  )}
                  <div className="testimonials-grid" ref={testimonialsScrollRef}>
                    {testimonials.map((t) => (
                      <div className="testimonial-card" key={t._id}>
                        <span className="testimonial-stars">{'★'.repeat(t.rating)}</span>
                        <p className="testimonial-text">"{t.text}"</p>
                        <div className="testimonial-person">
                          {t.photo ? (
                            <img className="testimonial-photo" src={mediaUrl(t.photo)} alt={t.name} />
                          ) : (
                            <span className="testimonial-photo-placeholder">{t.name.charAt(0)}</span>
                          )}
                          <span className="testimonial-name">{t.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {testimonials.length > 1 && (
                    <button
                      type="button"
                      className="testimonials-arrow testimonials-arrow-right"
                      onClick={() => scrollTestimonials(1)}
                      aria-label="Scroll testimonials right"
                    >
                      ›
                    </button>
                  )}
                </div>
              )}
              {user && (
                <div className="testimonials-cta">
                  <button className="btn-primary" onClick={() => setShowTestimonial(true)}>
                    Share your experience
                  </button>
                </div>
              )}
            </div>
          </section>
  );
}
