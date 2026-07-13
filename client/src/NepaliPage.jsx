function NepaliPage({ onBack }) {
  return (
    <section className="nepali-page container">
      <button className="back-btn" onClick={onBack}>← Choose a different language</button>
      <div className="nepali-hero">
        <span className="nepali-glyph ne">नमस्ते</span>
        <h1 className="section-title">Learn Nepali</h1>
        <p className="course-desc">
          Master the Devanagari script and essential phrases for daily life,
          travel, and connecting with people across Nepal.
        </p>
        <p className="nepali-soon">🚧 This course is coming soon — we're preparing the lessons!</p>
        <p className="nepali-sub">In the meantime, you can explore our Chinese course or check out our other languages.</p>
      </div>
    </section>
  );
}

export default NepaliPage;