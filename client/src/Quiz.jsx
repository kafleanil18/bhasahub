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

function Quiz({ words, language, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setQuestions(buildQuestions(words));
  }, [words]);

  if (questions.length === 0) return null;

  const q = questions[current];

  const handleAnswer = (choice) => {
    if (selected) return; // already answered this question
    setSelected(choice);
    if (choice === q.answer) setScore((s) => s + 1);
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
          <p className="quiz-result-percent">{percent}%</p>
          <div className="quiz-result-actions">
            <button className="btn-primary" onClick={restart}>Try again</button>
            <button className="nav-btn" onClick={onExit}>Back to lesson</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-area">
      <div className="quiz-progress">
        Question {current + 1} / {questions.length} · Score: {score}
      </div>

      <div className="quiz-question">
        <span className={`quiz-word ${language === 'chinese' ? 'zh' : 'ne'}`}>
          {q.word.word}
        </span>
        <span className="quiz-pron">{q.word.pronunciation}</span>
      </div>

      <div className="quiz-choices">
        {q.choices.map((choice) => {
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
              {choice}
            </button>
          );
        })}
      </div>

      {selected && (
        <button className="btn-primary quiz-next" onClick={next}>
          {current + 1 >= questions.length ? 'See results' : 'Next question →'}
        </button>
      )}
    </div>
  );
}

export default Quiz;