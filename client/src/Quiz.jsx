import { useState, useEffect, useCallback } from 'react';
import { mediaUrl } from './utils/mediaUrl';

const SERVER = window.API_BASE_URL;
const API = window.API_BASE_URL + '/api';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuestions(words) {
  return shuffle(words).map((w) => {
    const wrongPool = words.filter((x) => x._id !== w._id);
    const wrongChoices = shuffle(wrongPool).slice(0, 3).map((x) => x.meaning);
    const choices = shuffle([w.meaning, ...wrongChoices]);
    return { word: w, choices, answer: w.meaning };
  });
}

// Generate synthesizer sound tones natively using Web Audio API
const playTone = (freq, duration, type = 'sine') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.008, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // silently bypass browser context blockers
  }
};

const playCorrectTone = () => {
  playTone(523.25, 0.1, 'triangle'); // C5
  setTimeout(() => playTone(659.25, 0.15, 'triangle'), 80); // E5
};

const playIncorrectTone = () => {
  playTone(180, 0.35, 'sawtooth'); // low buzz
};

function Quiz({ words, language, lessonId, token, onExit, muted, onToggleMute }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missedIds, setMissedIds] = useState([]);

  useEffect(() => {
    setQuestions(buildQuestions(words));
  }, [words]);

  const q = questions[current];

  useEffect(() => {
    if (muted) return;
    const audioUrl = q?.word?.audioUrl;
    if (audioUrl) {
      new Audio(mediaUrl(audioUrl)).play().catch(() => {});
    }
  }, [q, muted]);

  const handleAnswer = useCallback((choice) => {
    if (selected) return; // already answered
    setSelected(choice);
    if (choice === q.answer) {
      setScore((s) => s + 1);
      playCorrectTone();
    } else {
      setMissedIds((ids) => [...ids, q.word._id]);
      playIncorrectTone();
    }
  }, [selected, q]);

  const next = useCallback(() => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [current, questions.length]);

  useEffect(() => {
    if (!finished || !lessonId || !token) return;
    fetch(`${API}/attempts/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lessonId, score, total: questions.length, missedVocabularyIds: missedIds }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const restart = () => {
    setMissedIds([]);
    setQuestions(buildQuestions(words));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  // Keyboard controls listener
  useEffect(() => {
    if (finished || questions.length === 0 || !q) return;

    const handleKeyDown = (e) => {
      // If already selected, Space/Enter/ArrowRight goes to next question
      if (selected) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
          e.preventDefault();
          next();
        }
        return;
      }

      // Map keyboard inputs to choices A, B, C, D (or numbers 1, 2, 3, 4)
      const key = e.key.toLowerCase();
      let index = -1;
      if (key === 'a' || key === '1') index = 0;
      else if (key === 'b' || key === '2') index = 1;
      else if (key === 'c' || key === '3') index = 2;
      else if (key === 'd' || key === '4') index = 3;

      if (index >= 0 && index < q.choices.length) {
        e.preventDefault();
        handleAnswer(q.choices[index]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, selected, finished, questions, q, next, handleAnswer]);

  if (questions.length === 0) return null;

  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    const incorrect = questions.length - score;

    // SVG donut chart calculations
    const radius = 36;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius; // ~226.19
    const correctShare = score / questions.length;
    const incorrectShare = 1 - correctShare;
    const correctStroke = circumference * correctShare;
    const incorrectStroke = circumference * incorrectShare;

    return (
      <div className="quiz-area">
        <div className="quiz-result">
          <span className="quiz-result-emoji">
            {percent >= 80 ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            ) : percent >= 50 ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--seal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            )}
          </span>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Quiz Completed!
          </h2>
          <p className="quiz-result-percent">Here is your performance breakdown:</p>
          
          <div className="quiz-analytics-container">
            {/* SVG Donut Chart */}
            <div className="quiz-chart-wrapper">
              <svg width="160" height="160" viewBox="0 0 100 100" className="quiz-chart-svg">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="var(--rice)"
                  strokeWidth={strokeWidth}
                />
                {/* Correct segment */}
                {score > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="var(--jade)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${correctStroke} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="quiz-chart-segment"
                  />
                )}
                {/* Incorrect segment */}
                {incorrect > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="var(--seal)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${incorrectStroke} ${circumference}`}
                    strokeDashoffset={-correctStroke}
                    strokeLinecap={score > 0 ? 'butt' : 'round'}
                    className="quiz-chart-segment"
                  />
                )}
              </svg>
              {/* Inner score label */}
              <div className="quiz-chart-label">
                <span className="quiz-chart-percent">{percent}%</span>
                <span className="quiz-chart-sub">Score</span>
              </div>
            </div>

            {/* Legend / Breakdown info */}
            <div className="quiz-legend">
              <div className="quiz-legend-item">
                <span className="quiz-legend-dot correct-dot"></span>
                <div className="quiz-legend-text">
                  <span className="quiz-legend-label">Correct Answers</span>
                  <span className="quiz-legend-value correct-color">{score}</span>
                </div>
              </div>
              <div className="quiz-legend-item">
                <span className="quiz-legend-dot incorrect-dot"></span>
                <div className="quiz-legend-text">
                  <span className="quiz-legend-label">Incorrect Answers</span>
                  <span className="quiz-legend-value incorrect-color">{incorrect}</span>
                </div>
              </div>
              <div className="quiz-legend-item">
                <span className="quiz-legend-dot total-dot"></span>
                <div className="quiz-legend-text">
                  <span className="quiz-legend-label">Total Questions</span>
                  <span className="quiz-legend-value">{questions.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="quiz-result-actions" style={{ marginTop: 24 }}>
            <button className="btn-primary" onClick={restart}>Try again</button>
            <button className="nav-btn" onClick={onExit}>Back to lesson</button>
          </div>
        </div>
      </div>
    );
  }

  const prefixLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="quiz-area">
      {/* 1. Progress Bar */}
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }}></div>
      </div>

      <div className="quiz-progress">
        Question {current + 1} of {questions.length} · Score: {score}
      </div>

      {onToggleMute && (
        <button
          type="button"
          className="nav-btn flash-mute-btn"
          onClick={onToggleMute}
          title={muted ? 'Unmute audio' : 'Mute audio'}
        >
          {muted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      )}

      {/* 2. Question word details */}
      <div className="quiz-question">
        <span className={`quiz-word ${language === 'chinese' ? 'zh' : 'ne'}`}>
          {q.word.word}
        </span>
        <span className="quiz-pron">{q.word.pronunciation}</span>
      </div>

      {/* 3. Multiple Choice Grid */}
      <div className="quiz-choices">
        {q.choices.map((choice, i) => {
          let cls = 'quiz-choice';
          if (selected) {
            if (choice === q.answer) cls += ' correct';
            else if (choice === selected) cls += ' wrong';
          }
          return (
            <button
              key={choice}
              className={cls}
              onClick={() => handleAnswer(choice)}
              disabled={!!selected}
            >
              <div className="quiz-choice-inner">
                <span className="quiz-choice-letter">{prefixLetters[i]}</span>
                <span>{choice}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Action button / next step */}
      {selected ? (
        <button className="btn-primary quiz-next" onClick={next} style={{ minWidth: 160 }}>
          {current + 1 >= questions.length ? 'See results' : 'Next question →'}
        </button>
      ) : (
        <p className="keyboard-shortcut-hint">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: '-2px' }}>
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
          </svg>
          Keyboard controls: Press <strong>A, B, C, D</strong> (or <strong>1, 2, 3, 4</strong>) to select your answer.
        </p>
      )}
    </div>
  );
}

export default Quiz;