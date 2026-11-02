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
    <div className="container py-4">
      <style>{`
        /* Custom Bootstrap Enhancements for Hanzi Tracing */
        .hover-lift {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
        }

        .tracing-stage-box {
          position: relative;
          width: ${CANVAS_SIZE}px;
          height: ${CANVAS_SIZE}px;
          margin: 0 auto;
          border-radius: 20px;
          background: var(--card, #fffdf8);
          border: 2px solid var(--line, #e6dcc6);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .tracing-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .grid-line {
          position: absolute;
        }

        .grid-line-v { top: 0; bottom: 0; left: 50%; width: 1px; border-left: 1px dashed var(--line, #e6dcc6); }
        .grid-line-h { left: 0; right: 0; top: 50%; height: 1px; border-top: 1px dashed var(--line, #e6dcc6); }
        .grid-line-d1 { top: 0; left: 0; width: 141.4%; height: 1px; border-top: 1px dotted var(--line, #e6dcc6); transform-origin: 0 0; transform: rotate(45deg); }
        .grid-line-d2 { bottom: 0; left: 0; width: 141.4%; height: 1px; border-top: 1px dotted var(--line, #e6dcc6); transform-origin: 0 0; transform: rotate(-45deg); }

        .tracing-guide-glyph {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--line, #e6dcc6);
          opacity: 0.45;
          user-select: none;
          pointer-events: none;
          font-family: 'Noto Serif SC', serif;
        }

        .tracing-canvas {
          position: absolute;
          inset: 0;
          cursor: crosshair;
          touch-action: none;
        }

        .stroke-demo-canvas svg {
          width: 100%;
          height: 100%;
        }

        .stroke-demo-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          color: var(--mist, #7a7266);
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.9);
        }
      `}</style>

      {/* Top Header Controls Bar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <button
          className="btn btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm hover-lift"
          onClick={activeCharacter ? backToBrowse : onBack}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>{activeCharacter ? 'Back to Characters' : 'Back to Site'}</span>
        </button>

        {canManage && !activeCharacter && (
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative d-inline-block">
              <button
                type="button"
                className="btn btn-outline-primary rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
                disabled={csvUploading}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>{csvUploading ? 'Importing...' : 'Upload CSV'}</span>
              </button>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={csvUploading}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                onClick={(e) => { e.target.value = ''; }}
                onChange={(e) => handleCsvUpload(e.target.files[0])}
              />
            </div>
            <button
              className="btn btn-primary rounded-pill d-inline-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm hover-lift"
              onClick={handleOpenCreateModal}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Character</span>
            </button>
          </div>
        )}
      </div>

      {!activeCharacter ? (
        <>
          {/* Hero Section */}
          <div className="card border-0 rounded-4 shadow-sm mb-4 p-4 p-md-5 text-center text-md-start" style={{ background: 'var(--card, #ffffff)' }}>
            <div className="row align-items-center g-4">
              <div className="col-12 col-md-8">
                <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2 text-uppercase fw-bold letter-spacing-1 mb-2 d-inline-flex align-items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                  </svg>
                  Writing Practice
                </span>
                <h1 className="fw-extrabold display-5 mb-2" style={{ color: 'var(--ink, #2a2320)' }}>
                  Trace Chinese Characters
                </h1>
                <p className="lead text-secondary mb-0" style={{ fontSize: '1.05rem' }}>
                  Pick a character below and trace it stroke-by-stroke over a traditional rice grid guide.
                </p>
              </div>

              <div className="col-12 col-md-4 text-center text-md-end">
                <div className="d-inline-flex p-3 rounded-4 bg-light text-danger display-4 fw-bold zh border shadow-sm">
                  字
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="mt-4 pt-3 border-top">
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-5">
                  <div className="input-group input-group-lg rounded-pill shadow-sm overflow-hidden border">
                    <span className="input-group-text bg-white border-0 ps-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 fs-6 ps-2"
                      placeholder="Search character (你), pinyin (nǐ), or meaning..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button className="btn bg-white border-0 text-muted px-3" onClick={() => setSearchQuery('')}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-7 d-flex align-items-center">
                  <div className="d-flex gap-2 overflow-auto pb-1 w-100 scrollbar-none">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-2 text-nowrap fw-semibold transition-all ${
                          selectedCategory === cat
                            ? 'btn-danger shadow-sm'
                            : 'btn-outline-secondary bg-white'
                        }`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Cards Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
              <p className="text-secondary fw-semibold">Loading character catalog...</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="card border-0 rounded-4 shadow-sm text-center py-5 px-3">
              <div className="display-4 text-muted mb-3">✍️</div>
              <h4 className="fw-bold mb-1">No characters found</h4>
              <p className="text-secondary mb-0">Try clearing your search query or selecting another category filter.</p>
            </div>
          ) : (
            <div className="row g-3 g-md-4">
              {filteredCharacters.map((c) => (
                <div key={c._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div
                    className="card h-100 border-0 rounded-4 shadow-sm hover-lift cursor-pointer text-center p-3 transition-all bg-white"
                    onClick={() => selectCharacter(c)}
                  >
                    <div className="display-4 fw-bold zh text-dark my-1">{c.character}</div>
                    <div className="mt-auto">
                      <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1 small mb-1">
                        {c.category || 'General'}
                      </span>
                      {c.pinyin && <div className="fw-semibold text-danger small">{c.pinyin}</div>}
                      {c.meaning && <div className="text-muted small text-truncate">"{c.meaning}"</div>}
                    </div>

                    {canManage && (
                      <div className="d-flex justify-content-center gap-1 mt-3 pt-2 border-top" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleOpenEditModal(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-2 py-0"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleDeleteCharacter(c._id, c.character)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Tracing View Mode */
        <div>
          {/* Header Card */}
          <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 text-center bg-white">
            <div className="display-2 fw-bold zh text-danger mb-1">{activeCharacter.character}</div>
            <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
              {activeCharacter.pinyin && <span className="fs-5 fw-bold text-dark">{activeCharacter.pinyin}</span>}
              {activeCharacter.meaning && <span className="fs-6 text-muted">"{activeCharacter.meaning}"</span>}
              {activeCharacter.category && (
                <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1 ms-2">
                  {activeCharacter.category}
                </span>
              )}
            </div>
          </div>

          {/* Tracing Steps side-by-side grid */}
          <div className="row g-4 justify-content-center">
            {/* Step 1: Stroke Order Animation */}
            <div className="col-12 col-md-6 col-lg-5 text-center">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white">
                <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2 text-uppercase fw-bold mb-3 d-inline-block">
                  Step 1 · Watch stroke order
                </span>

                <div className="tracing-stage-box">
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
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                      onClick={handleReplayDemo}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                      Replay Demo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Practice Canvas */}
            <div className="col-12 col-md-6 col-lg-5 text-center">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white">
                <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2 text-uppercase fw-bold mb-3 d-inline-block">
                  Step 2 · Trace it yourself
                </span>

                <div className="tracing-stage-box">
                  <div className="tracing-grid">
                    <span className="grid-line grid-line-v" />
                    <span className="grid-line grid-line-h" />
                    <span className="grid-line grid-line-d1" />
                    <span className="grid-line grid-line-d2" />
                  </div>
                  <div className="tracing-guide-glyph zh" style={{ fontSize: 'clamp(140px, 40vw, 220px)' }}>
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

                <p className="small text-muted mt-3 mb-0">Use your mouse or finger to draw strokes over the guide lines.</p>
              </div>
            </div>
          </div>

          {/* Tracing Controls Toolbar */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 mt-4 p-3 bg-white rounded-pill shadow-sm border border-light mx-auto" style={{ maxWidth: '540px' }}>
            <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-2 fw-semibold" onClick={() => goToOffset(-1)}>
              ← Previous
            </button>
            <button type="button" className="btn btn-outline-primary rounded-pill px-3 py-2 fw-semibold" onClick={handleUndo} disabled={strokes.length === 0}>
              Undo
            </button>
            <button type="button" className="btn btn-outline-danger rounded-pill px-3 py-2 fw-semibold" onClick={handleClear} disabled={strokes.length === 0}>
              Clear
            </button>
            <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-2 fw-semibold" onClick={() => goToOffset(1)}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Admin Modal for Create/Edit */}
      {modalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{editingCharacter ? 'Edit Character' : 'Add Character'}</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>

              <form onSubmit={handleSaveCharacter}>
                <div className="modal-body py-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-uppercase">Character</label>
                      <input
                        type="text"
                        className="form-control form-control-lg zh"
                        placeholder="你"
                        value={formCharacter}
                        onChange={(e) => setFormCharacter(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-uppercase">Pinyin</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="nǐ"
                        value={formPinyin}
                        onChange={(e) => setFormPinyin(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-uppercase">Meaning (English)</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="you"
                        value={formMeaning}
                        onChange={(e) => setFormMeaning(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-uppercase">Category</label>
                      <select
                        className="form-select form-select-lg"
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
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" disabled={submitting}>
                    {submitting ? 'Saving...' : editingCharacter ? 'Save Changes' : 'Add Character'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HanziTracePage;
