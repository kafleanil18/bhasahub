import { mediaUrl } from '../utils/mediaUrl';

// At most three reviews, side by side. With none yet, only signed-in learners see the section, to write the first one.
export default function HomeTestimonials({ loaded = true, setShowTestimonial, testimonials, user }) {
  if (loaded && !testimonials.length && !user) return null;

  return (
    <section className="worlds">
            <div className="container">
              <div className="section-header-center">
                <p className="home-section-kicker">Student reviews</p>
                <h2 className="section-title">What learners are saying</h2>
              </div>
              {!loaded ? (
                <div className="testimonials-placeholder" aria-hidden="true" />
              ) : testimonials.length === 0 ? (
                <div className="testimonials-empty">
                  <span className="testimonials-empty-mark" aria-hidden="true">“</span>
                  <div className="testimonials-empty-copy">
                    <h3>No reviews yet</h3>
                    <p>Learning with Xiao Ao? A few words about your experience helps new learners decide where to start.</p>
                  </div>
                  <button type="button" className="btn-primary" onClick={() => setShowTestimonial(true)}>
                    Write the first review
                  </button>
                </div>
              ) : (
                  <div className="testimonials-grid">
                    {testimonials.slice(0, 3).map((t) => (
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
