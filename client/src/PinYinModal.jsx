function PinyinModal({ onClose }) {
  const videoId = 'Hcm2udBvB2M';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pinyin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="pinyin-title">Pinyin — 拼音</h2>
        <p className="pinyin-sub">The foundation of Chinese pronunciation</p>

        <div className="monitor">
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
  );
}

export default PinyinModal;
