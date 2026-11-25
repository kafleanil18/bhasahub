# Practice access, the free week and plans

This page covers who can use the practice studio, the mock tests and the courses, and how a superadmin grants each.

## Summary

| What | Visitor | Signed-in student | Student with approved free week | Student with a paid plan | Admin / superadmin |
|---|---|---|---|---|---|
| Pinyin chart (`/practice/pinyin`) | Yes | Yes | Yes | Yes | Yes |
| Other practice tools | Sign-in prompt | Can look, but the page is locked | Yes, for 7 days | **Locked** unless they also have an approved access request (see Known gap) | Yes |
| Mock test H11226 | No | Yes (always free) | Yes | Yes | Yes |
| Other mock tests | No | Locked | Yes, for 7 days | **Locked** unless they also have an approved access request | Yes |
| Courses | No | Courses they subscribe to | Courses they subscribe to | Every published course | Yes |

## Access requests and the free week

- **Requesting access.** After signing in, students see a prompt asking them to request access (`client/src/components/TestAccessPrompt.jsx`, shown once per sign-in). They can also request it from the lock panel on any practice page. A request is an `AccessRequest` with `scope: 'tests'`, sent with `POST /api/access-requests`.
- **The lock panel.** Practice pages are wrapped in `PracticeGate` (`client/src/access/PracticeGate.jsx`). Until access is approved, the page shows behind a lock panel. The page is made `inert`, so nothing inside it can be clicked. The panel's wording depends on the student's status:

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
- Other papers need an admin role, or an approved free week that hasn't expired. Otherwise the API answers `403` with `code: 'TESTS_LOCKED'`, and the test list offers to request access.

## Paid plans

- **The plans.** Defined in `server/utils/plans.js`, which is the source of truth for prices:

  | Plan | Days | Price |
  |---|---|---|
  | 1 month | 30 | Rs 1,000 |
  | 3 months | 90 | Rs 2,000 |
  | 6 months | 180 | Rs 3,000 |

- **Requesting.** Students choose a plan on `/pricing`, which creates a `PlanRequest`. The superadmins get an email, and the request appears in the notifications bell and under **Subscriptions → Plan requests**.
- **Starting the plan.** Once the payment arrives, a superadmin chooses **Start plan**. This creates or extends a `PlatformPass`, which unlocks every published course until `expiresAt` (`server/utils/platformAccess.js`).
- **Other actions.** A request can be declined, and its email can be re-sent if delivery failed. A student can cancel their own pending request.
- **One plan at a time.** A student with an active plan can't request another until it ends.

## Managing students

**Admin → Students** (`/admin/students`, API `/api/students`, superadmin only) lists students with their free-week and plan status. From there, a superadmin can:

- create, edit or delete a student;
- grant or end a free week (`PUT` / `DELETE /api/students/:id/trial`);
- grant or end a plan (`PUT` / `DELETE /api/students/:id/plan`).

Deleting a student also removes their subscriptions, access requests, plans and plan requests.

## Known gap

A paid plan unlocks courses, but not the practice studio or the locked mock tests:

- the practice gate only checks access requests;
- `hasTestAccess` only checks admin roles and free-week approvals.

A student who pays for a plan therefore also needs an approved access request. To fix this, have `hasTestAccess` and `practiceStatus` also accept an active `PlatformPass`.

## Validation

- `server/test/practiceAccess.test.js` and `server/test/students.test.js`
- The end-to-end fixtures in `client/e2e/` approve practice access, so the practice tool tests run unlocked.
