# Version 0.2.1 — direct opening and device layouts

Tap the file icon/name/card to open it directly in the existing Reader. Tap a module name to study. The separate Open buttons are removed from these rows. File rename/download/fallback/delete options are under its three-dot menu. Primary targets are native buttons, so keyboard Enter/Space works; menu clicks do not launch the file.

Settings → App Information shows best-effort detected platform, phone/tablet/desktop, orientation and current layout. Detection includes Android phones/tablets, iPhone and iPads using desktop-style Safari identification. Responsive layout follows actual viewport size, including tablet split screen; operating-system detection is not a guarantee or authentication signal. No device identifiers are stored or sent to a server.

Phone rows wrap, tablet layouts use wider spacing, touch targets stay at least 44px, short landscape sheets fit the viewport, safe areas are respected, and iOS form text avoids automatic input zoom. iOS Settings explains Safari → Share → Add to Home Screen. Data remains in the browser/profile where it was saved; changing browsers requires backup/import.

Database schema/name/IDs and study content remain unchanged. Version 0.2.0 migration rules still apply; 0.2.1 adds no new learner-data migration. Updates retain existing install identity.

Changed: js/app.js, js/version.js, index.html, .github/workflows/deploy.yml, precache-manifest.js, service-worker.js, README.md, docs/TABLET_UPLOAD.md, docs/CHANGED_FILES.txt.
Added: js/device-environment.js, css/device-layout.css, tests/device.cjs, this release note.

Verification: script syntax, build checksums, device classification/direct-action tests and the existing eleven data/study/PDF/update test suites passed. Physical Android/iPad layouts and stylus behavior need device verification; no real-device test is claimed.
