import { Link } from 'react-router-dom';
import { liveClassInquiryHref } from '../components/contactPhone';
import { PLANS, formatRs } from '../pricing/plans';
import { FREE_ACCESS_DAYS } from '../access/practiceAccess';

// Questions about learning with Xiao Ao. Answers describe how the platform actually works
// (free access request, plans, practice tools), so keep them in step with those features.
function faqs() {
  const live = liveClassInquiryHref();
  return [
    ['I’m a complete beginner. Is Xiao Ao right for me?', <>Yes. Start with the <Link to="/practice/pinyin">pinyin chart</Link> to learn the sounds and four tones, then follow the HSK 1 course lesson by lesson. Every word comes with characters, pinyin, meaning and audio, so you never have to guess.</>],
    ['How does Xiao Ao prepare me for the HSK?', <>Our courses follow the HSK levels in order, so you learn the words and grammar each exam expects. Timed HSK mock tests show your score with a listening and reading breakdown, and nine practice tools train the exact skills the exam checks.</>],
    ['What can I try for free?', <>The pinyin chart is open to everyone, no account needed. Create a free account and request access to get <b>{FREE_ACCESS_DAYS} days of the practice studio and mock tests free</b> once an admin approves it. No payment and no card details. Free access is available once per account.</>],
    ['How much does a course plan cost?', <>{PLANS.map((plan, i) => <span key={plan.id}>{i ? ', ' : ''}{formatRs(plan.price)} for {plan.label}</span>)}. Every plan unlocks <b>all</b> HSK courses. See the <Link to="/pricing">pricing page</Link> for details.</>],
    ['How do I pay?', <>Choose a plan on the pricing page and we’ll email you the payment details. Your courses unlock as soon as the payment is confirmed. You can switch plans until then.</>],
    ['How much time should I spend each day?', <>Ten to fifteen minutes a day works better than one long session a week. Turn on the daily practice reminder and we’ll send one notification at your chosen time, skipped if you’ve already practised.</>],
    ['Will I learn to speak and understand, not just read?', <>Yes. Tone practice uses real teacher recordings, conversation practice walks you through dialogues line by line, and listening dictation trains your ear. You can switch between a female and a male Mandarin voice.{live && <> For speaking with a real person, <a href={live} target="_blank" rel="noopener noreferrer">ask us about live classes</a>.</>}</>],
    ['Do I have to learn Chinese characters?', <>HSK 1 and 2 papers show pinyin above the characters, so you can start with pinyin. From HSK 3 the exam uses characters only. The trace characters tool teaches stroke order so writing feels natural by then.</>],
    ['Can I learn on my phone?', <>Yes. Xiao Ao works in any modern browser. On your phone you can add it to your home screen and open it like an app.</>],
    ['How do I see my progress?', <>Sign in and open <b>My Progress</b> to see your course progress, mock test scores and practice across every studio. <b>My Courses</b> takes you straight back to your next lesson.</>],
  ];
}

export default function HskFaq() {
  return <div className="hsk-faq">
    {faqs().map(([question, answer], i) => <details key={question} className="hsk-faq-item" open={i === 0}>
      <summary><span>{question}</span><span className="hsk-faq-toggle" aria-hidden="true" /></summary>
      <div className="hsk-faq-answer"><p>{answer}</p></div>
    </details>)}
  </div>;
}
