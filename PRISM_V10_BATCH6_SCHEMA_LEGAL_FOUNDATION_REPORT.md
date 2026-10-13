# PRISM V10 Batch 6 — schema and legal foundation report

## Result and checkpoint

The implementation defines final `SCHEMA_VERSION = 10`, guarded `migrate_schema_v10()`, the equivalent manual SQL migration, governed Privacy/Terms versions, exact-version account acknowledgment/agreement and a central PDF/DOCX-only new-upload policy. Schema v10 is frozen after Batch 6. B7–B12 are code-only against this contract.

This is an uncommitted implementation for owner review. No installed or persistent staging database was migrated. Migration/bootstrap testing used newly initialized private MariaDB servers, verified private datadirs, random temporary credentials and disposable databases. HTTP testing used private application copies with synthetic configuration and disabled mail/AI transports. Browser presentation tests used isolated templates and intercepted API fixtures; public-page rendering never loads the installed database.

Starting and ending branch: `prism-v10-b06-schema-legal-foundation`.

Starting and ending HEAD: `23e898bca91b07ad938e2745da2b1183abc74605`.

The approved local Batch 5B base is `23e898b Harden sessions and add bulk document uploads`. The previous four checkpoints are `3d32a73` Batch 5A, `25557f2` Batch 4.5, `83ef1df` Batch 4 and `1ed5464` Batch 3. Starting tracked worktree was clean. The six pre-existing untracked Batch 2/3/4/4.5/5A/5B reports remain preserved. No remote access was used to claim or revalidate pushed status.

Ending worktree contains unstaged application/test edits and untracked Batch 6 migration/services/pages/tests/documentation. The Git index is unchanged. The existing local secret configuration, installed storage and unrelated reports were not rewritten. See final status inventory at the end of this report.

## Source audit before DDL

The proposal was recorded in [PRISM_V10_BATCH6_SCHEMA_PROPOSAL.md](PRISM_V10_BATCH6_SCHEMA_PROPOSAL.md) before DDL implementation. Audit findings came from the actual v9 migration declarations, canonical manifest and endpoint/service code.

| Area | Existing persistence | Required v10 preparation |
|---|---|---|
| Current schema | 17 InnoDB tables and canonical v9 FK/index definitions | Six new tables; four additive recipient columns; final v10 manifest and validation plan |
| Notifications | One recipient per `notifications` row; `type`, delivery status, scheduling, read timestamp and Sending lease | Logical campaign/sender copy; optional campaign/account binding; independent recipient archive/delete |
| Help & Support | No persisted support subsystem; existing mail-app preparation UI | Campaign kind and seven-category enum; ordinary-composer response correlation; current-Admin recipient snapshot in existing recipient rows |
| Staff registration | No global staff-code store; existing Adviser invitation flow | Checked singleton, generation ID, verifier, acknowledgment/state/expiry/consumption and nullable creator/consumer attribution |
| Document review/submission | `documents.review_status`, `review_remarks`, `reviewed_by`, `reviewed_at`, `version_no`, `supersedes_id`, `is_current`, `rpms_submitted_at/by`; version-bound activity events | No additional fields: B10 performs approval/submission in one controlled transaction |
| RPMS Return | Original document versions and generic entity-bound `activity_logs.reason`, actor and timestamp already exist | B10 appends mandatory version-bound return events, preserves original approval/submission fields and inserts a superseding revision; determine returned eligibility from latest workflow event |
| Admin Override | `admin_override`, `override_reason`, `override_by`, `override_at`, review/submission fields and `activity_logs.is_override` | No additional fields; B11 integrates the final state machine and distinguishes comments |
| Account lifecycle | Archive/restore, six-calendar-month retention, seven-day grace, Hold, unresolved workflow, ownership guards, transactional audit and recoverable file journal | Deliberate CASCADE/SET NULL account edges, institutional RESTRICT edges; exact updated purge manifest |
| Hard-delete verifier | Configuration/private evidence, binding, visibility checks and existing 24-hour lifetime | No database structure. B12 changes evidence validity in code; the existing expiry remains in B6 |
| Public legal | Batch 5B Markdown source and escaped public presentation | Corrected source seeded once into immutable published versions; runtime explicit current pointers |
| Legal acceptance | None | Account/exact-version evidence with server timestamp; no migration backfill |
| Uploads | All persisted document creation/revision paths converge on `documents_api.php?action=upload` | Central `allowed_document_extensions()` and actual-content validation for every file |

## Final database contract

[PRISM_V10_SCHEMA_CONTRACT.md](PRISM_V10_SCHEMA_CONTRACT.md) inventories every table/column/type/nullability/default/PK/unique/index/FK/delete/update rule and maps B7–B12 to exact structures. The final inventory has **23 InnoDB tables, 240 columns, 88 ordered index components and 26 ordered FK components**, with no triggers.

New tables:

- `notification_campaigns`: logical send, sender history, four kinds, seven support categories, nullable ordinary-response correlation and independent sender lifecycle.
- `legal_policies`: exactly Privacy/Terms, authoritative same-policy current-version pointer.
- `legal_policy_versions`: server-assigned monotonic numbers, immutable review/publication/history source, content hash and one generated unique open-candidate marker.
- `legal_policy_approvals`: one durable approved/rejected decision per candidate with independent/sole/bootstrap mode and review time.
- `user_policy_acceptances`: `(user_id, policy_version_id)` primary key plus server timestamp.
- `staff_registration_code`: checked `slot=1` singleton; verifier-only secret representation and acknowledgment/expiry/consumption fields.

Existing `notifications` gains nullable `campaign_id`, nullable `recipient_user_id`, `archived_at`, `deleted_at` and the required indexes/FKs. Legacy rows retain NULL new values and their original content/status/read/schedule values. Existing workflow tables are unchanged.

Institutional policy/version edges use RESTRICT. Account-bound acceptance and new recipient ownership use CASCADE. Campaign sender, version creator, approval reviewer and staff-code creator/consumer use SET NULL. Every account edge permits an otherwise valid purge; no new user FK uses RESTRICT. Archive/restore and Holds preserve the new rows. Acceptance disappears only when the account is actually purged; institutional legal history survives. Existing recoverable storage checks and retention rules remain authoritative.

## Legal text and public configuration

Only these non-substantive Privacy changes were made before v1 seed generation:

| Original | Corrected | Why |
|---|---|---|
| `Research Progress Monitoring Sectionl` | `Research Progress Monitoring Section` | Obvious trailing-letter typo |
| `Centro Escolar University - MAlolos` | `Centro Escolar University - Malolos` | Obvious capitalization typo |
| `Address: Street Address: Km. 44 ...` | `Address: Km. 44 ...` | Duplicate label removed; original address retained |

Terms wording is unchanged. Heading numbers and the supplied October 2026 effective-date text remain. Potential substantive identity/contact/retention/privacy-rights/Gmail/AI/legal-obligation wording was left unchanged for owner review. The database metadata separately shows actual publication/effective time in Asia/Manila; historical source is not silently rewritten to match a later date.

Immutable v1 source hashes:

- Privacy: `4d1c161153fa0892ccbb4133ec0ee6155378ef05823e45a9d894484471fcda31`.
- Terms: `4fabda0f307ed19036dea0af01db77a6ca0513911b7cfcbea20b1658e958aec8`.

`includes/public_urls.php` is the sole application hostname configuration: `https://www.rpmsceu.online/`, yielding `/privacy.php` and `/terms.php`. Relative application links remain relative. Approved absolute URL placeholders are resolved centrally; policy text and unknown contacts are not duplicated or invented. Public pages emit canonical URLs and show title/version/actual publication metadata.

Unresolved placeholders remain: organization/operator (`[ORGANIZATION / PRISM OPERATOR]`, `[ORGANIZATION / OPERATOR]`, `[NAME]`), support/privacy email (`[SUPPORT/PRIVACY EMAIL]`, `[SUPPORT EMAIL]`, `[EMAIL ADDRESS]`) and `[PRIVACY CONTACT / DATA PROTECTION OFFICER]`. These require owner-approved values before production/OAuth launch. They do not block this implementation. No OAuth credential, sender identity or real DB credential was printed, rotated or changed.

## Governance and rendering

Admin navigation now links `admin_legal_policies.php`; the Navigation Guide explains the new item. The page supports current policies, draft editing/saved preview, required change summary, submission, independent review, rejection reason and immutable historical viewing. Exactly two policy IDs and known actions are accepted. Only the creator edits/submits a draft; an orphaned draft can be adopted by an eligible Admin with audit. Submission freezes text. Rejection preserves the candidate and reason; a later draft receives the next number.

Eligibility is evaluated from current database records: Admin, Active, password setup complete, complete identity/email and valid password verifier. Legal acceptance is required for the acting Admin but is not used to hide other otherwise eligible Admins from the count. Two or more eligible Admins require one different eligible reviewer; three Admins still require only one other approval. The creator cannot self-publish with multiple Admins. A sole eligible Admin must confirm the current password, explicit review acknowledgment and the additional sole-Admin acknowledgment. The UI displays the sole-Admin notice and durable review mode/time in history.

Every governance transaction uses SERIALIZABLE isolation, locks the complete users PRIMARY-key range (including insertion gaps), revalidates actor/password/security/legal state, then locks policies in a fixed order. Registration, activation, deactivation, archive/purge and competing review cannot alter the authoritative count during publication. State checks, unique review and generated candidate uniqueness provide additional protection. Approval/audit/published state/time/current pointer commit together. A losing concurrency transaction rolls back and may require a reload/retry; native MariaDB 12.1 transient record-change/deadlock errors are treated as safe refusals in the concurrent fixture, matching the application's generic server-error boundary.

Published, pending and rejected text has no application edit/delete operation. Current resolution joins the explicit same-policy pointer, published state, approved evidence and matching SHA-256 source. It does not infer current from the largest number. Creator/reviewer purge nulls only attribution and preserves institutional text/evidence.

Preview, history and public pages all use `legal_render()`. Only escaped structured paragraphs/headings/lists are emitted. HTML, scripts, event attributes, CSS, iframes and JavaScript URL syntax display as literal text. No active raw HTML is accepted. Public reading needs no login, acceptance or JavaScript, and neither starts nor mutates the authenticated browser session/cookies.

Native POST management/acceptance forms require same-origin evidence, session generation and CSRF. Client version/state/reviewer/actor/current-pointer tricks are rejected or ignored in favor of server data. Policy body, password and hash are not copied into audit events.

## Account acknowledgment/agreement

Routing order is current authenticated account → forced password change → current Privacy acknowledgment/Terms agreement → Student/Adviser profile completion → normal workspace. Pending invited users, complete users and Admins all require exact current legal versions. Future Staff-Code registration must also follow this gate and creates no implied acceptance.

`legal_consent.php` shows the signed-in identity, links both public policies, presents only outstanding checkboxes, never prechecks them and provides logout. Privacy uses “I have read and acknowledge”; Terms uses “I agree.” Both outstanding requirements must be explicitly submitted before entering PRISM. Declining leaves evidence absent and normal access blocked.

Acceptance locks the current subject account and policy pointers. The submitted snapshot binds the exact displayed IDs and source hashes; publication while a form is open causes a 409/reload, with no acceptance of unseen newer text. User IDs, version IDs, accepted timestamps and proxy flags are not accepted from the client. Unique exact-version evidence is idempotent. Privacy-only publication leaves accepted Terms valid, and vice versa. Restored users retain historical evidence and must satisfy any current changed version after password setup.

`require_login()` and `api_require_login()` enforce the database-derived legal state on each request, including direct pages, mutation APIs and stale tabs. APIs return structured 403 `legal_acceptance_required` with `legal_consent.php`; the shared fetch wrapper redirects on that code. Password setup uses only the existing tightly scoped `profile_api.php` me/change_password exception. Public legal pages and logout remain available. No Admin proxy acceptance endpoint exists. No IP/user-agent/role or redundant profile snapshot is collected for acceptance.

## Global new-upload format policy

**ONLY PDF and DOCX are accepted for NEW PRISM document uploads.** The existing 14-item document-purpose catalog is unchanged and is distinct from file format.

| Endpoint / caller | Role permission | Central validator / final format |
|---|---|---|
| `documents_api.php?action=upload`, single scalar file | Student own active record; authorized Admin target | `prism_validate_upload()` → PDF/DOCX only |
| Same endpoint, multiple files | Same permissions; each file independently validated | Same validator; mixed batches retain per-file partial success |
| Revision/version creation through the upload endpoint | Existing ownership, workflow lock and stage/version rules | Same validator; no alternate replacement bypass |
| `role_portal.php` document chooser | Student | `accept=".pdf,.docx"`; server authority unchanged |
| `documents.php` document chooser | Existing permitted Admin UI | Same chooser restriction; no privileged format bypass |
| Adviser crafted upload | Existing upload prohibition retained | Cannot gain upload authority from a valid format |

No separate persistent IERB attachment/document importer/replacement/upload route was found. The local photo preview chooser is not a persisted PRISM document upload.

Extensions are case-normalized. Transport, shape, UPLOAD_ERR, name/path/double executable extension, zero-length, actual size and 20 MB limits remain enforced. Browser MIME is not trusted. PDF requires server finfo PDF MIME, a real header, object marker and bounded terminal startxref/EOF structure. DOCX accepts known Word MIME or conservative ZIP/octet-stream detection only after bounded ZIP metadata and real OOXML validation: content types, main Word part, main internal relationship, Word namespace/body, no macro main type/VBA/spreadsheet/presentation substitution, no DTD/entities/network parsing or extraction. Archive count/expanded-size/compression-ratio/path/encryption safeguards remain. This is file-format validation, not a malware scanner or a complete PDF parser.

Format errors use the clear allowlist message “Only PDF and DOCX files are allowed.” Spoofed content has a separate content mismatch/invalid-container message. TXT, DOC, XLS/XLSX, PPT/PPTX, CSV, images, ZIP/RAR, ODT/RTF and executable formats cannot create new document records/files. Uppercase PDF/DOCX are accepted when actual content is valid.

Historical legacy formats/labels are not deleted, renamed, rewritten or hidden. Preview/download/summary/history and their authorization remain. The stricter DOCX structural mode applies specifically to new uploads; historical extraction retains the earlier bounded-container behavior/error semantics. Bulk success/failure, rollback/cleanup, request replay receipts, revision sequence, locked versions, stale sessions and role restrictions remain Batch 5B behavior.

## Migration, parity and compatibility

`tools/build-schema-v10.py --generate` deterministically emits specification, PHP plan, seed and manual SQL from the preserved v9 contract and corrected legal source. It does not load configuration or connect to a database. `tools/write-batch6-contract.py` renders the verified inventory as the complete human contract. The preserved `tools/schema-v9-contract.json` allows v9 prerequisite checks and earlier native suites without reverting the final manifest.

Final deterministic regeneration preserved all five artifact hashes (plan, seed, manual SQL, specification and human contract). The plan contains 267 prerequisite checks, 15 guarded DDL steps, 367 final schema checks, eight seed statements and four seed/current/history invariants. The inventory SHA-256 is `ec424088b23a7a7ba5415fcf4e2fb602d7580df8c587d1ec1af541c7edb429ec`.

PHP migration is CLI opt-in, binds the exact selected database, requires canonical v9, enabled FK enforcement, owned `prism_migrate` lock and no active transaction. Ordinary web requests never execute pending DDL. Additive DDL is guarded by existence; complete table/column/type/default/index/FK inventory, generated candidate expression, singleton CHECK, no-trigger and visible external-FK checks must succeed before seed/stamp. Seed, invariant validation and schema stamp occur transactionally. MariaDB's implicit DDL commits are acknowledged: a failure may leave additive structures at v9, but rerun safely resumes and malformed definitions fail closed. Existing v10 retries do not rewind current policy pointers or duplicate v1/reviews/acceptance.

Manual SQL defaults deliberately refuse. The operator must set exact database and explicit backup/checkpoint flag; the helper routine requires routine/DDL privileges. It uses the same generated checks/DDL/seed, lock, transactional invariant/stamp boundary and exception rollback/release. No migration disables FK checks. The only fixture use of FK_CHECKS=0 is a deliberate guard-refusal test, immediately restored; it is never a migration shortcut.

Native testing used MariaDB **10.4.32** (XAMPP binary with new private datadir) and **12.1.2** (portable binary with new private datadir). PHP/manual results match exactly, including legal rows/timestamps under a fixed fixture clock. MariaDB 12.1 changed automatic legacy FK/index names when recreating old migrations; its test fixture explicitly reconstructs the canonical approved v9 names before v10. The v10 parity comparison itself ignores no name differences. Canonical production prerequisites are not relaxed.

Native MySQL 8 was unavailable and was not tested. The SQL targets MariaDB 10.4+ / MySQL 8.0.16+ features, but no MySQL-specific PASS is claimed. Hostinger access/privileges/version were not inspected; local MariaDB compatibility and shared-hosting metadata/routine requirements are the review evidence. Owner-authorized staging validation remains required before deployment.

## Verification

| Suite | Final result / evidence |
|---|---|
| Native v10 MariaDB 10.4.32 | PASS, 404 cumulative assertions |
| Native v10 MariaDB 12.1.2 | PASS, 404 cumulative assertions |
| PHP/manual migration parity/retry/failure/data preservation | Included: 135 native assertions per server |
| Real v10 HTTP/auth/legal/onboarding/stale APIs/multipart/governance | Included in native matrix; private app copy and transports disabled |
| Concurrent Admin insertion/count locking, competing reviewers/drafts, Staff Code consume | Included; exactly one publication/candidate/consume winner |
| Full v10 lifecycle | Included: Student/Adviser archive, restore/password requirement, Hold, grace refusal and completed recoverable purge; Admin self-purge and all new CASCADE/SET NULL references |
| Pure format validation | PASS, 73 allowlist/uppercase/MIME/PDF/OOXML/container/macro/XML/name/transport/size assertions |
| Shared legal-response fetch behavior | PASS, 11 isolated JavaScript checks using real Request/Headers/Response semantics; redirect, preserved caller body, generation and origin/status/type boundaries |
| Earlier isolated PHP regression | PASS, all 27 suites; `tests/v10-batch6-results/regression-results.json` |
| Earlier native retention/onboarding regression | PASS, 1,873 cumulative assertions on fresh MariaDB 10.4.32 with `--retention-core`; includes 484 real HTTP, 85 v9 migration, 315 onboarding/lifecycle and 200 onboarding concurrency checks; ignored log: `tests/v10-batch6-results/retention-core-final.log` |
| Complete earlier legacy-FK regression | PASS, 2,392 cumulative checks on fresh MariaDB 12.1.2; full PHP/manual matrix, retries and literal-`1` FK guard cases |
| Focused earlier legacy-FK guard regression | PASS, four checks on fresh MariaDB 10.4.32 |
| Batch 1 browser | PASS, 1,280 checks |
| Batch 2 browser | PASS, 1,044 checks |
| Batch 3 browser | PASS, 2,277 checks |
| Batch 4 browser | PASS, 2,368 checks |
| Batch 4.5 browser | PASS, 2,073 checks; search/render/selection transitions settled before geometry assertions |
| Batch 5A browser | PASS, 959 checks |
| Batch 5B HTTP / upload / session | PASS: 76 HTTP, 25 upload and 36 session checks; prior-batch fixtures explicitly model accepted legal state |
| Batch 5B browser | PASS, 284 checks |
| Batch 6 browser | PASS, 750 checks, 108 viewport/theme/state renders |
| PHP / JS-CJS syntax | PASS, 172 PHP and 45 JS/CJS files |
| Git diff whitespace | PASS; ordinary LF/CRLF conversion notices only |

Batch 6 tests cover two/three/sole Admins, self approval, missing summary/password/checkboxes, state/count changes, rejection, exact monotonic numbering, immutability, creator/reviewer purge, executable markup, all roles, pre/post profile completion, no acceptance backfill, exact/partial reacceptance and stale publication snapshots. Real multipart A.pdf/B.docx/C.xlsx/D.pdf produces three successes and one format failure, with existing historical DOC unchanged. Prior-batch suites retain authorization/versioning/failure/cleanup assertions; outdated fixture bootstrap/schema-version/format/lifecycle-filter assumptions were updated to the approved current behavior, rather than bypassing application guards.

The large combined earlier `--retention` run lost its MariaDB 10.4 connection (`2006 MySQL server has gone away`) in the final manual legacy-FK guard fixture. It had passed retention, recovery/bulk, two-isolation-level concurrency, 86 verifier checks, 484 real HTTP/onboarding checks, 85 v9 migration checks, 1,305 PHP FK migration assertions and the manual negative-FK cases. This interrupted combined run is not reported as a PASS. A new private MariaDB 10.4 `--hostinger-fk-guards` run passed all four focused guard checks. Retention/onboarding and the complete legacy FK matrix were then split onto fresh independent servers for final results in the table above; no application migration guard was bypassed or weakened.

The browser matrix covers 1920×1080, 1366×768, 1024×768, 768×1024, 390×844 and 375×812, light/dark, public policies, both/partial consent, draft, pending, creator, sole and historical states. Checks include one primary heading, no body overflow, labels, visible keyboard focus, mobile target sizes, no executable markup, immutable-history controls, explicit checkboxes and native forms with JavaScript disabled/reduced motion. Screenshots and metrics are in `tests/v10-batch6-results/` (ignored artifacts); selected earlier UI screenshots are in their private temporary output directories. No external browser resource/API was used as a substitute for real server authorization tests.

All eight Batch 1–6 browser suites pass, totaling 11,035 checks. The mobile consent and sole-Admin screenshots were also visually inspected. These counts describe the final passing runs, excluding obsolete fixture failures and their reruns.

Reproduction commands (disposable only):

```powershell
C:\xampp\php\php.exe tests/account-lifecycle-runner.php --batch6
# Optional: --mariadb-bin <reviewed portable MariaDB binary directory>
C:\xampp\php\php.exe tests/account-lifecycle-runner.php --retention
# Separate fresh-server runs are also supported:
C:\xampp\php\php.exe tests/account-lifecycle-runner.php --retention-core
C:\xampp\php\php.exe tests/account-lifecycle-runner.php --hostinger-fk-migration
python tools/run-batch6-regression.py
node tests/v10-batch6-browser-session.cjs
node tests/ui-audit.cjs --batch6-only
```

Native MariaDB connections verify `@@datadir` against the newly created private path before any test mutation. The runner shuts down only its own process and removes only its resolved temporary directory. The tests do not run the operator migration command against the installed application.

## Later one-time staging procedure — not performed

Perform only after explicit owner approval of this implementation and the persistent staging migration:

1. Confirm the reviewed Batch 6 commit/checkpoint and final contract/generator/manifest hashes.
2. Back up/checkpoint the staging database, configuration and applicable private storage; confirm a tested recovery path and suspend writers.
3. Confirm the exact selected staging database/server and stored schema v9.
4. Validate canonical v9 tables/types/defaults/indexes/FKs/engines and visible external dependencies against `tools/schema-v9-contract.json`; do not disable FK checks or improvise name changes.
5. Apply v9 → v10 once using one reviewed route. PHP: set `PRISM_ALLOW_SCHEMA_V10_MIGRATION=1` and `PRISM_SCHEMA_V10_EXPECT_DB=<exact staging DB>` only for `php tools/migrate-schema-v10.php`. Alternatively, in a reviewed copy of `tools/schema-v10-manual.sql`, set the exact database and backup/checkpoint flag to 1 and run the whole script on that selected staging connection. Do not run both routes as separate planned migrations. Remove temporary opt-ins afterwards. If interrupted, diagnose/repair the failed prerequisite and rerun the whole guarded route; never stamp by hand.
6. Verify stored `schema_version=10` only after successful completion.
7. Verify the complete final contract/manifest plus generated expression, singleton CHECK, FK enforcement and external-dependency checks from `schema_v10_plan()['verify']`.
8. Validate exactly corrected Privacy v1/Terms v1, their source hashes, bootstrap approval evidence and explicit current pointers using `schema_v10_plan()['invariants']`.
9. Verify `SELECT COUNT(*) FROM user_policy_acceptances` is zero before any smoke-test users explicitly accept; do not backfill migrated users.
10. Smoke-test public no-login legal reading, forced-password → legal → profile ordering, explicit/partial acceptance, all roles and direct/stale API denial.
11. Smoke-test real PDF/DOCX, content spoofs, denied formats, mixed bulk partial success, authorization and historical-file download.
12. Rerun account lifecycle/schema visibility/ownership/Hold/grace/unresolved-workflow/recoverable-purge checks on disposable staging copies; confirm deployment evidence invalidation after the manifest change. Enable hard-delete only with valid reviewed evidence.
13. Regenerate deployment-bound hard-delete evidence when the final verifier policy is implemented/appropriate. B12 is responsible for persistent validity; B6 does not remove the existing evidence expiry. Restore writers only after validation.

## Ending worktree inventory

45 tracked files modified, 32 untracked paths (26 Batch 6 additions plus the six preserved earlier reports), and no staged changes. Branch and HEAD remain the starting checkpoint. Test metrics/screenshots/logs remain ignored local artifacts.

```text
 M .gitignore
 M assets/css/public-legal.css
 M assets/js/prism-guidance.js
 M assets/js/session-browser.js
 M config.php
 M documents.php
 M includes/account_lifecycle_schema.json
 M includes/account_lifecycle_schema.php
 M includes/document_upload.php
 M includes/legal/privacy.md
 M includes/legal_placeholders.php
 M includes/office_container.php
 M includes/prism-navigation.php
 M includes/public_legal.php
 M index.php
 M role_portal.php
 M tests/account-hostinger-fk-migration.php
 M tests/account-lifecycle-http.php
 M tests/account-lifecycle-runner.php
 M tests/account-lifecycle-worker.php
 M tests/account-onboarding-mysql.php
 M tests/account-retention-extended.php
 M tests/account-retention-http.php
 M tests/account-retention-mysql.php
 M tests/account-retention-upload-worker.php
 M tests/account-retention-verification.php
 M tests/alignment-audit.php
 M tests/archive-operational-audit.php
 M tests/calendar-deadlines-audit.php
 M tests/document-summary-audit.php
 M tests/document-workflow-audit.php
 M tests/hardening-audit.php
 M tests/tonight-polish-audit.php
 M tests/ui-audit.cjs
 M tests/v10-batch2-readonly.php
 M tests/v10-batch3-invitations.php
 M tests/v10-batch4-security.php
 M tests/v10-batch45-security.php
 M tests/v10-batch45-ui.cjs
 M tests/v10-batch5a-routing.php
 M tests/v10-batch5b-http.cjs
 M tests/v10-batch5b-router.php
 M tests/v10-batch5b-session.php
 M tests/v10-batch5b-ui.cjs
 M tests/v10-batch5b-upload-validation.php
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
?? PRISM_V10_BATCH4_5_ARCHIVE_WORKSPACE_REPORT.md
?? PRISM_V10_BATCH4_DOCUMENT_UI_REPORT.md
?? PRISM_V10_BATCH5A_UI_ADVISER_ROUTING_REPORT.md
?? PRISM_V10_BATCH5B_SESSION_SECURITY_BULK_UPLOAD_PUBLIC_LEGAL_UI_REPORT.md
?? PRISM_V10_BATCH6_SCHEMA_LEGAL_FOUNDATION_REPORT.md
?? PRISM_V10_BATCH6_SCHEMA_PROPOSAL.md
?? PRISM_V10_SCHEMA_CONTRACT.md
?? admin_legal_policies.php
?? includes/legal_policy.php
?? includes/public_urls.php
?? includes/schema_v10.php
?? includes/schema_v10_plan.json
?? includes/schema_v10_seed.json
?? legal_consent.php
?? tests/fixtures/batch6-valid.pdf
?? tests/v10-batch6-browser-session.cjs
?? tests/v10-batch6-concurrency-worker.php
?? tests/v10-batch6-concurrency.php
?? tests/v10-batch6-http.php
?? tests/v10-batch6-mysql.php
?? tests/v10-batch6-template.php
?? tests/v10-batch6-ui.cjs
?? tests/v10-batch6-upload-validation.php
?? tools/build-schema-v10.py
?? tools/migrate-schema-v10.php
?? tools/run-batch6-regression.py
?? tools/schema-v10-manual.sql
?? tools/schema-v10-spec.json
?? tools/schema-v9-contract.json
?? tools/write-batch6-contract.py
```

## Explicit confirmations

`SCHEMA_VERSION = 10`. PHP/manual schema and corrected legal seeds are equivalent on both tested MariaDB versions. No acceptance is fabricated. No ordinary schema additions remain deferred for B7–B12; notification/support/staff-code preparation is persistence only. Existing B5B sessions/catalog/version/bulk behavior is preserved. Published versions are immutable through application paths; multiple eligible Admins require one other reviewer; sole publication requires current password and both explicit acknowledgments. Current legal acceptance is account/version bound and globally enforced. Approved absolute public URLs are centralized. Unknown operator/email/DPO details remain unresolved launch blockers. New document uploads accept PDF/DOCX only; historical formats and independent authorization remain.

No commit, push, merge, tag, deployment, persistent staging migration,
Hostinger modification, Google Cloud modification, production access,
or production modification performed.
