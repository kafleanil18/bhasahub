import { useState, useEffect } from 'react';

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

function Quiz({ words, language, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setQuestions(buildQuestions(words));
  }, [words]);

  const q = questions[current];

  const handleAnswer = (choice) => {
    if (selected) return; // already answered
    setSelected(choice);
    if (choice === q.answer) {
      setScore((s) => s + 1);
      playCorrectTone();
    } else {
      playIncorrectTone();
    }
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const restart = () => {
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
  }, [current, selected, finished, questions, q]);

  if (questions.length === 0) return null;

  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-area">
        <div className="quiz-result">
          <span className="quiz-result-emoji">
            {percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '📚'}
          </span>
          <h2 className="section-title">
            {score} / {questions.length} correct
          </h2>
          <p className="quiz-result-percent">{percent}% Score</p>
          <div className="quiz-result-actions">
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
          💡 Keyboard controls: Press <strong>A, B, C, D</strong> (or <strong>1, 2, 3, 4</strong>) to select your answer.
        </p>
      )}
    </div>
  );
}

export default Quiz;