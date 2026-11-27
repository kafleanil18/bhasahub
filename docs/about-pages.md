# About pages

Super admins edit the text of **About Xiao Ao** (`/about`) and **About HSK** (`/about-hsk`) in
**Admin > About pages** (`/admin/about-pages`), with a live preview beside the form.

## Visibility

- About Xiao Ao starts **hidden**. Visitors, students and admins get "Page not found", and its links
  in the footer and mobile menu aren't shown.
- The **Show About Xiao Ao to visitors** switch makes it visible straight away, links included.
  Turning it off hides it again.
- A super admin can always open `/about`. While it's hidden, the page shows a note saying so.
- About HSK is always visible.

## Editable text

The fields, their labels and their default wording are in `client/src/about/aboutContent.js`.
The server stores only the fields that differ from those defaults, so:

- an empty field, or "Use default", goes back to the default wording;
- changing a default in code reaches every field that hasn't been overridden;
- a new field shows its default until someone edits it.

The team on About Xiao Ao comes from **Admin > Teachers**. The HSK level table, exam skills, booking
steps and the FAQ stay in code.

## API

| Method | Path | Who | What |
| --- | --- | --- | --- |
| GET | `/api/about-pages` | Public | `[{ slug, visible }]` for the footer and menu links |
| GET | `/api/about-pages/:slug` | Public | `{ slug, visible, hideable, content }`. A hidden page is 404 except for a super admin |
| PUT | `/api/about-pages/:slug` | Super admin | `{ content }` and/or `{ visible }` (About Xiao Ao only). Logged in the audit log |

Slugs are `xiao-ao` and `hsk`. Text is plain (no formatting): up to 80 fields of up to 3,000
characters each. The model is `server/models/AboutPage.js`.

Tests: `server/test/aboutPages.test.js`, `client/e2e/about-xiao-ao.spec.js`,
`client/e2e/about-pages-admin.spec.js`.
