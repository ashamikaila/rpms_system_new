# PRISM v10 — Batch 10 final document workflow and UI report

Implemented locally on 2026-10-11. Code-only changes against frozen schema v10. This report is unstaged.

## Checkpoint and worktree

| Check | Result |
| --- | --- |
| Starting branch | `prism-v10-b09-staff-registration-code` |
| Starting HEAD | `badd28d99ee065d189fe4ad045498325810964f3` |
| Ending branch | `prism-v10-b10-final-document-workflow` |
| Ending HEAD | `badd28d99ee065d189fe4ad045498325810964f3` |
| Index | No staged changes |

The starting audit was reported before edits. The five starting commits were:

```text
badd28d Relocate Staff Registration to Account Activity
5b600d9 Add secure Staff Registration Code flow
aaa7448 Add internal support and refine shared UI
04dafae Add notification lifecycle and campaign history
6890d56 Freeze v10 schema and add legal governance
```

Batch 9 was present. All twelve pre-existing untracked reports/contracts were preserved. The requested local branch was created without changing HEAD. No application configuration or installed database was used for the native tests.

## Source audit

**Current document state machine before B10.** `workflow.php` derives state from the existing row: Submitted/Under Review/Received/Verified means Pending Adviser Review; Denied and Resubmission Requested remain distinct decisions displayed as Needs Revision; Approved without `rpms_submitted_at` means Ready for Formal RPMS Submission; Approved with it means Submitted to RPMS; `is_current=0` means Superseded. A separate Student action previously performed formal submission.

**Student upload and versioning.** `documents_api.php`, `includes/document_upload.php`, `includes/office_container.php`, the authoritative document catalog, `role_portal.php`, `assets/js/role-portal.js` and the shared `PrismUI` helpers form the upload/version path. Existing Student locking serializes versions for Student + stage + document type. `version_no`, `supersedes_id` and `is_current` preserve predecessor rows and distinct stored files. Catalog and PDF/DOCX validation remain authoritative and unchanged. Bulk transport and session receipts remain in place.

**Adviser review.** `documents.php`/`assets/js/documents.js` and `research_adviser.php`/`assets/js/adviser-dashboard.js` reach the same review API. Existing assignment resolution and document scope were reviewed. Previously approval only changed review fields; the Student still had to perform formal submission. Dashboard counts, attention lists and Student actions are derived through `workflow.php`.

**Current submit_to_rpms and formal submission before B10.** The existing API wrote per-version `rpms_submitted_at`/`rpms_submitted_by`, Student last-submission metadata, IERB history and configured stage advancement, audit, and notifications. That history remains readable. B10 now rejects every Student call to this obsolete endpoint with 403 and performs the normal Adviser approval/submission through one transaction. The legacy Admin submission path remains separate.

**RPMS/Admin review and Override.** Ordinary Admin review/comment paths, the distinct `override_review` endpoint and the reasoned Admin branch of `submit_to_rpms` (audited as `admin_override_submit_to_rpms`) already exist. They remain separate from the new assigned-Adviser operation. Return is a new ordinary Admin workflow action, not an Override. A comment on an already submitted version now appends evidence without replacing its original approval fields. Existing preview/download/history authorization remains in force.

**Activity/audit and notifications.** `activity_logs` already stores action, document identity, Student identity, actor name/role/email, reason, before/after values and time. `ierb_history` stores progression evidence. Existing B7 campaigns and notification copies support transaction persistence and delivery after commit. Legacy best-effort wrappers swallow persistence failures; the new controlled workflow uses strict transactional audit and recipient persistence instead.

**Legal Policies page.** `admin_legal_policies.php` previously used the public legal stylesheet/header and a separate narrow management layout. Its PHP controller and `includes/legal_policy.php` already enforce draft/pending/published governance, password confirmation, independent approval, sole-Admin acknowledgment, CSRF/generation and exact-version acceptance. Only its authenticated presentation was converted.

**Staff Registration manager.** `staff_registration_manage.php` already had the shared workspace and Account context, but its card was capped at 900px, spacing was cramped and its footer was absent. Its controller, code helpers, card, JavaScript and public registration security remain unchanged.

## Final workflow state machine

Return is derived from an immutable `document_returned_for_revision` activity event on the exact version. It is not a new database enum or column. Superseded takes precedence for older versions. Denied and Resubmission Requested remain distinct stored decisions.

| From | Actor/action | To | Version impact | Formal submission impact | Audit/history | Notification |
| --- | --- | --- | --- | --- | --- | --- |
| New upload | Student uploads PDF/DOCX | Pending Adviser Review | New immutable file/row; existing numbering | None | Existing upload/version evidence | Existing upload behavior |
| Pending Adviser Review | Assigned Adviser approves | Submitted to RPMS | Same eligible current version | Approval and formal timestamp commit together | Approval, formal submission, IERB submission and applicable stage evidence | Student and active Admin copies |
| Pending Adviser Review | Assigned Adviser requests revision | Needs Revision: Resubmission Requested | Existing reviewed version retained | None | Reasoned Adviser decision | Student |
| Pending Adviser Review | Assigned Adviser denies | Needs Revision: Denied | Existing reviewed version retained | None | Reasoned Adviser decision | Student |
| Needs Revision | Student uploads targeted revision | Pending Adviser Review | New numbered successor; predecessor Superseded | None | Existing version/upload evidence | Existing upload behavior |
| Submitted to RPMS | Eligible Admin returns with reason | Returned for Revision | Original row/file/approval/submission retained | Original timestamp unchanged | Immutable Return actor/reason/time event | Student and eligible assigned Adviser |
| Returned for Revision | Student uploads targeted revision | Pending Adviser Review | New successor on original stage/type, even after Student stage advancement | Predecessor timestamp unchanged | Existing version/upload evidence; Return retained | Existing upload behavior |
| Pending Adviser Review on returned chain | Assigned Adviser approves | Submitted to RPMS | New revision remains current | New version timestamp; earlier timestamps retained | Approval + formal resubmission + IERB evidence | Student and active Admin copies |
| Legacy Approved but unsubmitted | Assigned Adviser confirms approval | Submitted to RPMS | Same eligible latest version | Prospective formal timestamp | New confirmation/submission evidence; original reviewer/time retained | Student and active Admin copies |
| Any document | Student calls obsolete submit_to_rpms | Rejected 403 | None | None | No successful mutation | None |

Intermediate Adviser statuses remain available. Identical intermediate review replays return without new audit/notifications. Terminal review, submission and Return replays reject stale work instead of creating duplicates.

## Adviser approval → RPMS

`includes/document_workflow.php` owns the operation. The transport endpoint retains login, legal, origin and generation gates. The service revalidates live actor role/status/password identity, legal acceptance, active linked Student, completed profiles, archive/purge restrictions, current assignment and active linked Adviser. Only the currently assigned Adviser can use the normal operation.

The service discovers the Student outside the transaction, locks that Student, revalidates live identities/assignment, and locks the requested document. It also selects the authoritative latest current row by version/time/ID under lock; a duplicate legacy current marker cannot authorize an older version. It rejects superseded, formally submitted, returned, denied or revision-requested targets. Conflicting query/body document identities and malformed payloads are rejected.

One InnoDB transaction writes approval, formal submission, Student submission metadata, IERB submission/progression evidence, strict audit and one B7 campaign with independent recipient copies. Both existing stage-trigger modes continue to use the same controlled operation; old-stage resubmissions do not advance the Student's unrelated current stage. There is no successful normal Adviser approval committed without formal submission.

Formal timestamps belong to each submitted version. They are never cleared by Return or overwritten by a successor. Legacy approved-but-unsubmitted confirmation preserves its original reviewer/time and appends prospective evidence. Existing historical manual submissions are not backfilled or relabelled.

Student locks serialize competing approval, Return and version operations. Final checks occur after acquiring those locks. A second approval/Return rejects with 409; mandatory persistence failure rolls everything back. Native fault injection covers formal-update, audit, IERB, campaign, copy and commit boundaries, checking the exact document, Student, audit and notification state after rollback. Delivery occurs only after commit and cannot roll back the committed decision.

The Student manual submission button, workflow-dialog action and related portal handlers were removed. Backend enforcement independently rejects crafted obsolete Student requests. Admin legacy submission/Override helpers remain callable only under their existing Admin authorization.

## RPMS Return to Student

`POST documents_api.php?action=return_for_revision` requires an eligible active Admin and a nonblank reason of at most 5,000 characters. The current source must be Approved and formally submitted, and must not already have been returned. Student/Adviser calls, GET, unavailable accounts, archived profiles, stale generations, missing current legal acceptance and stale versions are rejected.

Return inserts one mandatory immutable activity event and one workflow campaign inside the transaction. It never clears or rewrites the original approval, reviewer/time, formal timestamp/submitter, stored file or version chain. One Return per version is allowed; further legitimate cycles operate on newly submitted versions.

The Student receives the reason and an Upload Revision action. The eligible assigned Adviser receives the Return notice using the existing institutional-change recipient pattern. Admin UI places Return inside the existing Actions menu, with warning styling, document/Student/version context and a labelled mandatory-reason confirmation. Empty reasons keep focus in the dialog. Escaped rendering prevents reason markup execution.

The existing retention open-work predicate minimally recognizes a current Returned version as unresolved; this prevents purging active revision work. Retention periods, cleanup policy, verification and deletion mechanisms were not redesigned.

## Revision / resubmission

The targeted upload sends `revisionOf`, then revalidates ownership, canonical document type, current predecessor and revision state under the existing Student/version lock. It carries the predecessor's original stage rather than trusting client stage or the Student's now-advanced stage. A targeted revision accepts exactly one new file; ordinary bulk upload remains available. The UI locks the selected type and provides cancellation.

The successor has a new ID, stored file, incremented version and predecessor link. It begins Submitted/Pending Adviser Review with no formal timestamp. Old rows/files and all approval, submission and Return evidence remain accessible within existing scope. The original submitted version is still locked; the targeted new-version operation is the explicit allowed path.

Approval of the successor creates its own formal submission timestamp and a `document_resubmitted_to_rpms` event. Three-cycle tests preserve the first timestamp and two successive resubmission events. Version history presents reviewer/time, formal submitter/time and Return actor/reason/time using existing components. Deny and Request Revision never submit to RPMS.

## Notification / audit

Approval/submission or resubmission produces one B7 workflow campaign with one Student copy and one copy per active Admin. Corrective Adviser decisions notify the Student. Return creates one campaign for the Student and the eligible assigned Adviser. Recipient lifecycle validation occurs during persistence; a failed required copy fails the transaction. Concurrent/replayed terminal decisions produce no extra campaign/copies.

Chronology uses existing activity IDs/timestamps and version links: approval → submission → Return → successor upload → new approval → resubmission. No historical audit row is rewritten. Return context includes exact document/version/type/stage and mandatory reason. The formal submitter explicitly identifies the Adviser-approval route.

B7 campaign deletion, recipient/sender lifecycle, fallback privacy and dispatch APIs remain unchanged. Email dispatch is after commit using existing delivery behavior; failures remain delivery follow-up rather than changing workflow success. No Gmail permissions/scopes or secret handling changed. Tests use local test notification transport with no external email delivery; no production email test was performed.

## Admin Override B11 readiness

Existing Admin reasoned `override_review` and the Override branch of `submit_to_rpms`, override flags/audit, notifications and progression remain separate. Ordinary Adviser approval never invokes an Override endpoint. Return does not stamp an override flag. Submitted-version history is protected when an ordinary Admin adds a comment.

B11 still owns final Admin Override integration/UX and any deliberate institutional override policy. The frozen contract already has review fields, override marker, per-version formal timestamp/submitter, successor/current markers, detailed activity and IERB history, and B7 campaigns/copies. No new table, column, index, FK or enum is necessary to integrate those existing capabilities. No B11 policy expansion was implemented here.

## UI fix — Legal Policies

The authenticated page now uses the standard Admin sidebar/navigation, shared workspace styles/main-content, topbar, theme control and CEU footer. Existing Account & Planning → Legal Policies active navigation is reused. There is exactly one Logout and one theme control.

Policy/draft/review/history sections use shared cards, spacing, fonts, theme variables and primary/secondary/danger buttons. Scoped `assets/css/admin-legal.css` supplies form wrapping, full-width fields, safe long-content wrapping, visible focus and 44px management controls. A regression caught and fixed a shared-rule specificity conflict. Six viewport/both-theme tests verify the shell, controls, native forms, governance presentation and no page overflow. Public Privacy/Terms files and the legal-governance helper are unchanged.

## UI fix — Staff Registration manager

The management card now uses available main-content width instead of the previous 900px cap. Paragraphs, headings, forms and buttons have clearer gaps and wrapping. Controls retain touch-sized targets; the one-time secret display remains locally contained rather than stretching its sensitive text across the workspace. The standard footer stylesheet/include is present.

The existing Account & Activity entry and active Account context remain in place. Staff Registration was not added to the navbar. B9 controller, helper, card, JavaScript, generation/consumption, acknowledgment, secret persistence/display, public registration and eligibility security are unchanged. Native B9 and responsive UI regressions passed.

## Security tests and test results

Native tests run MariaDB 10.4.32 in a new private datadir on a temporary loopback port, with the existing frozen-v10 fixture constructor. Each connection verifies that private datadir. Real API tests use temporary copies of the actual sources, private sessions/storage and a replaced database binding. External notification/AI credentials are explicitly empty. Browser tests block external requests. These tests do not bootstrap the installed database, access production or execute migrations.

| Coverage | Result |
| --- | --- |
| B10 native service | 143 assertions: atomic approval, injected rollback, current-version authority, assignment/account/legal scope, replay, concurrent approval/Return, multi-cycle/legacy history and maximum-length Unicode actor names |
| B10 HTTP and races | Final run: 218 cumulative B10 assertions; 237 total including governance/fixture checks. Real PDF upload, DOCX returned revision, mixed PDF/DOCX bulk upload; automatic first/resubmission; old file scope; Return/review/upload races; obsolete Student calls; reason, origin, generation, role, legal/status and malformed identity gates |
| B10 browser | 397 assertions, six viewports × both themes, all three roles; review confirmations, Return menu/dialog, targeted revision and shared Legal/Staff shells |
| B6 native governance on frozen fixture | 17 assertions: draft/save/submit, multi-Admin independent publish, sole-Admin acknowledgment, password, rejection, immutability and exact-version reacceptance |
| B7/B8 native regressions | 110 total assertions; campaign/lifecycle races, 61 lifecycle checks and 26 Support/purge/legal assertions |
| B9 native/HTTP regression | 217 B9 assertions; 219 including fixture checks |
| B9 browser regression | 1,345 assertions |
| CLI regressions | 30 suites passing: auth, CRUD, documents/review/summary/extraction, academic/group routing, reports/export, deadlines, archive/retention, notifications, B2–B6 guards and PDF/DOCX validation |
| Additional B8 fixtures | Support and privacy checks passed |
| PHP syntax | 202 files |
| JS/CJS syntax | 53 files |
| Whitespace validation | `git diff --check` passed |

Reproduce the isolated B10 backend run with `C:/xampp/php/php.exe -d extension=zip tests/v10-batch7-native.php --only10 --batch10 C:/xampp/mysql/bin`; add `--browser10` before the final binary-directory argument for its browser matrix. CLI/syntax checks use `python tools/run-batch7-regression.py`.

The complete prior browser matrix passed:

| Batch | Assertions | Failures |
| --- | ---: | ---: |
| 1 | 1,280 | 0 |
| 2 | 1,056 | 0 |
| 3 | 2,277 | 0 |
| 4 | 2,368 | 0 |
| 4.5 | 2,073 | 0 |
| 5A | 959 | 0 |
| 5B | 284 | 0 |
| 6 | 750 | 0 |
| 7 | 403 | 0 |
| 8 | 682 | 0 |
| 9 | 1,345 | 0 |

B10 viewports: 1920×1080, 1366×768, 1024×768, 768×1024, 390×844 and 375×812, light/dark. Checks cover overflow, labels, keyboard focus/dialog behavior, one Logout/theme control, shared footer/navigation, content width and Student action clarity. Screenshots and raw results are ignored local artifacts in `tests/v10-batch10-results/`; earlier browser matrices retain their existing artifact locations.

Earlier fixtures were updated only where the application contract/presentation changed: obsolete Student manual submission now expects 403; new Return history requires the existing activity table in partial doubles; Legal rendering expands reviewed shared partials; Staff card includes retain normal include scope; B9 interactions wait for completed page loading. B10 native tests cover the real assigned-Adviser service rather than treating the old best-effort mocks as evidence of atomicity.

No deployment/environment or external mail/provider test was performed. B6 migration suites were intentionally not run: legal governance was tested directly on the frozen fixture instead. Installed databases and configuration were excluded from test connections. Transport doubles in older suites supplement, and do not replace, B10 native/real-HTTP concurrency evidence.

## Frozen schema proof

`SCHEMA_VERSION` remains **10** in unchanged `config.php`. `git diff --name-only` is empty for all seven required frozen artifacts:

```text
includes/account_lifecycle_schema.json
tools/schema-v10-spec.json
includes/schema_v10_plan.json
includes/schema_v10_seed.json
tools/schema-v10-manual.sql
includes/schema_v10.php
tools/migrate-schema-v10.php
```

Native fixture schema comparisons passed after workflow and governance tests. No application table, column, index, FK or enum was added/changed. No migration was executed; schema v11 was not introduced. Creating a disposable database from the already-frozen fixture is test instantiation, not a migration of an installed application database. No production/Hostinger/Google Cloud connection was made.

## Explicit confirmations

- Assigned-Adviser approval automatically and formally submits the eligible current version in one controlled backend operation.
- Student no longer performs normal post-approval submission; crafted obsolete Student calls are rejected.
- Adviser Request Revision and Deny do not submit to RPMS and retain distinct reasoned decisions.
- Eligible Admin Return requires a reason and preserves the original submitted version, file, approval actor/time and formal-submission history.
- Return actor/reason/time is persisted in immutable frozen-v10 activity history.
- Student uploads a new PDF/DOCX revision; Adviser approval formally resubmits it automatically.
- Repeated legitimate cycles preserve chronological version, review, Return and submission evidence.
- Workflow changes remain server-authorized, current-version checked, serialized and replay safe.
- B11 Override remains separate and can use the existing frozen persistence without schema changes.
- Admin Legal Policies uses the shared workspace/sidebar/topbar/footer and PRISM cards/buttons; public Privacy/Terms and governance/acceptance behavior remain unchanged.
- Staff management has clearer spacing, available content width and the standard footer; it remains under Account & Activity without a new navbar item.
- Staff Registration security is unchanged; frozen v10 is unchanged; production was neither accessed nor modified.

## Ending worktree

All implementation and test edits are unstaged. The exact final `git status --short` inventory follows below.

```text
 M .gitignore
 M admin_legal_policies.php
 M assets/css/prism-workspace.css
 M assets/css/staff-registration.css
 M assets/js/adviser-dashboard.js
 M assets/js/documents.js
 M assets/js/prism-guidance.js
 M assets/js/prism-ui.js
 M assets/js/role-portal.js
 M documents_api.php
 M includes/account_retention.php
 M research_adviser.php
 M role_portal.php
 M staff_registration_manage.php
 M tests/alignment-audit.php
 M tests/archive-operational-audit.php
 M tests/document-summary-audit.php
 M tests/document-workflow-audit.php
 M tests/ui-audit.cjs
 M tests/v10-batch3-filters.php
 M tests/v10-batch6-template.php
 M tests/v10-batch6-ui.cjs
 M tests/v10-batch7-native.php
 M tests/v10-batch9-ui.cjs
 M workflow.php
?? PRISM_V10_BATCH10_FINAL_DOCUMENT_WORKFLOW_UI_REPORT.md
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
?? PRISM_V10_BATCH4_5_ARCHIVE_WORKSPACE_REPORT.md
?? PRISM_V10_BATCH4_DOCUMENT_UI_REPORT.md
?? PRISM_V10_BATCH5A_UI_ADVISER_ROUTING_REPORT.md
?? PRISM_V10_BATCH5B_SESSION_SECURITY_BULK_UPLOAD_PUBLIC_LEGAL_UI_REPORT.md
?? PRISM_V10_BATCH6_SCHEMA_LEGAL_FOUNDATION_REPORT.md
?? PRISM_V10_BATCH6_SCHEMA_PROPOSAL.md
?? PRISM_V10_BATCH7_NOTIFICATION_LIFECYCLE_REPORT.md
?? PRISM_V10_BATCH8_HELP_SUPPORT_UI_REPORT.md
?? PRISM_V10_BATCH9_STAFF_REGISTRATION_CODE_REPORT.md
?? PRISM_V10_SCHEMA_CONTRACT.md
?? assets/css/admin-legal.css
?? includes/document_workflow.php
?? tests/v10-batch10-bootstrap.php
?? tests/v10-batch10-http.php
?? tests/v10-batch10-legal.php
?? tests/v10-batch10-native.php
?? tests/v10-batch10-ui.cjs
?? tests/v10-batch10-worker.php
```

No commit, push, merge, tag, deployment, database migration,
schema change, Hostinger modification, Google Cloud modification,
production access, or production modification performed.
