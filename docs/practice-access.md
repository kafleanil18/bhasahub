# Practice access, the free week and plans

This page covers who can use the practice studio, the mock tests and the courses, and how a superadmin grants each.

## Summary

| What | Visitor | Signed-in student | Student with approved free week | Student with a paid plan | Admin / superadmin |
|---|---|---|---|---|---|
| Pinyin chart (`/practice/pinyin`) | Yes | Yes | Yes | Yes | Yes |
| Other practice tools | Sign-in prompt | Can look, but the page is locked | Yes, for 7 days | Yes, while the plan lasts | Yes |
| Mock test H11226 | No | Yes (always free) | Yes | Yes | Yes |
| Other mock tests | No | Locked | Yes, for 7 days | Yes, while the plan lasts | Yes |
| Courses | No | Courses they subscribe to | Courses they subscribe to | Every published course | Yes |

An active course subscription also opens the practice studio and every mock test, the same as a plan, but it opens only its own course.

**One rule for practice and mock tests.** The practice studio and every mock test are open during a free week, an active plan or an active course subscription. Admins always have them.
- **Server:** `hasTestAccess` in `server/utils/testAccess.js` decides who can open a paper.
- **App:** `practiceStatus` in `client/src/access/practiceAccess.js` follows the same rule, using `/api/access-requests/my` and `/api/subscriptions/my`. During a plan, `/api/subscriptions/my` lists every published course.

## Access requests and the free week

- **Requesting access.** After signing in, students see a prompt asking them to request access (`client/src/components/TestAccessPrompt.jsx`, shown once per sign-in). They can also request it from the lock panel on any practice page. A request is an `AccessRequest` with `scope: 'tests'`, sent with `POST /api/access-requests`.
- **The lock panel.** Practice pages are wrapped in `PracticeGate` (`client/src/access/PracticeGate.jsx`). Without a free week, a plan or an active course subscription, the page shows behind a lock panel. The page is made `inert`, so nothing inside it can be clicked. The panel's wording depends on the student's status:

  | Status | Panel says |
  |---|---|
  | `none` | Unlock practice for free (button to send a request) |
  | `pending` | Waiting for approval |
  | `denied` | Your earlier request was declined (button to send a new one) |
  | `expired` | Your free week has ended. Choose a plan to keep practising. |

- **Live updates.** The status is re-checked every 15 seconds, so an approval unlocks the page without a reload. If the check itself fails, the page stays usable rather than locking a student out by mistake.
- **Approving.** A superadmin approves a request under **Subscriptions → Pending requests**, or from **Admin → Students**. The button reads "Approve free access".
- **Seven days, once.** Approval sets `expiresAt` to 7 days later (`FREE_ACCESS_DAYS` in `server/utils/testAccess.js` and `client/src/access/practiceAccess.js`). Each student gets one free week. After it ends, a new request is refused with `FREE_ACCESS_USED`.
- **Older approvals.** Approvals made before the 7-day limit existed have no `expiresAt` and never expire.
- **The header badge.** A student's header shows the days left, counting both paid access and the free week.

## Mock tests

`server/utils/testAccess.js` decides who can open a paper:

- H11226 (`FREE_PAPER_ID`) is open to every signed-in student.
- Other papers need an admin role, a free week that hasn't ended, an active plan or an active course subscription. Otherwise the API answers `403` with `code: 'TESTS_LOCKED'`, and the test list offers to request access.

Where students find them:

- **Home page.** The practice studio's red bar is the **HSK 1 free mock test**, shown only to guests
  and students who can't open every mock test. It goes straight to H11226; a guest signs in first and
  lands on the paper, without the free-access prompt. Students with a free week, a plan or a course
  subscription, and staff, don't see the bar (`useShowsFreeMockTest`).
- **HSK course pages.** Each course page lists its level's mock tests near the top
  (`client/src/courses/CourseMockTests.jsx`). With access every paper opens; otherwise only the free
  one does, and the rest link to `/tests` to unlock them. A level with no mock tests shows nothing.
- **Levels.** Practice papers have no level field: the code gives it (`H1…` is HSK 1, `H2…` HSK 2),
  and a code that doesn't say counts as HSK 1 (`client/src/tests/mockTests.js`). Mock tests made in
  Test Studio use their `level`.
- `/tests` still lists every mock test, with the request-access and plans banner.

## Paid plans

- **The plans.** Defined in `server/utils/plans.js`, with these default prices. Live classes for the same length are an optional add-on at checkout:

  | Plan | Days | Subscription | Live classes |
  |---|---|---|---|
  | 1 month | 30 | Rs 1,000 | Rs 7,000 |
  | 3 months | 90 | Rs 2,000 | Rs 9,000 |
  | 6 months | 180 | Rs 3,000 | Rs 12,000 |

  A superadmin can change all six prices under **Admin → Payment details**. They're saved in `PaymentSettings.prices`, and `server/utils/planPrices.js` applies them. `GET /api/plans` returns today's prices, and the server sets the price when a payment is sent, so a payment keeps the price it was sent at.
- **Checkout.** On `/pricing`, choosing a plan opens checkout (`client/src/pricing/Checkout.jsx`):
  1. choose **bank transfer** or **merchant QR**;
  2. confirm the plan, its price and the method, and optionally tick **Also pay for live classes** (the running total updates and stays visible to the end);
  3. see the bank account (with copy buttons) or the QR, and pay from their own app;
  4. upload a **screenshot of the payment, which is required**, with an optional transaction ID and note.

  The screenshot goes to `POST /api/plans/payment-proof` (students only, JPG/PNG/WebP up to 8 MB, stored in Cloudinary's `payment-proofs` folder). The payment is then sent to `POST /api/plans/requests`, which refuses it without an uploaded screenshot, and saves it as a `PlanRequest` with `liveClass`, `liveClassPrice` and `payment: { method, screenshot, reference, note, submittedAt }`. Live classes are arranged by the team; starting the plan only unlocks the platform. The superadmins get an email with a link to the screenshot, and the payment appears in the notifications bell and under **Subscriptions → Plan requests**.
- **Payment details.** The bank account and merchant QR come from **Admin → Payment details** (`/admin/payment-details`, API `/api/payment-settings`, superadmin only to change). Until a method is filled in, checkout shows sample details for it (`server/utils/paymentDetails.js`, QR image `client/public/payments/sample-qr.svg`) and tells students not to pay into them.
- **Starting the plan.** A superadmin checks the screenshot against the account, then chooses **Payment checked, start plan**. This creates or extends a `PlatformPass`, which unlocks every published course, the practice studio and every mock test until `expiresAt` (`server/utils/platformAccess.js`).
- **Other actions.** A payment can be declined, and its email can be re-sent if delivery failed. A sent payment can't be cancelled by the student; a request from before checkout (no payment) can be, or paid with **Pay now**.
- **One at a time.** A student with an active plan, or a payment being checked, can't pay for another plan until it's done.

## What students see

| Page | Opens for students with | Otherwise |
|---|---|---|
| **My Courses** (`/my-courses`) | an active plan or course subscription | hidden from the header; the page explains how to get a plan |
| **My Progress** (`/progress`) | a free week, a plan or a course subscription | hidden from the header; the page offers a free week |
| **Recorded sessions** (`/recorded-sessions`) | live classes: paid at checkout (an approved payment, while its plan length runs) or ticked by a superadmin | hidden; the page explains how to join live classes, and the API answers `403` with `code: 'RECORDED_LOCKED'` |

- Students with course access don't get **HSK courses** in the header: My Courses lists every course on offer, with their progress.
- The client works these out in `App.jsx` (`studentAccess`), and the routes are guarded in `navigation/AppRoutes.jsx` (`navigation/AccessLocked.jsx`). Staff always have them.
- Recorded sessions access is decided by `server/utils/liveClassAccess.js`, from `User.liveClassAccess` and approved checkout payments with `liveClass`. `GET /api/recorded-sessions/access` reports it. A superadmin ticks **Joined live classes** in a student's access dialog (`PUT /api/students/:id/live-class`). A recording still has to be shared with the student to appear.

## Managing students

**Admin → Students** (`/admin/students`, API `/api/students`, superadmin only) lists students with their free-week and plan status. From there, a superadmin can:

- create, edit or delete a student;
- grant or end a free week (`PUT` / `DELETE /api/students/:id/trial`);
- grant or end a plan (`PUT` / `DELETE /api/students/:id/plan`).

Deleting a student also removes everything tied to the account (`OWNED` in `server/routes/students.js`): subscriptions, access requests, plans, plan requests, saved courses, progress, quiz and HSK attempts, studio activity, review schedules, reminders, push subscriptions, conversation recording records and sign-in records. It doesn't remove their feedback messages, reviews, uploaded media files or the audit log. For a full erasure request (see "Deleting your account and data" on `/privacy`), delete their feedback and reviews by hand as well, and their uploads in Cloudinary.

## Admins

- **Making an admin.** A superadmin changes a user's role under **Manage admins** (`/admin/users`, API `PUT /api/users/:id/role`). Only students and admins can be changed; a superadmin's role can't.
- **What admins get.** Admins and superadmins can open every course, including unpublished drafts, every practice tool and every mock test. They never need an access request or a plan, and they can't request a plan.
- **When a role change applies.**
  - The server reads the role from the database on every request, so the change applies there straight away.
  - The app keeps the account details it was given at sign-in, so it asks for them again (`GET /api/auth/me`) when the site opens and whenever the tab regains focus. The person doesn't need to sign in again.

## Validation

- `server/test/practiceAccess.test.js` and `server/test/students.test.js`
- `client/e2e/paid-practice-access.spec.js`: a plan or a course subscription unlocks the practice studio and every mock test.
- `client/e2e/mock-tests.spec.js`: the HSK 1 free mock test bar and the mock tests on each course page.
- The end-to-end fixtures in `client/e2e/` approve practice access, so the practice tool tests run unlocked.
