# Site typography and spacing

The site shares Inter for interface text, with Noto Serif SC retained for Chinese
characters and character practice. Font families are defined in
`client/src/styles/base.css`. The homepage hero is the intentional exception: its
heading retains Fraunces and its original responsive size, with Playfair Display
for the italic “Platform.” accent. The sign-in welcome headline also retains its
original Fraunces face and responsive size. Other headings use the shared hierarchy.

`client/src/styles/design-system.css` defines the site-wide hierarchy and rhythm:

| Use | Token | Default |
| --- | --- | --- |
| Page heading | `--text-page-title` | 28px |
| Section heading | `--text-section-title` | 18px |
| Card heading | `--text-card-title` | 16px |
| Interface text | `--text-body` | 14px |
| Long explanations | `--text-reading` | 16px |
| Supporting text | `--text-meta` | 13px |
| Caption | `--text-caption` | 12px |
| Between sections | `--section-gap` | 24px |
| Panel padding | `--panel-padding` | 24px; 16px on phones |
| Grid and form gaps | `--grid-gap`, `--field-gap` | 16px |
| Page gutters | `--page-gutter` | 24px; 16px on phones |

Type tokens use rem units to respect the reader's browser font preference.
The scale stays consistent across breakpoints instead of increasing the root font
size on larger monitors. Layout wrappers in `navigation/Layouts.jsx` provide the
shared route gutters. Homepage artwork and backgrounds retain full-width sections.

New page styles should consume these tokens. Keep component-specific sizing for
Chinese prompts, stroke canvases, pronunciation controls, media, and exam papers.
The scoped compatibility rules in the shared stylesheet bridge existing route
styles and embedded style blocks, including CSS loaded after navigation.

Check public, auth, student, course, practice, and admin pages at 320, 768, 1024,
and 1440px in both themes when changing the shared scale. Run the client build,
lint, and existing Playwright suite for changes to this stylesheet.

## Page layout and the footer

The app shell (`.app-shell` in `App.jsx`) is a full-height column. The page area grows to fill the
space between the header and the footer, so the footer sits at the bottom of the screen on short
pages. While a page loads its first data, the ink loader fills that space and sits in the middle of
it, and the footer stays hidden until the page is ready. The rules are in `design-system.css`.
`client/e2e/layout.spec.js` checks both cases.

## Header

From 1361px wide the header shows the navigation links in a row, each with its icon, as in the mobile
menu. Narrower screens use the menu button instead. To make room beside the account controls:

- the desktop header may grow to 1360px, a little wider than the 1200px page;
- **About HSK** and **FAQ** share one "About HSK" menu on desktop (`HskMenu` in `SiteHeader.jsx`);
  the mobile menu lists them separately;
- students with an active plan don't get **Pricing** in the header (it stays in the footer);
- the spacing is tight, and the account button shows just the avatar, as on phones; the name and role
  head its menu.

Hovering a link tints its background, without an underline. The rules are in `design-system.css`
(the width) and the `min-width: 1361px` block of `styles/navigation.css`.

Known limit: at 1361px, a student on a free week or with only a course subscription (days badge plus
Pricing) is about 45 to 60px too wide, so the account button reaches past the edge. Students with a
plan, students without access, guests and admins fit. `client/e2e/site-navigation.spec.js` checks
the student (with a plan) and admin headers at 1361px; check it again after adding a header link.

## Live classes card

`LiveClassNotice` (`client/src/components/LiveClassNotice.jsx`) is a card in the bottom right corner
saying live classes are available, with the WhatsApp and Viber buttons. It's for guests and students
only. It appears 8 seconds into a browsing page (`/`, `/about-hsk`, `/pricing`, `/my-courses`,
`/progress`), never during lessons, practice or tests, and not while a dialog or the studio tour is
open. "Later" or Escape hides it for 7 days, and messaging us hides it for 30. The choice is kept in
`localStorage` under `liveClassNotice`. The app update notice uses the same corner and goes first.
`client/e2e/live-class-notice.spec.js` covers it.

## Refresh and retry buttons

Every control that reloads a page or its data uses `RefreshButton` (`client/src/components/RefreshButton.jsx`).
It's a quiet outlined button with the `refresh` icon from `Icon.jsx`: an open ink circle with an
arrow, echoing the ensō in the loading animation. Pass `busy` while reloading and the icon turns.
Buttons that restart an exercise, such as "Retry missed" or "Try again" on a quiz, keep their own
styles, because they don't reload anything.
