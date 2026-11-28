import { recordStudioActivity } from './recordStudioActivity';
import { useEffect, useRef, useState } from 'react';
import { bookLessons } from './conversationLessons';
import useChineseVoice from './useChineseVoice';
import { pickConversationVoice } from './conversationVoice';
import { checkNaturalVoice, naturalVoiceUrl } from './naturalVoice';
import './ConversationPractice.css';
import Icon from '../components/Icon';
import { mediaUrl } from '../utils/mediaUrl';
import { apiFetch } from '../lib/apiClient';

const lessons = [
  {
    id: 'lesson-1', number: '01', title: '你好', subtitle: 'Hello', topic: 'Meeting someone',
    image: '/images/conversation-hello-greeting.png', imageAlt: 'Two people greeting each other with a handshake in a courtyard',
    caption: 'First meeting · 初次见面', kicker: 'YOUR FIRST WORDS', heroTitle: 'Start with a friendly hello.',
    intro: 'Learn a few simple greetings, from a friendly hello to a polite greeting and a quick apology.',
    exchanges: [
      { number: '01', title: 'Say hello', tone: 'hello', turns: [
        { speaker: 'A', chinese: '你好！', pinyin: 'Nǐ hǎo!', english: 'Hello!' },
        { speaker: 'B', chinese: '你好！', pinyin: 'Nǐ hǎo!', english: 'Hello!' },
      ] },
      { number: '02', title: 'Greet someone politely', tone: 'polite', turns: [
        { speaker: 'A', chinese: '您好！', pinyin: 'Nín hǎo!', english: 'Hello! (polite)' },
        { speaker: 'B', chinese: '你们好！', pinyin: 'Nǐmen hǎo!', english: 'Hello, everyone!' },
      ] },
      { number: '03', title: 'Say sorry', tone: 'sorry', turns: [
        { speaker: 'A', chinese: '对不起！', pinyin: 'Duìbuqǐ!', english: 'I’m sorry!' },
        { speaker: 'B', chinese: '没关系！', pinyin: 'Méi guānxi!', english: 'That’s okay!' },
      ] },
    ],
    words: [
      { chinese: '你', pinyin: 'nǐ', type: 'pronoun', meaning: 'you (one person)' },
      { chinese: '好', pinyin: 'hǎo', type: 'adjective', meaning: 'good; well' },
      { chinese: '您', pinyin: 'nín', type: 'pronoun', meaning: 'you (polite)' },
      { chinese: '你们', pinyin: 'nǐmen', type: 'pronoun', meaning: 'you (plural)' },
      { chinese: '对不起', pinyin: 'duìbuqǐ', type: 'phrase', meaning: 'I’m sorry' },
      { chinese: '没关系', pinyin: 'méi guānxi', type: 'phrase', meaning: 'that’s okay; no problem' },
    ],
  },
  {
    id: 'lesson-2', number: '02', title: '谢谢你', subtitle: 'Thank you', topic: 'Thanks & goodbyes',
    image: '/images/conversation-thank-you.png', imageAlt: 'A traveler thanking a helpful hotel attendant beside her suitcase',
    caption: 'A kind gesture · 感谢帮助', kicker: 'EVERYDAY COURTESY', heroTitle: 'Say thanks, then goodbye.',
    intro: 'Practice thanking someone, responding politely, and saying goodbye when it’s time to leave.',
    exchanges: [
      { number: '01', title: 'Say thank you', tone: 'hello', turns: [
        { speaker: 'A', chinese: '谢谢！', pinyin: 'Xièxie!', english: 'Thank you!' },
        { speaker: 'B', chinese: '不谢！', pinyin: 'Bú xiè!', english: 'You’re welcome!' },
      ] },
      { number: '02', title: 'Thank someone directly', tone: 'polite', turns: [
        { speaker: 'A', chinese: '谢谢你！', pinyin: 'Xièxie nǐ!', english: 'Thank you!' },
        { speaker: 'B', chinese: '不客气！', pinyin: 'Bú kèqi!', english: 'You’re welcome!' },
      ] },
      { number: '03', title: 'Say goodbye', tone: 'sorry', turns: [
        { speaker: 'A', chinese: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
        { speaker: 'B', chinese: '再见！', pinyin: 'Zàijiàn!', english: 'Bye! See you around!' },
      ] },
    ],
    words: [
      { chinese: '谢谢', pinyin: 'xièxie', type: 'verb', meaning: 'to thank; thank you' },
      { chinese: '不', pinyin: 'bù', type: 'adverb', meaning: 'no; not' },
      { chinese: '不客气', pinyin: 'bú kèqi', type: 'phrase', meaning: 'you’re welcome; don’t mention it' },
      { chinese: '再见', pinyin: 'zàijiàn', type: 'phrase', meaning: 'goodbye; see you again' },
    ],
  },
  {
    id: 'lesson-3', number: '03', title: '你叫什么名字', subtitle: 'What’s your name?', topic: 'Introducing yourself',
    image: '/images/conversation-introductions.png', imageAlt: 'Two adult learners introducing themselves in a bright classroom',
    caption: 'A new introduction · 初次认识', kicker: 'GET TO KNOW SOMEONE', heroTitle: 'Ask someone’s name.',
    intro: 'Learn a simple way to ask someone’s name and introduce yourself in Chinese.',
    exchanges: [
      { number: '01', title: 'Ask and answer a name', tone: 'hello', turns: [
        { speaker: 'A', chinese: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', english: 'What’s your name?' },
        { speaker: 'B', chinese: '我叫李月。', pinyin: 'Wǒ jiào Lǐ Yuè.', english: 'My name is Li Yue.' },
      ] },
      { number: '02', title: 'Ask what someone does', tone: 'polite', turns: [
        { speaker: 'A', chinese: '你是老师吗？', pinyin: 'Nǐ shì lǎoshī ma?', english: 'Are you a teacher?' },
        { speaker: 'B', chinese: '我不是老师，我是学生。', pinyin: 'Wǒ bú shì lǎoshī, wǒ shì xuésheng.', english: 'No, I’m not. I’m a student.' },
      ] },
      { number: '03', title: 'Ask where someone is from', tone: 'sorry', turns: [
        { speaker: 'A', chinese: '你是中国人吗？', pinyin: 'Nǐ shì Zhōngguó rén ma?', english: 'Are you Chinese?' },
        { speaker: 'B', chinese: '我不是中国人，我是美国人。', pinyin: 'Wǒ bú shì Zhōngguó rén, wǒ shì Měiguó rén.', english: 'No, I’m not Chinese. I’m American.' },
      ] },
    ],
    words: [
      { chinese: '叫', pinyin: 'jiào', type: 'verb', meaning: 'to call; to be called' },
      { chinese: '什么', pinyin: 'shénme', type: 'pronoun', meaning: 'what' },
      { chinese: '名字', pinyin: 'míngzi', type: 'noun', meaning: 'name' },
      { chinese: '我', pinyin: 'wǒ', type: 'pronoun', meaning: 'I; me' },
      { chinese: '李月', pinyin: 'Lǐ Yuè', type: 'name', meaning: 'Li Yue (a person’s name)' },
      { chinese: '是', pinyin: 'shì', type: 'verb', meaning: 'to be' },
      { chinese: '老师', pinyin: 'lǎoshī', type: 'noun', meaning: 'teacher' },
      { chinese: '吗', pinyin: 'ma', type: 'particle', meaning: 'turns a statement into a yes/no question' },
      { chinese: '学生', pinyin: 'xuésheng', type: 'noun', meaning: 'student' },
      { chinese: '人', pinyin: 'rén', type: 'noun', meaning: 'person; people' },
      { chinese: '中国', pinyin: 'Zhōngguó', type: 'proper noun', meaning: 'China' },
      { chinese: '美国', pinyin: 'Měiguó', type: 'proper noun', meaning: 'the United States; America' },
    ],
  },
  ...bookLessons,
];

const LAST_LESSON_KEY = 'conversation-last-lesson';
const readLastLesson = () => { try { return localStorage.getItem(LAST_LESSON_KEY); } catch { return null; } };
const linesOf = lesson => lesson.exchanges.flatMap(exchange => exchange.turns.map((turn, index) => ({ ...turn, exchange, first: index === 0 })));

function SpeakerIcon({ playing, size = 22 }) {
  return playing
    ? <span className="cp-eq" aria-hidden="true"><i /><i /><i /></span>
    : <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

// One conversation line at a time: intro → lines → done. Same layout on phones and desktops.
function ConversationPracticePage({ onBack }) {
  const [availableLessons, setAvailableLessons] = useState(lessons);
  const [selectedLessonId, setSelectedLessonId] = useState(() => readLastLesson() || lessons[0].id);
  const [step, setStep] = useState(-1); // -1 intro, 0..n-1 lines, n done
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [playingKey, setPlayingKey] = useState('');
  const runRef = useRef(0);
  const touchRef = useRef(null);
  const headingRef = useRef(null);
  const speech = useChineseVoice();
  const voice = pickConversationVoice(speech.voices);
  const isGoogle = Boolean(voice && /google/i.test(voice.name));
  const [natural, setNatural] = useState(null); // null while checking, then true when the Azure voice is available
  const audioRef = useRef(null);

  useEffect(() => { let live = true; checkNaturalVoice().then(ok => { if (live) setNatural(ok); }); return () => { live = false; }; }, []);
  useEffect(() => () => { runRef.current++; window.speechSynthesis?.cancel(); audioRef.current?.pause(); }, []);
  useEffect(() => {
    apiFetch(`${window.API_BASE_URL}/api/settings`).then(response => response.json()).then(settings => {
      if (!Array.isArray(settings.conversationLessons)) return;
      setAvailableLessons(current => {
        const stored = settings.conversationLessons;
        const merged = current.map(item => stored.find(saved => saved.id === item.id) || item);
        return [...merged, ...stored.filter(saved => !current.some(item => item.id === saved.id))]
          .sort((a, b) => Number(a.number) - Number(b.number));
      });
    }).catch(() => {});
  }, []);

  const lesson = availableLessons.find(item => item.id === selectedLessonId) || availableLessons[0];
  const lessonIndex = availableLessons.findIndex(item => item.id === lesson.id);
  const nextLesson = availableLessons[lessonIndex + 1];
  const lines = linesOf(lesson);
  const line = lines[step];
  const done = step >= lines.length;

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [step, lesson.id]);

  const stop = () => { runRef.current++; window.speechSynthesis?.cancel(); audioRef.current?.pause(); audioRef.current = null; setPlayingKey(''); };
  // A line's own recording plays first. Without one (or if it can't load), the server voice reads
  // the line, and the browser voice is the last resort.
  const say = (key, text, speaker = 'A', recording = '') => {
    stop();
    const run = runRef.current;
    recordStudioActivity('conversation', null, text.trim().replace(/\s+/g, ' '));
    if (recording) {
      const audio = new Audio(mediaUrl(recording));
      audioRef.current = audio;
      audio.onended = () => { if (run === runRef.current) setPlayingKey(''); };
      audio.onerror = () => { if (run === runRef.current) speakGenerated(key, text, speaker, run); };
      setPlayingKey(key);
      audio.play().catch(error => { if (error?.name === 'NotAllowedError' && run === runRef.current) setPlayingKey(''); });
      return;
    }
    speakGenerated(key, text, speaker, run);
  };
  const speakGenerated = (key, text, speaker, run) => {
    if (natural) {
      // Natural Azure voice; if the clip can't load, the browser voice reads it instead.
      const audio = new Audio(naturalVoiceUrl(text, { speaker }));
      audioRef.current = audio;
      const finish = () => { if (run === runRef.current) setPlayingKey(''); };
      audio.onended = finish;
      audio.onerror = () => { if (run === runRef.current) browserSay(key, text, run); };
      setPlayingKey(key);
      audio.play().catch(error => { if (error?.name === 'NotAllowedError') finish(); }); // load failures go through onerror
      return;
    }
    browserSay(key, text, run);
  };
  const browserSay = (key, text, run) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { setPlayingKey(''); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang || 'zh-CN';
    if (voice) utterance.voice = voice;
    utterance.rate = 0.86;
    utterance.onstart = () => { if (run === runRef.current) setPlayingKey(key); };
    utterance.onend = utterance.onerror = () => { if (run === runRef.current) setPlayingKey(''); };
    setPlayingKey(key);
    window.speechSynthesis.speak(utterance);
  };
  // Moving to a line plays it straight away (the tap or key press allows audio).
  const goTo = next => {
    const target = Math.max(-1, Math.min(lines.length, next));
    setStep(target);
    // Each screen starts at the top of the card, even after tapping a control low on a short screen.
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
    if (target >= 0 && target < lines.length) say(`line-${target}`, lines[target].chinese, lines[target].speaker, lines[target].audioUrl); else stop();
  };
  const selectLesson = id => {
    stop(); setStep(-1); setSelectedLessonId(id); window.scrollTo({ top: 0, behavior: 'instant' });
    try { localStorage.setItem(LAST_LESSON_KEY, id); } catch { /* Remembering the lesson is optional. */ }
  };

  useEffect(() => {
    const onKey = event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('select, input, textarea')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(step + 1); }
      else if (event.key === 'ArrowLeft' && step >= 0) { event.preventDefault(); goTo(step - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const onTouchStart = event => { const t = event.touches[0]; touchRef.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = event => {
    const start = touchRef.current; touchRef.current = null;
    if (!start || step < 0 || done) return;
    const t = event.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(step + (dx < 0 ? 1 : -1));
  };

  const voiceNote = natural !== false ? null : !speech.loading && (!speech.supported || !voice
    ? 'No Mandarin voice in this browser. Open in Chrome to hear the Google voice.'
    : isGoogle ? null : `Google voice isn’t available here, so ${voice.name.replace(/\s*\(.*\)\s*$/, '')} is used. Chrome has the Google voice.`);

  return (
    <main className="container conversation-page cp-page" aria-labelledby="cp-title">
      <div className="cp-topbar">
        <button className="cp-back" type="button" onClick={onBack}>Practice studio</button>
        <label className="cp-lesson-select"><span className="cp-visually-hidden">Choose lesson</span>
          <select value={lesson.id} onChange={event => selectLesson(event.target.value)}>
            {availableLessons.map(item => <option key={item.id} value={item.id}>Lesson {item.number}: {item.title}, {item.subtitle}</option>)}
          </select>
        </label>
      </div>

      <section className={`cp-card${step < 0 ? ' is-intro' : done ? ' is-done' : ''}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite">
        {step < 0 && <div className="cp-intro">
          <div className="cp-intro-image"><img src={lesson.image} alt={lesson.imageAlt} width="1672" height="942" /></div>
          <div className="cp-intro-body">
            <p className="cp-eyebrow">Lesson {lesson.number}: {lesson.topic}</p>
            <h1 id="cp-title" ref={headingRef} tabIndex={-1}><span lang="zh-CN">{lesson.title}</span> <small>{lesson.subtitle}</small></h1>
            <p className="cp-intro-text">{lesson.intro}</p>
            <p className="cp-intro-meta"><span><Icon name="chat"/> {lines.length} lines</span><span>文 {lesson.words.length} words</span></p>
            <button type="button" className="cp-primary cp-start" onClick={() => goTo(0)}><Icon name="play"/> Start conversation</button>
            {voiceNote && <p className="cp-voice-note"><Icon name="speaker"/> {voiceNote}</p>}
          </div>
        </div>}

        {line && <>
          <div className="cp-line-head">
            <span className="cp-exchange-title"><b>{line.exchange.number}</b> {line.exchange.title}</span>
            <span className="cp-count">{step + 1} / {lines.length}</span>
          </div>
          <div className="cp-progress" aria-hidden="true"><i style={{ width: `${(step + 1) / lines.length * 100}%` }} /></div>
          <h1 id="cp-title" className="cp-visually-hidden" ref={headingRef} tabIndex={-1}>Line {step + 1} of {lines.length}: {line.exchange.title}</h1>
          <div className={`cp-line speaker-${line.speaker.toLowerCase()}`} key={step}>
            <span className="cp-speaker" aria-label={`Speaker ${line.speaker}`}>{line.speaker}</span>
            {showPinyin && <p className="cp-pinyin" lang="zh-Latn">{line.pinyin}</p>}
            <p className="cp-chinese" lang="zh-CN">{line.chinese}</p>
            {showEnglish && <p className="cp-english">{line.english}</p>}
            <button type="button" className={`cp-listen${playingKey === `line-${step}` ? ' is-playing' : ''}`} onClick={() => say(`line-${step}`, line.chinese, line.speaker, line.audioUrl)} aria-label={`Listen to ${line.pinyin}`}>
              <SpeakerIcon playing={playingKey === `line-${step}`} size={26} /><span>{playingKey === `line-${step}` ? 'Playing…' : 'Listen'}</span>
            </button>
          </div>
          <div className="cp-toggles" role="group" aria-label="Display options">
            <button type="button" aria-pressed={showPinyin} onClick={() => setShowPinyin(value => !value)}>Pinyin</button>
            <button type="button" aria-pressed={showEnglish} onClick={() => setShowEnglish(value => !value)}>English</button>
          </div>
          <div className="cp-nav">
            <button type="button" className="cp-secondary" onClick={() => goTo(step - 1)}>Back</button>
            <button type="button" className="cp-primary" onClick={() => goTo(step + 1)}>{step === lines.length - 1 ? 'Finish' : 'Next'}</button>
          </div>
          <p className="cp-hint" aria-hidden="true">Swipe or use the arrow keys</p>
        </>}

        {done && <div className="cp-done">
          <p className="cp-eyebrow"><Icon name="lantern"/> Lesson complete</p>
          <h1 id="cp-title" ref={headingRef} tabIndex={-1}>Nice work!</h1>
          <p className="cp-intro-text">Review the new words. Tap one to hear it.</p>
          <ul className="cp-words">{lesson.words.map(word => {
            const key = `word-${word.chinese}`;
            return <li key={word.chinese}><button type="button" className={playingKey === key ? 'is-playing' : ''} onClick={() => say(key, word.chinese)} aria-label={`Listen to ${word.chinese}, ${word.pinyin}: ${word.meaning}`}>
              <span lang="zh-CN">{word.chinese}</span><small lang="zh-Latn">{word.pinyin}</small><em>{word.meaning}</em><SpeakerIcon playing={playingKey === key} size={18} />
            </button></li>;
          })}</ul>
          <div className="cp-nav">
            <button type="button" className="cp-secondary" onClick={() => goTo(0)}>Practise again</button>
            {nextLesson ? <button type="button" className="cp-primary" onClick={() => selectLesson(nextLesson.id)}>Next lesson</button>
              : <button type="button" className="cp-primary" onClick={onBack}>Back to studio</button>}
          </div>
        </div>}
      </section>
    </main>
  );
}

export default ConversationPracticePage;
