import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './PrivacyPages.css';
const FeedbackModal = lazy(() => import('../components/FeedbackModal'));

const storageRows = [
  ['Sign-in', 'A session token and basic account details keep you signed in.', 'Stored in this browser until sign-out or clearing site data. Tokens expire after seven days; expired values may remain in storage.'],
  ['Remembered email', 'If you choose “Remember me,” your email fills the sign-in form. Your password is not saved by this feature.', 'Until you turn off that choice or clear site data.'],
  ['Preferences', 'Your chosen appearance and flashcard audio setting.', 'Until changed or site data is cleared.'],
  ['Practice in this browser', 'Sentence-builder progress and grammar practice checkpoints.', 'Until site data is cleared. These local records are separate from My Progress on your account.'],
  ['HSK exam drafts', 'Answers and timing information help restore an unfinished exam in this browser.', 'Drafts can remain until replaced or site data is cleared. Server-side exam records are stored separately.'],
  ['Installed app & offline page', 'A service worker caches the offline notice so it can appear when the connection fails.', 'Old offline caches are removed when a newer worker activates; you can also clear site data. Lessons, API responses, and account data are not put in this offline cache.'],
  ['Third-party resources', 'Google sign-in, fonts, hosted styles, and media use connections to their providers.', 'Providers control their own cookies, browser storage, and retention. See the Privacy Policy for details.'],
];

// The policy pages share one layout, with a tab for each page.
const POLICIES = {
  privacy: { title: 'Privacy Policy', path: '/privacy', eyebrow: 'Xiao Ao · Your information', updated: ['2026-11-26', '26 November 2026'] },
  cookies: { title: 'Cookies & browser storage', path: '/cookies', eyebrow: 'Xiao Ao · Your information', updated: ['2026-11-13', '13 November 2026'] },
  terms: { title: 'Terms of Service', path: '/terms', eyebrow: 'Xiao Ao · Using the service', updated: ['2026-11-26', '26 November 2026'] },
};

function PolicyLayout({ page, children }) {
  const { title, eyebrow, updated: [date, label] } = POLICIES[page];
  return <main className="container privacy-page" aria-labelledby="privacy-page-title">
    <Link className="privacy-back" to="/">← Back to home</Link>
    <header className="privacy-page-header"><p className="privacy-eyebrow">{eyebrow}</p><h1 id="privacy-page-title">{title}</h1><p>Last updated: <time dateTime={date}>{label}</time></p></header>
    <nav className="privacy-page-nav" aria-label="Policy pages">{Object.entries(POLICIES).map(([key, policy]) => <Link key={key} to={policy.path} aria-current={key === page ? 'page' : undefined}>{policy.title}</Link>)}</nav>
    <article className="privacy-document">{children}</article>
  </main>;
}

export function PrivacyPolicy({ user }) {
  const [contact, setContact] = useState(false);
  const [pointToContact, setPointToContact] = useState(false);
  const contactButton = useRef(null);
  // "Erase all my data" takes the reader down to the privacy request button and briefly highlights it.
  const goToContact = event => {
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('privacy-contact')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    contactButton.current?.focus({ preventScroll: true });
    setPointToContact(true);
  };
  useEffect(() => {
    if (!pointToContact) return undefined;
    const timer = window.setTimeout(() => setPointToContact(false), 2600);
    return () => window.clearTimeout(timer);
  }, [pointToContact]);

  return <PolicyLayout page="privacy">
    <p>Xiao Ao is the Chinese-learning service provided by the Xiao Ao teaching and administration team. This notice explains how information is used when you browse, create an account, take lessons, practice, or contact us.</p>
    <section><h2>Information we collect</h2><ul>
      <li><strong>Your account:</strong> name, email address, role, account dates, and a password hash if you register with a password. Google sign-in can provide your Google account identifier, name, email, and profile image.</li>
      <li><strong>Your learning:</strong> course enrollment and access dates, lesson completion, vocabulary quiz results, vocabulary-review schedules, studio question or activity identifiers, first-answer correctness, and activity dates.</li>
      <li><strong>Your tests:</strong> started and submitted HSK attempts, answers, scores, and timestamps. Some unfinished exam information is also saved in your browser.</li>
      <li><strong>Your messages and submissions:</strong> enquiries, feedback, reviews, ratings, and any photos or recordings you choose to upload. Approved reviews, including the submitted name and optional photo, appear publicly.</li>
      <li><strong>Service records:</strong> student sign-in dates and methods, administrator actions, and reminder delivery records. Hosting and resource providers receive technical connection information, such as IP addresses and browser information, when your device connects.</li>
    </ul></section>
    <section><h2>How we use information</h2><p>We use it to create and protect accounts, provide course access, save and display learning progress, grade exercises and tests, respond to messages, review submissions, and operate the service. The teaching team can view student information needed to administer learning and access.</p><p>Where available, teachers may send practice reminders. Reminder emails include an unsubscribe option. Account verification and password-reset messages support access to your account.</p><p>Depending on the laws that apply, processing may be based on providing the service you request, legitimate interests in operating and securing the service, legal obligations, or consent for activities that require it. A browser microphone permission lets the site access your microphone; it does not by itself explain or authorize every later use of a recording.</p></section>
    <section><h2>Who receives information</h2><ul>
      <li><strong>Hosting:</strong> Vercel serves the website and Render runs the application API. Account and learning records are held in the application's configured database.</li>
      <li><strong>Google:</strong> Google Identity Services supports Google sign-in, and Google Fonts supplies fonts. The sign-in script and fonts currently load when pages open, so Google receives connection information even if you do not complete Google sign-in.</li>
      <li><strong>Styles and media:</strong> jsDelivr supplies shared styles. Cloudinary stores uploaded images and audio and delivers hosted media. Playing or viewing hosted resources connects to their providers.</li>
      <li><strong>Email:</strong> messages are processed by the email provider configured by the team, such as an SMTP provider, Resend, or Brevo.</li>
      <li><strong>AI tone feedback:</strong> if you submit a recording for AI tone evaluation and that feature is configured, your audio and target word/pronunciation information are sent to Google Gemini to generate feedback.</li>
      <li><strong>Device speech:</strong> some pronunciation playback uses your device or browser speech service; that service may process text remotely according to your device settings.</li>
    </ul><p>Providers may process information outside your country. Their processing and retention also depend on their own terms and privacy notices: <a href="https://policies.google.com/privacy">Google</a>, <a href="https://vercel.com/legal/privacy-policy">Vercel</a>, <a href="https://render.com/privacy">Render</a>, <a href="https://cloudinary.com/privacy">Cloudinary</a>, and <a href="https://www.jsdelivr.com/terms/privacy-policy">jsDelivr</a>.</p></section>
    <section><h2>Cookies, storage, and tracking</h2><p>The application uses browser storage for sign-in, preferences, practice, exam drafts, and the offline notice. We do not currently include advertising pixels or a third-party visitor-analytics SDK in the application. My Progress is account-based learning activity, rather than advertising tracking.</p><p>This does not mean third-party services never use cookies or collect connection information. Read <Link to="/cookies">Cookies & browser storage</Link> for the storage inventory and available controls.</p></section>
    <section><h2>How long information stays</h2><p>Account and learning records currently have no automatic expiry in the application. They remain until removed by the team or handled through a deletion request. Uploaded media, messages, and operational records may have separate retention. Provider logs and backups are managed separately, and removal from application records may not immediately remove all provider copies.</p><p>Browser storage generally remains until it is replaced, explicitly removed, or cleared using browser settings. Signing out removes the active sign-in token and account details, but does not clear every preference, practice record, or exam draft.</p></section>
    <section><h2>Your choices and requests</h2><p>You can change your password, sign out, turn off remembered email, and clear this site's browser data. My Progress lets you reset a studio's unique count after confirmation; that reset does not delete your account, course completion, HSK results, or separate local practice records.</p><p>You can contact the team to request access, correction, a copy, or deletion of your information, or ask about restricting or objecting to processing. The rights and any exceptions depend on applicable law. You may also be entitled to complain to your local data-protection authority. We may need to verify your identity before handling a request. Do not send your password.</p></section>
    <section id="privacy-deletion"><h2>Deleting your account and data</h2>
      <p>You can ask the team to delete your account at any time. There is no delete button in the app yet, so send a request using the form under <a href="#privacy-contact" onClick={goToContact}>Contact the team</a>. We may ask you to confirm the request from the email address on your account.</p>
      <p>Deleting your account permanently removes it and the records tied to it:</p>
      <ul>
        <li>your account details and sign-in history;</li>
        <li>course access, plans, saved courses, and plan and access requests;</li>
        <li>lesson progress, quiz results, and HSK test attempts and scores;</li>
        <li>practice studio activity and vocabulary review schedules;</li>
        <li>practice reminder settings, reminder records, and notification subscriptions.</li>
      </ul>
      <p>Deletion can't be undone, and any active plan or course access ends with it. Messages you sent, reviews you submitted, and photos or recordings you uploaded are kept unless you ask for full erasure. Records of administrator actions that mention your account may be kept to protect the service, and copies in our providers' backups and logs are removed on their own schedules. Data saved in your browser stays on your device until you clear it; see <Link to="/cookies">Cookies & browser storage</Link>.</p>
      <p className="privacy-erase"><strong>Want everything erased?</strong> Ask for full erasure and we'll also delete your messages, reviews, and uploaded photos and recordings, unless the law requires us to keep something. <a href="#privacy-contact" onClick={goToContact}>Ask the team to erase all my data <span aria-hidden="true">↓</span></a></p>
    </section>
    <section id="privacy-contact" className={pointToContact ? 'is-pointed' : undefined}><h2>Contact the team</h2><p>Use the privacy request form to ask a question or request help with your information. It sends your name, reply email, and message to the team's administrator inbox. Sending a request does not automatically delete an account.</p><button ref={contactButton} type="button" className="btn-primary" onClick={() => setContact(true)} aria-haspopup="dialog">Contact us about privacy</button></section>
    <section><h2>Updates to this notice</h2><p>We update this page when the service or its information practices change. The date above identifies this version.</p></section>
    {contact && <Suspense fallback={<p role="status">Opening privacy request form…</p>}><FeedbackModal user={user} privacyRequest onClose={() => setContact(false)} /></Suspense>}
  </PolicyLayout>;
}

export function BrowserStoragePolicy() {
  return <PolicyLayout page="cookies">
    <p>Cookies are small values a website can store in your browser. This site also uses local storage and an offline cache. These are different browser technologies, but they can all hold information on your device.</p>
    <section><h2>What this site stores</h2><div className="privacy-table-wrap"><table><caption>Browser storage used by Xiao Ao</caption><thead><tr><th scope="col">Feature</th><th scope="col">Purpose</th><th scope="col">Duration and controls</th></tr></thead><tbody>{storageRows.map(([feature, purpose, duration]) => <tr key={feature}><th scope="row">{feature}</th><td>{purpose}</td><td>{duration}</td></tr>)}</tbody></table></div></section>
    <section><h2>Learning records are separate</h2><p>Course access, lesson completion, studio counts, quiz results, and HSK attempts are also saved to your account on the server. Clearing browser data does not delete those records. Resetting a studio count in My Progress does not clear your local sentence-builder or grammar practice history.</p></section>
    <section><h2>Manage storage in your browser</h2><p>Use your browser's settings for this website to inspect or clear cookies, site data, local storage, and cached content. Clearing data can sign you out and remove preferences and unfinished work saved only in that browser. Save or submit an exam before clearing site data.</p><p>Turn off “Remember me” on the sign-in page to remove the remembered email. Sign out after using a shared device; use the browser's site-data controls if you also need to remove local drafts and preferences.</p></section>
    <section><h2>Optional tracking and third parties</h2><p>The application does not currently offer advertising or visitor-analytics cookies to accept. This page is an explanation of storage, not a consent prompt. Google sign-in, Google Fonts, jsDelivr, and hosted media can receive connection information and apply their own storage practices.</p><p>If optional tracking that requires consent is introduced, it will need appropriate controls before it runs. Read the <Link to="/privacy">Privacy Policy</Link> for recipients and uses, or <Link to="/privacy#privacy-contact">contact the team</Link> about your information.</p></section>
  </PolicyLayout>;
}

export function TermsOfService() {
  return <PolicyLayout page="terms">
    <p>These terms apply when you use Xiao Ao, the Chinese-learning service provided by the Xiao Ao teaching and administration team. By creating an account or using the service, you agree to them. If you don't agree, please don't use Xiao Ao.</p>
    <section><h2>Your account</h2><ul>
      <li>Give accurate information when you sign up, and keep your password private. You're responsible for what happens on your account.</li>
      <li>Each account is for one person. Don't share your account or let anyone else use your access.</li>
      <li>If you're too young to accept these terms where you live, use Xiao Ao only with a parent's or guardian's permission.</li>
      <li>Tell us straight away if you think someone else has used your account.</li>
    </ul></section>
    <section><h2>Free access, plans and payments</h2><ul>
      <li>Some features are free: the pinyin chart, and one full HSK 1 mock test with a free account. You can ask once for a free week of the practice studio and the other mock tests, which starts when the team approves it.</li>
      <li>Plans last 1, 3 or 6 months at the prices shown on the <Link to="/pricing">pricing page</Link>. After you choose a plan, we email you how to pay. Your plan starts when the payment is confirmed, ends when its time is up, and never renews automatically.</li>
      <li>A plan unlocks every HSK course, the practice studio and every mock test for one person while it lasts.</li>
      <li>If something goes wrong with a payment or your access, contact the team and we'll look into it.</li>
      <li>We may change prices or what's included for free. Changes don't affect a plan you've already paid for.</li>
    </ul></section>
    <section><h2>Using Xiao Ao fairly</h2><p>Please don't:</p><ul>
      <li>copy, sell or share our lessons, recordings or mock tests outside Xiao Ao;</li>
      <li>try to get around access limits, or reach other people's accounts or information;</li>
      <li>scrape, overload or disrupt the service, or access it with automated tools;</li>
      <li>upload anything unlawful, harmful or misleading, or anything that infringes someone else's rights;</li>
      <li>harass other learners or the team.</li>
    </ul></section>
    <section><h2>Your content</h2><p>You own the reviews, feedback, photos and recordings you send us. You give us permission to store and use them to run Xiao Ao. For reviews you submit for publication, that includes showing them publicly, with the name and photo you provide, once approved. You can ask us to remove them at any time.</p></section>
    <section><h2>Our content</h2><p>Lessons, recordings, mock tests, text, images and software on Xiao Ao belong to us or to the people who license them to us. You may use them for your own learning while you have access.</p><p>The HSK is an official exam run by its own organisers. Xiao Ao isn't affiliated with or endorsed by them. Our mock tests are practice only and don't give official scores or certificates.</p></section>
    <section><h2>Availability and changes</h2><p>We work to keep Xiao Ao running, but it may sometimes be unavailable, for example during maintenance or when a provider has problems. We may update, add or remove courses, practice tools and other features.</p></section>
    <section><h2>Suspending or closing accounts</h2><p>We may suspend or close an account that breaks these terms or puts the service or other people at risk. You can stop using Xiao Ao at any time, and you can ask us to delete your account and data. See <Link to="/privacy#privacy-deletion">Deleting your account and data</Link>.</p></section>
    <section><h2>Our responsibility</h2><p>We provide Xiao Ao as it is and do our best to keep its content accurate, but we can't promise it will always be error-free or that you'll pass an exam. As far as the law allows, we're not responsible for indirect losses that come from using the service. Nothing in these terms takes away rights you have under consumer law that can't be excluded.</p></section>
    <section><h2>Changes to these terms</h2><p>We may update these terms as the service changes. The date above shows the current version, and we'll tell you on the site or by email about important changes. If you keep using Xiao Ao after an update, the new terms apply.</p></section>
    <section><h2>Contact</h2><p>Questions about these terms? <Link to="/privacy#privacy-contact">Contact the team</Link>.</p></section>
  </PolicyLayout>;
}
