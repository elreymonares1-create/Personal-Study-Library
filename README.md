# Personal Study Library PWA

This evolves **Personal_Study_Library_Simple_Reader.html**, the authoritative file you specified. It retains that version's library, study behavior, bundled modules, Reader, annotations, notes, quizzes, flashcards, tables, calendar, backups and independent module records. It does not include later UI refinements from differently named HTML copies.

The original CSS and main script were extracted intact into `css/app.css` and `js/app.js`, with narrow hooks for local PDF loading and safe saves before updates. Large module payloads remain embedded in the existing registry for this first conversion; they were not blindly rebuilt or split.

## Before moving from your downloaded HTML

1. On your tablet, open your **current working HTML in the same browser/file provider you normally use**.
2. Choose **Library menu → Export complete backup**. Keep that JSON somewhere outside browser storage. Check that the download completed.
3. Publish the PWA, open its permanent HTTPS address in the same preferred browser, and choose **Import backup**.
4. Check your PDFs, module progress, notes and drawings before relying on the new installation. Keep the old HTML and backup.

A browser cannot automatically read the storage of a different `file://`, Android `content://`, website origin, browser, browser profile or device. Importing a backup is the one-time bridge. An installed PWA and Chrome's normal tab share storage when they use the **same origin and browser profile**. Chrome and Samsung Internet have separate storage; installing in one does not move the other's data.

## Deploy with GitHub Pages

No repository was supplied, and this project has **not been published or pushed to your account**.

1. Create or choose your GitHub repository. Put the **contents of this project folder at the repository root**, including `.github/workflows/deploy.yml`.
2. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Commit and push to `main`. The included workflow validates the app, stages an allow-list of public code/assets into `_site`, then deploys it with GitHub Pages.
4. Wait for the workflow to succeed. Open the URL shown by its deployment, usually `https://USERNAME.github.io/REPOSITORY/`.
5. Keep this URL, repository path, manifest `id`, `start_url` and scope stable for future releases. Enable HTTPS.

The staging step publishes only `index.html`, manifest, service worker, offline page, public `css/`, `js/` and `assets/`. It does **not** publish the recovery HTML, documentation, tests, exported backups, your live IndexedDB, uploaded PDFs, personal notes, drawings or study history. The two academic modules already embedded in the original application remain public application content. Review any academic content you intentionally add to the repository before publishing it.

For a manual static build:

```sh
python tools/build.py --output _site
python tools/verify.py
```

Serve `_site` over HTTPS, or use localhost for development. Do not double-click `index.html` to test installation: service workers require an HTTP(S) origin, and browsers permit localhost for development. The project also works under a repository subdirectory; all PWA and PDF asset URLs are relative to its own app directory.

## Install on an Android tablet

1. Open the published HTTPS URL in Chrome.
2. Keep it open until **Settings → App information → Offline app is ready** appears. Initial setup downloads the app code, modules, PDF engine and font/mapping assets; allow sufficient space and time.
3. Use Chrome's **Install app / Add to Home screen** menu, or **Settings → Install Study Library** when Chrome offers the install event.
4. Launch the installed icon. The manifest uses `display: standalone`.
5. Optionally select **Settings → Protect Local Study Data**, then export a backup.
6. Test airplane mode with a saved PDF, notes and a study module before a study session that depends on offline access.

Samsung Internet may offer installation through its own menu. Installation UI and persistent-storage grants depend on the browser. iOS uses Safari's **Share → Add to Home Screen** and has different storage/install behavior; it is not physically verified in this environment.

## How updates work

Edit code with Codex, review it, then:

1. Update `APP_VERSION` in `js/version.js` for a release. This is the one human-edited app version.
2. Run `python tools/build.py`. It generates a content revision, precache checksums and the service worker's build stamp. The GitHub workflow also runs this step automatically, so forgotten generated files do not leave installations stuck on old code.
3. Commit and push to `main`.
4. GitHub Pages deploys the new static build. The installed app checks for a worker update when opened, when returning to the foreground, when reconnecting, and every ten minutes while visible. You can also use **Settings → Check for Updates**. Browser scheduling and deployment/CDN propagation can delay discovery.
5. The new worker downloads and verifies the full app shell. It **waits** rather than immediately replacing a study session.
6. The app shows **Update available → Later / Update Now**. Later hides the banner for that version in the current tab; the Settings update button stays available. A future app opening can offer it again.
7. **Update Now** flushes pending notes, reading positions, module state and committed IndexedDB writes, saves the current workspace, tells the waiting worker to activate, and reloads **once** on `controllerchange`.
8. The original workspace is restored after boot: module sessions resume through their existing engine, and open generic quiz/flashcard sessions retain their question order, answers and position. Reader positions keep their original keys.

An unfinished drawing stroke or unsaved form blocks the reload with an explanation. Save or close the form and tap Update Now again. A failed save also blocks activation; retry that save or export a backup. No background update force-refreshes an active quiz or exam.

Other open tabs do not automatically reload when one tab activates an update. They show the update and can save/reload separately. Old application caches remain while any app tab reports older or unknown code, and are cleaned when the open tabs all report the current revision. Cache cleanup is limited to this app's scope-specific application-cache prefix.

If an installation fails, its incomplete new cache is removed and the old app cache remains usable. Every asset has an SHA-256 digest so a partial/mixed deployment cannot be accepted silently. A checksum failure does not publish a waiting update. Version checks bypass the browser's HTTP cache for service-worker scripts. There is no perpetual network-first page refresh during study.

## Offline behavior and PDF.js

The completed service-worker installation caches only the public app shell and an explicit asset allow-list. Installed/offline launches of the app directory or `index.html` receive the cached version. No user uploads or arbitrary external URLs are put into the application cache.

Core library, stored modules, notes, MCQs, flashcards, calendar, tables, progress, Reader and annotations use existing local storage. PDFs already saved in IndexedDB can be reopened offline. External sites/tutors still need internet; they are not simulated or cached as private content. A genuinely first-ever visit cannot work offline because the app has not yet been downloaded.

The original **PDF.js 3.11.174** library and matching worker are local in `assets/pdfjs/`. The existing continuous/lazy renderer, normalized page annotations, stylus handling, search, zoom and page navigation remain in `js/app.js`. `js/pdf-reader.js` only supplies the local loader and paths. Static standard fonts and packed CMaps are also local. Provenance and license information are in `assets/pdfjs/SOURCES.md` and the preserved licenses.

`isEvalSupported: false` is set for PDF loading: it avoids PDF font evaluation in this older retained engine. Keeping that version avoids an unnecessary renderer rewrite, but a separately tested future PDF.js upgrade is advisable; this conversion is not a claim that every dependency is the newest security release. This version keeps original PDF cache metadata in IndexedDB and simply stops depending on CDN fetches.

## Where personal data is stored

- **IndexedDB:** database `PersonalStudyLibrary`, version **3**.
- **Existing stores:** `subjects`, `chapters`, `topics`, `modules`, `materials`, `notes`, `calendarNotes`, `annotations`, `flashcardSets`, `flashcards`, `quizSets`, `questions`, `tables`, `progress`, `shares`, `trash`, `meta`.
- **Lightweight preferences:** the existing localStorage key `psl_prefs_v1`; legacy module keys remain available for the existing safe migration/import behavior.
- **Module records:** existing IDs and `sharedStudy:<moduleId>` / `moduleState:<moduleId>` namespaces remain unchanged.
- **PWA workspace snapshot:** additive `meta` record `pwaResume:v1`, created before an explicit update. After successful restoration it is marked consumed rather than clearing older user stores.
- **Application code:** scope-specific Cache Storage, separate from IndexedDB.

**No database schema migration was performed. No database, store, module ID, annotation structure or learner namespace was renamed, deleted or intentionally reset.** Existing write methods now acknowledge a transaction only after it commits; quota or aborted saves are reported instead of being called saved prematurely.

**Protect Local Study Data** calls `navigator.storage.persist()` only when you choose the button. The status is **Enabled** or **Browser-managed**; estimates include the origin's IndexedDB and browser caches and are approximate. Persistent storage helps resist automatic eviction but is not a backup and cannot prevent an explicit browser-data deletion, device loss or operating-system cleanup.

## Backup, recovery and rollback

Use the existing **Settings → Backup → Export Backup** or **Library menu → Export complete backup**. It includes all original stores, uploaded file Blobs, canonical module state and the recognized legacy preference/module keys. Keep exports outside browser storage. Large JSON backups can consume memory; confirm that the export completes. Import checks the backup and preserves conflicting copies in its archive rather than clearing the library.

If a backup is damaged, keep the original file and use another export. Failed validation/imports show an error. Do not use browser **Clear site data** or remove the database as a troubleshooting shortcut.

The ZIP deliverable includes the unchanged authoritative portable HTML in a separate recovery folder. You can open that original using its original origin/file provider to export its data. Opening the file at a new location/provider is not guaranteed to reveal the same local-file database.

To roll back deployed application code, revert the offending GitHub commit and push a corrected release. The installed app receives the rollback through the same waiting-worker flow. A code rollback cannot undo data edits and is not a substitute for backups. Before any future incompatible schema migration, create a reviewed migration and a backup/recovery path; this conversion does not introduce such a migration.

For later portable distributions, the authoritative HTML remains available as a recovery snapshot. A new single-file export builder can later inline the retained app sources; it should be a separate distribution without PWA registration. The current PWA does not depend on a portable-export build step.

## Files and changes

| File / folder | Responsibility |
| --- | --- |
| `index.html` | Original DOM; PWA links and ordered script loading |
| `css/app.css` | Existing styles, safely extracted in their original order |
| `css/pwa.css` | Compact update and error banners |
| `js/app.js` | Existing app and bundled module architecture; narrow save/PDF hooks |
| `js/storage.js` | Commit-aware writes, pending-save flushing and failure reporting |
| `js/pdf-reader.js` | Exact local PDF engine and worker loader |
| `js/integration.js` | Settings additions, save checks and workspace restoration |
| `js/updater.js` | Install prompt, waiting updates, user-controlled reload, storage status |
| `js/version.js` | Central app version and generated build identity |
| `manifest.webmanifest` | Stable identity, scope, standalone display and icons |
| `service-worker.js` | Offline allow-list, integrity checking and controlled app-cache cleanup |
| `precache-manifest.js` | Generated public asset list and SHA-256 checksums |
| `offline.html` | Fallback for unavailable routes |
| `assets/icons/` | Original theme-matched installation icons |
| `assets/pdfjs/` | Local library, worker, CMaps, standard fonts and licenses |
| `tools/build.py` | Static release identity and public-only deployment staging |
| `tools/verify.py` | Asset, manifest, path, schema and syntax checks |
| `tools/convert_base.py` | One-time conversion recipe; do not rerun over edited PWA sources |
| `tests/` | Worker/update/storage/preservation/PDF/integration verification |
| `.github/workflows/deploy.yml` | Validation and GitHub Pages deployment from `main` |
| `docs/` | Base fingerprints and honest testing report |

The application was not decomposed into speculative navigation/study-module services. That refactoring can be done incrementally after device validation. Module and generic Topic tool behavior remains the authoritative file's behavior.

## Verification and known limitations

Run:

```sh
python tools/build.py
python tools/verify.py
node tests/service-worker.cjs
node tests/updater.cjs
node tests/storage.cjs
node tests/preservation.cjs
node tests/integration.cjs
node tests/pdf.cjs
```

The worker and update manager are tested using their production code with simulated browser APIs. Storage tests reopen the actual unchanged initializer against a persistent fixture and check transaction/save errors. PDF tests run the real local library and worker; raster rendering additionally uses a local canvas implementation when available. These checks are not physical Android installation tests or browser screenshots.

Chromium cannot launch in this execution sandbox (`sandbox_host_linux: shutdown: Operation not permitted`). Therefore physical installation, Chrome/Samsung/iOS behavior, visual layout, stylus input and the full installed-browser update/offline path still require the checklist in `docs/TESTING.md` on your tablet after deployment. This project has not been connected to a specific GitHub repository or deployed URL.
