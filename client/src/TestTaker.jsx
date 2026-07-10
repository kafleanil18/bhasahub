import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function TestTaker({ testId, onBack }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
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
        <button className="back-btn" onClick={onBack}>← Back to tests</button>
        <p className="courses-empty">Loading test...</p>
      </section>
    );
  }

  if (!test || !test._id) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={onBack}>←