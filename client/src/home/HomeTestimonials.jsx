import { mediaUrl } from '../utils/mediaUrl';

export default function HomeTestimonials({ openLogin, scrollTestimonials, setShowTestimonial, testimonials, testimonialsScrollRef, user }) {
  const shareReview = () => (user ? setShowTestimonial(true) : openLogin());

  return (
    <section className="worlds">
            <div className="container">
              <div className="section-header-center">
                <p className="home-section-kicker">Student reviews</p>
                <h2 className="section-title">What learners are saying</h2>
              </div>
              {testimonials.length === 0 ? (
                <div className="testimonials-empty">
                  <span className="testimonials-empty-mark" aria-hidden="true">“</span>
                  <div className="testimonials-empty-copy">
                    <h3>No reviews yet</h3>
                    <p>Learning with Xiao Ao? A few words about your experience helps new learners decide where to start.</p>
                  </div>
                  <button type="button" className="btn-primary" onClick={shareReview}>
                    {user ? 'Write the first review' : 'Sign in to write a review'}
                  </button>
                </div>
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
              {user && testimonials.length > 0 && (
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
