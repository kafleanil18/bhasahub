import React from 'react';

function PinyinPage({ onBack }) {
  const videoId = 'Hcm2udBvB2M';

  return (
    <section className="pinyin-page-container">
      <div className="container">
        
        {/* Back Button */}
        <div className="pinyin-page-back">
          <button className="back-btn" onClick={onBack}>← Back to home</button>
        </div>

        {/* Header Details */}
        <div className="pinyin-page-header">
          <h1 className="pinyin-title">Pinyin — 拼音</h1>
          <p className="pinyin-sub">The absolute foundation of Chinese pronunciation</p>
        </div>

        {/* Video Monitor Frame */}
        <div className="pinyin-page-content">
          <div className="monitor" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="monitor-bezel">
              <div className="monitor-camera">
                <span className="cam-dot"></span>
                <span className="cam-dot"></span>
                <span className="cam-dot green"></span>
              </div>
              <div className="monitor-screen">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Pinyin lesson"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <div className="monitor-base-neck"></div>
            <div className="monitor-base">
              <span className="monitor-label">HSK COURSE</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default PinyinPage;
