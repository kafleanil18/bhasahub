import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { practiceTools } from './practiceTools';
import './StudioTour.css';

export const TOUR_SEEN_KEY = 'studioTourSeen';

const tips = {
  tests: 'Sit a full HSK paper the way the real exam runs. Start with the free H11226 test to find your level, then review every answer you missed.',
  pinyin: 'Tap any syllable to hear it. Say it out loud straight after, then replay to compare. Getting the four tones right early saves a lot of relearning later.',
  trace: 'Watch the strokes animate, trace over them, then try writing the character from memory. Stroke order matters, so follow the numbers.',
  listening: 'Hear a word, then choose what it means. Headphones help. Replay as often as you like before you answer.',
  sentences: 'Put the words in the right order to build a sentence. Chinese usually goes: who → when → where → action → what.',
  measures: 'Choose the right counting word for each thing. 个 works as a fallback, but learning 本, 张 and 只 makes you sound natural.',
  numbers: 'Practise the numbers you meet every day: prices, times and dates. Say each answer aloud before you type it.',
  dictation: 'Listen to a recording and write what you hear. Short daily sessions train your ear faster than one long one.',
  conversation: 'Work through guided conversations line by line. Speak each line aloud and repeat it until it feels natural.',
};

const steps = [
  { selector: '#practice-studio .hero-practice-heading', title: 'Welcome to your practice studio', tip: `There are ${practiceTools.length} ways to practise here. Let’s take a quick look at each one. You can leave the tour at any time.` },
  ...practiceTools.map(([id, title]) => ({ selector: `#practice-studio .hero-practice-${id}`, title: id === 'tests' ? 'HSK mock tests' : title, tip: tips[id] })),
];

const PAD = 8;

// Dims the page and spotlights each practice studio tool in turn, with a tip beside it.
export default function StudioTour({ onClose }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [missing, setMissing] = useState(false);
  const cardRef = useRef(null);
  const [cardSize, setCardSize] = useState({ width: 360, height: 220 });
  const step = steps[index];
  const last = index === steps.length - 1;

  const finish = useCallback(() => {
    try { localStorage.setItem(TOUR_SEEN_KEY, '1'); } catch { /* storage may be unavailable */ }
    onClose();
  }, [onClose]);
  const go = useCallback(delta => setIndex(value => Math.min(steps.length - 1, Math.max(0, value + delta))), []);

  // Find the step's element (the home page may still be loading), scroll it into view and follow it.
  useEffect(() => {
    let frame = 0;
    let element = null;
    let tries = 0;
    setRect(null); setMissing(false);
    const measure = () => {
      if (!element || !element.isConnected) element = document.querySelector(step.selector);
      if (!element) {
        if (++tries > 300) { setMissing(true); return; }
        frame = requestAnimationFrame(measure);
        return;
      }
      if (tries >= 0) {
        tries = -1;
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        const box = element.getBoundingClientRect();
        // On small screens the tip sits at the bottom, so keep the spotlight in the space above it.
        const room = window.innerWidth <= 600 ? window.innerHeight - (cardRef.current?.offsetHeight || 260) - 24 : window.innerHeight;
        const header = document.querySelector('header')?.getBoundingClientRect().bottom || 0;
        const target = Math.max(header + 16, (room - box.height) / 2);
        window.scrollTo({ top: window.scrollY + box.top - target, behavior });
      }
      const box = element.getBoundingClientRect();
      setRect(previous => previous && previous.top === box.top && previous.left === box.left && previous.width === box.width && previous.height === box.height ? previous : { top: box.top, left: box.left, width: box.width, height: box.height });
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [step.selector, index]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const { offsetWidth: width, offsetHeight: height } = card;
    setCardSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }, [index, rect]);

  useEffect(() => { cardRef.current?.querySelector('.studio-tour-next')?.focus({ preventScroll: true }); }, [index]);
  useEffect(() => {
    const keys = event => {
      if (event.key === 'Escape') finish();
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', keys);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', keys); document.body.style.overflow = overflow; };
  }, [finish, go]);

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const hole = rect && {
    top: Math.max(4, rect.top - PAD),
    left: Math.max(4, rect.left - PAD),
    width: Math.min(rect.width + PAD * 2, viewportWidth - 8),
    height: Math.min(rect.height + PAD * 2, viewportHeight - 8),
  };
  // Place the tip below the spotlight, else above it, else pinned to the bottom of the screen.
  let cardStyle = { left: 0, right: 0, bottom: 16, marginInline: 'auto' };
  if (hole && viewportWidth > 600) {
    const left = Math.min(Math.max(16, hole.left), viewportWidth - cardSize.width - 16);
    if (hole.top + hole.height + 16 + cardSize.height < viewportHeight) cardStyle = { left, top: hole.top + hole.height + 16 };
    else if (hole.top - 16 - cardSize.height > 0) cardStyle = { left, top: hole.top - 16 - cardSize.height };
    else {
      // Beside the spotlight, vertically centred on it.
      const top = Math.min(Math.max(16, hole.top + hole.height / 2 - cardSize.height / 2), viewportHeight - cardSize.height - 16);
      if (hole.left + hole.width + 16 + cardSize.width < viewportWidth) cardStyle = { left: hole.left + hole.width + 16, top };
      else if (hole.left - 16 - cardSize.width > 0) cardStyle = { left: hole.left - 16 - cardSize.width, top };
    }
  }

  return <div className="studio-tour" role="dialog" aria-modal="true" aria-labelledby="studio-tour-title" aria-describedby="studio-tour-tip">
    <div className="studio-tour-blocker" onClick={event => event.stopPropagation()} />
    {hole ? <div className="studio-tour-spotlight" style={hole} aria-hidden="true" /> : <div className="studio-tour-dim" aria-hidden="true" />}
    <div className="studio-tour-card" ref={cardRef} style={cardStyle}>
      <div className="studio-tour-meta"><span className="studio-tour-step">{index === 0 ? 'Studio tour' : `Tool ${index} of ${steps.length - 1}`}</span><button className="studio-tour-skip" onClick={finish}>Skip tour</button></div>
      <h2 id="studio-tour-title">{step.title}</h2>
      <p id="studio-tour-tip" aria-live="polite">{missing ? 'This part of the page couldn’t be found. Go to the home page and start the tour again.' : <><span className="studio-tour-tip-label">Tip</span>{step.tip}</>}</p>
      <div className="studio-tour-progress" aria-hidden="true">{steps.map((_, dot) => <span key={dot} className={dot === index ? 'is-current' : dot < index ? 'is-done' : ''} />)}</div>
      <div className="studio-tour-actions">
        <button className="studio-tour-back" onClick={() => go(-1)} disabled={index === 0}>Back</button>
        <button className="studio-tour-next" onClick={() => last ? finish() : go(1)}>{last ? 'Finish tour' : index === 0 ? 'Start tour' : 'Next'}</button>
      </div>
    </div>
  </div>;
}
