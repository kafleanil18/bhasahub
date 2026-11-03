import { useEffect, useMemo, useRef, useState } from 'react';
import { parseGrammarContent } from './grammarContent';
import GrammarPractice, { ReflectionQuestion } from './GrammarPractice';
import './GrammarLesson.css';

function ExampleCard({ example, showPinyin, number }) {
  const [revealed, setRevealed] = useState(false);
  return <article className="gs-example">
    <span className="gs-example-label">Example {number}</span>
    <p className="gs-example-chinese zh">{example.chinese}</p>
    {showPinyin && <p className="gs-pinyin">{example.pinyin}</p>}
    <button type="button" className="gs-translation" aria-expanded={revealed} onClick={() => setRevealed(value => !value)}>{revealed ? example.english : 'Reveal the meaning'}<span aria-hidden="true">{revealed ? '−' : '+'}</span></button>
  </article>;
}

function readProgress(key, points) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? [...new Set(value)].filter(id => points.some(point => point.id === id)) : [];
  } catch { return []; }
}

export default function GrammarLesson({ html, lessonId, userId }) {
  const content = useMemo(() => parseGrammarContent(html), [html]);
  if (!content.points.length) return <div className="grammar-explanation-text" dangerouslySetInnerHTML={{ __html: content.safeHtml }} />;
  return <GrammarStudio key={`${lessonId}:${userId || 'guest'}`} content={content} lessonId={lessonId} userId={userId} />;
}

function GrammarStudio({ content, lessonId, userId }) {
  const storageKey = `bhashahub:grammar-practice:v1:${userId || 'guest'}:${lessonId}`;
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState('learn');
  const [showPinyin, setShowPinyin] = useState(true);
  const [fullLesson, setFullLesson] = useState(false);
  const [practiced, setPracticed] = useState(() => readProgress(storageKey, content.points));
  const headingRef = useRef(null);
  const point = content.points[activeIndex];
  const allExamples = content.points.flatMap(item => item.examples);
  const percent = Math.round(practiced.length / content.points.length * 100);
  const glyph = point.pattern.match(/[\u3400-\u9fff]/u)?.[0] || '文';

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(practiced)); } catch { /* Practice remains available when browser storage is unavailable. */ }
  }, [practiced, storageKey]);

  function selectPoint(index) {
    setActiveIndex(index);
    if (mode === 'review') setMode('learn');
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  }
  function markPracticed() {
    setPracticed(previous => previous.includes(point.id) ? previous : [...previous, point.id]);
  }

  return <div className="grammar-studio">
    <div className="gs-overview">
      <div className="gs-overview-copy"><p className="gs-eyebrow"><span className="gs-live-dot" /> Your grammar practice</p><h2>Make the pattern yours.</h2><p>{content.objective}</p><span className="gs-module-meta">{content.meta}</span></div>
      <div className="gs-overview-art"><span className="gs-topic-glyph zh" aria-hidden="true">{glyph}</span><div className="gs-progress-ring" role="progressbar" aria-label="Grammar points practiced" aria-valuemin={0} aria-valuemax={content.points.length} aria-valuenow={practiced.length} aria-valuetext={`${practiced.length} of ${content.points.length} points practiced`}><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" className="gs-ring-track" /><circle cx="40" cy="40" r="34" className="gs-ring-fill" strokeDasharray={`${percent * 2.136} 213.6`} /></svg><span><strong>{practiced.length}<small>/{content.points.length}</small></strong><em>practiced</em></span></div></div>
    </div>

    <div className="gs-workspace">
      <aside className="gs-path"><div className="gs-path-heading"><span>In this lesson</span><span>{content.points.length} points</span></div><nav aria-label="Grammar points">{content.points.map((item, index) => <button type="button" key={item.id} className={`gs-step ${activeIndex === index ? 'is-current' : ''} ${practiced.includes(item.id) ? 'is-practiced' : ''}`} aria-current={activeIndex === index ? 'step' : undefined} onClick={() => selectPoint(index)}><span className="gs-step-number" aria-hidden="true">{practiced.includes(item.id) ? '✓' : String(index + 1).padStart(2, '0')}</span><span>{item.title}<small>{practiced.includes(item.id) ? 'Practiced' : `${item.examples.length} examples · ${item.questions.length} exercises`}</small></span><span className="gs-step-arrow" aria-hidden="true">↗</span></button>)}</nav><div className="gs-path-note"><span aria-hidden="true">↻</span><p>Revisit any point.<br />A little repetition helps it stick.</p></div></aside>

      <section className="gs-desk" aria-label="Grammar learning workspace">
        <nav className="gs-mode-switch" aria-label="Study mode">{[['learn','Learn the pattern'],['practice','Try it yourself'],['review','Review & reflect']].map(([value,label],index)=><button type="button" key={value} aria-pressed={mode === value} className={mode === value ? 'is-active' : ''} onClick={() => { setMode(value); requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true })); }}><span aria-hidden="true">{index === 0 ? '一' : index === 1 ? '二' : '三'}</span>{label}</button>)}</nav>
        <div className="gs-desk-content">
          {mode !== 'review' && <div className="gs-point-header"><div><p className="gs-eyebrow">Pattern {activeIndex + 1} of {content.points.length}</p><h3 ref={headingRef} tabIndex={-1}>{point.title}</h3></div>{practiced.includes(point.id) && <span className="gs-practiced-label">✓ Practiced</span>}</div>}
          {mode === 'learn' && <div key={point.id} className="gs-learn-content">
            <div className="gs-formula"><span className="gs-formula-label">The building blocks</span><p>{point.pattern.split(/(\+)/).map((part,index)=><span key={index} className={part === '+' ? 'gs-plus' : 'gs-formula-part'}>{part.trim()}</span>)}</p></div>
            <p className="gs-explanation">{point.explanation}</p>
            <div className="gs-examples-heading"><h4>See it in a sentence</h4><button type="button" className="gs-pinyin-toggle" aria-pressed={showPinyin} onClick={() => setShowPinyin(value => !value)}><span aria-hidden="true">ā</span>{showPinyin ? 'Hide pinyin' : 'Show pinyin'}</button></div>
            <div className="gs-examples-grid">{point.examples.map((example,index)=><ExampleCard key={`${point.id}-${index}`} example={example} showPinyin={showPinyin} number={index + 1} />)}</div>
            {point.mistake && <aside className="gs-watch-out"><span className="gs-watch-icon" aria-hidden="true">!</span><div><h4>Watch this little detail</h4><p>{point.mistake}</p></div></aside>}
            <button type="button" className="gs-primary gs-start-practice" onClick={() => { setMode('practice'); requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true })); }}>Let’s try this pattern <span aria-hidden="true">→</span></button>
          </div>}
          {mode === 'practice' && <GrammarPractice key={point.id} point={point} allExamples={allExamples} onSuccess={markPracticed} />}
          {mode === 'review' && <div className="gs-review-panel"><p className="gs-eyebrow">Pause. Recall. Put it into words.</p><h3 ref={headingRef} tabIndex={-1}>{content.reviews.length ? 'Your review desk' : 'Bring it all together'}</h3><p className="gs-review-intro">Write your own answers first, then open the model and compare. These open-ended exercises are for self-review.</p>{(content.reviews.length ? content.reviews : [{title:'Lesson self-check',questions:content.points.flatMap(item=>item.questions)}]).map((review,reviewIndex)=><section className="gs-review-group" key={review.title}><h4>{review.title}</h4>{review.instructions && <p>{review.instructions}</p>}{review.questions.map((question,index)=><ReflectionQuestion key={`${reviewIndex}-${index}`} question={question} number={`review-${reviewIndex}-${index + 1}`} />)}</section>)}</div>}
        </div>
        <div className="gs-desk-footer"><span>{practiced.length === content.points.length ? 'Every pattern practiced. Great work.' : `${practiced.length} of ${content.points.length} patterns practiced`}</span><div><button type="button" className="gs-text-button" disabled={activeIndex === 0} onClick={() => selectPoint(activeIndex - 1)}>← Previous</button><button type="button" className="gs-text-button" disabled={activeIndex === content.points.length - 1} onClick={() => selectPoint(activeIndex + 1)}>Next point →</button></div></div>
      </section>
    </div>
    <div className="gs-reference-bar"><span>Pattern progress is saved on this device.</span><button type="button" className="gs-text-button" aria-expanded={fullLesson} onClick={() => setFullLesson(value => !value)}>{fullLesson ? 'Close full lesson' : 'Read the full lesson'} <span aria-hidden="true">{fullLesson ? '−' : '+'}</span></button></div>
    {fullLesson && <div className="gs-full-lesson grammar-explanation-text" dangerouslySetInnerHTML={{ __html: content.safeHtml }} />}
  </div>;
}
