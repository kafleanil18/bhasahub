# Moving to a new web host and domain

This is the plan for moving the live site from `bhasahub.vercel.app` and `bhasahub.onrender.com` to a new host and your own domain, without losing data, uploads or signed-in features.

In the examples, the new site is `https://www.example.com` and the new API is `https://api.example.com`. Replace them with your real domain.

> Moving the code is the easy part. Most of the work is changing settings that name the old domain, and handling the fact that a browser keeps data per domain.

---

## 1. What exists today

| Piece | Today | Holds data? | Tied to a domain? |
|---|---|---|---|
| Site (React client) | Vercel project `bhasahub`, built from `main` with `vercel.json` | No | Yes: the site address, Google sign-in origins, PWA install |
| API (Express) | Render web service `bhasahub-api` (`render.yaml`), started with `npm start` in `server/` | No (stateless) | Yes: `VITE_API_BASE_URL`, the GitHub Actions `API_URL` |
| Database | MongoDB Atlas | **Yes, everything** | No. It only needs to accept connections from the new API host. |
| Uploaded media | Cloudinary, folder `bhashahub` | **Yes, every upload** | No. Records store full `https://res.cloudinary.com/...` URLs, which keep working on any domain. |
| Built-in exam audio and pictures | `client/public/hsk1/` in Git | In Git | No. They move with the site. |
| Cached Mandarin voice | `ttsaudios` collection in the database | Yes | No |
| Email | Settings saved in the database (encrypted), or SMTP/Resend variables | Settings only | **Yes:** the sender domain must be verified with the provider |
| Push reminders | VAPID keys in env, subscriptions in the `pushsubscriptions` collection | Yes | **Yes:** each subscription belongs to the site domain it was made on |
| Scheduled reminder runs | `.github/workflows/daily-reminders.yml` | No | Yes: it calls `API_URL` |
| Browser data | `localStorage` on each student's device | Yes, per device | **Yes:** see section 4 |

The API runs two background workers inside the web process (`server/index.js`): the practice-reminder email queue and the daily push check. So the new API host must run a normal, always-on Node process. Pure serverless functions are not enough.

## 2. Choose the target setup

| Option | What changes | Effort | Notes |
|---|---|---|---|
| **A. Same providers, your own domain** (recommended first step) | Add `www.example.com` to Vercel and `api.example.com` to Render | Low | No code or data moves. Upgrade Render to a paid instance so the API doesn't sleep. |
| B. New providers, two services | Static host for the client (Netlify, Cloudflare Pages, etc.) and a Node host for the API (Railway, Fly.io, a VPS, etc.) | Medium | The static host must rewrite all paths to `index.html` and copy the cache headers in `vercel.json`. |
| C. One server for both | One Node server or VPS runs `npm run build`, then `npm start`. `server/index.js` serves `client/dist` and the API from the same origin. | Medium | `window.API_BASE_URL` becomes `''` automatically, so no CORS is involved. You run HTTPS (for example Caddy or nginx), restarts and updates yourself. |

**Keep MongoDB Atlas and Cloudinary in every option.** They aren't tied to the domain, so moving them adds risk for no gain. Moving them is covered separately in section 9.

## 3. Everything that names the old domain

Change each of these during the move. The **When** column refers to the steps in section 5.

| # | Setting | Where | New value | When |
|---|---|---|---|---|
| D1 | DNS records | Your domain registrar or DNS provider | `www` and the bare domain point at the site host. `api` points at the API host. | Steps 2 and 6 |
| D2 | `VITE_API_BASE_URL` | Site host's build settings (Vercel → Project → Environment Variables) | `https://api.example.com` (leave empty for option C) | Step 3 |
| D3 | `CLIENT_URL` | API host's environment | `https://www.example.com`. It's used in password-reset emails, plan-request emails, reminder emails, unsubscribe links and push-notification links. | Step 2 |
| D4 | `VAPID_SUBJECT` | API host's environment | `mailto:admin@example.com` | Step 2 |
| D5 | Google sign-in origins | Google Cloud Console → Credentials → the OAuth client used by `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | Add `https://www.example.com` and `https://example.com`. Keep the old origins until the move is finished. | Step 2 |
| D6 | Email sender domain | Resend or Brevo (domain verification), or your SMTP provider | Verify `example.com`. Add the SPF, DKIM and DMARC DNS records they give you. Then update `EMAIL_FROM` or **Admin → Email settings**. | Step 2 |
| D7 | `API_URL` repository variable | GitHub → repository → Settings → Secrets and variables → Actions → Variables | `https://api.example.com`. Without it, the workflow keeps calling `bhasahub.onrender.com`. | Step 6 |
| D8 | `PUSH_CRON_SECRET` | GitHub Actions secret **and** the API environment | The same value in both places | Step 2 |
| D9 | Atlas network access | Atlas → Security → Network Access | Allow the new API host's outgoing IP addresses, unless it is already open to all addresses (`0.0.0.0/0`) | Step 2 |
| D10 | `VITE_CONTACT_PHONE` (optional) | Site build settings | Only if the WhatsApp/Viber number changes | Step 3 |
| D11 | Hard-coded defaults in code | `server/utils/contentImport.js` (`https://bhasahub.onrender.com`, used when importing old `/uploads/` links) and the fallback in `daily-reminders.yml` | Change them to the new API address | Step 6 |
| D12 | Docs | `docs/README.md`, `docs/new-device-migration.md` | New addresses | Step 7 |

### Settings that must keep their current values

| Setting | Why |
|---|---|
| `JWT_SECRET` and `EMAIL_SETTINGS_KEY` | They encrypt the email passwords and API keys saved in **Admin → Email settings**, and sign unsubscribe links. New values would make the saved email settings unreadable, and email would stop. |
| `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` | Existing push subscriptions only accept messages signed with these keys. |
| `MONGO_URI` | Same database |
| `CLOUDINARY_URL` | Same media account |
| `GOOGLE_CLIENT_ID`, `AZURE_SPEECH_*`, `GEMINI_API_KEY`, `ADMIN_CODE` | Not tied to a domain |

## 4. What students will notice

A browser keeps data separately for each domain, so on the new domain every student starts with a clean browser. Plan for this and tell students in advance.

| Kept in the browser | Effect on the new domain | Kept on the server? |
|---|---|---|
| Sign-in token (`token`, `user`) | **Everyone has to sign in again** | Accounts, progress and results are all safe |
| Mock test in progress (answers and section deadlines) | An unfinished attempt can't be resumed there. Finished results are safe. | Finished attempts only |
| Theme, male/female voice choice, studio tour seen, flashcard audio mute | Back to defaults | No |
| Grammar practice progress (`bhashahub:grammar-practice:v1:*`), last conversation lesson | Starts again | No |
| Push reminder opt-in | **Students must turn reminders on again** on the new site. Old subscriptions still get messages, but tapping one opens `/` on the **old** domain, so keep that domain redirecting. | Subscriptions are stored, but tied to the old site |
| Installed app (PWA) | The old icon keeps opening the old address. Students reinstall from the new domain. | — |

How to soften this:

- Keep the old addresses running as redirects (step 6).
- Show a notice for a week before the move, for example "We're moving to www.example.com. You'll need to sign in once."
- Finish or cancel live mock-test attempts before the cutover.

## 5. Step-by-step plan

### Step 0: Prepare (a week before)

1. **Freeze risky changes.** Merge pending work to `main`. Make sure `git status` is clean on the deploying computer.
2. **Lower the DNS TTL** for the new domain's records to 300 seconds, so the switch takes effect quickly.
3. **Collect every environment variable:**
   - API variables: Render → `bhasahub-api` → Environment.
   - Site variables: Vercel → Project → Settings → Environment Variables.
   - GitHub Actions secrets and variables.

   Store them in a password manager, never in Git. The full list is in [new-device-migration.md](new-device-migration.md#d-must-obtain-from-external-service-providers).
4. **Back up the database** with MongoDB Database Tools, from any computer allowed by Atlas:
   ```sh
   mongodump --uri "<production MONGO_URI>" --out backup-$(date +%F)
   ```
   Keep the dump encrypted and off the repository. It holds accounts and password hashes. It includes the cached voice audio (`ttsaudios`) and the Test Studio edits (`practicepapers`), which hold H11112's 15 pictures.
5. **List the Cloudinary assets**, so you know what exists:
   - Cloudinary console → Media Library → folder `bhashahub`, or `cloudinary.api.resources({ prefix: 'bhashahub', max_results: 500 })` with the existing `CLOUDINARY_URL`.
   - The assets stay where they are; this is only a record. To keep a full offline copy, use Cloudinary's backup option or download the folder.
6. **Check for old `/uploads/` links.** Search the database for any records still pointing at `/uploads/...` on the API, which would break when the API domain changes. Run this from `server/`, with the production URI in `MONGO_URI_ATLAS`. It only reads.
   ```sh
   node -e '
   require("dotenv").config(); const { MongoClient } = require("mongodb");
   (async () => { const c = await MongoClient.connect(process.env.MONGO_URI_ATLAS); const db = c.db();
     for (const { name } of await db.listCollections({ type: "collection" }).toArray()) {
       let n = 0; for await (const d of db.collection(name).find()) if (JSON.stringify(d).includes("/uploads/")) n++;
       if (n) console.log(name, n); }
     await c.close(); })()'
   ```
   If anything turns up, move those files to Cloudinary with `node server/scripts/migrateUploadsToCloudinary.js` before the move.

### Step 1: Buy and connect the domain

1. Register the domain. Use DNS that supports CNAME records on subdomains (most do).
2. Decide the addresses: `www.example.com` for the site, `api.example.com` for the API. Redirect the bare `example.com` to `www`.

### Step 2: Set up the API on its new address

- **Option A:** Render → `bhasahub-api` → Settings → Custom Domains → add `api.example.com`, then create the CNAME it shows. Render issues HTTPS automatically. Upgrade the instance so it doesn't sleep.
- **Option B or C:** create the service on the new host.
  - Root `server/`, install with `npm install`, start with `npm start`.
  - Pin Node to the version used in development (Node 26). Add `"engines": { "node": ">=22" }` to `server/package.json`, or set the host's Node version.
  - Copy every API environment variable from step 0.3.

Then, on the API host:

1. Set `CLIENT_URL` (D3), `VAPID_SUBJECT` (D4) and `PUSH_CRON_SECRET` (D8). Keep every secret listed under "Settings that must keep their current values".
2. Allow the host in Atlas (D9).
3. Add the new origins to Google sign-in (D5).
4. Start verifying the email sender domain (D6). DNS checks can take hours, so start early.
5. Check the API:
   ```sh
   curl https://api.example.com/api/tts/status        # {"enabled": ...}
   curl https://api.example.com/api/pinyin-recordings  # a JSON list
   ```

### Step 3: Set up the site on its new address

- **Option A:** Vercel → Project → Settings → Domains → add `www.example.com` and `example.com`, and create the DNS records it shows. Set `VITE_API_BASE_URL=https://api.example.com` (D2), then redeploy. Vite reads variables at build time, so the redeploy is required.
- **Option B:** build with `npm install --prefix client && npm run build --prefix client`, publish `client/dist`, and set up:
  - a rewrite of every path to `/index.html`, the same as `vercel.json`;
  - `Cache-Control: no-cache` on `/sw.js`;
  - `Content-Type: application/manifest+json` and `no-cache` on `/manifest.webmanifest`.
- **Option C:** nothing separate. The API server serves the site.

### Step 4: Test before switching anyone over

Test on the new addresses while the old site keeps running. Sign in with a test student and a superadmin, and check:

- [ ] Home, pricing, About HSK and privacy pages load. A direct visit to a deep link such as `/practice/numbers` loads, not a 404.
- [ ] Register with an email code (proves email works with the new sender), sign in, sign out, and reset a password. The reset link must open the new domain.
- [ ] Google sign-in works on the new domain.
- [ ] A course lesson plays its video and audio (Cloudinary media).
- [ ] The pinyin chart plays recordings. Numbers, tones and listening speak (Azure voice, if enabled).
- [ ] Request access as the student, approve it in the superadmin notifications bell, and see the practice page unlock.
- [ ] Mock test H11112 shows all its pictures. Take a mock test, submit it, and print the result.
- [ ] Choose a plan. The plan-request email arrives and its link opens `https://www.example.com/admin/subscriptions`.
- [ ] Upload a picture in Test Studio (proves `CLOUDINARY_URL`).
- [ ] Send a practice reminder email to the test student. Its unsubscribe link opens the new domain.
- [ ] Turn on push reminders. Run the workflow manually (GitHub → Actions → Daily practice reminders → Run workflow) after updating `API_URL` for the test.
- [ ] Install the PWA from the new domain and open it offline (shows `offline.html`).

### Step 5: Announce

Tell students the date. Mention that they'll sign in once more, and should turn push reminders back on if they use them.

### Step 6: Cut over

1. **Point DNS at the new hosts** (D1), if anything still points elsewhere.
2. **Redirect the old addresses:**
   - **Old site:** keep `bhasahub.vercel.app` live and add a permanent redirect to `https://www.example.com/:path*`. On Vercel, add a `redirects` entry with a `has` condition on the host `bhasahub.vercel.app`. Alternatively, leave the old deployment running for a few weeks and show a banner pointing to the new address.
   - **Old API:** keep `bhasahub.onrender.com` working (option A gives this for free). Installed apps and old browser tabs keep calling it until they reload the new site.
3. **Update scheduled jobs and code defaults:** `API_URL` in GitHub (D7), and the defaults in D11.
4. **Watch the API logs for an hour:** sign-ins, `MongoDB connected`, email sends, and the reminder workers.

### Step 7: Afterwards

1. Update the docs (D12) and `render.yaml`, if the service name or settings changed.
2. **Lock CORS down.** `server/index.js` currently uses `cors()`, which allows any origin. Change it to allow only `https://www.example.com` (and `http://localhost:5173` for development).
3. After two to four weeks:
   - remove the old Google sign-in origins;
   - remove the old Vercel domain or redirect;
   - turn off the old API if you moved hosts.
4. Raise the DNS TTL back to normal (3,600 seconds or more).

## 6. Rollback

Until step 6, nothing changes for students, so rollback means "don't switch". After step 6:

- Point DNS back at the old hosts. Set `CLIENT_URL` and `VITE_API_BASE_URL` back to the old values, then redeploy the site.
- The database and media were never moved, so no data is lost either way.
- Anything students did on the new domain is already in the same database.

## 7. Cost and plan notes

- **Render free plan** sleeps after inactivity, so the first request takes about a minute. This affects sign-in, the voice-status check and scheduled reminders. A paid instance keeps it awake. With a custom domain, budget for the always-on tier.
- **Vercel's Hobby plan** is for non-commercial use. A site that takes payments for plans should use Pro, or move to another static host.
- **Atlas, Cloudinary and Azure** bill the same whatever the domain. Azure's free Speech tier (500,000 characters a month) easily covers the cached practice phrases.

## 8. Quick reference: the new environment

API (`server/.env` locally, or the host's environment):

```
MONGO_URI=<unchanged>
JWT_SECRET=<unchanged>
EMAIL_SETTINGS_KEY=<unchanged, if set>
CLIENT_URL=https://www.example.com
CLOUDINARY_URL=<unchanged>
GOOGLE_CLIENT_ID=<unchanged>
VAPID_PUBLIC_KEY=<unchanged>
VAPID_PRIVATE_KEY=<unchanged>
VAPID_SUBJECT=mailto:admin@example.com
PUSH_CRON_SECRET=<unchanged, same as GitHub secret>
EMAIL_FROM=Xiao Ao <no-reply@example.com>   # if email is set by environment rather than Admin → Email settings
AZURE_SPEECH_KEY=<recommended>
AZURE_SPEECH_REGION=<recommended>
ADMIN_CODE=<unchanged>
GEMINI_API_KEY=<unchanged, optional>
```

Site build:

```
VITE_API_BASE_URL=https://api.example.com
VITE_GOOGLE_CLIENT_ID=<unchanged>
VITE_CONTACT_PHONE=<optional>
```

GitHub Actions: secret `PUSH_CRON_SECRET` and variable `API_URL=https://api.example.com`.

## 9. Optional: moving the database or media off their current providers

You don't need this for a hosting or domain change. Do it later, and separately, if you need it.

**Database (Atlas to another MongoDB):**
1. Run `mongodump` from Atlas, then `mongorestore` into the new cluster. Do this during a short maintenance window, so nothing is written in between.
2. Switch `MONGO_URI`. Indexes are rebuilt when the app starts.

**Media (Cloudinary to other storage):**
1. Download every asset in `bhashahub`.
2. Upload them to the new storage.
3. Rewrite every stored URL. Cloudinary links appear in many collections:
   - `lessons`, including rich-text HTML and video fields;
   - `slides`, `vocabularies`, `tests` and `practicepapers` (inside `content`);
   - `pinyinrecordings`, `sentenceaudios`, `tonepairaudios` and `conversationrecordings`;
   - `testimonials`, `teachers`, `teammembers` and `sitesettings`.
4. Replace `server/utils/cloudinary.js` and `server/routes/upload.js` with the new storage's upload code.

Test the rewrite on a copy of the database first.
