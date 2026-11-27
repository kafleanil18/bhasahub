import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ChineseRoadmap.css';

// Each stop links to the course for its level (`/?level=…#courses` opens the home page's course list
// filtered to it) and to the practice studio tools that train its tasks, named as on the studio cards.
// Where there's no course for a level yet, the first link explains that level on About HSK instead.
const course = level => ({ kind: 'HSK course', to: `/?level=${encodeURIComponent(level)}#courses`, label: `${level} course` });
const milestones = [
  {
    label: 'Sounds', level: 'Before HSK 1', title: 'Get comfortable with tones',
    example: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello',
    tasks: ['Learn how to read pinyin and recognise the four tones.', 'Listen to a greeting, then say it aloud without reading.'],
    next: course('HSK 1'),
    practice: [['/practice/pinyin', 'Pinyin & tones'], ['/practice/listening', 'Listening practice']],
  },
  {
    label: 'First words', level: 'HSK 1–2', title: 'Use Chinese in everyday exchanges',
    example: '多少钱？', pinyin: 'Duōshao qián?', meaning: 'How much is it?',
    tasks: ['Practise introducing yourself and asking about time and prices.', 'Read short sentences and start recognising common characters without pinyin.'],
    next: course('HSK 2'),
    practice: [['/practice/numbers', 'Everyday numbers'], ['/practice/conversations', 'Conversation'], ['/practice/characters', 'Trace characters']],
  },
  {
    label: 'Conversation', level: 'HSK 3–4', title: 'Talk about what happened and why',
    example: '因为下雨，我没去。', pinyin: 'Yīnwèi xiàyǔ, wǒ méi qù.', meaning: 'Because it was raining, I didn’t go.',
    tasks: ['Retell a short dialogue in your own words.', 'Write a few sentences about your day, using connectors like 因为 and 但是.'],
    next: course('HSK 3'),
    practice: [['/practice/sentences', 'Sentence builder'], ['/practice/conversations', 'Conversation']],
  },
  {
    label: 'Longer texts', level: 'HSK 5–6', title: 'Follow and summarise an argument',
    example: '这篇文章的重点是什么？', pinyin: 'Zhè piān wénzhāng de zhòngdiǎn shì shénme?', meaning: 'What’s the main point of this article?',
    tasks: ['Summarise a short article or news clip from memory.', 'Practise reading and listening under timed conditions.'],
    next: { kind: 'About the level', to: '/about-hsk#hsk-levels-title', label: 'What HSK 5 and 6 expect' },
    practice: [['/practice/dictation', 'Listening dictation']],
  },
  {
    label: 'Advanced', level: 'HSK 7–9', title: 'Adapt your Chinese to the situation',
    example: '我们需要权衡利弊。', pinyin: 'Wǒmen xūyào quánhéng lìbì.', meaning: 'We need to weigh the pros and cons.',
    tasks: ['Present both sides of an issue and defend your view.', 'Translate a short passage, then check whether the register fits its audience.'],
    next: { kind: 'About the level', to: '/about-hsk#hsk-new-title', label: 'HSK 3.0 and levels 7 to 9' },
    practice: [['/practice/dictation', 'Listening dictation']],
  },
];

export default function ChineseRoadmap() {
  const [selected, setSelected] = useState(0);
  const milestone = milestones[selected];

  return <div className="chinese-roadmap">
    <ol className="roadmap-route" style={{ '--roadmap-progress': selected / (milestones.length - 1) }}>
      {milestones.map((item, index) => <li key={item.label}>
        <button type="button" aria-pressed={index === selected} aria-controls="roadmap-milestone"
          onClick={() => setSelected(index)}>
          <span className="roadmap-stop" aria-hidden="true">{index + 1}</span>
          <span>{item.label}</span>
        </button>
      </li>)}
    </ol>

    <div id="roadmap-milestone" aria-live="polite">
      <div key={milestone.label} className="roadmap-milestone">
        <div className="roadmap-plan">
          <p className="roadmap-level">{milestone.level}</p>
          <h3>{milestone.title}</h3>
          <ul>{milestone.tasks.map(task => <li key={task}>{task}</li>)}</ul>
          <dl className="roadmap-links">
            <div><dt>{milestone.next.kind}</dt><dd><Link to={milestone.next.to}>{milestone.next.label}</Link></dd></div>
            <div><dt>Practice studio</dt><dd>{milestone.practice.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</dd></div>
          </dl>
        </div>
        <figure className="roadmap-example">
          <p lang="zh-Hans">{milestone.example}</p>
          <figcaption>
            <span lang="zh-Latn-pinyin">{milestone.pinyin}</span>
            <span>{milestone.meaning}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  </div>;
}
