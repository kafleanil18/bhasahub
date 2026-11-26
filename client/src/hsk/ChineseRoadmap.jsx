import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ChineseRoadmap.css';

const milestones = [
  {
    label: 'Sounds', level: 'Before HSK 1', title: 'Get comfortable with tones',
    example: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello',
    tasks: ['Learn how to read pinyin and recognise the four tones.', 'Listen to a greeting, then say it aloud without reading.'],
    to: '/practice/pinyin', action: 'Explore the pinyin chart',
  },
  {
    label: 'First words', level: 'HSK 1–2', title: 'Use Chinese in everyday exchanges',
    example: '多少钱？', pinyin: 'Duōshao qián?', meaning: 'How much is it?',
    tasks: ['Practise introducing yourself and asking about time and prices.', 'Read short sentences and start recognising common characters without pinyin.'],
    to: '/practice/conversations', action: 'Practise a conversation',
  },
  {
    label: 'Conversation', level: 'HSK 3–4', title: 'Talk about what happened and why',
    example: '因为下雨，我没去。', pinyin: 'Yīnwèi xiàyǔ, wǒ méi qù.', meaning: 'Because it was raining, I didn’t go.',
    tasks: ['Retell a short dialogue in your own words.', 'Write a few sentences about your day, using connectors like 因为 and 但是.'],
    to: '/practice/sentences', action: 'Practise building sentences',
  },
  {
    label: 'Longer texts', level: 'HSK 5–6', title: 'Follow and summarise an argument',
    example: '这篇文章的重点是什么？', pinyin: 'Zhè piān wénzhāng de zhòngdiǎn shì shénme?', meaning: 'What’s the main point of this article?',
    tasks: ['Summarise a short article or news clip from memory.', 'Practise reading and listening under timed conditions.'],
    to: '/tests', action: 'Browse timed mock tests',
  },
  {
    label: 'Advanced', level: 'HSK 7–9', title: 'Adapt your Chinese to the situation',
    example: '我们需要权衡利弊。', pinyin: 'Wǒmen xūyào quánhéng lìbì.', meaning: 'We need to weigh the pros and cons.',
    tasks: ['Present both sides of an issue and defend your view.', 'Translate a short passage, then check whether the register fits its audience.'],
    to: '/practice/dictation', action: 'Practise listening and transcription',
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
          <Link to={milestone.to}>{milestone.action}</Link>
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
