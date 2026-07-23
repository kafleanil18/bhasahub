import { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

const API = window.API_BASE_URL + '/api';

const CATEGORIES = ['All', 'Basic Strokes', 'HSK 1', 'HSK 2', 'Radicals', 'Common Hanzi'];
const CANVAS_SIZE = 320;
const CSV_HEADER_WORDS = ['character', 'hanzi', 'char', 'word'];

// Parses CSV text into rows of fields, honoring quoted fields that may contain commas/newlines.
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);

  return rows;
}

function HanziTracePage({ user, onBack, token }) {
  const canManage = user && (user.role === 'admin' || user.role === 'superadmin');

  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCharacterId, setActiveCharacterId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [formCharacter, setFormCharacter] = useState('');
  const [formPinyin, setFormPinyin] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formCategory, setFormCategory] = useState('Basic Strokes');
  const [submitting, setSubmitting] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);

  const [strokes, setStrokes] = useState([]);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef([]);
  const inkColorRef = useRef('#2a2320');
  const sealColorRef = useRef('#c8362a');
  const lineColorRef = useRef('#e6dcc6');

  const [demoUnavailable, setDemoUnavailable] = useState(false);
  const demoContainerRef = useRef(null);
  const writerRef = useRef(null);

  useEffect(() => {
    fetchCharacters();
    const rootStyle = getComputedStyle(document.documentElement);
    inkColorRef.current = rootStyle.getPropertyValue('--ink').trim() || '#2a2320';
    sealColorRef.current = rootStyle.getPropertyValue('--seal').trim() || '#c8362a';
    lineColorRef.current = rootStyle.getPropertyValue('--line').trim() || '#e6dcc6';
  }, []);

  useEffect(() => {
    const character = characters.find((c) => c._id === activeCharacterId) || null;
    if (!character || !demoContainerRef.current) return;

    if (character.character.length !== 1) {
      setDemoUnavailable(true);
      return;
    }

    setDemoUnavailable(false);
    const container = demoContainerRef.current;
    container.innerHTML = '';

    const writer = HanziWriter.create(container, character.character, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      padding: 24,
      strokeColor: inkColorRef.current,
      radicalColor: sealColorRef.current,
      outlineColor: lineColorRef.current,
      showCharacter: false,
      onLoadCharDataError: () => setDemoUnavailable(true),
    });
    writerRef.current = writer;
    writer.animateCharacter();

    return () => {
      writerRef.current = null;
      container.innerHTML = '';
    };
  }, [activeCharacterId, characters]);

  const handleReplayDemo = () => {
    writerRef.current?.animateCharacter();
  };

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/hanzi-trace`);
      if (res.ok) setCharacters(await res.json());
    } catch (err) {
      console.error('Failed to load trace characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCharacters = characters.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.character.includes(q) ||
      (c.pinyin && c.pinyin.toLowerCase().includes(q)) ||
      (c.meaning && c.meaning.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const activeCharacter = characters.find((c) => c._id === activeCharacterId) || null;

  const selectCharacter = (c) => {
    setActiveCharacterId(c._id);
    setStrokes([]);
  };

  const backToBrowse = () => {
    setActiveCharacterId(null);
    setStrokes([]);
  };

  const goToOffset = (offset) => {
    const list = filteredCharacters;
    const idx = list.findIndex((c) => c._id === activeCharacterId);
    if (idx === -1 || list.length === 0) return;
    const nextIdx = (idx + offset + list.length) % list.length;
    setActiveCharacterId(list[nextIdx]._id);
    setStrokes([]);
  };

  // ---- Tracing canvas ----

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches && e.touches.length ? e.touches[0] : e;
    return {
      x: ((point.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((point.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    currentStrokeRef.current = [getPos(e, canvasRef.current)];
  };

  const moveDraw = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    const pts = currentStrokeRef.current;
    const prev = pts[pts.length - 1];
    pts.push(pos);

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = inkColorRef.current;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const finishedStroke = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (finishedStroke.length > 1) {
      setStrokes((prev) => [...prev, finishedStroke]);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = inkColorRef.current;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach((pts) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    });
  }, [strokes, activeCharacterId]);

  const handleUndo = () => setStrokes((prev) => prev.slice(0, -1));
  const handleClear = () => setStrokes([]);

  // ---- Admin CRUD ----

  const handleOpenCreateModal = () => {
    setEditingCharacter(null);
    setFormCharacter('');
    setFormPinyin('');
    setFormMeaning('');
    setFormCategory('Basic Strokes');
    setModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCharacter(c);
    setFormCharacter(c.character || '');
    setFormPinyin(c.pinyin || '');
    setFormMeaning(c.meaning || '');
    setFormCategory(c.category || 'Basic Strokes');
    setModalOpen(true);
  };

  const handleSaveCharacter = async (e) => {
    e.preventDefault();
    if (!formCharacter.trim()) {
      alert('Please enter a character to trace.');
      return;
    }

    setSubmitting(true);
    const payload = {
      character: formCharacter.trim(),
      pinyin: formPinyin.trim(),
      meaning: formMeaning.trim(),
      category: formCategory,
    };

    try {
      const url = editingCharacter ? `${API}/hanzi-trace/${editingCharacter._id}` : `${API}/hanzi-trace`;
      const method = editingCharacter ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchCharacters();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save character');
      }
    } catch (err) {
      console.error('Save character error:', err);
      alert('Could not save character');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCharacter = async (id, character) => {
    if (!confirm(`Are you sure you want to delete "${character}"?`)) return;

    try {
      const res = await fetch(`${API}/hanzi-trace/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (activeCharacterId === id) backToBrowse();
        fetchCharacters();
      } else {
        alert('Could not delete character');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not delete character');
    }
  };

  const handleCsvUpload = async (file) => {
    if (!file) return;

    let rows;
    try {
      rows = parseCsvRows(await file.text());
    } catch (err) {
      console.error('CSV parse error:', err);
      alert('Could not read the CSV file');
      return;
    }

    if (rows.length === 0) {
      alert('The CSV file appears to be empty.');
      return;
    }

    const firstCell = (rows[0][0] || '').trim().toLowerCase();
    const dataRows = CSV_HEADER_WORDS.includes(firstCell) ? rows.slice(1) : rows;

    const parsedCharacters = dataRows
      .map((r) => ({
        character: (r[0] || '').trim(),
        pinyin: (r[1] || '').trim(),
        meaning: (r[2] || '').trim(),
        category: (r[3] || '').trim() || 'Basic Strokes',
      }))
      .filter((c) => c.character);

    if (parsedCharacters.length === 0) {
      alert('No valid character rows found in the CSV file. Expected columns: character, pinyin, meaning, category.');
      return;
    }

    setCsvUploading(true);
    try {
      const res = await fetch(`${API}/hanzi-trace/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ characters: parsedCharacters }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Imported ${data.count} character${data.count === 1 ? '' : 's'} from CSV.`);
        fetchCharacters();
      } else {
        alert(data.error || 'CSV import failed');
      }
    } catch (err) {
      console.error('CSV import error:', err);
      alert('Could not import the CSV file');
    } finally {
      setCsvUploading(false);
    }
  };

  return (
    <div className="hanzi-clips-page container">
      <div className="hanzi-clips-nav-header">
        <button className="nav-btn" onClick={activeCharacter ? backToBrowse : onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {activeCharacter ? 'Back to characters' : 'Back to site'}
        </button>
        {canManage && !activeCharacter && (
          <div className="hanzi-header-actions">
            <div className="bm-file-input-wrapper">
              <button type="button" className="nav-btn" disabled={csvUploading}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {csvUploading ? 'Importing...' : 'Upload CSV'}
              </button>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={csvUploading}
                onClick={(e) => { e.target.value = ''; }}
                onChange={(e) => handleCsvUpload(e.target.files[0])}
              />
            </div>
            <button className="btn-primary" onClick={handleOpenCreateModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Character
            </button>
          </div>
        )}
      </div>

      {!activeCharacter ? (
        <>
          <div className="hanzi-clips-hero">
            <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
              WRITING PRACTICE
            </p>
            <h1 className="hanzi-hero-title">Trace Chinese Characters</h1>
            <p className="hanzi-hero-desc">
              Pick a characto ter below and trace it with your mouse or finger, right over a faint guide in a traditional practice grid.
            </p>

            <div className="hanzi-controls-bar">
              <div className="hanzi-search-box">
                <span className="search-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by character (你), pinyin (nǐ), or meaning (you)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hanzi-search-input"
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                    ✕
                  </button>
                )}
              </div>

              <div className="hanzi-categories-scroll">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="hanzi-loading-state">
              <span className="status-spinner"></span>
              <p style={{ marginTop: 8 }}>Loading characters...</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="hanzi-empty-state">
              <span className="empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </span>
              <h3>No characters found</h3>
              <p>Try clearing your search query or selecting a different category filter.</p>
            </div>
          ) : (
            <div className="trace-chars-grid">
              {filteredCharacters.map((c) => (
                <div className="trace-char-card" key={c._id} onClick={() => selectCharacter(c)}>
                  <div className="trace-char-card-top">
                    <div className="hanzi-char-badge zh">{c.character}</div>
                    <div className="trace-char-meta">
                      <span className="hanzi-category-pill">{c.category || 'General'}</span>
                      {c.pinyin && <span className="hanzi-pinyin">{c.pinyin}</span>}
                      {c.meaning && <span className="hanzi-meaning">"{c.meaning}"</span>}
                    </div>
                  </div>
                  {canManage && (
                    <div className="hanzi-admin-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="nav-btn" onClick={() => handleOpenEditModal(c)}>Edit</button>
                      <button className="nav-btn bm-remove-img-btn" onClick={() => handleDeleteCharacter(c._id, c.character)}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="trace-view">
          <div className="trace-view-header">
            <div className="hanzi-char-badge zh">{activeCharacter.character}</div>
            <div>
              {activeCharacter.pinyin && <span className="hanzi-pinyin">{activeCharacter.pinyin}</span>}
              {activeCharacter.meaning && <span className="hanzi-meaning">"{activeCharacter.meaning}"</span>}
            </div>
          </div>

          <span className="trace-step-label">Step 1 · Watch the stroke order</span>
          <div className="stroke-demo-panel" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
            <div className="tracing-grid">
              <span className="grid-line grid-line-v" />
              <span className="grid-line grid-line-h" />
              <span className="grid-line grid-line-d1" />
              <span className="grid-line grid-line-d2" />
            </div>
            <div ref={demoContainerRef} className="stroke-demo-canvas" />
            {demoUnavailable && (
              <div className="stroke-demo-fallback">
                Stroke order demo isn't available for this character.
              </div>
            )}
          </div>
          {!demoUnavailable && (
            <button className="nav-btn" onClick={handleReplayDemo}>↻ Replay</button>
          )}

          <span className="trace-step-label">Step 2 · Trace it yourself</span>
          <div className="tracing-stage" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
            <div className="tracing-grid">
              <span className="grid-line grid-line-v" />
              <span className="grid-line grid-line-h" />
              <span className="grid-line grid-line-d1" />
              <span className="grid-line grid-line-d2" />
            </div>
            <div className="tracing-guide-glyph zh" style={{ fontSize: 'clamp(120px, 60vw, 220px)' }}>
              {activeCharacter.character}
            </div>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="tracing-canvas"
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
          </div>

          <div className="trace-controls">
            <button className="nav-btn" onClick={() => goToOffset(-1)}>← Previous</button>
            <button className="nav-btn" onClick={handleUndo} disabled={strokes.length === 0}>Undo</button>
            <button className="nav-btn" onClick={handleClear} disabled={strokes.length === 0}>Clear</button>
            <button className="nav-btn" onClick={() => goToOffset(1)}>Next →</button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="hanzi-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hanzi-modal-header">
              <h2>{editingCharacter ? 'Edit Character' : 'Add Character'}</h2>
              <button className="hanzi-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCharacter} className="hanzi-modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="bm-label">Character (e.g. 你, 好, 水)</label>
                  <input
                    type="text"
                    className="bm-input zh"
                    placeholder="你"
                    value={formCharacter}
                    onChange={(e) => setFormCharacter(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="bm-label">Pinyin (e.g. nǐ)</label>
                  <input
                    type="text"
                    className="bm-input"
                    placeholder="nǐ"
                    value={formPinyin}
                    onChange={(e) => setFormPinyin(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="bm-label">Meaning (English)</label>
                  <input
                    type="text"
                    className="bm-input"
                    placeholder="you"
                    value={formMeaning}
                    onChange={(e) => setFormMeaning(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="bm-label">Category</label>
                  <select
                    className="bm-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Basic Strokes">Basic Strokes</option>
                    <option value="HSK 1">HSK 1</option>
                    <option value="HSK 2">HSK 2</option>
                    <option value="Radicals">Radicals</option>
                    <option value="Common Hanzi">Common Hanzi</option>
                  </select>
                </div>
              </div>

              <div className="bm-actions">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCharacter ? 'Save Changes' : 'Add Character'}
                </button>
                <button type="button" className="nav-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HanziTracePage;
