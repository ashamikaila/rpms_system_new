# PRISM V10 Batch 7 - notification lifecycle foundation

Date: 2026-10-11 (Asia/Manila).

**Result: IMPLEMENTED AND VALIDATED LOCALLY.** The original section-38 mandatory stop was resolved by the user's explicit continuation authorization for a narrow, forward-looking notification mail-log privacy fix. The existing B7 report is updated after implementation and validation; all changes remain unstaged and uncommitted.

## Starting and ending repository

- STARTING BRANCH: `prism-v10-b06-schema-legal-foundation`
- STARTING HEAD: `6890d565c62ae86a2c1bb0e907be558cbab7d758`
- ENDING BRANCH: `prism-v10-b07-notification-lifecycle`
- ENDING HEAD: `6890d565c62ae86a2c1bb0e907be558cbab7d758`
- No tracked modifications existed at the original starting checkpoint. Existing untracked reports were preserved. The B7 branch was created from the same B6 HEAD after continuation authorization.
- Batch 6 code, schema version 10, and the frozen campaign/account-binding/lifecycle structures were present before implementation. No unrelated tracked changes were overwritten. `git diff --cached --name-only` is empty.

Starting `git log -5 --oneline`:

```text
6890d56 Freeze v10 schema and add legal governance
23e898b Harden sessions and add bulk document uploads
3d32a73 Refine adviser routing and workspace UI
25557f2 Add archived account workspace and UI refinements
83ef1df Refine PRISM document and management interface
```

ENDING WORKTREE (`git status --short`):

```text
 M .gitignore
 M admin_notifications.php
 M assets/css/prism-ui.css
 M assets/js/admin-notifications.js
 M assets/js/prism-ui.js
 M assets/js/role-portal.js
 M config.php
 M dashboard.php
 M includes/account_lifecycle.php
 M includes/account_retention.php
 M includes/calendar_deadlines.php
 M includes/notification_delivery.php
 M notifications_api.php
 M role_portal.php
 M send_followup.php
 M tests/alignment-audit.php
 M tests/calendar-deadlines-audit.php
 M tests/document-workflow-audit.php
 M tests/notification-delivery-audit.php
 M tests/research-group-audit.php
 M tests/ui-audit.cjs
 M tests/v10-batch45-ui.cjs
 M tools/process_scheduled_notifications.php
 M workflow.php
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
?? PRISM_V10_BATCH4_5_ARCHIVE_WORKSPACE_REPORT.md
?? PRISM_V10_BATCH4_DOCUMENT_UI_REPORT.md
?? PRISM_V10_BATCH5A_UI_ADVISER_ROUTING_REPORT.md
?? PRISM_V10_BATCH5B_SESSION_SECURITY_BULK_UPLOAD_PUBLIC_LEGAL_UI_REPORT.md
?? PRISM_V10_BATCH6_SCHEMA_LEGAL_FOUNDATION_REPORT.md
?? PRISM_V10_BATCH6_SCHEMA_PROPOSAL.md
?? PRISM_V10_BATCH7_NOTIFICATION_LIFECYCLE_REPORT.md
?? PRISM_V10_SCHEMA_CONTRACT.md
?? assets/js/notification-history.js
?? includes/notification_lifecycle.php
?? tests/email-format-audit.php
?? tests/notification-v10-fixture.php
?? tests/v10-batch7-api.php
?? tests/v10-batch7-concurrency.php
?? tests/v10-batch7-lifecycle.php
?? tests/v10-batch7-native-fixture.php
?? tests/v10-batch7-native.php
?? tests/v10-batch7-purge.php
?? tests/v10-batch7-ui.cjs
?? tests/v10-batch7-worker.php
?? tools/run-batch7-regression.py
```

## Source audit

The following table preserves the **before-implementation source audit** recorded at the mandatory stop. It describes the B6 behavior that informed the implementation, rather than the resulting B7 behavior. The subsequent sections describe the completed changes.


| Area | Inspected source and current behavior |
| --- | --- |
| Manual producer / composer | `notifications_api.php`, `admin_notifications.php`, `assets/js/admin-notifications.js`: Admin institution-wide and Adviser assigned-student audiences; type and 600-character message validation; recipient preview, group options, immediate/scheduled sending. One row per recipient, no campaign creation or logical sender history. Intended B7 kind: staff. |
| Follow-up producer | `send_followup.php`: server-selected active, completed Student; Adviser assignment checked; generated IERB follow-up saved in-app and emailed. Intended kind: staff, since explicitly initiated by staff. |
| Workflow producers | `documents_api.php`: submission receipt, Adviser review, formal RPMS submission to Student/Admins/Adviser, document overrides. `ierb_api.php` and `students_api.php`: progress changes and overrides. `workflow.php` routes through `notify_student`, `notify_adviser_of_student`, `notify_rpms_admins`, `notify_in_app`. Intended kind: workflow, preserving existing subtypes and canonical workflow records. |
| System producer | `includes/calendar_deadlines.php::deadline_notify`: deadline creation/cancellation snapshots, one queued recipient row per Student. Intended kind: system, preserving the Reminder subtype. |
| Shared persistence | `includes/notification_delivery.php`, `includes/student_snapshot.php`: persist before provider calls; transaction-owned creation defers delivery; revalidate profile recipients using row locks. Inserts do not populate campaign_id or recipient_user_id. Student archive/completion and Adviser Active/completion checks exist; account binding and full login eligibility require B7 work. |
| API / legacy ownership | `notifications_api.php`: Student list and read writes match email and exclude historical_adviser; Adviser list additionally includes assigned Students' notifications; Admin list is institutional/unscoped. Personal preview matches email. This is legacy visibility, not authorization for B7 personal lifecycle actions. |
| Read state | `notifications_api.php`: per-row read_at and mark_all_read by recipient email; single mark overwrites read timestamp; no lifecycle exclusions. `assets/js/role-portal.js`: read and mark-all actions. |
| Student presentation | `role_portal.php`, `assets/js/role-portal.js`, `assets/css/role-portal.css`, `assets/css/student-dashboard.css`: paginated notification panel and recent dashboard messages. Unread badge is computed from loaded page records, not an authoritative total. No archive/restore/delete/filter controls. |
| Adviser presentation | `research_adviser.php`, `assets/js/adviser-dashboard.js`, `assets/css/adviser-dashboard.css`: personal five-item preview, client email check, keyboard-reachable notification region. The separate Notification Center also displays legacy assigned-student history. |
| Admin presentation / bell | `dashboard.php`: five-item preview from the institutional list, timestamps, dropdown and View All. `admin_notifications.php` and its controller render recipient rows as history, with escaped/textContent content and a native detail dialog. No logical campaign view or personal lifecycle controls. |
| Scheduler / sending | `tools/process_scheduled_notifications.php`, `notifications_api.php`, shared delivery helper: Scheduled-to-Sending conditional claims, 15-minute stale lease recovery, per-notification GET_LOCK mutex through provider/status persistence. Statuses include Sent/Failed/Logged/Cancelled. Claims are recipient-level, not campaign-level. No campaign cancellation or Sending lifecycle lockout exists yet. |
| Email side effects | `config.php::send_notification_email`, `includes/email_format.php`, shared delivery helper and worker: Gmail, server mail, then non-sensitive body logging. Delivery diagnostics remain hidden by the history controller's provider-neutral presentation. The mail-log stop above applies. |
| Account archive / restore / purge | `includes/account_lifecycle.php`, `includes/account_retention.php`, `includes/account_retention_bulk.php`, `includes/account_purge_files.php`, account lifecycle schema source: transactional archive/restore, eligibility/hold/grace/workflow checks and recoverable file-purge journal. Retention matches legacy notifications, takes delivery mutexes and row locks, rejects Sending, deletes Student copies and anonymizes historical Adviser rows. User deletion uses the existing FK contract. No explicit sender-campaign subject/body erasure is integrated before user deletion. |
| Audit helpers | `config.php::log_activity/log_api_error`, `workflow.php::audit_log`, lifecycle/retention audit helpers: existing notification send audit records audience/type/count. New content-free, transactionally persisted lifecycle audit events still need implementation. General error logging accepts caller-provided messages; B7 must avoid passing subject/body/provider payloads. |
| AI / reports / exports | `ai_helpers.php`, `admin_ai.php`, `reports_api.php`, `reports.php`, `data_exports_api.php`, `data_export.php`, `includes/csv_export.php`: no notification references found in these consumers. B7 must not introduce notification/support body ingestion. |
| Shared filters / paging / styles | `includes/record_filters.php`, `includes/pagination.php`, `assets/js/prism-ui.js`, `assets/css/prism-ui.css`, `assets/css/workspace-pages.css`, role/dashboard styles: existing pagination, safe literal search helper, standardized pills and responsive forms. Notification history currently lacks kind/read/archive/sort filtering and a bounded independent desktop history scroll. |
| Frozen Batch 6 contract | `config.php:194`, `includes/schema_v10.php`, `includes/schema_v10_plan.json`, `tools/schema-v10-spec.json`, `tools/schema-v10-manual.sql`, `includes/account_lifecycle_schema.json`: schema version 10, campaign sender-copy state, recipient account binding and lifecycle columns, campaign SET NULL / recipient-user CASCADE foreign keys. Verified in source only. |

No existing notification archive/permanent-delete implementation was found in the audited paths. No notification search UI exists in the current controller, so there is no existing search feature to preserve there.


### Implemented source plan

The audited plan was carried out using procedural helpers and existing v10 fields: add authoritative binding and campaign creation; separate personal copies, sender campaigns and legacy visibility; enforce server lifecycle transitions; coordinate dispatch/cancellation/purge; share accessible history controls; integrate account purge; validate privacy, authorization, concurrency and prior behavior with isolated fixtures. The continuation's metadata-only logging change was implemented without extending the task into a general email redesign.

Production files changed: `config.php`, `notifications_api.php`, `includes/notification_delivery.php`, new `includes/notification_lifecycle.php`, `workflow.php`, `send_followup.php`, `includes/calendar_deadlines.php`, `tools/process_scheduled_notifications.php`, `includes/account_lifecycle.php`, `includes/account_retention.php`, `admin_notifications.php`, `role_portal.php`, `dashboard.php`, `assets/js/admin-notifications.js`, `assets/js/role-portal.js`, new `assets/js/notification-history.js`, `assets/js/prism-ui.js`, and `assets/css/prism-ui.css`.

## Campaign model

- A manual Admin/Adviser composer send creates one authenticated **staff** campaign and independent copies for its authorized recipient snapshot. Bulk queued and explicitly scheduled sends share that campaign. Adviser audience restrictions remain assigned-student/group restrictions.
- Staff-triggered follow-ups create **staff** campaigns. Document/IERB workflow producers create **workflow** campaigns, preserving existing notification subtypes and richer immediate email bodies. Each multi-Admin workflow fan-out creates one campaign with a locked snapshot of current Active Admins.
- Official deadline announcements/cancellations create one **system** campaign for the canonical deadline recipient snapshot; they remain queued and preserve the authoritative calendar record.
- Recipient rows independently store subject/message, delivery status, read/archive/delete state, schedule and timestamps. The campaign stores sender content, kind, schedule, delivery aggregate and sender lifecycle. Client-supplied kind/account IDs do not determine composer authority.
- `notification_recipient_user()` revalidates the locked server-selected profile/login, role, email, Active state and completed/non-archived profile. An unambiguous matching login is bound; conflicting/inactive/ambiguous bindings fail safely. A profile with genuinely no login may retain the pre-existing business notification behavior with NULL binding.
- `sent_history` queries only the current sender's campaigns, returning one logical item and recipient-copy count per send. System sends without an authenticated session may have a NULL sender.
- Historical NULL campaigns are not reconstructed, rewritten into invented groups, or deleted. Admin institutional and Adviser assigned-student **pre-v10** visibility is retained in a separate read-only Legacy History. Personal history uses bound account ownership or compatible legacy email visibility. Legacy mutations require a uniquely proven profile/account link; ambiguous legacy records remain readable without lifecycle authority.

## Recipient lifecycle

`mark_read`, `mark_all_read`, `archive`, `restore`, and `delete` operate on personal recipient copies. New ownership comes from `recipient_user_id`, never a browser identity field. Reading is independent and preserves an existing read timestamp. Mark-all excludes archived/deleted/unavailable copies and changes only authorized ownership.

Archive retains content and read state. Restore clears archive state on the existing row. Permanent deletion requires archive first and a separate explicit boolean confirmation; there is no notification grace period. Deletion tombstones `deleted_at`, clears subject, empties the frozen non-null message field, clears delivery information and unneeded email/name/creator display metadata, and retains account/row/campaign identity and lifecycle metadata. A safely authorized legacy tombstone is bound to its actor so the erased copy still has ownership/integrity.

Deleting A's copy leaves B's copy and sender content unchanged. Deleted copies cannot be restored, read, or archived back into visibility. Queries exclude deleted copies in every normal/archived personal view, and never obtain erased content from a joined campaign. Repeated archive/delete/read operations have safe, deterministic behavior and avoid duplicate destructive audit events.

Active Inbox, personal previews, bell and authoritative `unread_count` exclude deleted and archived copies, plus Scheduled/Sending/Cancelled copies that are not delivered inbox messages. Student badges consume the full authorized unread total rather than counting only the loaded page. Admin and Adviser previews retain their compact personal scope; Admin bell remains limited to five items with timestamps and View All. No existing notification search subsystem was found or replaced.

## Sender lifecycle

Admin/Adviser Sent History is one row per owned campaign with subject/message, kind, status, schedule/sent time, and recipient count. Sender archive/restore modifies only the campaign's sender-copy state. Archive plus explicit confirmation permanently tombstones the sender copy and clears campaign subject/message. Recipient rows and bodies remain available according to each recipient's lifecycle.

Another Admin cannot manage a different Admin's sender history or personal copy. Neither institutional Admin permissions nor Adviser student visibility grant lifecycle authority over other users' new copies. Sender archive/deletion never performs physical campaign deletion.

## Scheduled / Sending lifecycle

The scheduler and immediate send path both use `notification_dispatch()`. A campaign mutex coordinates claim, provider call and result aggregation; the recipient mutex protects the individual copy. Provider calls run after persistence commits. Existing stale Sending lease recovery remains available to the worker.

Scheduled campaigns offer explicit cancellation. Cancellation atomically marks the campaign and pending recipient copies Cancelled and clears unnecessary delivery diagnostics/claim state; it does not physically delete copies. Only then may sender history be archived and optionally deleted. Server checks reject crafted Scheduled archive/delete and Sending archive/delete/cancel requests independently of UI controls.

Recipient and campaign guards prevent dispatch of deleted, archived, cancelled or otherwise unavailable rows. Active-account eligibility is checked again at claim. Campaign aggregate status becomes Sent only when delivery copies finish without Failed/Logged/Cancelled outcomes; those outcomes produce the stable Failed aggregate. A local metadata fallback is never mislabeled externally Sent. Existing per-copy delivery statuses and timestamp semantics are retained.

Native concurrent connections verified: two archives; archive/read; restore/delete; two deletes; cancellation/worker; archive/claim; provider-gated Sending/destructive requests; two sender deletes. Mutex contention returns a controlled retry/conflict. No resurrection, cross-copy change, duplicate delivery or duplicate destructive audit occurred. Account purge uses the same coordination boundaries and refuses ongoing Sending work.

## Filter / sort / UI

The shared history controller provides Inbox, Sent History and separately labeled Legacy History where authorized. Compact controls offer All/Unread/Read/Archived, Staff/Workflow/System/Support/All kinds, and Newest/Oldest. Server values are allowlisted, parameterized and paginated; malformed filter/page inputs are rejected. Sender and recipient archive views remain separate. Existing composer, audience preview, subtype semantics and detail dialog are retained.

Desktop history has bounded independent scrolling; at 768px and below it returns to normal readable document flow. Existing PRISM theme variables and standardized pills provide Scheduled, Sending, Sent, Failed, Cancelled, Logged and Archived presentation. Buttons use text labels and visible focus. Filters have semantic labels, history has an accessible region label, and lifecycle results use a persistent live status region.

Permanent recipient confirmation says: "This permanently removes your copy of this notification."

Permanent sender confirmation says: "This permanently removes this item from your Sent History. Recipient copies are not deleted."

Confirmation starts with Cancel focused, traps focus, supports Escape and returns focus. After a completed removal, focus moves to the stable history region. Scheduled offers Cancel Scheduled Notification; Sending omits archive/delete. Rendered content is literal text; stored HTML cannot execute. API diagnostics are omitted from browser payloads and UI uses provider-neutral status.

## Account lifecycle

Generation revalidates archived/completed/Active account state, so archived accounts do not acquire new ordinary copies. Account archive does not erase existing notifications. Restore preserves existing notification state and cannot recreate a personal tombstone.

Both Admin self-purge and Student/Adviser retention purge erase/tombstone sender campaign content **before** user deletion and the frozen sender SET NULL edge. Delivered copies belonging to other accounts survive. Bound recipient copies follow the frozen user CASCADE edge; existing legacy retention matching/handling remains in place. Scheduled sender campaigns are cancelled before purge; Sending or held mutexes postpone purge safely.

Existing password verification, confirmation, last-Admin protection, archive-first policy, Hold, account grace, unresolved-workflow safeguards, file-purge staging and recoverable journal are retained. Native tests exercised Admin and Adviser sender purge, Student recipient purge, Hold/grace/override/workflow blockers, unchanged tombstones through restore, other-recipient survival, and completed purge journals. Schema parity was checked before/after native account lifecycle tests.

## Audit / privacy

New lifecycle audit is transactional and content-free: actor identity, actor ID, action, entity/notification/campaign ID, server timestamp and kind. Subject, message, support/feedback/email body, delivery diagnostics, provider payloads and tokens are never copied into these audit events. Unexpected notification errors are logged with fixed generic messages. Sender/recipient purge does not copy notification bodies into purge audit.

Deleted content is excluded from personal and sender list/archive APIs. No new notification body source was introduced into AI, report or export consumers. The audited AI/report/export sources contain no indiscriminate notification ingestion. Notification deletion changes only notification state/content; it does not delete canonical document, IERB, calendar or workflow evidence. The mail-log boundary is detailed below.

## MAIL-LOG PRIVACY REMEDIATION

**Original behavior/root cause:** `deliver_notification_email()` previously used the default non-sensitive `send_notification_email()` mode. After Gmail and PHP mail failed, that helper appended recipient, subject and the entire body to `storage/mail.log`. The independent log copy lacked campaign/notification identifiers for safe per-copy removal, so database deletion alone could not erase it. The original B7 audit stopped under section 38; the continuation expressly authorized this narrow forward-looking fix.

**Implementation:** `config.php::send_notification_email()` now accepts an explicit fifth `fallbackLogContent` option, defaulting to true for compatibility. `includes/notification_delivery.php::deliver_notification_email()` requests `(sensitive=false, fallbackLogContent=false)` for every notification delivery. This is not the rejected sensitive-credential shortcut. Gmail diagnostic suppression is reused internally to avoid storing provider response bodies in API error logs; credential-specific failure behavior is not applied to notifications.

**Permitted fallback metadata:** one append-only line containing DATE_ATOM timestamp, `notification_delivery_fallback`, and `status=Logged`. It contains no recipient address, subject, message/body, HTML/text email content, support/workflow body, credential, token, provider response or secret.

Gmail API -> server/PHP mail -> controlled local fallback remains the transport order. Successful external delivery does not write fallback metadata. The safe fallback preserves recipient Logged semantics and returns a controlled content-free failure if even its metadata write fails. **Logged means a safe local delivery-fallback record was written, not that the full email body was stored or externally delivered.** Campaign aggregation does not report such a fallback as Sent.

Password reset, account invitation/setup and credential emails continue to pass sensitive=true and retain their existing delivery/no-body-log protections. Current source callers were audited: the other `send_notification_email()` call sites are credential/setup/reset paths. The generic non-sensitive default remains unchanged for unrelated callers; no broad email subsystem redesign, transport configuration, OAuth scope or sender change was made.

**NEW notification fallback logging does not retain notification subject/body.** Manual, follow-up, workflow and scheduled producers use the same explicitly safe delivery helper; future B8 support can use it too. MIME/escaping, Gmail success, Gmail failure + PHP mail success, metadata fallback, unavailable fallback, support/workflow/HTML sentinels and credential regressions passed with mocked transports. No live Gmail/PHP mail delivery was attempted.

**Existing production mail.log was NOT read, modified, truncated or deleted.** No real installed mail-log content was accessed, rotated, sanitized or rewritten. Historical pre-fix log entries may still contain old notification content and require a **separate operator retention/rotation decision**. The old format cannot reliably map content back to campaign/notification IDs for selective deletion. The new code prevents new fallback body copies after deployment; historical-log retention must be deliberately addressed before claiming fully production-hardened historical deletion. Database recipient/sender deletion semantics remain intact.

## B8 readiness

The procedural campaign helper supports frozen `kind=support`, validates all seven support categories, and accepts the existing reply-to campaign field. It can attribute an authenticated Student/Adviser sender and create one support campaign inside a transaction. B8 can use the already demonstrated locked `users WHERE role='admin' AND status='Active'` snapshot pattern, then `create_notification(..., kind='support', campaignId)` for one independently bound copy per current Admin. Shared delivery automatically uses metadata-only fallback; kind filtering, personal lifecycle and purge handling already support these rows.

All necessary physical fields/FKs/enums exist in frozen v10. B8 can add its explicit request/access/thread behavior using this infrastructure without a database change. B7 introduces no Help & Support request UI, support request producer, Pending Support exception, or new support permissions.

## Test results

All tests used disposable fixtures, stubbed transports or isolated browser templates/APIs. The installed application/configuration/database was not bootstrapped for testing.

| Validation | Result |
| --- | --- |
| Actual lifecycle/dispatch SQL, role binding, recipient/sender independence, restore/delete/idempotency, legacy, filters, privacy | **61 checks passed** (`v10-batch7-lifecycle.php`), also rerun natively |
| Actual notification API, POST/origin, strict generation including missing/stale markers, legal-policy fixture SQL, Pending restriction, ownership attacks, data minimization | **213 checks passed** (`v10-batch7-api.php`) |
| Private MariaDB 10.4.32, full frozen 23-table fixture, real concurrent connections, FK/account purge/journal/restore/workflow | **84 native assertions passed**, in addition to the native 61 lifecycle checks |
| Gmail/PHP mail/metadata fallback/MIME/escaping/credential privacy | **41 checks passed** (`email-format-audit.php`) |
| Existing notification and scheduled/manual/follow-up/workflow delivery regressions | **293 checks passed** |
| Existing document workflow; research-group notification; calendar deadline regressions | **48 cases; 197 checks; 190 checks passed**, respectively |
| Existing pagination/authorization alignment | **228 checks passed** |
| Batch 7 responsive/a11y/theme/lifecycle/browser checks | **403 checks, zero failures** |
| Batch 1 browser | **1280 checks, zero failures** |
| Batch 2 browser | **1044 checks, zero failures** |
| Batch 3 browser | **2277 checks, zero failures** |
| Batch 4 browser | **2368 checks, zero failures** |
| Batch 4.5 browser | **2073 checks, zero failures** |
| Batch 5A browser | **959 checks, zero failures** |
| Batch 5B browser | **284 checks, zero failures** |
| Batch 6 browser | **750 checks, zero failures** |
| Isolated CLI regression runner | **30 suites passed**, including the B7 suites above and relevant Batch 1-6 regressions |
| PHP syntax | **181 files passed**; secret local configuration excluded |
| JS/CJS syntax | **47 files passed** |
| `git diff --check` | Passed |

The B7 browser matrix covers Admin, Adviser and Student at 1920x1080, 1366x768, 1024x768, 768x1024, 390x844 and 375x812 in both themes. It verifies no body overflow, desktop/mobile scrolling, labeled filters/actions, literal stored content, archive/deletion confirmations, focus trap/return, stable post-delete focus, campaign count, Scheduled/Sending controls and compact previews. Prior browser suites cover composer and existing workflow/security/legal presentation as well.

The CLI runner also passed authentication, CRUD, academic APIs, report formatting/privacy, backend, login/AI boundary, token/password/container hardening, document extraction/summary/transport, archive operations, CSV, read-only/Pending, filters, invitations, deadlines, lifecycle security, routing, session identity/generation and PDF/DOCX upload validation. Its complete suite list and result details are in `tests/v10-batch7-results/regression-results.json`.

Older fixture schemas and SQL-routing doubles were extended for existing v10 notification fields and real SQL persistence; legacy institutional-history tests explicitly use Legacy History. Original behavior assertions were retained. One pre-existing Batch 4.5 evaluated selector had broken nested quotes; quoting was corrected without changing its condition. The Batch 1 status-markup regression was corrected in production rendering and its original assertions pass.

Reproducible test sources and `tools/run-batch7-regression.py` are included as unstaged files; `.gitignore` narrowly exposes the new test source files while leaving generated results ignored. Local metrics/screenshots/log summaries reside under `tests/v10-batch7-results`; older suites also report their temporary screenshot locations. The private native runner verifies its random datadir/port/credential and removes only its checked temporary server directory. It constructs the existing frozen contract as a fresh fixture; it never calls an application migration. Migration-running historical runners were not invoked under B7's no-migration instruction. Browser rendering uses isolated templates/mocked APIs; API authorization tests execute real guards and legal queries with fixture identities rather than installed sessions.

## Schema proof

`config.php:194` still declares `SCHEMA_VERSION = 10`.

This command returns no diff:

```text
git diff -- includes/account_lifecycle_schema.json tools/schema-v10-spec.json includes/schema_v10_plan.json tools/schema-v10-manual.sql includes/schema_v10.php includes/schema_v10_seed.json
```

Direct comparisons against HEAD confirm all listed frozen artifacts are equal (normalizing checkout line endings only). The full config region from `SCHEMA_VERSION` through the mail-helper boundary, including all migration functions/DDL, also equals HEAD. `config.php` changes are limited to the authorized mail fallback option and handling.

No application/deployed schema table, column, index or foreign key was added or changed. No enum altered. No migration executed. No `migrate_schema_v10()` or manual SQL edit. No schema-v11 introduced. Disposable test databases instantiate the existing v10 contract only; native inventory matches the frozen manifest before/after lifecycle testing. There was no production database inspection or modification.

## Explicit confirmations

- One logical multi-recipient send appears as one Sent History campaign.
- Each recipient copy has independent read/archive/restore/delete state. Recipient deletion affects only that user's copy.
- Sender Sent History deletion erases the sender copy and preserves recipient copies.
- Archive and a second explicit confirmation are required for permanent notification deletion; no 7-day notification grace applies. Restore is available while archived and non-deleted.
- Scheduled campaigns must be cancelled before archive/delete. Sending campaigns cannot be archived/deleted; both client and server enforce the rule.
- Deleted notification content is not copied into new general lifecycle/error/purge audit logs. New notification mail fallback also retains no subject/body. The historical pre-fix mail-log limitation is explicitly retained above.
- Workflow/system notification copies are deletable without deleting authoritative workflow/calendar evidence.
- Legacy notifications remain readable/compatible, without fabricated campaign grouping or unsafe mutation authority.
- Account purge integrates frozen recipient CASCADE and sender SET NULL with prior sender content erasure, and retains existing Hold/grace/workflow/verification/journal protections.
- Session-generation, same-origin, legal acceptance and Pending security boundaries remain enforced.
- B8's support campaign/current-active-Admin snapshot infrastructure requires no schema change. No B8 UI or Pending exception was implemented.
- Existing untracked reports were preserved. The report and all implementation changes are unstaged. Production was not accessed or modified.

No commit, push, merge, tag, deployment, database migration,
schema change, Hostinger modification, Google Cloud modification,
production access, or production modification performed.
