import { useState, useEffect, useCallback } from 'react';

const API = window.API_BASE_URL + '/api';

const GRADES = [
  { label: 'Again', quality: 0, className: 'srs-grade-again' },
  { label: 'Hard', quality: 3, className: 'srs-grade-hard' },
  { label: 'Good', quality: 4, className: 'srs-grade-good' },
  { label: 'Easy', quality: 5, className: 'srs-grade-easy' },
];

function SrsReview({ lessonId, language, token, onExit }) {
  const [cards, setCards] = useState(null); // null = loading
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadDue = useCallback(() => {
    setCards(null);
    setIndex(0);
    setFlipped(false);
    setReviewedCount(0);
    fetch(`${API}/srs/due?lessonId=${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCards(data.cards || []))
      .catch(() => setCards([]));
  }, [lessonId, token]);

  useEffect(() => {
    loadDue();
  }, [loadDue]);

  const card = cards && cards[index];

  const grade = (quality) => {
    if (!card || submitting) return;
    setSubmitting(true);
    fetch(`${API}/srs/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ vocabularyId: card.vocabularyId, quality }),
    })
      .catch(() => {})
      .finally(() => {
        setSubmitting(false);
        setReviewedCount((c) => c + 1);
        setFlipped(false);
        setIndex((i) => i + 1);
      });
  };

  useEffect(() => {
    if (!card || submitting) return;
    const handleKeyDown = (e) => {
      if (!flipped) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          setFlipped(true);
        }
        return;
      }
      if (e.key === '1') grade(0);
      else if (e.key === '2') grade(3);
      else if (e.key === '3') grade(4);
      else if (e.key === '4') grade(5);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, flipped, submitting]);

  if (cards === null) {
    return <div className="srs-review-area"><p>Loading review queue…</p></div>;
  }

  if (cards.length === 0) {
    return (
      <div className="srs-review-area">
        <p className="srs-empty">🎉 Nothing due for review right now — check back later!</p>
        <button className="nav-btn" onClick={onExit}>← Back to word list</button>
      </div>
    );
  }

  if (index >= cards.length) {
    return (
      <div className="srs-review-area">
        <p className="srs-empty">✅ Reviewed {reviewedCount} card{reviewedCount === 1 ? '' : 's'}. Nice work!</p>
        <div className="quiz-result-actions">
          <button className="btn-primary" onClick={loadDue}>Review more</button>
          <button className="nav-btn" onClick={onExit}>Back to word list</button>
        </div>
      </div>
    );
  }

  return (
    <div className="srs-review-area">
      <div className="flash-progress-bar">
        <div className="flash-progress-fill" style={{ width: `${((index + 1) / cards.length) * 100}%` }}></div>
      </div>
      <span className="flash-count">{index + 1} / {cards.length}{card.isNew ? ' · new' : ''}</span>

      <div
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flash-front">
          <span className={`flash-word ${language === 'chinese' ? 'zh' : 'ne'}`}>{card.word}</span>
          <span className="flash-hint">tap or press Space to flip</span>
        </div>
        <div className="flash-back">
          <span className="flash-pron">{card.pronunciation}</span>
          <span className="flash-meaning">{card.meaning}</span>
        </div>
      </div>

      {flipped ? (
        <div className="srs-grade-buttons">
          {GRADES.map((g) => (
            <button
              key={g.label}
              className={`srs-grade-btn ${g.className}`}
              onClick={() => grade(g.quality)}
              disabled={submitting}
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="keyboard-shortcut-hint">
          💡 Press <strong>Space</strong> to flip, then <strong>1-4</strong> to grade (Again / Hard / Good / Easy).
        </p>
      )}
    </div>
  );
}

export default SrsReview;
