# Frontend navigation

The client uses React Router's BrowserRouter, mounted in `client/src/main.jsx`.
`client/src/navigation/AppRoutes.jsx` defines page routes. The address bar is the
source of truth for the current page; transient dialogs and menus remain local
React state. Route components remain lazy loaded.

| Area | URLs | Access |
| --- | --- | --- |
| Home | `/` | Public; superadmins go to `/admin` |
| Authentication | `/sign-in`, `/register`, `/forgot-password`, `/reset-password?token=…` | Public |
| Pinyin | `/practice/pinyin` | Public |
| Learning | `/my-courses`, `/progress` | Signed in |
| Courses | `/courses/:courseId`, `/courses/:courseId/lessons/:lessonId` | Signed in; lesson access checks still apply |
| Practice | `/practice/characters`, `/practice/listening`, `/practice/sentences`, `/practice/measure-words`, `/practice/numbers`, `/practice/dictation`, `/practice/conversations` | Signed in |
| Tests | `/tests`, `/tests/:testId` | Signed in |
| Administration | `/admin/tests`, `/admin/subscriptions` | Admin or superadmin |
| Content and platform management | `/admin`, `/admin/courses`, `/admin/courses/:courseId/lessons`, `/admin/users`, `/admin/conversations`, `/admin/testimonials`, `/admin/sentence-audio`, `/admin/characters`, `/admin/pinyin`, `/admin/inbox`, `/admin/audit` | Superadmin; ordinary admins visiting `/admin` go to test management |

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
