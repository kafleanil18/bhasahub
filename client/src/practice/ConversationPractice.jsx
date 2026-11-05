import { useEffect, useState } from 'react';
import { bookLessons } from './conversationLessons';
import './ConversationPractice.css';

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

function ConversationPracticePage({ onBack }) {
  const [availableLessons, setAvailableLessons] = useState(lessons);
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0].id);
  const [translationsVisible, setTranslationsVisible] = useState(true);
  const [playingPhrase, setPlayingPhrase] = useState('');

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    fetch(`${window.API_BASE_URL}/api/settings`).then(response => response.json()).then(settings => {
      if (!Array.isArray(settings.conversationLessons)) return;
      setAvailableLessons(current => current.map(item => settings.conversationLessons.find(saved => saved.id === item.id) || item));
    }).catch(() => {});
  }, []);

  const lesson = availableLessons.find((item) => item.id === selectedLessonId) || availableLessons[0];

  const playPhrase = (phrase) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.86;
    utterance.onstart = () => setPlayingPhrase(phrase);
    utterance.onend = () => setPlayingPhrase('');
    utterance.onerror = () => setPlayingPhrase('');
    window.speechSynthesis.speak(utterance);
  };

  const selectLesson = (id) => {
    window.speechSynthesis?.cancel();
    setPlayingPhrase('');
    setSelectedLessonId(id);
  };

  return (
    <main className="container conversation-page" aria-labelledby="conversation-page-title">
      <button className="back-btn conversation-back" type="button" onClick={onBack}>← Back to practice studio</button>

      <section className="conversation-lesson-nav" aria-label="Choose a conversation lesson">
        <label className="conversation-lesson-select-wrap"><span>Choose lesson</span><select className="conversation-lesson-select" value={lesson.id} onChange={event => selectLesson(event.target.value)}>
          {availableLessons.map(item => <option key={item.id} value={item.id}>Lesson {item.number} · {item.title} — {item.subtitle}</option>)}
        </select></label>
        <span className="conversation-lesson-position">Lesson {availableLessons.findIndex(item => item.id === lesson.id) + 1} of {availableLessons.length}<span aria-hidden="true"> · </span>{lesson.topic}</span>
        <div className="conversation-lesson-stepper"><button type="button" onClick={() => selectLesson(availableLessons[Math.max(0, availableLessons.findIndex(item => item.id === lesson.id) - 1)].id)} disabled={availableLessons.findIndex(item => item.id === lesson.id) === 0}>← Previous</button><button type="button" onClick={() => selectLesson(availableLessons[Math.min(availableLessons.length - 1, availableLessons.findIndex(item => item.id === lesson.id) + 1)].id)} disabled={availableLessons.findIndex(item => item.id === lesson.id) === availableLessons.length - 1}>Next lesson →</button></div>
      </section>

      <header className="conversation-page-heading">
        <div>
          <p className="conversation-eyebrow">LESSON {lesson.number} · BEGINNER</p>
          <h2 id="conversation-page-title">{lesson.title} <span>{lesson.subtitle}</span></h2>
          <p className="conversation-lead">{lesson.intro}</p>
        </div>
        <div className="conversation-lesson-meta"><span>{lesson.exchanges.length} {lesson.exchanges.length === 1 ? 'conversation' : 'conversations'}</span><span>{lesson.words.length} new words</span></div>
      </header>

      <section className="conversation-hero" aria-label="Lesson introduction">
        <div className="conversation-hero-image">
          <img src={lesson.image} alt={lesson.imageAlt} width="1672" height="942" fetchPriority="high" />
          <span className="conversation-image-caption">{lesson.caption}</span>
        </div>
        <div className="conversation-hero-copy">
          <p className="conversation-hero-kicker">{lesson.kicker}</p>
          <h3>{lesson.heroTitle}</h3>
          <p>Listen to a sample phrase, then practice each exchange below.</p>
        <div className="conversation-hero-phrase"><span className="conversation-phrase-stack"><b lang="zh-Latn">{lesson.exchanges[0].turns[0].pinyin.replace(/[！!]/g, '')}</b><strong lang="zh-CN">{lesson.exchanges[0].turns[0].chinese.replace(/[！!]/g, '')}</strong><small>{lesson.exchanges[0].turns[0].english}</small></span><button type="button" onClick={() => playPhrase(lesson.exchanges[0].turns[0].chinese)} aria-label={`Listen to ${lesson.exchanges[0].turns[0].pinyin}`}>{playingPhrase === lesson.exchanges[0].turns[0].chinese ? '♫' : '▶'}</button></div>
        </div>
      </section>

      <div className="conversation-content-grid">
        <section className="conversation-exchanges" aria-labelledby="conversation-exchanges-title">
          <div className="conversation-section-heading">
            <div><p className="conversation-eyebrow">SPEAK IT OUT LOUD</p><h2 id="conversation-exchanges-title">Short conversations</h2><p className="conversation-dialogue-guide">Take turns: Speaker A starts, then Speaker B replies.</p></div>
            <button className="conversation-translation-toggle" type="button" aria-pressed={translationsVisible} onClick={() => setTranslationsVisible(value => !value)}>
              {translationsVisible ? 'Hide English' : 'Show English'}
            </button>
          </div>

          <nav className="conversation-jump-links" aria-label="Jump to a conversation">{lesson.exchanges.map((exchange, index) => <a key={exchange.number} href={`#conversation-${exchange.number}`}><span>{String(index + 1).padStart(2, '0')}</span>{exchange.title}</a>)}</nav>

          {lesson.exchanges.map((exchange) => (
            <article id={`conversation-${exchange.number}`} className={`conversation-exchange is-${exchange.tone}`} key={exchange.number}>
              <header className="conversation-exchange-heading"><span className="conversation-exchange-number">{exchange.number}</span><h3>{exchange.title}</h3></header>
              <div className="conversation-turns">
                {exchange.turns.map((turn, index) => (
                  <div className={`conversation-turn turn-${turn.speaker.toLowerCase()}`} key={`${exchange.number}-${index}-${turn.speaker}`}>
                    <span className="conversation-speaker" aria-label={`Speaker ${turn.speaker}`}>{turn.speaker}</span>
                    <div className="conversation-turn-copy">
                      <span lang="zh-Latn">{turn.pinyin}</span>
                      <strong lang="zh-CN">{turn.chinese}</strong>
                      {translationsVisible && <small>{turn.english}</small>}
                    </div>
                    <button className={`conversation-listen${playingPhrase === turn.chinese ? ' is-playing' : ''}`} type="button" onClick={() => playPhrase(turn.chinese)} aria-label={`${playingPhrase === turn.chinese ? 'Playing' : 'Listen to'} ${turn.pinyin}`} aria-pressed={playingPhrase === turn.chinese}>
                      <span aria-hidden="true">{playingPhrase === turn.chinese ? '♫' : '▶'}</span><span>{playingPhrase === turn.chinese ? 'Playing' : 'Listen'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <aside className="conversation-vocabulary" aria-labelledby="conversation-vocabulary-title">
          <div className="conversation-vocabulary-heading"><span aria-hidden="true">文</span><div><p className="conversation-eyebrow">WORDS TO KNOW</p><h2 id="conversation-vocabulary-title">New words</h2></div></div>
          <ol className="conversation-word-list">
            {lesson.words.map((word, index) => (
              <li className="conversation-word" key={word.chinese}>
                <span className="conversation-word-index">{index + 1}</span>
                <div className="conversation-word-main"><strong lang="zh-CN">{word.chinese}</strong><span lang="zh-Latn">{word.pinyin}</span></div>
                <div className="conversation-word-meaning"><small>{word.type}</small><span>{word.meaning}</span></div>
              </li>
            ))}
          </ol>
          <p className="conversation-vocabulary-note">Use <b>Listen</b> on a dialogue line, then say it aloud yourself.</p>
        </aside>
      </div>
    </main>
  );
}

export default ConversationPracticePage;
