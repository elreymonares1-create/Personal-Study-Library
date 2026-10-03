# Verification report and tablet checklist

## Completed here

- All generated JavaScript passes `node --check`.
- Manifest contains stable relative `id`, `start_url`, `scope`, standalone display and valid 192/512/maskable PNG icons.
- Public asset digests verify, with URLs checked under both `/` and `/REPOSITORY/`.
- Production service worker is exercised with simulated Cache Storage and network responses: first installation, offline shell/code/local PDF worker, navigation fallback, private-resource exclusion, waiting activation, failed new-cache installation, old-cache survival, per-scope cleanup and older-tab retention.
- Production updater is exercised with simulated worker/browser lifecycle: explicit Update Now, Later, no refresh during normal study, save-before-activation order, one reload, save-failure refusal, up-to-date/offline checks, registration failure and another tab activating code.
- Production storage wrapper is exercised against transaction fixtures: commit acknowledgement, immediate debounce flushing, quota failure, abort handling, retry recovery and unchanged unrelated records.
- The actual original storage initializer is reopened at database version 3, with subject, note, PDF Blob, annotation, quiz/mastery and flashcard fixtures intact, including a 2,501-note library.
- Authoritative bundled module registry and shared study engine/UI/adapter strings are byte-for-byte checked against fingerprints from the Simple Reader file.
- Production integration bridge is exercised for generic quiz/card snapshots, module flush/resume, PDF positions, active strokes, unsaved editors and failed module saves.
- Actual local PDF.js 3.11.174 and its matching local worker parse a two-page PDF and extract searchable text. In this environment, a local native canvas also rasterizes the PDF text using bundled standard fonts.

These are code-level tests and a real PDF-engine test, **not** full browser, physical-device or deployed-site evidence. Chromium fails before launching because this execution sandbox denies its required operation. No Android/iOS device or GitHub repository was supplied.

## Acceptance scenarios

| Requested scenario | Evidence here | Validate after deployment |
| --- | --- | --- |
| 1. First visit online | Complete shell precache, integrity/manifest/path checks | Open HTTPS URL; check normal library/module load and wait for Offline app is ready |
| 2. Install | Manifest identity, icons and standalone setting verified | Install in Chrome Android; open home-screen icon and verify standalone display |
| 3. Offline | Worker serves cached shell/code/PDF assets with network disabled in harness | Use airplane mode; reopen installed app, library, notes and both modules |
| 4. Existing user data | Same DB/stores/IDs; reopened persistent fixtures preserved | Export old HTML; import once at hosted origin; add records; update and inspect them |
| 5. Update | Waiting worker, explicit skipWaiting and one reload tested | Change version and visible code; deploy; check prompt and apply it |
| 6. Later | Waiting update stays available, no reload | Tap Later; continue studying; apply through Settings later |
| 7. Active MCQ | No automatic reload; save ordering and session snapshots tested | Answer a question while update is waiting; apply and verify session resumes |
| 8. PDF | Local worker/font parse, search and raster test; PDF Blob fixture retained | Save a real large PDF online, annotate it, disconnect, reopen it and verify ink/page/search |
| 9. Large library | 2,501 records remain accessible; existing rendering code retained | Test your own large library/PDFs for memory and touch responsiveness |
| 10. Failed update | Missing/checksum-bad assets reject new install; current cache survives | On a disposable test deployment, omit an asset and verify current installation still works |

## Suggested release check on the tablet

1. Keep a verified backup outside browser storage. Do not clear site data during testing.
2. Confirm the expected permanent repository URL and same Chrome profile before importing.
3. Add one uniquely named subject and note, answer an MCQ, change one flashcard's progress, and draw a small annotation on a PDF/module source.
4. Record the version shown under Settings. Restart once while online, then verify everything in airplane mode.
5. Deploy a release with a small visible change and a higher `APP_VERSION`.
6. With an MCQ/exam open, wait for the update or use Settings → Check for Updates. Verify the current screen stays usable.
7. Tap Later and continue. Then use Update Now; verify the new version and saved session/annotation/notes.
8. Repeat with two open app tabs; updating one must not reload the other without its choice.
9. Try tablet portrait and landscape, finger scrolling, stylus drawing, PDF zoom/search and a sufficiently large source.
10. Only after these pass, treat the installed PWA as your primary study copy. Keep periodic backups.
