# BhasaHub (Xiao Ao) documentation

Xiao Ao is a Chinese-learning site: HSK courses, a practice studio, HSK 1 mock tests and an admin area. The repository is called BhasaHub. This page gives an overview of the whole system and links to the detailed docs.

Last reviewed: 25 November 2026, at commit `0d69b2b`.

## How the system fits together

| Part | Where it runs | What it does |
|---|---|---|
| Client (`client/`) | Vercel, `https://bhasahub.vercel.app` | React 19 + Vite single-page app. It's also a PWA. `vercel.json` builds it and rewrites every path to `index.html`. |
| API (`server/`) | Render, service `bhasahub-api`, `https://bhasahub.onrender.com` | Express 5 + Mongoose 9. Every route is under `/api`. The free plan sleeps when idle and takes about a minute to wake. |
| Database | MongoDB Atlas (production), local `language-lms` (development) | All accounts, content, progress, attempts, settings and cached voice audio. |
| Media | Cloudinary, folder `bhashahub` | Every uploaded picture, recording and video. The database stores only the Cloudinary URL. |
| Mandarin voice | Azure AI Speech (optional) | Natural female and male voices. Each phrase is generated once and kept in the `ttsaudios` collection. |
| Email | Google SMTP, SMTP, Resend or Brevo | Sign-in codes, password resets, plan-request emails and practice reminders. Set up under **Admin → Email settings** or with environment variables. |
| Push reminders | Web Push (VAPID), plus a GitHub Actions workflow | `.github/workflows/daily-reminders.yml` wakes the API every 30 minutes to send due daily reminders. |
| Static exam assets | `client/public/hsk1/` | Recordings and pictures for the built-in mock tests. They ship with the client. |

The client finds the API through `window.API_BASE_URL`, which is set in `client/index.html`:

- `VITE_API_BASE_URL`, set at build time on Vercel, in production;
- `http://<host>:5001` when the page is served on port 5173 (local development);
- otherwise the same origin, for when one server serves both the site and the API.

## Roles

| Role | Can do |
|---|---|
| Visitor | Home page, pricing, About HSK, the pinyin chart, privacy pages |
| Student | Courses they have access to, practice studio (after access is approved), mock tests, progress |
| Admin | Test Studio (preview and publish papers) and Subscriptions |
| Superadmin | Everything: courses, students, users, recordings, mock-test editing, email settings, reminders, audit log |

## Features and where they live

### Access, free week and plans
- Students request access when they sign in. Until a superadmin approves it, the practice studio pages show a lock panel.
- Approved free access lasts 7 days and can be used once.
- Paid plans (1, 3 or 6 months, in Nepali rupees) are requested on `/pricing`. A superadmin starts the plan once the payment arrives.
- Details: [practice-access.md](practice-access.md).

### Admin notifications
- The superadmin header has a bell that lists everything waiting:
  - plan requests;
  - access requests;
  - student testimonials awaiting approval;
  - unread feedback.
- Each item has a tag, and the tags filter the list. Clicking an item opens the page where it's handled. Plan and access requests open Subscriptions with that list selected, using `?view=plans` or `?view=requests`.
- The list refreshes every 15 seconds. Code: `client/src/components/AdminNotifications.jsx`. The counts are loaded in `App.jsx`.

### Student management
- **Admin → Students** (`/admin/students`, API `/api/students`): create, edit and delete student accounts.
- From there, superadmins can also grant, extend or revoke a student's free week or plan.

### Practice studio
These pages need approved access, except the pinyin chart, which is public:

| Page | URL | Doc |
|---|---|---|
| Pinyin chart | `/practice/pinyin` | — |
| Tone listening and tone pairs | `/practice/tones` | [tone-listening.md](tone-listening.md) |
| Character tracing | `/practice/characters` | — |
| Listening | `/practice/listening` | — |
| Sentence builder | `/practice/sentences` | [sentence-builder.md](sentence-builder.md) |
| Measure words | `/practice/measure-words` | [measure-word-practice.md](measure-word-practice.md) |
| Everyday Chinese numbers | `/practice/numbers` | [everyday-chinese-numbers.md](everyday-chinese-numbers.md) |
| Listening dictation | `/practice/dictation` | [listening-dictation.md](listening-dictation.md) |
| Conversations | `/practice/conversations` | — |

New students can take a guided studio tour (`client/src/home/StudioTour.jsx`). It's offered after sign-in and from the footer.

### Mandarin voices
The pinyin, tones, listening and numbers pages share one speaker (`client/src/practice/useMandarinSpeaker.js`), which tries voices in this order:

1. **Uploaded teacher recordings**, where a page has them: the pinyin chart, tone pairs, sentences and conversations.
2. **The server's Azure voice**, when `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are set: female `zh-CN-XiaoxiaoNeural` or male `zh-CN-YunxiNeural`. It sounds the same on every browser and device.
3. **The browser's own Mandarin voice**, as a backup: Google's voice in Chrome, or a voice built into the operating system. Some browsers have none, such as Brave or Firefox on Linux.

Students choose the female or male voice with the switch on each page, and the choice is remembered.

### HSK 1 mock tests
- Five built-in papers: H11226, H10901, H11556, H11221 and H11112. Superadmins can also create papers in **Test Studio**.
- H11226 is free for every signed-in student. The other papers need approved access.
- Superadmins can edit, soft-delete and restore any paper, and upload new pictures.
- **Print / save result** prints only the score card.
- Details: [hsk1-test-portal.md](hsk1-test-portal.md). To add a paper, follow [adding-hsk-mock-test.md](adding-hsk-mock-test.md). Per-paper notes: [h11226](hsk1-test-portal.md), [h10901](h10901-test-portal.md), [h11221](h11221-test-portal.md), [h11112](h11112-test-portal.md).

### Courses
- HSK courses with lessons, vocabulary, slides and quizzes.
- Course access comes from a course subscription or an active plan.
- The HSK 1 grammar course is installed by a script: see [hsk1-grammar-course.md](hsk1-grammar-course.md).

### Public pages
- **Home** (`/`).
- **Pricing** (`/pricing`).
- **About HSK** (`/about-hsk`): a level explorer, FAQ and an interactive Chinese roadmap.
- **Privacy** (`/privacy`) and **Cookies & browser storage** (`/cookies`).

### Contact and footer
- Live-class enquiries go to WhatsApp and Viber links. The number comes from `client/src/components/contactPhone.js`, and `VITE_CONTACT_PHONE` overrides it.
- Every page except sign-in, register and reset password shows the same footer: courses, practice studio, pricing plans, live class inquiry, social links and privacy links.
- On phones, the menu adds Home for everyone, plus Pinyin practice and Live class inquiry for visitors who aren't signed in.

### Loading screen
- An ink-brush ensō circle with "Loading" and 加载中.
- The first-paint copy and all its styles are in `client/index.html`, so it shows before any JavaScript loads. `client/src/components/InkLoader.jsx` reuses those styles.
- A page shows at most one loader. Pages that wait for server data call `useInitialLoad(loading, message)` from `client/src/navigation/pageLoad.js`. The `PageLoadGate` in each layout keeps the page hidden under the loader until all of its first loads finish, so the requests run together and the page appears complete. It stops waiting after 12 seconds.
- Loads that start after the page is shown, such as tabs, dialogs and retries, keep their own small loading text.
- Pages that don't wait for the server show no loader beyond a brief one while their code downloads. These include home, pricing, About HSK and the pinyin chart. The home page shows placeholder cards while its courses and reviews arrive.

### Reminders
- **Practice reminder emails**, sent by a superadmin: [practice-reminders.md](practice-reminders.md).
- **Daily push reminders**, which each student opts into in the browser. Worker: `server/utils/dailyPush.js`.

### Email
[smtp.md](smtp.md), [email-api.md](email-api.md), [email-verification.md](email-verification.md).

## Running it locally

```sh
bhasahub            # shell function in ~/.bashrc: starts mongod if needed, then the API (5001) and client (5173)
npm test            # server tests (node --test)
npm run build       # client production build
npm run lint        # client lint (oxlint)
npm --prefix client run test:navigation   # Playwright end-to-end tests, with mocked APIs
```

Setting up a new computer: [new-device-migration.md](new-device-migration.md). Copying cloud content into the local database: [local-content-import.md](local-content-import.md).

## Moving hosting or domain

[hosting-and-domain-migration.md](hosting-and-domain-migration.md) is the step-by-step plan for moving the site, API, database and media to a new host and a custom domain.

## Known gaps

- **A paid plan doesn't open the practice studio or the locked mock tests by itself.** A plan unlocks every course (`server/utils/platformAccess.js`). The practice gate (`client/src/access/practiceAccess.js`) and mock tests (`server/utils/testAccess.js`) only check approved access requests. A student with a plan still needs an approved access request.
- **Numbers, tones and listening have no uploaded recordings to fall back on.** Without the Azure voice, they depend on the browser having a Mandarin voice.
- **Render's free plan sleeps.** The first request after a quiet period takes about a minute.

## Other docs

- [design-system.md](design-system.md): typography, colours and components.
- [frontend-routing.md](frontend-routing.md): every URL and who can open it.
- [hero-artwork.md](hero-artwork.md): home page artwork.
