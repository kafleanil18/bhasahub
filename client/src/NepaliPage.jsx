function NepaliPage({ onBack }) {
  return (
    <section className="nepali-page container">
      <button className="back-btn" onClick={onBack}>← Back to Chinese Courses</button>
      <div className="nepali-hero">
        <span className="nepali-glyph ne">नमस्ते</span>
        <h1 className="section-title">Learn Nepali (नेपाली)</h1>
        <p className="course-desc">
          Master the Devanagari script, everyday greetings, and essential spoken phrases for daily life, travel, and cultural connection across Nepal.
        </p>

        <div className="nepali-status-box">
          <div className="nepali-status-badge">
            <span className="live-pulse" aria-hidden="true"></span>
            <span>Curriculum Under Preparation</span>
          </div>
          <p className="nepali-status-text">
            Our native instructors are currently crafting structured video lessons, Devanagari stroke guides, and high-fidelity native audio.
          </p>
          <div className="nepali-actions">
            <button className="btn-primary" onClick={onBack}>
              Explore Chinese Lessons Instead ➔
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NepaliPage;