import { lazy, Suspense, useState } from 'react';
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

function PolicyLayout({ storage, children }) {
  return <main className="container privacy-page" aria-labelledby="privacy-page-title">
    <Link className="privacy-back" to="/">← Back to home</Link>
    <header className="privacy-page-header"><p className="privacy-eyebrow">Xiao Ao · Your information</p><h1 id="privacy-page-title">{storage ? 'Cookies & browser storage' : 'Privacy Policy'}</h1><p>Last updated: <time dateTime="2026-11-13">13 November 2026</time></p></header>
    <nav className="privacy-page-nav" aria-label="Policy pages"><Link to="/privacy" aria-current={!storage ? 'page' : undefined}>Privacy Policy</Link><Link to="/cookies" aria-current={storage ? 'page' : undefined}>Cookies & browser storage</Link></nav>
    <article className="privacy-document">{children}</article>
  </main>;
}

export function PrivacyPolicy({ user }) {
  const [contact, setContact] = useState(false);
  return <PolicyLayout>
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
    <section id="privacy-contact"><h2>Contact the team</h2><p>Use the privacy request form to ask a question or request help with your information. It sends your name, reply email, and message to the team's administrator inbox. Sending a request does not automatically delete an account.</p><button type="button" className="btn-primary" onClick={() => setContact(true)} aria-haspopup="dialog">Contact us about privacy</button></section>
    <section><h2>Updates to this notice</h2><p>We update this page when the service or its information practices change. The date above identifies this version.</p></section>
    {contact && <Suspense fallback={<p role="status">Opening privacy request form…</p>}><FeedbackModal user={user} privacyRequest onClose={() => setContact(false)} /></Suspense>}
  </PolicyLayout>;
}

export function BrowserStoragePolicy() {
  return <PolicyLayout storage>
    <p>Cookies are small values a website can store in your browser. This site also uses local storage and an offline cache. These are different browser technologies, but they can all hold information on your device.</p>
    <section><h2>What this site stores</h2><div className="privacy-table-wrap"><table><caption>Browser storage used by Xiao Ao</caption><thead><tr><th scope="col">Feature</th><th scope="col">Purpose</th><th scope="col">Duration and controls</th></tr></thead><tbody>{storageRows.map(([feature, purpose, duration]) => <tr key={feature}><th scope="row">{feature}</th><td>{purpose}</td><td>{duration}</td></tr>)}</tbody></table></div></section>
    <section><h2>Learning records are separate</h2><p>Course access, lesson completion, studio counts, quiz results, and HSK attempts are also saved to your account on the server. Clearing browser data does not delete those records. Resetting a studio count in My Progress does not clear your local sentence-builder or grammar practice history.</p></section>
    <section><h2>Manage storage in your browser</h2><p>Use your browser's settings for this website to inspect or clear cookies, site data, local storage, and cached content. Clearing data can sign you out and remove preferences and unfinished work saved only in that browser. Save or submit an exam before clearing site data.</p><p>Turn off “Remember me” on the sign-in page to remove the remembered email. Sign out after using a shared device; use the browser's site-data controls if you also need to remove local drafts and preferences.</p></section>
    <section><h2>Optional tracking and third parties</h2><p>The application does not currently offer advertising or visitor-analytics cookies to accept. This page is an explanation of storage, not a consent prompt. Google sign-in, Google Fonts, jsDelivr, and hosted media can receive connection information and apply their own storage practices.</p><p>If optional tracking that requires consent is introduced, it will need appropriate controls before it runs. Read the <Link to="/privacy">Privacy Policy</Link> for recipients and uses, or <Link to="/privacy#privacy-contact">contact the team</Link> about your information.</p></section>
  </PolicyLayout>;
}
