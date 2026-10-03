# Study-system improvement report — version 0.2.0

This release patches the existing Simple Reader PWA project. It does not replace the Main Base or either academic module. The earlier PWA infrastructure is retained; this improvement adds no new PWA subsystem. Original Simple Reader HTML and the previous PWA ZIP remain recoverable.

## Audit and authoritative systems

The Main Base already organizes subjects, optional chapters, Topics, module registrations, materials, notes, calendar, global search, sharing, trash and backup. Generic Topic quizzes originally stored attempts only when confidence was clicked; cards overwrote their latest rating; Topic progress blended reading and retrieval. Two embedded pharmacy modules already used one richer shared UI, adapters, adaptive queues, concept maps, exams and mistake history. Their original academic sources are retained byte for byte.

The shared module engine is now the authoritative study interface for the two bundled modules and generic Topic quizzes/cards/recall. Legacy Topic editing, importing, tables and reading remain usable. `LegacyTopicStudy` retains explicit access to the old study surfaces for developer recovery; they are no longer the default study launch path. This is consolidation, not mass deletion.

## Architecture and responsibilities

- Main Base (`js/app.js`): library, source Reader, organization, calendar, editors, backup, module launch.
- Shared module UI (`js/shared-study.js`): existing dashboard, MCQ, flashcards, typed recall, exam, history, guide, coverage, mistakes and sheets. Subject adapters supply independent content.
- Retrieval core (`js/study-core.js`): pure versioned progress normalization, verification, confidence, memory-state scheduling, prioritization, balanced fixed exam selection and concept coverage.
- Topic adapter (`js/topic-study.js`): brings saved generic questions/cards into that same UI; bridges existing Reader/notes/tables and mirrors existing progress keys.
- Existing bundled adapters remain unchanged and preserve original item keys/content.
- Build tool embeds the same core/UI sources into srcdoc launches and self-contained module packages. Maintain these source files rather than separately editing generated engine strings in app.js.

## Data models and compatibility

The database remains **PersonalStudyLibrary version 3**, with the same 18 stores, IDs and storage namespaces. No IndexedDB upgrade, store deletion, global localStorage clear, database deletion or academic-bank reset is performed.

Study schema is now 2. Existing module `sharedStudy:<moduleId>` records are normalized additively. Before upgrading schema 1, the original is copied to `sharedStudyUpgradeBackup:<moduleId>:v1`. Notes, histories, bookmarks, events, sessions, unknown fields and legacy state remain. Existing mastered records are not globally downgraded. New verification rules apply to new answers.

Topic modules use **sharedStudy:topic:<existingTopicId>** and **moduleState:topic:<existingTopicId>**. Initial legacy progress is retained in a `sharedStudyLegacyBackup:` meta record. Original progress keys remain `q:<questionId>` and `fc:<cardId>`; shared records are also mirrored there with an additive `studyRecord`. Calendar notes remain separate. A Topic's data never shares a learner namespace with another Topic or bundled module.

Concept: stable ID, title, topic/unit, optional true source reference, type/importance and linked items. Availability and attempts are computed from real links. User-defined Topic concepts live under `topicConcepts:<topicId>` in meta. Concepts without cards/questions remain untested. Item fallback IDs explicitly start `unmapped:`. Source links are recorded only when provided by the learner or original source adapter.

Study item: original key/ID, kind, prompt/front/back, answer options, correct original index, option explanations, concept/topic/unit, real source, optional difficulty/cognitive metadata. Invalid questions remain in the editor/source but do not break study sessions.

Progress: attempts/correct/incorrect, streak/verified, assistance, mastery/manual status, events, difficulty/stability/retrievability, last confidence, misconception, due date, scheduler/review type and original unknown fields.

Session: stable session ID, fixed or adaptive queue with appearance tickets, position, drafts, responses, option order, confidence, flags, hints, mode, timestamps, timer and settings. Missing-item/broken sessions are archived separately before dropping only the unusable session reference. The library is not reset.

Mistake: question/answer/explanation, true source, concept/topic, confidence, miss count, date, category and ACTIVE/IMPROVING/RESOLVED status. One successful recall moves a mistake toward improving. Verified retrieval resolves it. Manual mastery does not fabricate verified evidence or automatically erase active mistakes.

## Study behavior changed

Confidence is selected before checking the MCQ. Guess/Unsure answers do not earn independent verified credit. Confident errors create persistent misconception evidence and high-priority review. All scored attempts autosave independently of whether confidence is selected.

Normal, Strict and Mastery remain distinct. Normal can master an independently correct retrieval. Strict needs 2 distinct unassisted recalls separated by at least 10 minutes. Mastery needs 3 separated by at least 24 hours each. Repeating the same appearance does not increment verification. Hint/revealed-source assistance is excluded. Manual Master Anyway remains available with clear override labeling. Old evidence remains preserved.

Long-term and Exam Cram have different due intervals. Long-term uses a conservative exponential forgetting model with explicit difficulty, stability and retrievability estimates. Cram uses short intervals and the existing delayed within-session return queue. The scheduler identity is stored as `conservative-exponential-v1`. This is **not FSRS**, not a trained predictor, and its estimates are not clinically/experimentally calibrated. A real FSRS migration is still a separate improvement. Reviewed current upstream ts-fsrs documentation (FSRS 6) on October 3, 2026: https://github.com/open-spaced-repetition/ts-fsrs . No dependency or proprietary algorithm has been falsely claimed.

Mastered items are suppressed in ordinary sessions. Due-only sessions can intentionally include due mastered items. Weak prioritization, misconception review, Study Now, Smart Review and topic filters use saved evidence. Topics require multiple attempts before being labeled weak; one error is not sufficient on its own to label a whole Topic weak.

Cards use the same engine; Again/Hard/Good/Easy are available in the secondary menu with complete event history. Self-assessment is distinguished from independently verified typed recall. Typed matching remains text matching, not simulated semantic AI. Hint/source use marks the appearance assisted.

Exams select a fixed set before study, round-robin by actual topic and cognitive/difficulty labels where present, with shuffled ordering. No adaptive replacements occur during exams. Flags, navigator, unanswered states, optional timer, delayed feedback, submit confirmation and results remain. Delayed-feedback answers can be revised before final submission. Results include incorrect/unanswered/flagged/confidently wrong counts, topic results, missed concepts and follow-up review. Blueprint reports represented mapped concepts without pretending question count equals complete source coverage. No invented difficulty labels or fresh academic questions were added.

## Reader, accessibility and storage

Existing internal PDF.js, continuous scrolling, lazy rendering, zoom, source PDF Blobs, annotations, stylus, eraser, search and saved position are preserved. Search now stores each occurrence and navigates through exact result counts/snippets; page highlighting remains, precise text-region highlighting is not implemented.

Upstream PDF.js config reported stable 6.3.289 when reviewed October 3, 2026: https://github.com/mozilla/pdf.js/blob/master/pdfjs.config . The existing pinned 3.11.174 engine was retained because a major ESM/worker/tablet compatibility migration needs its own validation. Local engine/worker byte hashes remain pinned; font eval stays disabled. This release does not claim the old engine is the newest or fully hardened against hostile PDFs.

Main bottom sheets gain dialog labels, initial focus, keyboard trapping, Escape and focus restoration. Toasts become live status. Important controls target 44px. Shared module accessibility and tablet menus are retained. No physical-device layout certification is claimed.

`Storage.queryBy` adds a cursor-filtered API without changing DB version, reducing returned unrelated records/Blobs. It still scans the store; it is not an indexed lookup. Source/item editors progressively use it. Genuine DB indexes remain deferred to a separate explicit version migration, because both existing module openers still expect DB v3.

## Backup and recovery

Full backup version 3 includes lightweight preferences and all original stores, including Blobs as existing base64 exports, annotations, meta study histories and migration archives. Versions 1/2-style store backups remain importable.

Import parses and validates all records/binaries before writes, rejects unsafe prototype/identity keys, then asks for the existing explicit import confirmation. Conflicting originals and preferences are archived in `backupImportRecovery:<id>`. All database writes occur in one transaction. Failed writes roll back that transaction; unrelated local records are not cleared. Preference saving happens after successful DB restore. Newer unsupported backup schemas are rejected, not silently converted.

Recovery archives are included in full export. There is not yet a dedicated restore-one-archive UI. Recovery must be inspected from an exported backup or developer tooling. The complete original portable HTML and `recovery/shared-study-0.1.0.declaration.txt` preserve the original portable app and shared-engine source; the older PWA ZIP is also retained separately.

## Tests and limits

Automated tests exercise production source with simulated DOM/IndexedDB/SW APIs where appropriate; actual local PDF.js and worker parse generated 2-, 100- and 320-page PDFs, extract text and rasterize a page when native canvas is available. Tests cover original academic hashes, v1 migration recovery, module isolation, notes/ink/reader position preservation, spaced verification, assistance/guess exclusion, misconceptions, mistakes, fixed exams, backup rejection and recovery, Topic adapter launches/progress mirroring, script-breaking text, save failures, PDF result navigation, PWA update safety and 1,000-item/1,100-concept fixtures. Existing preservation test also opens a 2,501-note fixture through the actual storage initializer.

Full browser boot, real IndexedDB migration, Android/iPad installation, visual interaction, stylus scrolling and large-PDF UI memory remain device checks. Chromium is blocked by this environment's sandbox. No real device tests or GitHub deployment are claimed.

## Remaining technical debt and next step

Automatic trustworthy full-source concept extraction needs an actual connected/reviewable generation service or a carefully reviewed manual catalog. Adding a PDF alone cannot infer a complete academic concept map. Existing banks cover mapped content only. Generated distractor/case/calculation/diagram variants were not invented. Subject extensions remain adapter/hook-based; richer diagram/matching/calculation editors are future work.

A mature trained FSRS dependency, indexed DB migration, transactional concurrency across tabs, recovery-archive UI, responsive browser/device tests and a tested PDF.js major upgrade remain. The Main Base's large original bundle and some legacy inline handlers remain intentionally. Imported standalone HTML Study Modules contain executable application code and must come from trusted sources; JSON study text is escaped and does not run as code.

Recommended next step: test 0.2.0 on the actual Android tablet with a complete backup, then perform a dedicated indexed-storage migration and FSRS integration using the now-preserved review logs. Do not pursue another whole-app rewrite.

See CHANGED_FILES.txt for every changed/added project file and TABLET_UPLOAD.md for deployment steps.
