# Xiao Ao PWA

The BhasaHub frontend uses its existing Xiao Ao display name and XA mark for installation. The manifest supplies regular and maskable PNG icons, standalone display, and a home screen launch URL. Safari users can install through Share → Add to Home Screen; supporting browsers also display the in-app install prompt when eligible.

Service workers register only in production builds. Serve `dist` over HTTPS (localhost also works). Keep `sw.js`, `offline.html`, `manifest.webmanifest`, and `pwa/` publicly accessible rather than rewriting them to the SPA document. Vercel headers disable stale worker caching; Express static hosting also supports these files.

Only the standalone offline document is cached. Lessons, account data, API responses, and audio are not cached or queued. Offline document navigation displays a retry screen; an already open page continues to use its existing network error handling. This release does not provide downloadable lessons or offline progress synchronization.

The Vite build emits a versioned worker automatically. Returning users see a reload prompt when an update is waiting; choosing Later hides prompts for that page session. Reloading is explicit so active exercises are not interrupted automatically. Worker updates are checked when the app returns to the foreground.

Verify with Node.js compatible with this project's Vite version:

```sh
npm --prefix client run lint
npm --prefix client run test:pwa
```

The PWA browser test uses a production preview on port 5177 and requires Playwright Chromium (`cd client` then `npx playwright install chromium` if absent). It checks manifest icons, worker control, restricted caching, offline deep links, and retry after reconnecting. To test installation and updates manually, run a production preview, install in a supporting browser, then rebuild with a change and reopen the app. Verify that Later preserves the page and Reload to update loads the new version.
