# PRISM V10 — Batch 3 filter, invitation and deadline guardrails

Date: 2026-10-10 (Asia/Manila). Local, unstaged implementation against the existing v9 schema.

## Repository checkpoint

- STARTING BRANCH: `prism-v10-b03-filter-guardrails`.
- STARTING HEAD: `5675e5f9921df8baf4ad38317315d937292d102d`.
- Ending branch and HEAD: unchanged.
- Starting worktree: only `?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md`. That pre-existing report was preserved.
- ENDING WORKTREE STATE: 14 modified tracked files, five Batch 3 additions, and the preserved untracked Batch 2 report; all unstaged. Index empty.

The requested commands were executed and reported before edits:

```text
git branch --show-current
prism-v10-b03-filter-guardrails
git rev-parse HEAD
5675e5f9921df8baf4ad38317315d937292d102d
git log -5 --oneline
5675e5f Add PRISM dashboard guidance and deadline details
9191aeb Polish PRISM v10 interface and auth presentation
0d52de5 Support Hostinger legacy foreign key normalization
d7dc512 Implement final v9 account onboarding and lifecycle retention
be75eaf Implement v9 account retention and controlled purge
git status --short
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
```

Both Batch 1 and Batch 2 are committed checkpoints in this history. Their source, reports and regressions were inspected; neither was reimplemented.

## Source audit before implementation

| Requested audit | Current source and behavior |
| --- | --- |
| CURRENT FILTER DEPENDENCIES | Student Records and IERB used independent scoped dropdowns; no filter cascade. Their add/edit forms already had academic dependencies through `academic-fields.js`. Research Adviser Records used department, account status and group filters; Admin lists also have lifecycle, retention and profile filters. |
| CURRENT ACADEMIC CATALOG SOURCE | `includes/academic_catalog.php::academic_catalog()` is the sole catalog. Its groupings are explicitly catalog groupings, not newly asserted institutional departments. No academic map was added or changed. |
| CURRENT ACADEMIC UNIT FIELD | Students: `academic_unit_key`, public API `academicUnitKey`. Adviser accounts: historical `department` label, with canonical catalog labels on current forms. |
| CURRENT PROGRAM/COURSE FIELD | Students: `program_key` / `programKey`, plus the preserved `course` display label. Graduate programs have a null catalog unit. Research Adviser Records has no Program field. |
| CURRENT YEAR LEVEL MODEL | `academic_year_levels()` limits undergraduate options to each program's configured duration: four, five or six years. Graduate year levels are not configured. Historical blanks remain allowed. |
| CURRENT ACADEMIC YEAR MODEL | Explicit `academicYears` allowlist in the catalog. Independent of Unit, Program, group and sorting; no inferred rollover/default was added. |
| Documents filters | Type, legacy course label, upload calendar year, and whitelisted sort. There is no Academic Unit filter on this page; no fabricated cascade was introduced. Student access uses its existing redirect to the Student portal. |
| Notification filters | Notification Center currently has no secondary history-filter row. Audience, group and type controls belong to its send form. They remain outside generic Filters & Sort. This corrects the preliminary commentary's description of notification history filters. |
| Current sort/filter helpers | `record_filters.php`, `PrismUI.recordFilters()` and `recordPager()`. Fixed SQL columns, bound filter parameters, and a safe whitelist/fallback for invalid sort requests. |
| Bulk reconstruction | `retention_list_scope()` and `retention_selection()` reconstruct server-authorized populations. `PrismRetentionAdmin.syncScope()` clears individual selections and all-matching snapshots on changed filter/search scope; sort/page do not define populations. |
| CURRENT INVITATION DOMAIN VALIDATION | `ALLOWED_EMAIL_DOMAINS` from existing configuration/environment; `is_allowed_email_domain()` originally accepted configured domains and genuine subdomains. `onboarding_invite()` lowercases/trims email, validates syntax/domain, and checks existing users and profiles. Adviser identity/assignment is derived on the server. |
| CURRENT DEADLINE GROUP SELECTOR | Native multiple select populated by `calendar_deadlines_api.php?action=group_options`, using `research_group_options(..., activeOnly: true)`. No deadline edit/update form or API exists. |
| CURRENT DEADLINE CANCELLATION FLOW | Already used `PrismUI.confirm()`, then POSTed `cancel`. Backend locks the record, permits Admin or its Adviser creator, changes status to Cancelled, retains history and groups, and avoids duplicate delivery on repeat cancellation. No serious cancellation authorization flaw was found. |
| Batch 2 deadline work | Dashboard marker/detail reads use their existing read scope. Deadline management separately uses existing group options and creator permissions. `dashboard_day` and all deadline backend code remain unchanged. |

REQUESTS ALREADY SATISFIED: canonical catalogs; scoped group options; prepared filters and whitelisted sorts; invitation syntax/normalization/uniqueness and Pending lifecycle; origin/POST guards; group validation/deduplication; cancellation confirmation and history retention; separate deadline read/management scope; v9 compatibility; Batch 1/2 features.

## Files changed and added

FILES CHANGED:

- `.gitignore`: expose the four new tests; no staging.
- `admin_people.php`: serialize the authoritative invitation domain list and render associated hint/error text.
- `includes/record_filters.php`: validate scoped academic/course values and catalog dependencies in the existing list/bulk helper.
- `includes/account_onboarding.php`: invitation-only exact-domain helper and its use in invitations.
- `assets/js/prism-ui.js`: cascade, restored-state validation, compact disclosure, optional confirmation labels/focus and tracking newly loaded form fields without erasing existing dirty state.
- `assets/css/prism-ui.css`: theme tokens, responsive disclosure/group UI, domain error and cancellation summary styles; retain intended checkbox dimensions against generic input minimum heights.
- `assets/js/admin-management.js`: use disclosure and reconcile before list/bulk scope updates.
- `assets/js/ierbprog.js`: consolidate existing secondary controls and reconcile before loads.
- `assets/js/documents.js`: consolidate existing type/course/year/sort controls with labels.
- `assets/js/invitations.js`: immediate validation, accessible errors, correction/reset handling and duplicate-submit guard.
- `assets/js/calendar-deadlines.js`: searchable authorized checkboxes, selected count/Clear, empty-selection feedback, detailed cancellation confirmation and focus return.
- `tests/ui-audit.cjs`: actual rendered configuration fixture, Batch 3/academic entry points, URL fixtures, and current Edit Student/Adviser selectors. Existing assertions retained.
- `tests/account-onboarding-mysql.php`, `tests/account-lifecycle-worker.php`: provide the fixture's authoritative allowed-domain constant. These MariaDB/migration-dependent runners were not executed.

FILES ADDED:

- `tests/v10-batch3-filters.php`.
- `tests/v10-batch3-invitations.php`.
- `tests/v10-batch3-deadlines.php`.
- `tests/v10-batch3-ui.cjs`.
- `PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md`.

Existing ignored test output was refreshed by the original runners. Screenshots are temporary artifacts. The pre-existing Batch 2 report and ignored non-standalone JS fragment were preserved.

## Academic filters and compact UI

ACADEMIC UNIT → PROGRAM IMPLEMENTATION: the existing shared dropdown helper intersects server-returned, authorized stored-value options with the canonical catalog. Changing Unit clears an incompatible Program before issuing one new list request. Clearing Unit restores only the current user's supplied choices. Reconciliation runs before list/bulk loads and before applying refreshed options.

DEPENDENCY RULES IMPLEMENTED: Unit → Program; canonical Program → Year Level, using configured duration; server checks for conflicting Unit/course-label and Program/course-label pairs. Academic Year and all sorting remain independent. Initial URL filters restore in dependency order; a stale mismatched Program is cleared while keeping Unit, with a status message. Unavailable independent selections retain an explicit unavailable option rather than silently clearing and widening the query; the backend rejects values outside scoped records.

DEPENDENCIES DELIBERATELY NOT IMPLEMENTED: adviser department → Program (no such field/model); Documents course → upload year (upload time is independent); Academic Year cascades (catalog years are independent); group/adviser cascades from adjacent controls (would unnecessarily hide legacy or independently scoped records). Existing role-derived Adviser/filter options and server scopes remain authoritative. Notification send-form audience rules are unchanged.

LEGACY BLANK BEHAVIOR: no default filter excludes blanks. Existing `__blank__` / “Not recorded” values remain available when present in authorized records. Blank Program is available with a recorded Unit. Graduate and unmapped legacy programs remain locatable under All units or Not recorded; unmapped programs are not assigned to an invented Unit. Historical course labels remain literal, scoped, bound filters. No historical records are rewritten.

FILTERS & SORT PAGES MODIFIED: Student Records (Admin/Adviser), Research Adviser Records (Admin), IERB Progress (Admin/Adviser), Documents (Admin/Adviser). Search, Invite, Add Record, upload, view switches, export/submit actions and deadline form values stay outside. Disclosure expands in normal page flow, which avoids viewport-edge popover clipping.

ACTIVE FILTER INDICATOR: `Filters & Sort (N)` counts non-default secondary filters/sorts. CLEAR FILTER BEHAVIOR: one Clear Filters action resets filters, sorting and search to the existing defaults, resets page one and reloads once. The search field remains primary and gains its native search clear affordance.

BULK SELECTION BEHAVIOR: reconciliation precedes `syncScope()`. Material filter/search changes clear selected rows and all-matching snapshots; sort/page preserves the population. Tests verify individually selected rows, all-matching selection, final cascade request parameters, and actual server reconstruction through the same helper.

## Invitations

Admin and Adviser Invite Student share immediate inline domain/syntax feedback, a configured-domain hint, `aria-describedby`, `aria-invalid`, invalid styling, correction clearing, whitespace handling and blocked invalid client submission. Admin Invite Adviser reuses the same behavior. Pending Student assignment bypasses new-invitation validation for its disabled historical email field.

CONFIGURED DOMAIN SOURCE: `ALLOWED_EMAIL_DOMAINS`, normalized/deduplicated by `onboarding_invitation_domains()`, safely serialized with JSON_HEX flags. No domains are hard-coded in application JavaScript. Repository configuration defaults are `ceu.edu.ph` and `mls.edu.ph`; environment/local configuration remains authoritative.

USER-AUTHORIZED EXCEPTION: the initial audit found legitimate subdomains accepted by the existing general helper. The user explicitly chose: “Require exact configured domains for invitations only; authorize that narrow backend policy change.” The new invitation-specific server matcher therefore uses exact normalized membership. Genuine subdomains, lookalikes, appended attacker domains and trailing-domain tricks are refused for new invitations. The general matcher and Staff Registration remain untouched.

SERVER VALIDATION: valid syntax, normalized email, exact invitation domain, existing-user/Pending uniqueness, permitted role, active/completed inviter, authorized Admin assignment and server-derived Adviser assignment remain required. Invalid direct endpoint requests cannot bypass the client warning. Neither permission nor Pending lifecycle was broadened.

## Deadlines

DEADLINE MULTI-GROUP SELECTOR: search over already-authorized checkbox labels, individual labeled choices, selected-count announcement, Clear selection, fixed-height scrolling and accessible empty-selection feedback. Selection survives search; Clear includes search-hidden choices. There is no custom group input or Select all visible action. The hidden native select only carries the existing group-array representation; it is not shown as the interaction control.

GROUP SOURCE OF TRUTH: unchanged `research_group_options()` and standardized group validation. Admin retains current institution-wide management choices. Adviser choices come from current assigned students. The create backend independently revalidates groups under its existing locks, rejects stale/unauthorized/hidden values, deduplicates groups and retains the current global/assigned-all policy. Dashboard visibility cannot expand management permissions.

LEGACY EDIT BEHAVIOR: no current edit/update route exists, so none was introduced. Opening Calendar/management views neither rewrites nor drops existing stale group mappings. Endpoint tests verify their preservation. New creates refuse stale targets. Cancellation retains existing mappings and records.

DEADLINE CANCELLATION CONFIRMATION: “Cancel official deadline?” includes escaped title, date and affected groups, the cancellation explanation, Keep deadline and Cancel deadline. Keep, Escape and backdrop send no request and return focus. A first/double click opens one dialog; explicit confirmation sends one POST while the initiating button is busy. Modal focus is contained. Backend rejection is shown without removing the record; repeated cancellation uses the unchanged idempotent backend behavior. No physical deletion, history change or notification-persistence change was made.

Loading does not reveal unauthorized choices, replace manual input or clear a manual dirty state. Search-only activity is not a form change. Newly loaded checkboxes are added to the existing dirty baseline without resetting other inputs.

## Responsive, accessibility and regression results

RESPONSIVE RESULTS: the final Batch 3 browser suite passed 2,265 checks with zero failures across all requested sizes (1920×1080, 1366×768, 1024×768, 768×1024, 390×844, 375×812), in both light/dark themes, across the modified listing roles, both Invite Student viewers, deadline forms, selector and confirmation. Compact/expanded toolbars and dialogs stay within their intended viewport/page containment; no horizontal page overflow was found. Browser fixtures block external fonts/icons and services; no staging or production page was contacted.

ACCESSIBILITY RESULTS: native keyboard buttons; `aria-expanded`/`aria-controls`; labeled secondary selects; visible focus; Escape/focus return; Tab can leave the non-modal disclosure; associated textual domain errors; labeled group checkboxes/search; selected-count live status; modal label/role/focus trap; safe dismissal; reduced motion. Text explains invalid/selected state independently of color.

LIGHT/DARK RESULTS: shared PRISM palette tokens supply surfaces, borders, focus, text and danger colors. Mobile screenshots include disclosures, invitation errors, group selector and cancellation dialogs. Final screenshot directory: `C:\Users\khirz\AppData\Local\Temp\prism-batch3-ui-xxB1sz` (30 screenshots), captured after theme transitions settle. Visual inspection included invitation errors, group-checkbox rows and cancellation summaries in both themes. Group labels use the existing checkbox-label class so generic form grid styles do not stack the checkbox above its text. The selector explicitly uses the current PRISM foreground, including search labels and selected count; the browser suite verifies that foreground in every deadline matrix case.

BATCH 1 REGRESSION: 1,279 original browser checks passed. Login/session notice/Welcome text, Adviser action layout, provider wording, description cleanup, preview/download/export styling, hidden nav scrollbar, Admin logout, setup eye controls and resources remain intact. The official Research Agenda image retains SHA-256 `6f0b1d29bf9962ab43c383bebc74df7d6733eda3e85e59d0e03aed929b025859`.

BATCH 2 REGRESSION: 1,020 original browser checks plus 68 read-only endpoint checks passed. Calendar markers/detail, Adviser panels/scope, multiple deadlines, Quick Tour, role-aware guide/storage, loading and reduced-motion checks remain intact. No Batch 2 dashboard script/read API was changed.

## Validation commands and totals

All backend tests below isolate configuration and use volatile SQL or reviewed service fixtures. No installed database, schema migration, real mail, AI provider or production service was used. Migration-dependent MariaDB runners were deliberately not executed under the instruction forbidding any database migration.

| Exact command | Final result |
| --- | --- |
| `C:\xampp\php\php.exe tests/v10-batch3-filters.php` | 150 new filter/list/bulk/security assertions |
| `C:\xampp\php\php.exe tests/v10-batch3-invitations.php` | 130 new invitation/domain/assignment assertions |
| `C:\xampp\php\php.exe tests/v10-batch3-deadlines.php` | 50 new deadline/group/cancellation assertions |
| `node tests/ui-audit.cjs --batch3-only` | 2,265 new browser checks; zero failures |
| `python tests/run-final-regression.py` | 27 suites, 5,127 original checks/cases/assertions; initial new-validator namespace incompatibility corrected and affected suite rerun |
| `C:\xampp\php\php.exe -d extension=zip tests/final-regression-audit.php` | 242 passing assertions, included in the 5,127 total |
| `C:\xampp\php\php.exe tests/v10-batch2-readonly.php` | 68 original read-only endpoint assertions |
| `node tests/final-regression-ui.cjs` | 21 original shared network/session/debounce assertions |
| `node tests/ui-audit.cjs --batch1-only` | 1,279 original browser checks |
| `node tests/ui-audit.cjs --batch2-only` | 1,020 original browser checks |
| `node tests/ui-audit.cjs --retention-only` | 332 original bulk/lifecycle browser checks |
| `node tests/ui-audit.cjs --onboarding-only` | 599 original invitation/onboarding/setup browser checks |
| `node tests/ui-audit.cjs --final-only` | 79 original management/filter/privacy browser checks |
| `node tests/ui-audit.cjs --deadlines-only` | 255 original deadline browser checks |
| `node tests/ui-audit.cjs --academic-only` | 538 original academic field/form/display browser checks |
| `node tests/ui-audit.cjs --alignment-only` | 43 original pagination/management browser checks |
| `git diff --check` | Passed; only Git's LF/CRLF notices |

Browser environment: `$env:PRISM_TEST_BROWSER='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'`. Chrome timed out twice at debugger startup; approved Edge runs use temporary profiles and loopback fixture pages. Original security/workflow assertions were not removed or weakened. Stale Edit selectors were aligned with the existing accessible titles. Intermediate deadline regressions found and fixed stretched checkboxes and asynchronous dirty-state clearing.

The original CLI runner executes the following exact command for each name: `C:/xampp/php/php.exe -d extension=zip tests/<name>.php`:

```text
auth-audit, auth-flows, session-idle-audit, security-audit, rate-limit-audit,
logout-audit, crud-audit, document-workflow-audit, notification-delivery-audit,
research-group-audit, academic-audit, academic-api-audit, alignment-audit,
report-format-audit, backend-audit, tonight-polish-audit, readiness-audit,
email-format-audit, cache-audit, final-regression-audit, hardening-audit,
calendar-deadlines-audit, document-extraction-audit, document-summary-audit,
document-summary-transport-audit, archive-operational-audit, csv-export-audit
```

NEW ASSERTION TOTALS: **2,595**, comprising 330 backend and 2,265 browser checks. REGRESSION TOTALS: **9,361**, comprising 5,216 CLI/helper checks and 4,145 browser checks. Combined final successful checks: **11,956**. Repeated successful runs and diagnostic failures are excluded from totals.

PHP SYNTAX COUNT: 146 files, zero failures. JS/CJS SYNTAX COUNT: 36 standalone files, zero failures, plus the unchanged ignored insertion fragment parsed successfully inside its intended async function. Its standalone top-level await/return is not an executable CommonJS file.

```powershell
$batch3PhpFiles=@(rg --files -g '*.php')
foreach($batch3File in $batch3PhpFiles){ & 'C:\xampp\php\php.exe' -l $batch3File }
$batch3JsFiles=@(rg --files -g '*.js' -g '*.cjs' | Where-Object {$_ -ne 'tests\shell-alignment-focus.js'})
foreach($batch3File in $batch3JsFiles){ node --check $batch3File }
$batch3Fragment=Get-Content -LiteralPath tests/shell-alignment-focus.js -Raw
('async function verifyFragment(){'+[Environment]::NewLine+$batch3Fragment+[Environment]::NewLine+'}') | node --check
git diff --check
```

## Protected behavior and ending status

SCHEMA_VERSION remains 9 (`config.php:190`). NO schema change; NO migration change; NO core workflow change; NO notification persistence change; NO document backend workflow change; NO code-structure reorganization. Account retention/purge, credential authentication, role permissions, Pending setup/completion lifecycle and Staff Registration Code remain unchanged.

NO authentication/role/assignment authorization semantic change. The explicitly authorized invitation-domain admission change is the sole exception to a blanket “no auth semantic change” statement; exact-only invitations are now enforced on both client and server. Existing accounts and general registration-domain behavior are unaffected.

Student document submission, Adviser approval, formal RPMS submission, Admin Override, post-RPMS return and Help & Support backend were not modified. Notification persistence and deadline creation/cancellation services remain unchanged. Protected-file diffs for `config.php`, `tools/`, schema helpers/manifests, `workflow.php`, deadline APIs/helpers, document/notification APIs, student/adviser/IERB API routes, lifecycle/purge helpers, registration and Batch 2 scripts returned empty. This is compatible with current v9 staging without requiring a schema operation; staging/Hostinger was not accessed.

```text
 M .gitignore
 M admin_people.php
 M assets/css/prism-ui.css
 M assets/js/admin-management.js
 M assets/js/calendar-deadlines.js
 M assets/js/documents.js
 M assets/js/ierbprog.js
 M assets/js/invitations.js
 M assets/js/prism-ui.js
 M includes/account_onboarding.php
 M includes/record_filters.php
 M tests/account-lifecycle-worker.php
 M tests/account-onboarding-mysql.php
 M tests/ui-audit.cjs
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
?? tests/v10-batch3-deadlines.php
?? tests/v10-batch3-filters.php
?? tests/v10-batch3-invitations.php
?? tests/v10-batch3-ui.cjs
```

No commit, push, merge, tag, deployment, staging, database migration,
Hostinger modification, production access, or production modification performed.
