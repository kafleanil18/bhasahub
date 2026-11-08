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
