function LanguageChoice({ onChoose }) {
  return (
    <section className="lang-choice">
      <div className="lang-choice-inner">
        <h1 className="lang-choice-title">
          Bhasha<span>Hub</span>
        </h1>
        <p className="lang-choice-sub">What would you like to learn?</p>

        <div className="lang-options">
          <button className="lang-option zh-option" onClick={() => onChoose('chinese')}>
            <span className="lang-glyph zh">你好</span>
            <span className="lang-label">Learn Chinese</span>
            <span className="lang-note">Pinyin, tones, and HSK 1 vocabulary</span>
          </button>

          <button className="lang-option ne-option" onClick={() => onChoose('nepali')}>
            <span className="lang-glyph ne">नमस्ते</span>
            <span className="lang-label">Learn Nepali</span>
            <span className="lang-note">Devanagari script and everyday phrases</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default LanguageChoice;