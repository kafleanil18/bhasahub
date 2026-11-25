import { useState } from 'react';
import { Link } from 'react-router-dom';
import { hskLevels, registerSteps, skills } from './hskData';
import ChineseRoadmap from './ChineseRoadmap';
import HskFaq from './HskFaq';
import './AboutHsk.css';

const advanced = { level: '7–9', words: 11092, goodFor: 'Research, interpreting and professional work in Chinese', can: 'Work, study and translate in Chinese at a near-native level.' };
const levels = [...hskLevels, advanced];
const sections = {
  roadmap: ['chinese-roadmap-title', 'Chinese learning roadmap'],
  levels: ['hsk-levels-title', 'Pick a level'],
  exam: ['hsk-sections-title', 'What’s in the exam'],
  scoring: ['hsk-pass-title', 'How you pass'],
  booking: ['hsk-steps-title', 'From booking to results'],
  update: ['hsk-new-title', 'HSK 3.0'],
  faq: ['hsk-faq-title', 'Learning Chinese with Xiao Ao'],
};

function GuideSection({ section, children }) {
  const [id, title] = sections[section];
  return <section className="hsk-block" aria-labelledby={id}>
    <h2 id={id} tabIndex={-1}>{title}</h2>
    {children}
  </section>;
}

function LevelPicker() {
  const [selected, setSelected] = useState(0);
  const level = levels[selected];
  const isAdvanced = level === advanced;

  function choose(event, index) {
    const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const next = (index + offset + levels.length) % levels.length;
    setSelected(next);
    event.currentTarget.parentElement.children[next].focus();
  }

  return <GuideSection section="levels">
    <p className="hsk-intro">Compare the vocabulary, test length and pass mark for each level.</p>
    <div className="hsk-levels" role="radiogroup" aria-labelledby={sections.levels[0]}>
      {levels.map((item, index) => <button
        key={item.level}
        type="button"
        role="radio"
        aria-label={`HSK ${item.level}`}
        aria-checked={selected === index}
        tabIndex={selected === index ? 0 : -1}
        onClick={() => setSelected(index)}
        onKeyDown={event => choose(event, index)}
      ><span aria-hidden="true">HSK</span> {item.level}</button>)}
    </div>

    <div className="hsk-detail" aria-live="polite">
      <div className="hsk-detail-heading">
        <h3>HSK {level.level}</h3>
        <p>{isAdvanced ? 'Advanced' : level.level <= 3 ? 'Beginner' : 'Intermediate'}</p>
      </div>
      <p className="hsk-can">{level.can}</p>
      <dl className="hsk-numbers">
        <div><dt>Words</dt><dd>{level.words.toLocaleString('en-US')}</dd></div>
        {!isAdvanced && <div><dt>Questions</dt><dd>{level.questions}</dd></div>}
        <div><dt>Exam time</dt><dd>{isAdvanced ? '~3.5 h' : `${level.minutes} min`}</dd></div>
        {isAdvanced
          ? <div><dt>Result</dt><dd>Level 7, 8 or 9</dd></div>
          : <div><dt>Pass mark</dt><dd>{level.pass} <small>/ {level.score}</small></dd></div>}
      </dl>
      <p className="hsk-good-for"><strong>Good for</strong> {level.goodFor}</p>
      <ul className="hsk-skills" aria-label="Sections in this exam">
        {isAdvanced
          ? <li>All five skills in one exam</li>
          : level.skills.map(key => <li key={key}>{skills[key].name}</li>)}
      </ul>
    </div>
  </GuideSection>;
}

export default function AboutHsk() {
  return <article className="container hsk-page" aria-labelledby="hsk-title">
    <header className="hsk-hero">
      <div>
        <p className="hsk-exam-name"><span lang="zh-Hans">汉语水平考试</span><span>Hànyǔ Shuǐpíng Kǎoshì</span></p>
        <h1 id="hsk-title">What is the HSK?</h1>
        <p className="hsk-lead">The HSK is the official international Mandarin proficiency exam. Universities, scholarship programmes and employers use it to see what you can do in Chinese.</p>
      </div>
      <img className="hsk-hero-photo" src="/images/blog_hsk.jpg" width="1376" height="768"
        alt="An open Chinese workbook beside a laptop and headphones" />
    </header>

    <div className="hsk-layout">
      <nav className="hsk-contents" aria-label="On this page">
        <p>On this page</p>
        <ul>{Object.values(sections).map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}</ul>
      </nav>

      <div className="hsk-guide">
        <GuideSection section="roadmap">
          <p className="hsk-intro">Start with sounds or jump to the stage that matches what you can already do.</p>
          <ChineseRoadmap />
        </GuideSection>

        <LevelPicker />

        <GuideSection section="exam">
          <p className="hsk-intro">HSK 1–6 all test listening and reading. Writing starts at HSK 3.</p>
          <dl className="hsk-exam-skills">{Object.values(skills).map(item => <div key={item.name}>
            <dt>{item.name} <span lang="zh-Hans">{item.zh}</span></dt>
            <dd>{item.text}</dd>
          </div>)}</dl>
        </GuideSection>

        <GuideSection section="scoring">
          <div className="hsk-pass">
            <div className="hsk-pass-score">
              <p><strong>60%</strong> of the total score</p>
              <div className="hsk-pass-track" role="img" aria-label="You pass with 60 percent of the total score for HSK 1 to 6" />
              <dl>
                <div><dt>HSK 1–2</dt><dd>120 / 200</dd></div>
                <div><dt>HSK 3–6</dt><dd>180 / 300</dd></div>
              </dl>
            </div>
            <ul className="hsk-facts">
              <li>Each section is worth <strong>100 points</strong>. A strong section can make up for a weaker one.</li>
              <li>Universities accept results from the <strong>last two years</strong>.</li>
              <li>For HSK 1–6, speaking is a separate test called <strong>HSKK</strong>.</li>
            </ul>
          </div>
        </GuideSection>

        <GuideSection section="booking">
          <ol className="hsk-steps">{registerSteps.map(([, title, description]) => <li key={title}>
            <h3>{title}</h3><p>{description}</p>
          </li>)}</ol>
          <p className="hsk-booking-note">Check dates, fees and formats at <a href="https://www.chinesetest.cn" target="_blank" rel="noopener noreferrer">chinesetest.cn</a> before you book.</p>
        </GuideSection>

        <GuideSection section="update">
          <div className="hsk-update">
            <p>The new standard expands the HSK from six levels to nine and adds speaking and translation. The advanced HSK 7–9 exam is already running. Check which version your test centre uses.</p>
            <p>The vocabulary target at the highest level rises from <strong>5,000 to 11,092 words</strong>.</p>
          </div>
        </GuideSection>

        <GuideSection section="faq">
          <HskFaq />
        </GuideSection>

        <section className="hsk-cta" aria-labelledby="hsk-cta-title">
          <h2 id="hsk-cta-title">Try a timed mock test</h2>
          <p>Get a feel for the exam and see which sections you need to practise.</p>
          <div className="hsk-cta-actions">
            <Link className="hsk-button" to="/tests">Take a mock test</Link>
            <Link to="/pricing">See courses <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </div>
    </div>
  </article>;
}
