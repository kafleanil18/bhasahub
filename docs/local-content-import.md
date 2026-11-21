# Copy cloud learning content to localhost

Put the cloud MongoDB connection string in `MONGO_URI_ATLAS` in `server/.env`. Use a read-only cloud database user when available. Keep `MONGO_URI` pointed at your local database. Connection strings stay in the ignored environment file; never commit them.

Preview from the repository root:

```sh
node server/scripts/importCloudContent.js
```

Apply the previewed import:

```sh
node server/scripts/importCloudContent.js --apply
```

The script only reads the cloud database. The destination must be a single loopback MongoDB address. It copies courses, lessons, vocabulary, tests, practice papers, slides, tracing characters, pinyin content, sentence audio links, and public lesson settings. Accounts, passwords, subscriptions, learning progress, attempts, messages, testimonials, and email credentials are excluded.

Existing local content is preserved. Matching local courses and lessons are reused and child references are mapped to their local IDs; missing content is inserted. Ambiguous matches or missing parent references stop the import. Records already in localhost are not overwritten, so this does not synchronize later edits to existing content.

Before applying, the script writes a restricted-access Extended JSON backup of local content in a unique system temporary directory and prints its path. Imported image/audio URLs remain cloud-hosted; relative `/uploads/` references point to the production API. This copies content records and media links, not the media files themselves. Static sentence catalogs and built-in HSK papers ship with the repository and need no database copy.
