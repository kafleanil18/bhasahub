import { recordStudioActivity } from './recordStudioActivity';
import { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import Icon from '../components/Icon';
import { useInitialLoad } from '../navigation/pageLoad';

const API = window.API_BASE_URL + '/api';

const CATEGORIES = ['All', 'Basic Strokes', 'HSK 1', 'HSK 2', 'Radicals', 'Common Hanzi'];
const CANVAS_SIZE = 320;
const STAGE_MAX = 400;
const STAGE_PADDING = 0.075;
const EMPTY_QUIZ = { stroke: 0, total: 0, mistakes: 0, done: false, hint: false, wrong: false };
const MODES = [
  ['watch', 'Watch'],
  ['trace', 'Trace'],
  ['memory', 'From memory'],
];

// hanzi-writer only understands hex colours, but theme variables can be any CSS colour (e.g. color-mix),
// so each one is resolved by the browser and read back as hex.
function toHex(value, fallback) {
  try {
    const probe = document.createElement('span');
    probe.style.color = fallback;
    probe.style.color = value;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = fallback;
    ctx.fillStyle = resolved;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return fallback;
  }
}

function themeColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => toHex(style.getPropertyValue(name).trim() || fallback, fallback);
  const dark = document.documentElement.classList.contains('dark');
  return {
    dark,
    ink: dark ? '#ffffff' : read('--ink', '#2a2320'),
    seal: read('--seal', '#a92316'),
    line: read('--line', '#e6dcc6'),
    success: read('--answer-success', '#28734e'),
  };
}
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
  const practicedCharactersRef = useRef(new Set());
  const canManage = user && (user.role === 'admin' || user.role === 'superadmin');

  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  useInitialLoad(loading, 'Loading the character catalogue…');
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

  // Practice modes share one stage: watch the animation, trace over the outline, or write from memory.
  const [mode, setMode] = useState('watch');
  const [attempt, setAttempt] = useState(0);
  const [quiz, setQuiz] = useState(EMPTY_QUIZ);
  const [demoUnavailable, setDemoUnavailable] = useState(false);
  const [themeKey, setThemeKey] = useState(0);
  const [stageSize, setStageSize] = useState(0);
  const stageSizeRef = useRef(0);
  const stageRef = useRef(null);
  const writerHostRef = useRef(null);
  const writerRef = useRef(null);

  useEffect(() => {
    fetchCharacters();
    // Re-read the ink colours when the light/dark theme changes.
    const observer = new MutationObserver(() => setThemeKey((k) => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeCharacter = characters.find((c) => c._id === activeCharacterId) || null;
  const activeGlyph = activeCharacter?.character || '';

  // The writer maps pointer positions in screen pixels, so it is sized to the stage rather than scaled by CSS.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const size = Math.round(Math.min(stage.clientWidth, STAGE_MAX));
      if (!size || size === stageSizeRef.current) return;
      stageSizeRef.current = size;
      setStageSize(size);
      writerRef.current?.updateDimensions({ width: size, height: size, padding: Math.round(size * STAGE_PADDING) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [activeCharacterId]);

  const markPracticed = (character) => {
    if (!character || practicedCharactersRef.current.has(character)) return;
    practicedCharactersRef.current.add(character);
    recordStudioActivity('trace', null, character);
  };

  const stageReady = stageSize > 0;
  useEffect(() => {
    const container = writerHostRef.current;
    if (!activeGlyph || !stageReady || !container) return;
    if ([...activeGlyph].length !== 1) {
      setDemoUnavailable(true);
      return;
    }
    setDemoUnavailable(false);
    setQuiz(EMPTY_QUIZ);
    container.innerHTML = '';

    const colors = themeColors();
    const size = stageSizeRef.current;
    const hintAfter = mode === 'memory' ? 3 : 2;
    const writer = HanziWriter.create(container, activeGlyph, {
      width: size,
      height: size,
      padding: Math.round(size * STAGE_PADDING),
      strokeColor: colors.ink,
      radicalColor: mode === 'watch' && !colors.dark ? colors.seal : null,
      outlineColor: colors.line,
      drawingColor: colors.ink,
      highlightColor: colors.seal,
      highlightCompleteColor: colors.success,
      drawingWidth: 18,
      showCharacter: false,
      showOutline: mode !== 'memory',
      onLoadCharDataSuccess: (data) => setQuiz((q) => ({ ...q, total: data.strokes.length })),
      onLoadCharDataError: () => setDemoUnavailable(true),
    });
    writerRef.current = writer;

    if (mode === 'watch') {
      writer.animateCharacter();
    } else {
      writer.quiz({
        showHintAfterMisses: hintAfter,
        onCorrectStroke: (d) => setQuiz((q) => ({ ...q, stroke: d.strokeNum + 1, mistakes: d.totalMistakes, hint: false, wrong: false })),
        onMistake: (d) => setQuiz((q) => ({ ...q, mistakes: d.totalMistakes, hint: d.mistakesOnStroke >= hintAfter, wrong: true })),
        onComplete: ({ totalMistakes }) => {
          setQuiz((q) => ({ ...q, stroke: q.total, mistakes: totalMistakes, done: true, hint: false, wrong: false }));
          markPracticed(activeGlyph);
        },
      });
    }

    return () => {
      writer.cancelQuiz();
      writerRef.current = null;
      container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCharacterId, activeGlyph, mode, attempt, stageReady, themeKey]);

  const handleReplayDemo = () => {
    writerRef.current?.animateCharacter();
  };

  const changeMode = (next) => {
    setMode(next);
    setAttempt((n) => n + 1);
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

  const selectCharacter = (c) => {
    setActiveCharacterId(c._id);
    setMode('watch');
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
    setMode('watch');
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
    ctx.strokeStyle = themeColors().ink;
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
      markPracticed(activeGlyph);
      setStrokes((prev) => [...prev, finishedStroke]);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = themeColors().ink;
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

        .trace-surface { background: var(--card); color: var(--ink); border: 1px solid var(--line); }
        .trace-muted { color: var(--mist) !important; }
        .trace-ink { color: var(--ink) !important; }
        .trace-chip { display: inline-block; padding: 3px 10px; border-radius: 999px; background: var(--rice); color: var(--mist); font-size: .75rem; font-weight: 700; }
        .trace-filter { border: 1.5px solid var(--line); background: var(--card); color: var(--ink); }
        .trace-filter:hover { border-color: var(--seal); color: var(--seal); }
        .trace-filter.is-active { background: var(--seal); border-color: var(--seal); color: #fff; }
        .trace-search { border: 1.5px solid var(--line); background: var(--card); }
        .trace-search .input-group-text, .trace-search .form-control, .trace-search .btn { background: transparent; color: var(--ink); }
        .trace-search .form-control::placeholder { color: var(--mist); }
        .trace-card { width: 100%; border: 1px solid var(--line) !important; font: inherit; }
        .trace-card:focus-visible { outline: 2px solid var(--seal); outline-offset: 3px; }

        .trace-practice { max-width: 480px; }
        .trace-practice-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .trace-practice-pinyin { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--seal); line-height: 1.2; }
        .trace-practice-meaning { margin: 2px 0 0; color: var(--mist); }
        .trace-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; margin-bottom: 14px; border-radius: 12px; background: var(--rice); }
        .trace-mode { min-height: 40px; padding: 6px 8px; border: 0; border-radius: 9px; background: transparent; color: var(--mist); font: inherit; font-size: .9rem; font-weight: 700; cursor: pointer; transition: background .15s ease, color .15s ease; }
        .trace-mode:hover { color: var(--ink); }
        .trace-mode.is-active { background: var(--card); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
        .trace-mode:focus-visible { outline: 2px solid var(--seal); outline-offset: 1px; }

        .tracing-stage-box {
          position: relative;
          width: 100%;
          max-width: ${STAGE_MAX}px;
          aspect-ratio: 1;
          margin: 0 auto;
          border-radius: 16px;
          background: var(--paper);
          border: 2px solid var(--line);
          overflow: hidden;
          touch-action: none;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .tracing-stage-box.is-wrong { border-color: var(--seal); }
        .tracing-stage-box.is-done { border-color: var(--answer-success); box-shadow: 0 0 0 3px var(--answer-success-bg); }

        .tracing-grid { position: absolute; inset: 0; pointer-events: none; }
        .grid-line { position: absolute; }
        .grid-line-v { top: 0; bottom: 0; left: 50%; width: 1px; border-left: 1px dashed var(--line); }
        .grid-line-h { left: 0; right: 0; top: 50%; height: 1px; border-top: 1px dashed var(--line); }
        .grid-line-d1 { top: 0; left: 0; width: 141.4%; height: 1px; border-top: 1px dotted var(--line); transform-origin: 0 0; transform: rotate(45deg); }
        .grid-line-d2 { bottom: 0; left: 0; width: 141.4%; height: 1px; border-top: 1px dotted var(--line); transform-origin: 0 0; transform: rotate(-45deg); }

        .tracing-guide-glyph {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--line);
          font-size: min(70vw, 280px);
          user-select: none;
          pointer-events: none;
          font-family: 'Noto Serif SC', serif;
        }
        .tracing-canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: crosshair; touch-action: none; }
        .stroke-demo-canvas { position: absolute; inset: 0; cursor: crosshair; }
        .stroke-demo-canvas[hidden] { display: none; }
        .stroke-demo-canvas svg { display: block; }

        .trace-status { min-height: 48px; display: flex; align-items: center; justify-content: center; text-align: center; padding: 10px 4px 4px; color: var(--mist); }
        .trace-status p { margin: 0; }
        .trace-status strong { color: var(--ink); }
        .trace-status-done strong { color: var(--answer-success); }
        .trace-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 8px; }
        .trace-btn { min-height: 44px; padding: 8px 18px; border: 1.5px solid var(--line); border-radius: 999px; background: var(--card); color: var(--ink); font: inherit; font-weight: 700; cursor: pointer; transition: border-color .15s ease, background .15s ease, color .15s ease; }
        .trace-btn:hover:not(:disabled) { border-color: var(--seal); color: var(--seal); }
        .trace-btn:disabled { opacity: .45; cursor: not-allowed; }
        .trace-btn:focus-visible { outline: 2px solid var(--seal); outline-offset: 2px; }
        .trace-btn.is-primary { background: var(--seal); border-color: var(--seal); color: #fff; }
        .trace-btn.is-primary:hover { filter: brightness(1.08); color: #fff; }
        .trace-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
        .trace-nav-count { color: var(--mist); font-size: .9rem; font-weight: 600; }
        @media (prefers-reduced-motion: reduce) { .trace-mode, .trace-btn, .tracing-stage-box { transition: none; } }
      `}</style>

      {/* Top Header Controls Bar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <button
          className="trace-btn d-inline-flex align-items-center gap-2 shadow-sm"
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
          <div className="trace-surface rounded-4 shadow-sm mb-4 p-4 p-md-5 text-center text-md-start">
            <div className="row align-items-center g-4">
              <div className="col-12 col-md-8">
                <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2 text-uppercase fw-bold letter-spacing-1 mb-2 d-inline-flex align-items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                  </svg>
                  Writing Practice
                </span>
                <h1 className="fw-extrabold display-5 mb-2 trace-ink">
                  Trace Chinese Characters
                </h1>
                <p className="lead trace-muted mb-0" style={{ fontSize: '1.05rem' }}>
                  Pick a character below and trace it stroke-by-stroke over a traditional rice grid guide.
                </p>
              </div>

              <div className="col-12 col-md-4 text-center text-md-end">
                <div className="d-inline-flex p-3 rounded-4 trace-surface display-4 fw-bold zh shadow-sm" style={{ color: 'var(--seal)' }}>
                  字
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="mt-4 pt-3 border-top">
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-5">
                  <div className="input-group input-group-lg rounded-pill shadow-sm overflow-hidden trace-search">
                    <span className="input-group-text border-0 ps-3">
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
                      <button className="btn border-0 px-3" aria-label="Clear search" onClick={() => setSearchQuery('')}>
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
                        className={`btn btn-sm rounded-pill px-3 py-2 text-nowrap fw-semibold trace-filter${selectedCategory === cat ? ' is-active' : ''}`}
                        aria-pressed={selectedCategory === cat}
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
              <p className="trace-muted fw-semibold">Loading character catalog...</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="trace-surface rounded-4 shadow-sm text-center py-5 px-3">
              <div className="display-4 text-muted mb-3"><Icon name="brush" size="1em"/></div>
              <h4 className="fw-bold mb-1">No characters found</h4>
              <p className="trace-muted mb-0">Try clearing your search query or selecting another category filter.</p>
            </div>
          ) : (
            <div className="row g-3 g-md-4">
              {filteredCharacters.map((c) => (
                <div key={c._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div
                    className="card h-100 rounded-4 shadow-sm hover-lift cursor-pointer text-center p-3 trace-surface trace-card"
                    onClick={() => selectCharacter(c)}
                  >
                    <div className="display-4 fw-bold zh trace-ink my-1">{c.character}</div>
                    <div className="mt-auto">
                      <span className="trace-chip mb-1">{c.category || 'General'}</span>
                      {c.pinyin && <div className="fw-semibold small" style={{ color: 'var(--seal)' }}>{c.pinyin}</div>}
                      {c.meaning && <div className="trace-muted small text-truncate">"{c.meaning}"</div>}
                    </div>

                    {canManage && (
                      <div className="d-flex justify-content-center gap-1 mt-3 pt-2 border-top" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0"
                          style={{ fontSize: '0.875rem' }}
                          onClick={() => handleOpenEditModal(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-2 py-0"
                          style={{ fontSize: '0.875rem' }}
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
        /* Practice view: one stage, three modes */
        <div className="trace-practice mx-auto">
          <div className="trace-surface rounded-4 shadow-sm p-3 p-md-4">
            <header className="trace-practice-head">
              <div>
                {activeCharacter.pinyin && <p className="trace-practice-pinyin">{activeCharacter.pinyin}</p>}
                {activeCharacter.meaning && <p className="trace-practice-meaning">{activeCharacter.meaning}</p>}
              </div>
              {activeCharacter.category && <span className="trace-chip">{activeCharacter.category}</span>}
            </header>

            {!demoUnavailable && (
              <div className="trace-modes" role="radiogroup" aria-label="Practice mode">
                {MODES.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={mode === id}
                    className={`trace-mode${mode === id ? ' is-active' : ''}`}
                    onClick={() => changeMode(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div ref={stageRef} className={`tracing-stage-box${quiz.wrong ? ' is-wrong' : ''}${quiz.done ? ' is-done' : ''}`}>
              <div className="tracing-grid" aria-hidden="true">
                <span className="grid-line grid-line-v" />
                <span className="grid-line grid-line-h" />
                <span className="grid-line grid-line-d1" />
                <span className="grid-line grid-line-d2" />
              </div>
              <div
                ref={writerHostRef}
                className="stroke-demo-canvas"
                role="img"
                hidden={demoUnavailable}
                aria-label={mode === 'watch' ? `Stroke order of ${activeCharacter.character}` : `Writing area for ${activeCharacter.pinyin || activeCharacter.character}`}
              />
              {demoUnavailable && (
                <>
                  <div className="tracing-guide-glyph zh" aria-hidden="true">{activeCharacter.character}</div>
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="tracing-canvas"
                    aria-label={`Drawing area for ${activeCharacter.character}`}
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={moveDraw}
                    onTouchEnd={endDraw}
                  />
                </>
              )}
            </div>

            <div className="trace-status" aria-live="polite">
              {demoUnavailable ? (
                <p>Stroke checking isn't available for this entry. Draw over the guide freely.</p>
              ) : mode === 'watch' ? (
                <p>Watch the stroke order, then trace it yourself.</p>
              ) : quiz.done ? (
                <p className="trace-status-done">
                  <strong>Well done!</strong> {quiz.mistakes === 0 ? 'No mistakes.' : `${quiz.mistakes} ${quiz.mistakes === 1 ? 'mistake' : 'mistakes'}.`}
                </p>
              ) : (
                <p>
                  {quiz.total > 0 && <strong>Stroke {Math.min(quiz.stroke + 1, quiz.total)} of {quiz.total}.</strong>}
                  {quiz.hint ? ' Follow the highlighted stroke.' : quiz.wrong ? ' Not quite. Try that stroke again.' : mode === 'memory' ? ' Write it without the outline.' : ' Trace over the outline in stroke order.'}
                </p>
              )}
            </div>

            <div className="trace-actions">
              {demoUnavailable ? (
                <>
                  <button type="button" className="trace-btn" onClick={handleUndo} disabled={strokes.length === 0}>Undo</button>
                  <button type="button" className="trace-btn" onClick={handleClear} disabled={strokes.length === 0}>Clear</button>
                </>
              ) : mode === 'watch' ? (
                <>
                  <button type="button" className="trace-btn" onClick={handleReplayDemo}>Replay</button>
                  <button type="button" className="trace-btn is-primary" onClick={() => changeMode('trace')}>Start tracing</button>
                </>
              ) : quiz.done ? (
                <>
                  <button type="button" className="trace-btn" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
                  {mode === 'trace'
                    ? <button type="button" className="trace-btn is-primary" onClick={() => changeMode('memory')}>Write from memory</button>
                    : <button type="button" className="trace-btn is-primary" onClick={() => goToOffset(1)}>Next character</button>}
                </>
              ) : (
                <button type="button" className="trace-btn" onClick={() => setAttempt((n) => n + 1)}>Start again</button>
              )}
            </div>
          </div>

          <nav className="trace-nav" aria-label="Characters">
            <button type="button" className="trace-btn" onClick={() => goToOffset(-1)}>Previous</button>
            <span className="trace-nav-count">{filteredCharacters.findIndex((c) => c._id === activeCharacterId) + 1} of {filteredCharacters.length}</span>
            <button type="button" className="trace-btn" onClick={() => goToOffset(1)}>Next</button>
          </nav>
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
