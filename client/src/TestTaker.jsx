import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

function TestTaker({ testId, onBack }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`${API}/tests/${testId}`)
      .then(res => res.json())
      .then(data => { setTest(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [testId]);

  const selectAnswer = (qi, oi) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

  const submit = () => {
    let correct = 0;
    test.questions.forEach((q, qi) => {
      if (answers[qi] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retake = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={onBack}>Back to tests</button>
        <p className="courses-empty">Loading test...</p>
      </section>
    );
  }

  if (!test || !test._id) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={onBack}>Back to tests</button>
        <p className="courses-empty">Test not found.</p>
      </section>
    );
  }

  const total = test.questions.length;
  const percent = total ? Math.round((score / total) * 100) : 0;

  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>Back to tests</button>
      <p className="eyebrow">{test.level}</p>
      <h1 className="section-title">{test.title}</h1>
      {test.description && <p className="course-desc">{test.description}</p>}

      {submitted && (
        <div className="test-result">
          <span className="quiz-result-emoji">{percent >= 60 ? '🎉' : '📚'}</span>
          <h2>You scored {score} / {total}</h2>
          <p className="quiz-result-percent">{percent}%</p>
          <button className="nav-btn" onClick={retake}>Retake test</button>
        </div>
      )}

      {test.testType === 'listening' && test.audioUrl && (
        <div className="test-media">
          <h3 className="dialogue-heading">🎧 Listening Audio</h3>
          <audio controls src={`${SERVER}${test.audioUrl}`} style={{ width: '100%' }} />
        </div>
      )}

      {test.pdfUrl && (
        <div className="test-media">
          <h3 className="dialogue-heading">📄 Question paper</h3>
          <iframe
            src={`${SERVER}${test.pdfUrl}`}
            title="Question paper"
            className="test-pdf"
          ></iframe>
        </div>
      )}

      <div className="test-questions">
        <h3 className="dialogue-heading">✏️ Answers</h3>
        {test.questions.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <div className="test-question" key={qi}>
              <p className="test-question-text" style={{ marginBottom: q.questionPinyin ? '6px' : '16px' }}>
                <strong>Q{qi + 1}.</strong> {q.questionText}
              </p>
              {q.questionPinyin && (
                <p className="test-question-pinyin" style={{ color: 'var(--mist)', fontSize: '0.9rem', marginTop: '-4px', marginBottom: '16px', paddingLeft: '32px' }}>
                  {q.questionPinyin}
                </p>
              )}
              {q.audioUrl && (
                <div className="test-question-audio" style={{ paddingLeft: '32px', marginBottom: '16px' }}>
                  <audio controls src={`${SERVER}${q.audioUrl}`} style={{ height: '36px', maxWidth: '100%', width: '320px' }} />
                </div>
              )}
              <div className="test-options">
                {q.options.map((opt, oi) => {
                  let cls = 'test-option';
                  if (submitted) {
                    if (oi === q.correctIndex) cls += ' correct';
                    else if (chosen === oi) cls += ' wrong';
                  } else if (chosen === oi) {
                    cls += ' selected';
                  }

                  const optionText = opt && typeof opt === 'object' ? opt.text : opt;
                  const optionPinyin = opt && typeof opt === 'object' ? opt.pinyin : '';

                  return (
                    <button
                      key={oi}
                      className={cls}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={submitted}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: optionPinyin ? '10px 16px' : '14px 16px', gap: '2px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                        <span className="option-letter" style={{ flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</span>
                        <span style={{ fontWeight: 600, textAlign: 'left' }}>{optionText}</span>
                      </div>
                      {optionPinyin && (
                        <span className="option-pinyin" style={{ fontSize: '0.85rem', color: 'var(--mist)', marginLeft: '32px', textAlign: 'left' }}>
                          {optionPinyin}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && total > 0 && (
        <button className="btn-primary" onClick={submit} style={{ marginTop: 24 }}>
          Submit test
        </button>
      )}
    </section>
  );
}

export default TestTaker;