import { Link } from 'react-router-dom';
import ContactLinks from '../components/ContactLinks';
import { CONTACT_PHONE } from '../components/contactPhone';
import { useInitialLoad } from '../navigation/pageLoad';
import { mediaUrl } from '../utils/mediaUrl';
import NotFound from '../navigation/NotFound';
import ChineseRoadmap from '../hsk/ChineseRoadmap';
import { useAboutPage } from './aboutContent';
import { useTeam } from './useTeam';
import './AboutXiaoAo.css';

// About Xiao Ao: what the platform is, how it teaches, and who is behind it. The text is edited in
// Admin > About pages, and the page stays hidden until a super admin chooses to show it. The team
// comes from Admin > Teachers, so names, titles, bios and photos stay current.
const marks = ['步', '声', '考'];

function TeamMember({ member }) {
  const initial = (member.name || '?').trim().charAt(0).toUpperCase();
  return <li className="about-member">
    {member.photo
      ? <img className="about-member-photo" src={mediaUrl(member.photo)} alt="" width="96" height="96" loading="lazy" />
      : <span className="about-member-photo is-initial" aria-hidden="true">{initial}</span>}
    <div>
      <h3>{member.name}</h3>
      {member.title && <p className="about-member-title">{member.title}</p>}
      {member.bio && <p className="about-member-bio">{member.bio}</p>}
    </div>
  </li>;
}

// The page itself, from its text. The admin editor renders this too, as a live preview.
export function AboutXiaoAoView({ text, team, notice = null }) {
  return <article className="container about-page" aria-labelledby="about-title">
    {notice}
    <header className="about-hero">
      <p className="about-eyebrow">{text.eyebrow}</p>
      <h1 id="about-title">{text.title}</h1>
      <p className="about-lead">{text.lead}</p>
      <p className="about-motto">{text.motto}</p>
    </header>

    <section className="about-section" aria-labelledby="about-how-title">
      <h2 id="about-how-title">{text.howTitle}</h2>
      <ul className="about-principles">
        {marks.map((mark, index) => <li key={mark}>
          <span className="about-principle-mark" lang="zh-CN" aria-hidden="true">{mark}</span>
          <h3>{text[`principle${index + 1}Title`]}</h3>
          <p>{text[`principle${index + 1}Text`]}</p>
        </li>)}
      </ul>
    </section>

    <section className="about-section" aria-labelledby="chinese-roadmap-title">
      <h2 id="chinese-roadmap-title">{text.roadmapTitle}</h2>
      <p className="about-section-intro">{text.roadmapIntro}</p>
      <ChineseRoadmap />
    </section>

    <section className="about-section" aria-labelledby="about-offer-title">
      <h2 id="about-offer-title">{text.offerTitle}</h2>
      <dl className="about-offer">
        <div><dt><Link to="/#courses">HSK courses</Link></dt><dd>{text.offerCourses}</dd></div>
        <div><dt><Link to="/#practice-studio">Practice studio</Link></dt><dd>{text.offerStudio}</dd></div>
        <div><dt><Link to="/tests">HSK mock tests</Link></dt><dd>{text.offerTests}</dd></div>
        <div><dt>Live classes</dt><dd>{text.offerLive}</dd></div>
      </dl>
    </section>

    <section className="about-section" aria-labelledby="about-team-title">
      <h2 id="about-team-title">{text.teamTitle}</h2>
      <p className="about-section-intro">{text.teamIntro}</p>
      {team.failed ? <p className="about-team-note" role="status">We couldn’t load the team just now. Please try again later.</p>
        : team.members.length ? <ul className="about-team">{team.members.map(member => <TeamMember key={member._id || member.name} member={member} />)}</ul>
          : !team.loading && <p className="about-team-note">Our team will be introduced here soon.</p>}
    </section>

    <section className="about-cta" aria-labelledby="about-cta-title">
      <h2 id="about-cta-title">{text.ctaTitle}</h2>
      <p>{text.ctaText}{CONTACT_PHONE && ' For live classes, message us on WhatsApp or Viber.'}</p>
      <div className="about-cta-actions">
        <Link className="about-button" to="/practice/pinyin">Try pinyin practice</Link>
        <Link to="/#courses">See courses</Link>
        <ContactLinks label="Ask about live classes" />
      </div>
    </section>
  </article>;
}

export default function AboutXiaoAo({ user }) {
  const page = useAboutPage('xiao-ao');
  const team = useTeam();
  useInitialLoad(team.loading, 'Loading…');
  const superAdmin = user?.role === 'superadmin';
  if (page.loading) return null;
  if (!page.visible && !superAdmin) return <NotFound />;
  const notice = page.visible ? null : <p className="about-hidden-notice" role="status">Only you can see this page. It’s hidden from visitors until you show it in <Link to="/admin/about-pages">Admin &gt; About pages</Link>.</p>;
  return <AboutXiaoAoView text={page.text} team={team} notice={notice} />;
}
