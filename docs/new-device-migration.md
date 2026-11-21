# Moving BhasaHub to a new computer

Git already carries the code. This guide covers what Git does not: ignored files, secrets, local database data, and machine setup.

Put everything you copy from the old computer into [`migration-export/`](../migration-export/README.md). That folder is git-ignored apart from its README, so secrets placed there are never committed.

## What lives where

- **Production data is in the cloud.** The live API (Render, `render.yaml`) uses MongoDB Atlas. Uploaded media goes straight to Cloudinary (`server/routes/upload.js` uploads from a temporary file and keeps nothing on disk). Users, subscriptions, progress, images and audio are not on either computer and need no transfer.
- **The local database is only for development.** It is `language-lms` at `mongodb://127.0.0.1:27017`. It holds only what you created on localhost.
- **`server/uploads/` is legacy.** `server/index.js` still serves it, and `server/scripts/migrateUploadsToCloudinary.js` moves old files from it to Cloudinary.
- **Uncommitted work is not in Git.** Before leaving the old computer, run `git status` and commit and push anything you want to keep.

---

## A. Must recover from the old computer

| # | Item | Why | How |
|---|---|---|---|
| A1 | `server/.env` | Git-ignored. Holds every backend secret. | Copy to `migration-export/env/server.env`, then on the new computer: `cp migration-export/env/server.env server/.env` |
| A2 | The same `JWT_SECRET` and `EMAIL_SETTINGS_KEY` (inside A1) | `server/utils/googleSmtpSettings.js` uses them to encrypt the Gmail app password saved in admin email settings. If you restore an old database with a different secret, that password can't be decrypted. A new secret also signs everyone out. | Keep the values from A1 unchanged. |
| A3 | Local MongoDB data | It exists only on the old disk. | Exported to `migration-export/database/`. See [Database backup and restore](#database-backup-and-restore). |
| A4 | The same `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (inside A1) | Saved push subscriptions only work with the keys that created them. This matters only if you restore old `pushsubscriptions`. | Keep them from A1, or generate new keys (C5) and turn notifications on again in the browser. |
| A5 | `server/uploads/`, if it exists | Very old local uploads may exist only there. | Old computer: `ls server/uploads`. If it has files, copy them to `migration-export/uploads/`. New computer: `mkdir -p server/uploads && cp -R migration-export/uploads/. server/uploads/`, then `node server/scripts/migrateUploadsToCloudinary.js` |
| A6 | `client/.env`, if it exists | Google sign-in on localhost needs it. | Copy to `migration-export/env/client.env`, then `cp migration-export/env/client.env client/.env` |

Transfer these securely (AirDrop, `scp`, an encrypted USB drive, or a password manager). Don't email them and don't commit them.

## B. Must configure manually on the new computer

| # | Item | Why | How |
|---|---|---|---|
| B1 | Node v26 and MongoDB 9.0.8 | Both live under `~/.local` and are not on PATH. | Add `export PATH=~/.local/node-v26.13.0-darwin-arm64/bin:$PATH` to `~/.zshrc`. Start MongoDB with `~/.local/mongodb-macos-aarch64--9.0.8/bin/mongod --dbpath ~/.local/mongodb-data --bind_ip 127.0.0.1 --port 27017` |
| B2 | Localhost values in `server/.env` | These differ from production. | `PORT=5001`, `MONGO_URI=mongodb://127.0.0.1:27017/language-lms`, `CLIENT_URL=http://localhost:5173`, `NODE_ENV=development`. `SKIP_EMAIL_VERIFICATION=true` is for local testing only and also needs `NODE_ENV=development`. |
| B3 | `client/.env` (optional) | Without it, Google sign-in is turned off (`client/src/auth/GoogleAuthButton.jsx`). The API address is found automatically: `client/index.html` uses port 5001 when the page is served on port 5173. | `cp client/.env.example client/.env`, then set `VITE_GOOGLE_CLIENT_ID`. Set `VITE_API_BASE_URL` only to use a different API. |
| B4 | Atlas database name in `MONGO_URI_ATLAS` | A placeholder such as `/YOUR_DATABASE_NAME` makes the import script stop with "No courses found". | Use the real database name from Atlas. Prefer a read-only database user. |
| B5 | Dependencies | `node_modules` is git-ignored. | `npm install && npm --prefix server install && npm --prefix client install` |
| B6 | Playwright browser | Needed for end-to-end tests. | `cd client && npx playwright install chromium` |

## C. Can be regenerated automatically

| # | Item | How |
|---|---|---|
| C1 | Starter course, lessons, vocabulary | `node server/seed.js` (deletes and re-creates that course's lessons) |
| C2 | Cloud learning content on localhost | After B4: `node server/scripts/importCloudContent.js` to preview, then add `--apply`. It only inserts, backs up local content first, and skips accounts and progress. See `docs/local-content-import.md`. |
| C3 | HSK 1 grammar course | `node server/scripts/installHsk1Grammar.js` |
| C4 | Built-in HSK papers, sentence lists, tone pairs | Already in Git (`server/data/`). Nothing to do. |
| C5 | New local secrets, if you don't bring A1 | `openssl rand -hex 32` for `JWT_SECRET`, `ADMIN_CODE`, `PUSH_CRON_SECRET`. `npx web-push generate-vapid-keys` for VAPID keys. |
| C6 | `client/dist`, `test-results/`, cached TTS audio | Rebuilt by building, testing, or using the app |

## D. Must obtain from external service providers

| Variable | Required? | Purpose | Where to get it |
|---|---|---|---|
| `MONGO_URI` | Yes | Main database | Local value for development. The production value is in Render → bhasahub-api → Environment. |
| `JWT_SECRET` | Yes | Sign-in tokens, email-password encryption, reminder links | A1, or generate (C5) |
| `ADMIN_CODE` | Yes, to register admins | Admin sign-up code (`server/routes/auth.js`) | A1, or choose one |
| `PORT` | No (defaults in code) | API port. Use `5001` locally. | — |
| `CLIENT_URL` | Yes | Links in emails and push notifications | `http://localhost:5173` locally |
| `NODE_ENV`, `SKIP_EMAIL_VERIFICATION` | Local only | Skip email codes during development | — |
| `MONGO_URI_ATLAS` | Optional | Source for `importCloudContent.js` and other scripts | MongoDB Atlas → Connect |
| `CLOUDINARY_URL` | Needed for any upload | Media, recordings, testimonial uploads | Cloudinary dashboard → API Keys |
| `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` | Optional | Google sign-in | Google Cloud Console → Credentials. Add `http://localhost:5173` as an authorized JavaScript origin. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Optional | Verification and plan emails. SMTP is used instead of Resend when set. | Your mail provider (Gmail: an app password). Can also be entered in admin email settings. |
| `RESEND_API_KEY` | Optional | Email fallback | resend.com |
| `EMAIL_SETTINGS_KEY` | Optional | Separate encryption key. Falls back to `JWT_SECRET`. | See A2 |
| `GEMINI_API_KEY` | Optional | AI tone feedback (`server/routes/aiTone.js`) | Google AI Studio |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | Optional | Natural Mandarin voice. Falls back to the browser voice. | Azure portal → Speech resource → Keys and Endpoint |
| `AZURE_SPEECH_VOICE_A`, `AZURE_SPEECH_VOICE_B` | Optional | Voice choice. Defaults: `zh-CN-XiaoxiaoNeural`, `zh-CN-YunxiNeural` | — |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Optional | Daily push notifications | A4, or generate (C5) |
| `PUSH_CRON_SECRET` | Optional locally | Protects `/api/push/run`. Also a GitHub Actions secret used by `.github/workflows/daily-reminders.yml`. | Choose one. In production it must match Render and GitHub. |
| `VITE_API_BASE_URL` | Optional | Override the API address the client uses | — |

Production values on Render, Vercel and GitHub stay on those services and are not affected by changing computers.

---

## Database backup and restore

The export uses the MongoDB driver that ships with the server, so no extra tools are needed.

**On the old computer** (with mongod running), from the repository root, after `npm --prefix server install`:

```sh
cd server && node -e '
const fs=require("fs"),path=require("path"),{MongoClient,BSON}=require("mongodb");
const out=path.resolve("../migration-export/database/language-lms");fs.mkdirSync(out,{recursive:true});
(async()=>{const c=await MongoClient.connect("mongodb://127.0.0.1:27017");const db=c.db("language-lms");
for(const {name} of await db.listCollections({type:"collection"}).toArray()){const docs=await db.collection(name).find().toArray();
fs.writeFileSync(path.join(out,name+".json"),docs.map(d=>BSON.EJSON.stringify(d,{relaxed:false})).join("\n")+(docs.length?"\n":""),{mode:0o600});console.log(name,docs.length)}
await c.close()})()'
```

This writes one Extended JSON file per collection, which keeps ObjectIds, dates and binary data exact.

**On the new computer** (with mongod running), from the repository root:

```sh
npm --prefix server install
node migration-export/database/restore.js
```

The restore script only inserts records whose `_id` is missing, so it never overwrites data that's already there and is safe to run twice. Indexes are rebuilt when the app starts.

If you'd rather use MongoDB's own tools (`mongodump`/`mongorestore` from MongoDB Database Tools), those work too.

## Final check on the new computer

```sh
export PATH=~/.local/node-v26.13.0-darwin-arm64/bin:$PATH
~/.local/mongodb-macos-aarch64--9.0.8/bin/mongod --dbpath ~/.local/mongodb-data --bind_ip 127.0.0.1 --port 27017 &
npm run server   # http://localhost:5001, should log "MongoDB connected"
npm run client   # http://localhost:5173
npm test         # server tests
```

When everything works, delete the copied secrets from `migration-export/` and from any transfer media.
