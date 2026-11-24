import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { hskLevels, registerSteps, skills } from './hskData';
import HskFaq from './HskFaq';
import './AboutHsk.css';

const advanced = { level: '7–9', words: 11092, goodFor: 'Research, interpreting and professional work in Chinese', can: 'Work, study and translate in Chinese at a near-native level.' };
const steps = [...hskLevels, advanced];
const numerals = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', '7–9': '高' };
const band = level => (level === '7–9' ? 'advanced' : level <= 3 ? 'beginner' : 'intermediate');
const bandName = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const fmt = n => n.toLocaleString('en-US');
const short = n => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : String(n));

function SectionHead({ num, id, title, children }) {
  return <div className="hsk-head">
    <span className="hsk-head-num" aria-hidden="true">{num}</span>
    <div><h2 id={id}>{title}</h2>{children && <p>{children}</p>}</div>
  </div>;
}

export default function AboutHsk() {
  const [selected, setSelected] = useState(1);
  const step = steps.find(item => item.level === selected);
  const isAdvanced = step.level === '7–9';
  const choose = (event, index) => {
    const next = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const wrapped = (next + steps.length) % steps.length;
    setSelected(steps[wrapped].level);
    event.currentTarget.parentElement.children[wrapped].focus();
  };

  return <article className="hsk-page" aria-labelledby="hsk-title">
    <header className="hsk-hero">
      <span className="hsk-hero-mark" aria-hidden="true">汉语</span>
      <div className="container hsk-hero-inner">
        <div>
          <p className="hsk-eyebrow"><span lang="zh-Hans">汉语水平考试</span> · Hànyǔ Shuǐpíng Kǎoshì</p>
          <h1 id="hsk-title">What is the <em>HSK</em>?</h1>
          <p className="hsk-lead">The official international Chinese exam. It shows universities, scholarship committees and employers how well you know Mandarin.</p>
        </div>
        <dl className="hsk-hero-stats">
          <div><dd>6</dd><dt>levels, from first words to fluency</dt></div>
          <div><dd>150+</dd><dt>countries with test centres</dt></div>
          <div><dd>60%</dd><dt>of the total score to pass</dt></div>
        </dl>
      </div>
    </header>

    <div className="container hsk-inner">
      <section className="hsk-block" aria-labelledby="hsk-levels-title">
        <SectionHead num="01" id="hsk-levels-title" title="Pick a level">Each level roughly doubles the words of the one before. Tap a step to explore it.</SectionHead>

        <div className={`hsk-explorer is-${band(step.level)}`}>
          <div className="hsk-stairs" role="radiogroup" aria-labelledby="hsk-levels-title">
            {steps.map((item, index) => <button key={item.level} type="button" role="radio" aria-checked={selected === item.level} tabIndex={selected === item.level ? 0 : -1}
              className={`hsk-stair is-${band(item.level)}`} style={{ '--step': index + 1 }}
              onClick={() => setSelected(item.level)} onKeyDown={event => choose(event, index)}>
              {selected === item.level && <span className="hsk-stair-flag" aria-hidden="true" />}
              <span className="hsk-stair-level"><span className="hsk-sr-only">HSK </span>{item.level}</span>
              <span className="hsk-stair-words">{short(item.words)}<span className="hsk-sr-only"> words</span></span>
            </button>)}
          </div>
          <div className="hsk-bands" aria-hidden="true"><span>Beginner</span><span>Intermediate</span><span>Advanced</span></div>

          <div className="hsk-detail" aria-live="polite">
            <span className="hsk-detail-mark" aria-hidden="true" lang="zh-Hans">{numerals[step.level]}</span>
            <div className="hsk-detail-head">
              <h3>HSK {step.level}</h3><span className="hsk-tag">{bandName[band(step.level)]}</span>
            </div>
            <p className="hsk-can">{step.can}</p>
            <dl className="hsk-numbers">
              <div><dt>Words</dt><dd>{fmt(step.words)}</dd></div>
              {isAdvanced ? <>
                <div><dt>Exam time</dt><dd>~3.5 h</dd></div>
                <div><dt>Result</dt><dd>Level 7, 8 or 9</dd></div>
              </> : <>
                <div><dt>Questions</dt><dd>{step.questions}</dd></div>
                <div><dt>Exam time</dt><dd>{step.minutes} min</dd></div>
                <div><dt>Pass mark</dt><dd>{step.pass}<small> / {step.score}</small></dd></div>
              </>}
            </dl>
            <div className="hsk-detail-foot">
              <p className="hsk-good-for"><Icon name="target" /> <span><b>Good for</b> {step.goodFor}</span></p>
              <ul className="hsk-skills" aria-label="Sections in this exam">
                {isAdvanced ? <li><Icon name="sparkle" /> All five skills in one exam</li>
                  : step.skills.map(key => <li key={key}><Icon name={skills[key].icon} /> {skills[key].name}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="hsk-block" aria-labelledby="hsk-sections-title">
        <SectionHead num="02" id="hsk-sections-title" title="What’s in the exam">Every level tests listening and reading. Writing joins at HSK 3.</SectionHead>
        <div className="hsk-skill-cards">{Object.entries(skills).map(([key, item]) => <div key={key} className={`hsk-skill-card is-${key}`}>
          <span className="hsk-skill-icon"><Icon name={item.icon} size={24} /></span>
          <h3>{item.name} <span lang="zh-Hans">{item.zh}</span></h3>
          <p>{item.text}</p>
        </div>)}</div>
      </section>

      <section className="hsk-block" aria-labelledby="hsk-pass-title">
        <SectionHead num="03" id="hsk-pass-title" title="How you pass" />
        <div className="hsk-pass">
          <div className="hsk-pass-visual">
            <p className="hsk-pass-big">60<span>%</span></p>
            <p className="hsk-pass-caption">of the total score</p>
            <div className="hsk-pass-track" role="img" aria-label="You pass with 60 percent of the total score: 120 of 200 for HSK 1 and 2, 180 of 300 for HSK 3 to 6">
              <span className="hsk-pass-fail" /><span className="hsk-pass-ok" />
            </div>
            <div className="hsk-pass-legend" aria-hidden="true"><span><b>120</b> / 200 · HSK 1–2</span><span><b>180</b> / 300 · HSK 3–6</span></div>
          </div>
          <ul className="hsk-facts">
            <li><span className="hsk-fact-icon"><Icon name="checkCircle" size={20} /></span><span>Each section is worth <b>100 points</b>. Only the total needs to pass, so a strong section can carry a weaker one.</span></li>
            <li><span className="hsk-fact-icon"><Icon name="clock" size={20} /></span><span>Universities accept results from the <b>last 2 years</b>.</span></li>
            <li><span className="hsk-fact-icon"><Icon name="mic" size={20} /></span><span>Speaking is a <b>separate test</b> called HSKK, in three levels.</span></li>
          </ul>
        </div>
      </section>

      <section className="hsk-block" aria-labelledby="hsk-steps-title">
        <SectionHead num="04" id="hsk-steps-title" title="From booking to results" />
        <ol className="hsk-steps">{registerSteps.map(([icon, title, text], i) => <li key={title}>
          <span className="hsk-step-icon"><Icon name={icon} size={20} /><span className="hsk-step-num" aria-hidden="true">{i + 1}</span></span>
          <h3>{title}</h3><p>{text}</p>
        </li>)}</ol>
      </section>

      <aside className="hsk-new" aria-labelledby="hsk-new-title">
        <div>
          <p className="hsk-new-label"><Icon name="sparkle" /> On the way</p>
          <h2 id="hsk-new-title">HSK 3.0</h2>
          <p>A new standard is replacing the six levels with nine and adds speaking and translation. The advanced HSK 7–9 exam is already running. Check which version your test centre uses.</p>
        </div>
        <dl className="hsk-new-compare">
          <div><dt>Levels</dt><dd><s>6</s> <span aria-hidden="true">→</span><span className="hsk-sr-only">becomes</span> 9</dd></div>
          <div><dt>Top-level words</dt><dd><s>5,000</s> <span aria-hidden="true">→</span><span className="hsk-sr-only">becomes</span> 11,092</dd></div>
        </dl>
      </aside>

      <section className="hsk-block" aria-labelledby="hsk-faq-title">
        <SectionHead num="05" id="hsk-faq-title" title="Learning Chinese with Xiao Ao">Common questions from new students.</SectionHead>
        <HskFaq />
      </section>

      <section className="hsk-cta" aria-labelledby="hsk-cta-title">
        <span className="hsk-cta-mark" aria-hidden="true">考</span>
        <div>
          <h2 id="hsk-cta-title">Not sure which level you’re at?</h2>
          <p>A timed mock test shows you in about 40 minutes.</p>
        </div>
        <div className="hsk-cta-actions">
          <Link className="hsk-button is-primary" to="/tests"><Icon name="target" /> Take a mock test</Link>
          <Link className="hsk-button" to="/pricing">See courses →</Link>
        </div>
      </section>

      <p className="hsk-footnote">Dates, fees and formats vary by country. Always check <a href="https://www.chinesetest.cn" target="_blank" rel="noopener noreferrer">chinesetest.cn</a> before you book.</p>
    </div>
  </article>;
}
