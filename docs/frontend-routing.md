# Frontend navigation

The client uses React Router's BrowserRouter, mounted in `client/src/main.jsx`.
`client/src/navigation/AppRoutes.jsx` defines page routes. The address bar is the
source of truth for the current page; transient dialogs and menus remain local
React state. Route components remain lazy loaded.

| Area | URLs | Access |
| --- | --- | --- |
| Home | `/` | Public. Superadmins go to `/admin`. |
| Public pages | `/pricing`, `/about-hsk`, `/privacy`, `/cookies`, `/terms`, `/email/reminders/unsubscribe` | Public |
| Authentication | `/sign-in`, `/register`, `/forgot-password`, `/reset-password?token=…` | Public. Header and footer are hidden. |
| Pinyin | `/practice/pinyin` | Public |
| Learning | `/continue`, `/my-courses`, `/progress` | Signed in |
| Courses | `/courses/:courseId`, `/courses/:courseId/lessons/:lessonId` | Signed in. Course access checks still apply. |
| Practice | `/practice/tones`, `/practice/characters`, `/practice/listening`, `/practice/sentences`, `/practice/measure-words`, `/practice/numbers`, `/practice/dictation`, `/practice/conversations` | Signed in, behind `PracticeGate`. The page is locked without a free week, a plan or an active course subscription (see [practice-access.md](practice-access.md)). |
| Tests | `/tests`, `/tests/:testId` | Signed in. Papers other than H11226 need a free week, a plan or an active course subscription. |
| Administration | `/admin/tests`, `/admin/subscriptions` | Admin or superadmin. `/admin/subscriptions?view=plans` or `?view=requests` opens that list. |
| Content and platform management | `/admin`, `/admin/courses`, `/admin/courses/:courseId/lessons`, `/admin/users`, `/admin/students`, `/admin/conversations`, `/admin/testimonials`, `/admin/teachers`, `/admin/sentence-audio`, `/admin/tone-pair-audio`, `/admin/characters`, `/admin/pinyin`, `/admin/inbox`, `/admin/audit`, `/admin/settings/email`, `/admin/reminders` | Superadmin. Ordinary admins visiting `/admin` go to test management. |
| Anything else | `*` | Not found page |

Route components are lazy loaded. While a page's code loads, `App.jsx` shows the ink loader (`InkLoader`) in the page area and keeps the header in place. The very first load shows the same loader from `client/index.html`.

Pages that wait for server data report it with `useInitialLoad()` from `navigation/pageLoad.js`. The public, student and admin layouts wrap their pages in `PageLoadGate`, which shows a single ink loader and keeps the page hidden until all of its first loads finish, or 12 seconds pass. `PracticeGate` reports its access check the same way, so a practice page and its access check share one loader. A load that starts after the page is shown keeps its own loading state.

`Layouts.jsx` separates public, authentication, student, and admin route trees.
`RequireSession` redirects anonymous visitors to sign-in with an internal `next`
parameter. The destination survives auth-page switches and refreshes. Role guards
prevent entering inappropriate frontend screens; backend authorization remains
the security boundary. `paths.js` contains shared path builders and validates
post-login destinations to prevent redirects to external sites.

Course and lesson IDs are loaded from the URL rather than retained course objects.
Admin lesson management retrieves drafts through the authenticated course API.
Test preview links use `?preview=1` to preserve their return to `/admin/tests`.
Legacy emailed `/?reset=…` links redirect to the reset route.

The existing Vercel rewrite to `index.html` and Express SPA fallback serve direct
page URLs. Other static hosts must also rewrite non-asset frontend routes to
`index.html` while keeping `/api` on the backend.

## Verification

- `npm run build`
- `npm run lint`
- `node --test client/src/navigation/paths.test.js`
- `npm run test:navigation --prefix client`

Install the browser once with `npx --prefix client playwright install chromium`.
The browser suite starts an isolated Vite server on port 5176 and uses mocked APIs;
it does not require MongoDB, identity providers, or production credentials.
