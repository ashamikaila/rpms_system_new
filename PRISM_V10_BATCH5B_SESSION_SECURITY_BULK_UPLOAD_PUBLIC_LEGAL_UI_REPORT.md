# PRISM V10 — Batch 5B report

Review date: October 11, 2026 (Asia/Manila).

## Checkpoint and worktree

- STARTING BRANCH: `prism-v10-b05a-ui-adviser-routing`
- STARTING HEAD: `3d32a73f108d943b58872f07d0f6ad7a0ff64e0f`
- ENDING BRANCH: `prism-v10-b05b-security-bulk-upload`
- ENDING HEAD: `3d32a73f108d943b58872f07d0f6ad7a0ff64e0f`
- Base: the committed Batch 5A checkpoint, `Refine adviser routing and workspace UI`.
- Starting recent history: `3d32a73`, `25557f2`, `83ef1df`, `1ed5464`, `5675e5f`.
- Starting worktree: five untracked Batch 2, 3, 4, 4.5 and 5A reports. All preserved; unrelated artifacts were not edited.
- ENDING WORKTREE: changes remain unstaged; no index changes. Exact final status is recorded below.

Batch 5A behavior was retained. Credential and template fixture harnesses were updated for the new guard/approved pure includes; assertions were not removed or relaxed to pass. The older credential-login cases now explicitly start logged out. New tests are made reviewable through narrow `.gitignore` exceptions.

## Source audit, completed before application edits

### Auth/session

Inspected `config.php`, `security.php`, `index.php`, `login.php`, `login_process.php`, `logout.php`, authentication/role guards, onboarding helpers, protected page/navigation bootstrap and shared/raw fetch patterns.

`login.php` already redirected a valid authenticated session to `index.php`. The router already enforced password change before profile completion, followed by Student `student.php`, Adviser `research_adviser.php`, or Admin `dashboard.php`. Account status and credential fingerprints were checked by `current_user()`; inactivity limit was 1,800 seconds. Missing/archived profiles remained subject to existing onboarding restrictions. Cookies already used HttpOnly and SameSite=Lax, with Secure on HTTPS. Mutation protection used the existing Origin/Referer same-origin guard, rather than a separate token-based CSRF system. Fresh login already regenerated the PHP identifier; logout already cleared the session, expired its cookie and destroyed storage.

The vulnerability was the direct POST path: `login_process.php` accepted valid second credentials and overwrote the existing shared identity. No pre-authentication current-identity check existed there. An isolated execution of the original source demonstrated A becoming B with a session rotation before the fix.

### Catalog, upload, versioning and filesystem

Inspected `documents.php`, `documents_api.php`, `role_portal.php`, document controllers, `prism-ui.js`, workflow, Office container checks, notification helpers, audit and purge gates, and preview/download scope.

Batch 4's 14 labels lived only in JavaScript. Backend uploads accepted arbitrary/free-text types and defaulted missing type to `Other`. Historical filters used literal stored values. Upload supported a scalar file, a 20 MiB application limit, extension allowlist, finfo MIME compatibility, and safe Office containers. Original names were metadata; generated 24-hex identifiers determined storage paths. File move preceded the transaction. Student-row `FOR UPDATE` locking serialized even the first version; the current document was then locked, its successor inserted, and the predecessor superseded. Failure rolled back and removed the new file. Success sent the existing Student/adviser notifications and wrote upload audit evidence. Preview/download and review used current server roles and student/adviser ownership.

### Gmail

Inspected configuration constant definitions without reading real override credentials, `gmail_access_token()`, `gmail_api_send()`, `send_notification_email()`, OAuth helper/documentation, and mail-log fallback.

The helper requests exactly `https://www.googleapis.com/auth/gmail.send`. Access-token exchange uses the configured refresh token. The Gmail application endpoint is outgoing `users/me/messages/send`; no read/search/delete mailbox API was found in these wrappers. No credentials, tokens or Google configuration were changed.

Finding: after failed Gmail and PHP mail delivery, nonsensitive messages are logged with recipient, subject and complete body to `storage/mail.log`. This can retain personal and workflow information. Sensitive credential mail returns a failure before that fallback; existing sensitive reset/setup transport protections were retained. This is a production privacy/security finding. Body-log remediation is deferred to the appropriate mail/hardening batch; notification persistence and transport behavior were not redesigned here.

### Public auth/UI

Inspected Login, auth styles, shared presentation/footer, theme patterns and password-recovery presentation. Approved legal bodies were absent initially. The owner subsequently supplied the Privacy Policy and Terms through this conversation. Their wording, supplied date and unresolved placeholders are retained.

### Admin dashboard

Inspected `dashboard.php`, dashboard/overview/workspace CSS, attention, stage cards, Calendar, Tasks & Deadlines, monitor controls, breakpoints, Year container queries, and overlay controllers. Attention, stage distribution and IERB were inside a left-column wrapper; Calendar was inside the right-column wrapper. This constrained IERB width. The existing Year mode expands the calendar layout and uses natural height with 3/2/1 columns. Navigation overlays the workspace.

## Part A — Session security

**ONE BROWSER PROFILE = ONE ACTIVE PRISM ACCOUNT.** PHP's shared browser cookie remains the sole session identity. Simultaneous identities require separate browser profiles, browsers, or private contexts; no per-tab identities were introduced.

- Authenticated GET Login continues through the existing canonical router; no duplicated role-routing logic or password/profile gate bypass.
- A direct POST checks the authoritative current identity before parsing credentials, throttling, regenerating, or overwriting auth fields.
- Another email, unknown identity, or malformed second submission returns HTTP 409 and an explicit logout-first message, with links back to PRISM and Logout. Existing account ID, email, role, credential binding, generation and CSRF-like fixture state remain intact.
- A same-account email submission returns to `index.php` without recreating authentication, even if an already authenticated page accidentally resubmits credentials.
- Fresh unauthenticated login retains `session_regenerate_id(true)` and creates a random session-only generation. Strict session mode and cookie-only session identifiers are enabled.
- Logout retains session/cookie destruction and expires the additional public generation cookie.
- The random generation contains no PII, credentials, or authorizing token. Protected shared staff navigation and Student pages render it; the authentication cookie stays HttpOnly. A separate readable cookie permits stale-page comparison.
- Focus, visibility and pageshow compare the rendered generation. A mismatch displays “Your PRISM session changed in another tab. Reload this page to continue.” in a modal with Reload.
- Shared same-origin fetch mutations send `X-PRISM-Generation`. Ordinary POST forms on these pages receive a hidden marker. The origin guard rejects a supplied stale marker with 409. Upload requires a matching marker independently.
- Authentication, roles, onboarding, same-origin and object authorization remain independent and authoritative. After logout, protected endpoints still return 401.

Exact scenario evidence: the HTTP harness models two tabs sharing a cookie jar: Adviser login; second-tab Login redirect; rejected Admin POST; Adviser identity and PHP cookie unchanged; explicit logout; normal Admin login; stale Adviser generation rejected; old destroyed cookie cannot revive Adviser; Admin logout; stale protected action requires authentication. The browser harness independently exercises the rendered stale-page dialog and prevents a mutation from leaving the browser.

Limits: these are automated fixture/browser checks, not manual testing against an installed application. General older mutation clients that omit a marker retain their existing same-origin/auth/object guards. Password/profile setup pages do not receive the workspace browser script. Uploads always require the generation. The marker adds no DB schema and grants no authorization.

## Part B — Authoritative document catalog

`includes/document_catalog.php` is the sole new-upload catalog. `document_catalog_client.php` serializes it using JSON hex escaping; Documents and Student submission render those values. `PrismUI.documentTypes` reads the serialized array without a duplicate JavaScript list. Backend membership requires an exact canonical label.

1. Form 11 Review Checklist
2. Form 12 Registration and Application Form
3. Form 14 Informed Consent Assessment
4. Form 13 Study Protocol Assessment Form
5. Study Protocol
6. Letter to IERB Chair
7. Certificate of Ethics
8. Payment
9. Informed Consent - Local Language
10. Informed Consent - English
11. Data Collection Questionnaire
12. Diagrammatic Workflow
13. Curriculum Vitae
14. Other Supporting Document

`Custom Document`, `Research Protocol`, `<script>`, and historical `Protocol` are rejected as new types. No historical label is rewritten. List/filter, history, review and file authorization paths retain literal legacy values; previous-batch fixture regressions cover their presentation and filtering.

## Part B — Bulk upload

- Both existing upload surfaces use native `multiple` selection, one document type for the batch, names/sizes in a status region, and keyboard-accessible per-file results.
- Multipart files use `document[]`; scalar `document` remains supported with current session-generation protections. Metadata fields retain the existing meaning. New UI adds `fileCount` and a random `requestId`.
- Complete success, partial success and complete failure are represented by `outcome`, uploaded/failed counts, summary and ordered `results`. Every structurally valid submitted file receives its own result. All-failure responses carry the same results through the shared error path.
- Successful files commit independently. A failed later file does not roll back an earlier success. There is no auto-approval or formal submission.
- Student owner/stage/research metadata come from the server record. Staff selection is resolved and scoped by the existing authorization; the locked record is revalidated for archival, assignment, stage and purge eligibility.
- Native labels, status/live regions, visible focus, escaped/textContent results, and busy buttons are retained. No local full paths are shown.
- Mismatched/nested/noncontiguous file arrays and nonstring request fields fail before processing. Files independently check PHP upload errors, `is_uploaded_file`, actual byte size, zero length, filename/control/separator/executable-double-extension safety, extension/MIME compatibility and Office container limits.
- The existing 20 MiB per-file application limit remains. Observed local CLI limits: memory 512M; POST 40M; individual PHP upload 40M; max uploads 20. No new institutional file-count policy was created. Submitted `fileCount` detects PHP truncation before persistence. PHP-rejected/oversized POSTs fail closed without writes; server and application limits are not bypassed.
- No concatenated binary buffers, DB base64 bodies, or whole-batch in-memory file loading. Receipt fingerprints stream `hash_file`; extraction remains per file using existing logic.
- Busy controls prevent double clicks; server session receipts replay a completed identical request without creating versions. A request ID reused for different content fails with 409. Receipts include generation and a binary-safe metadata/content fingerprint and are bounded to 16 entries per session.
- An uncertain network response does not trigger automatic resubmission. The selected files are cleared, the Documents state is refreshed, and the user is told to check it before selecting again.

Limits: receipts are session-scoped and optional for older scalar clients; they are not permanent cross-session idempotency records. A process death before receipt storage can leave an uncertain outcome, so reconciliation is required. No persistent request table was introduced.

## Versioning / atomicity

The existing single-upload body is reused as a procedural per-file function in `documents_api.php`, preserving workflow rules. Each file independently computes the next version after locking the student and latest document. Success supersedes only its predecessor; history remains. In a same-type batch the final successful file becomes current, and earlier successful files become earlier versions according to existing semantics.

Validation precedes storage. A destination is exclusively reserved with `fopen(..., 'xb')`; only that new reservation is replaced by the uploaded file. Generated paths prevent original-name authority and collision overwrite. Move failure removes the reservation. The transaction locks/revalidates the owner, inserts metadata, updates current pointers and submission date, and calls the existing audit helper before commit. Its existing best-effort audit behavior is not redesigned. On conflict/DB/commit failure, the current transaction is rolled back and only the newly generated file is cleaned. Cleanup failure uses existing safe server logging. Student/adviser success notifications run after commit; delivery/read-back failure cannot report an already durable upload as failed and encourage duplication.

Two concurrent PHP fixture servers and separate authenticated cookie jars exercise overlapping same-type uploads, including first/current-version sequencing. SQLite `BEGIN IMMEDIATE` replaces MySQL row locking in the fixture, and buffered statements model MySQL cursor behavior. Unique versions, one current pointer, preserved history, separate files and per-success audit are asserted. This proves the fixture sequencing and existing lock usage; native MySQL contention was not executed. No installed database or real student files were used.

Injected move, nonexistent destination/write, metadata INSERT and commit failures produce no newly committed metadata, orphan files, audit success or success notices. Existing rollback/cleanup-failure workflow fixtures also pass. As in the original architecture, database/filesystem operations are not a distributed transaction across process crashes.

## Part C — Public Privacy Policy / Terms

`privacy.php` and `terms.php` select fixed trusted static files under `includes/legal/`. Their shared public renderer loads pure security/assets helpers, not `config.php`, sessions, user details, workspace navigation or a database. Anonymous and authenticated requests return readable content without altering cookies. Query parameters cannot supply HTML or choose a content path.

Exact sources: the owner's two message replies in this task, titled “PRISM Privacy Policy” and “PRISM Terms of Service”, each with “Effective Date: October 2026”. Static Markdown adds headings/list structure and spacing only. Wording is unchanged, including the supplied `Sectionl`, `MAlolos`, and “Address: Street Address:” wording in Privacy; no legal interpretation or invented institutional details were added.

The pages use PRISM branding, an 880px maximum shell, one H1, ordered H2 sections, normal browser scrolling, light/dark presentation, a theme control, skip link, visible keyboard focus, URL wrapping and native navigation. Login has actual `privacy.php`/`terms.php` anchors. Public legal content/navigation work with JavaScript disabled. Authenticated Login still redirects independently.

Unresolved, centralized in `includes/legal_placeholders.php`:

- `[SUPPORT/PRIVACY EMAIL]`
- `[PRIVACY CONTACT / DATA PROTECTION OFFICER]`
- `[EMAIL ADDRESS]`
- `[NAME]`
- `[PUBLIC PRIVACY POLICY URL]`
- `[ORGANIZATION / PRISM OPERATOR]`
- `[SUPPORT EMAIL]`
- `[ORGANIZATION / OPERATOR]`
- `[PUBLIC TERMS URL]`

These visible placeholders need approved replacement before production launch/OAuth verification. The supplied postal address and month/year date were used as supplied. No final production domain, DPO, legal representative or contact address was invented.

The Gmail scope and outgoing-only wrappers match the supplied Gmail disclosure. The exact Google API Services User Data Policy/“including the Limited Use requirements” sentence is present. No live Google API/verification interaction was performed. Nonsensitive mail-body logging remains the separately disclosed finding above.

Explicit confirmation: NO authentication required for Privacy Policy. NO authentication required for Terms. NO mandatory Privacy acceptance. NO mandatory Terms acceptance. NO legal-consent schema. NO Gmail OAuth scope expansion. NO Gmail credential change.

## Part D — Admin dashboard layout

The left/right wrappers were replaced by direct grid children: full-width attention; stage distribution and Month Calendar/Tasks side by side above 1200px; full-width IERB; full-width recent repository. Narrow widths stack naturally. `grid-column: 1 / -1` gives IERB the existing workspace width at every breakpoint; page width was not enlarged. Panels use top alignment and natural heights.

Year mode retains Batch 4.5's existing expanded single-column calendar arrangement to preserve full-readable 3/2/1 month cards. This mode stacks stage distribution before the expanded Calendar; IERB still follows at full width. Month view uses the requested aligned two-panel row on desktop. No calendar/deadline, stage metric, attention count/link, IERB data/action or authorization logic changed.

Browser metrics assert monitor width equals grid width and monitor begins below preceding panels; Month panel top alignment; narrow stacking; sidebar open/close geometry stability; Year twelve-month containment, natural height, no inner vertical scrollbar, and correct 3/2/1 columns. Existing filters/Actions/modal layering, keyboard focus return and viewport containment are exercised by the older batch regressions. Table horizontal scrolling remains a deliberate contained region; body horizontal overflow is absent.

Visual and metric artifacts are in temporary folders listed in Test Results; they are separate from the preserved pre-existing workspace artifacts.

## Test results

All tests use isolated identities/PDO doubles, volatile or temporary SQLite, temporary storage, rendered templates and mocked external transports. The installed app configuration/database was never bootstrapped. Part A passed before Part B; Part B passed before C/D. Part A and upload HTTP tests were rerun after all implementation parts.

| Suite | Result |
| --- | --- |
| Baseline silent switch reproduction | PASS — original direct POST changed A into B |
| `v10-batch5b-session.php` | PASS — 36 identity, roles, gates, origin, stale-generation, rotation/logout cases |
| `v10-batch5b-http.cjs` | PASS — 76 actual cookie/multipart/partial/version/cleanup/receipt/public-page/object-access checks |
| `v10-batch5b-upload-validation.php` | PASS — 25 malformed transport, PHP errors, name/MIME/size checks |
| `document-workflow-audit.php` | PASS — 48 review, Revision/Deny, formal submission, Override, version, archival, rollback and cleanup cases |
| `v10-batch5a-routing.php` | PASS — 30 real routing/auth/profile cases |
| `auth-flows.php` | PASS — 52 credential/reset/password/origin/provisioning checks |
| `v10-batch4-security.php` | PASS — 91 lifecycle/authorization checks |
| `v10-batch45-security.php` | PASS — 168 scope, archive, purge and route checks |
| `v10-batch2-readonly.php` | PASS — 71 read-only/scope/Pending/pagination checks |
| `v10-batch3-filters.php` | PASS — 150 filter/API/bulk/security checks |
| `v10-batch3-deadlines.php` | PASS — 50 deadline/group/cancellation checks |
| `v10-batch3-invitations.php` | PASS — 130 invitation/domain/assignment checks |
| `hardening-audit.php` | PASS — 114 token/password/Office/AI checks, CLI ZIP enabled for this test invocation only |
| `document-extraction-audit.php` | PASS — 37 extraction/privacy assertions, CLI ZIP enabled for this test invocation only |
| `email-format-audit.php` | PASS — 26 Gmail/mail/log MIME/escaping checks, transports stubbed |
| Batch 5B browser | PASS — 283 checks, six requested dimensions, light/dark, legal accessibility/contrast, JS disabled, reduced motion, dashboard, upload and stale page |
| Batch 1 browser | PASS — 1,280 checks |
| Batch 2 browser | PASS — 1,032 checks |
| Batch 3 browser | PASS — 2,277 checks |
| Batch 4 browser | PASS ? 2,368 checks |
| Batch 4.5 browser | PASS ? 2,073 checks |
| Batch 5A browser | PASS — 959 checks |
| PHP syntax | PASS — 143 tracked/new PHP files |
| JS/CJS syntax | PASS — 40 tracked/new JS/CJS files |
| `git diff --check` | PASS |

Dimensions: 1920×1080, 1366×768, 1024×768, 768×1024, 390×844, 375×812. Theme, responsive and keyboard checks use both themes. No claimed live OAuth verification, production testing, installed-DB testing or native MySQL test.

Initial broad scratch-inclusive JS sweep found a pre-existing ignored `tests/shell-alignment-focus.js` snippet with top-level await that is not a standalone Node module. It was preserved. The reviewable tracked/new application/test syntax sweep is clean. Local PHP had ZIP disabled by default; relevant ZIP suites were rerun using a process-only `-d extension=php_zip.dll` flag, without editing installed PHP configuration.

Artifacts already produced:

- Batch 5B metrics/legal/dashboard screenshots: `C:\Users\khirz\AppData\Local\Temp\prism-batch5b-ui-6vL2j6` (final passing run, including targeted Month/Year/monitor captures and metrics).
- Final session/upload HTTP fixture: `C:\Users\khirz\AppData\Local\Temp\prism-batch5b-8rrxG0`.
- Batch 5A: `C:\Users\khirz\AppData\Local\Temp\prism-batch5a-iExbn9`.
- Batch 2: `C:\Users\khirz\AppData\Local\Temp\prism-batch2-ui-GmTAVE`.
- Batch 3: `C:\Users\khirz\AppData\Local\Temp\prism-batch3-ui-cftxBX`.
- Batch 4: `C:\Users\khirz\AppData\Local\Temp\prism-batch4-after-HDwrGA`.
- Batch 4.5: `C:\Users\khirz\AppData\Local\Temp\prism-batch45-braZgy`.

## Schema proof and explicit non-changes

`SCHEMA_VERSION` remains **9**. The `migrate()` section is byte-for-byte equivalent after line-ending normalization to starting HEAD. No schema manifest, manual SQL, migration code/tool or final/intermediate v10 schema was changed. Persistent installed databases were not accessed or migrated.

NO notification lifecycle redesign. NO Help & Support. NO Staff Registration Code. NO Adviser approval → automatic RPMS submission. NO RPMS Return to Student. NO Admin Override semantic change. NO retention semantic change. NO permanent-delete verifier redesign. NO Archive-first bypass. NO mandatory legal acceptance. NO legal-consent database. NO Gmail OAuth scope expansion. NO Gmail credential/token modification. NO Google Cloud modification. NO MVC/OOP conversion, frontend framework or code-structure reorganization.

## Final review state

All requested batch browser suites passed: 10,273 checks in total. The final Batch 5B run passed 284 checks. An earlier artifact-capture run exposed a test reload race; its fixed delay was replaced with the existing readiness waiter, and the full suite was rerun without removing assertions.

Final branch/HEAD are the values listed above. Index diff is empty. All changes and this report remain unstaged.

```text
 M .gitignore
 M assets/css/dashboard-overview.css
 M assets/css/prism-workspace.css
 M assets/css/style.css
 M assets/js/documents.js
 M assets/js/prism-ui.js
 M assets/js/role-portal.js
 M config.php
 M dashboard.php
 M documents.php
 M documents_api.php
 M includes/prism-navigation.php
 M login.php
 M login_process.php
 M logout.php
 M role_portal.php
 M security.php
 M tests/auth-flows.php
 M tests/document-workflow-audit.php
 M tests/ui-audit.cjs
 M tests/v10-batch45-security.php
 M tests/v10-batch5a-routing.php
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
?? PRISM_V10_BATCH4_5_ARCHIVE_WORKSPACE_REPORT.md
?? PRISM_V10_BATCH4_DOCUMENT_UI_REPORT.md
?? PRISM_V10_BATCH5A_UI_ADVISER_ROUTING_REPORT.md
?? PRISM_V10_BATCH5B_SESSION_SECURITY_BULK_UPLOAD_PUBLIC_LEGAL_UI_REPORT.md
?? assets/css/public-legal.css
?? assets/js/document-upload.js
?? assets/js/session-browser.js
?? includes/document_catalog.php
?? includes/document_catalog_client.php
?? includes/document_upload.php
?? includes/legal/
?? includes/legal_placeholders.php
?? includes/public_legal.php
?? includes/session_browser.php
?? privacy.php
?? terms.php
?? tests/v10-batch5b-http.cjs
?? tests/v10-batch5b-router.php
?? tests/v10-batch5b-session.php
?? tests/v10-batch5b-ui.cjs
?? tests/v10-batch5b-upload-validation.php
```

No commit, push, merge, tag, deployment, staging, database migration,
Hostinger modification, Google Cloud modification, production access,
or production modification performed.
