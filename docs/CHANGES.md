# Narrow changes to the authoritative base

Authoritative input: Personal_Study_Library_Simple_Reader.html. Its SHA-256 is recorded in base-fingerprint.json. Original module payloads, shared engine/adapter/styles and store list have separate fingerprints.

1. Moved the three existing style blocks into css/app.css in order and the single original script into js/app.js. Original DOM stays in index.html.
2. Added install manifest, theme metadata, icons, local PWA CSS and ordered script references.
3. Replaced only ensurePdfJs()'s CDN loading path with the exact local 3.11.174 loader, and provided local CMaps/font URLs. PDF document loading disables font eval; original page rendering/annotations/search/navigation remain.
4. Made note/PDF/text-reader position debounce callbacks flushable and capture their actual record/position before a reload.
5. Kept the original database initializer/version/store creation rules. Added a readable blocked-database message; a preference parse failure does not clear the database.
6. Added a wrapper that resolves writes after transaction completion and surfaces quota/abort failures. It never clears a store or creates an update migration.
7. Added a small integration wrapper around Settings for app information/update/install/storage controls. Original Settings and backup functions remain.
8. Saved an additive pwaResume:v1 meta snapshot only before an explicit update and restored/marked it consumed afterwards. Generic quiz/card sessions retain their existing question/answer data rather than being transformed into a new learning engine.
9. Added the standalone waiting-worker updater and scoped cache worker; neither is embedded in portable module exports.
10. Added public-only static release staging, asset integrity checks, deployment workflow, tests and documentation.

No schema migration, module/subject/topic ID replacement, existing learner data reset, source-content deletion, database deletion or wholesale interface redesign was performed. Personal uploads and data are not copied from IndexedDB into repository files. The original portable HTML is supplied separately in the download as a recovery version, outside the deployment allow-list.
