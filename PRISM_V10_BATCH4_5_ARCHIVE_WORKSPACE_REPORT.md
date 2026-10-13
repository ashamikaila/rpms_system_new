# PRISM V10 Batch 4.5 — Archived Accounts and workspace reconciliation

Date: 2026-10-11 (Asia/Manila). Implementation remains compatible with schema v9.

## Checkpoint and worktree

- Starting branch: `prism-v10-b04-document-ui`.
- Starting HEAD: `83ef1df84538c09fe0390ee645ab78b778d88d60`.
- Starting log: `83ef1df` Refine PRISM document and management interface; `1ed5464` Add PRISM filter and deadline guardrails; `5675e5f` Add PRISM dashboard guidance and deadline details; `9191aeb` Polish PRISM v10 interface and auth presentation; `0d52de5` Support Hostinger legacy foreign key normalization.
- Starting worktree: only untracked Batch 2, Batch 3, and Batch 4 reports. All three were preserved.
- Ending branch: `prism-v10-b04-5-archive-workspace`.
- Ending HEAD: `83ef1df84538c09fe0390ee645ab78b778d88d60` (unchanged).
- Changes remain unstaged. The ending worktree is listed below; no staged diff exists.
- Local branch creation required escalation because the sandbox made Git metadata read-only. It created a branch without staging or committing.

## Source audit, reported before implementation

### Records and lifecycle

`admin_students.php` and `admin_advisers.php` are wrappers around `admin_people.php`. Their shared JavaScript previously exposed lifecycle controls and selection continuously. Admin list requests used `retention_list_scope()` without an active-only default. Adviser Student requests already excluded archived Students and used current assignments.

`includes/account_retention_bulk.php` supplies the trusted SQL scope for displayed lists and selection snapshots, validates filter values, limits selection, and reconstructs the snapshotted population on preview/execution. Search, sorting, and pagination already use shared helpers. Material filters form the selection scope; page and sort do not.

`includes/account_retention.php` already projects archive dates, seven-day manual-purge dates, six-calendar-month retention dates, Hold, unresolved workflow, eligibility, and block reasons. Existing activity logs provide lifecycle actor evidence; there is no new invented archived-by display field. Existing archive/restore transactions, assignment behavior, password setup, Hold semantics, purge checks, and audit persistence remain authoritative.

### Adviser dashboard and history

The visible Recent Resubmissions section was a static explanatory note linking to Document Reviews. It did not supply dashboard data or authoritative history. The review queue, version history, documents, and activity evidence use independent existing paths.

### Deadline scope and calendars

`deadline_scope()` already determines applicable deadlines from the authenticated viewer. Students use their current non-archived, standardized group. Adviser-origin deadlines additionally require current adviser ownership and original recipient evidence. Advisers use groups derived from currently assigned, non-archived Students. Admin-created global deadlines follow the existing global policy. Management permissions remain separate from recipient reads.

The marker `dates` action already supports all three roles, but the narrow read-only `dashboard_day` action previously excluded Students. It returned only safe recipient fields and filtered mixed-target group labels for Advisers. Full calendars already kept browser reminders separate from server deadlines. The Adviser dashboard already had official markers/popups; the Student dashboard mini calendar lacked them.

### Navigation, Year view, buttons, and counts

Desktop navigation expanded the workspace reservation from the collapsed rail to the expanded drawer width. Mobile already behaved more like an overlay. Existing navigation groups, profile controls, and guide/tour derive from the shared navigation partial.

Admin Year view was constrained by the dashboard's right column and overlapping legacy layout rules. Shared primary buttons used navy; neutral/secondary buttons could blend into their surroundings. Legacy `!important` row-button hover rules also overrode semantic text-button styles.

Admin current Student metrics already exclude archived records and incomplete profiles. Adviser counts use the authorized current Student population. Historical document/activity metrics were left intact; no ambiguous historical metric was redefined.

## Archived Accounts

- Route: `admin_archived_accounts.php`, using the existing shared management workspace.
- Authorization: original `require_login('admin')` guard; anonymous, Student, and Adviser callers do not reach the page body.
- Separate Students and Research Advisers destinations use `?type=student` / `?type=adviser`, with active-tab indication.
- Shared navigation includes Archived Accounts and the navigation guide explains it. Both current record pages link directly to the corresponding archive tab; archive tabs link back to current records.
- Normal Admin record lists and blank/default lifecycle scopes exclude archived accounts. The archive workspace always submits `lifecycle=archived`; current pages submit `lifecycle=active`. A URL filter or hidden checkbox cannot change these UI population requests.
- Both APIs continue to use the shared authorized SQL scope and pagination. Academic, group, department/status, profile, and existing retention filters remain available where supported. Retention Hold is an existing retention filter. Archived date is displayed and can be sorted using a fixed SQL column mapping.
- Tables display authoritative identity, academic/group information, archive date, retention date, existing eligibility/block reasons, and Hold reason where present. Current Adviser assignments are shown as current information; no historical group assignment is fabricated.
- Long names/identifiers wrap within fixed archive table columns. Mobile tables scroll inside their table wrapper without body horizontal overflow.
- Actions reuse existing Restore, Hold/remove Hold, permanent deletion, and existing grace override services. Backend eligibility and the existing deployment verifier determine availability. No client clock calculates eligibility.
- Single and bulk lifecycle success reload the same server-filtered list. Archive membership disappears from current lists; restored membership disappears from archive lists through the authoritative population filter. The account identity is retained by the existing archive/restore services.
- Restore continues existing password-setup and assignment semantics. No account reconstruction or replacement was introduced.
- Existing bulk Restore, Hold/remove Hold, protected purge, and explicit Retention Cleanup remain available in the archive workspace. Bulk permanent purge already existed; this batch does not introduce it.
- Retention Maintenance is inside the archive Filters & Sort panel. Cleanup still requires an explicit action, eligibility preview, and existing confirmation/security gates. No cleanup executes on page load, search, filtering, or selection changes.
- Lifecycle `account_state` explicitly reads both populations, preserving existing confirmation dialogs after changing the record-list default.

## Recent Resubmissions removal

Removed exactly the `adviser-panel prism-resubmission-note` section headed Recent Resubmissions from `research_adviser.php`. No replacement widget was added. Document Reviews, the dashboard review queue, document/version history, activity logs, APIs, and stored data remain intact.

## Shared buttons

- Primary: PRISM purple/pink family, white text (`#a21368` light, `#b52b79` dark), with visible border and darker hover.
- Secondary: tinted accent surface, contrasting accent text, and outlined border in both themes.
- Neutral: theme surface/text with a stronger visible border. Actions retains this treatment.
- Danger: existing red family; destructive menu hover/focus/active remains red. Legacy row rules no longer force neutral text buttons into their icon-button hover treatment.
- Compact shared heights are 38px desktop and 44px on small screens. Toolbar groups use consistent spacing and vertical alignment; selection controls are centered. Existing review/file-link alignment and resource disclosures passed regression checks.
- Focus outlines remain visible. Disabled buttons retain their labels and show reduced opacity and a disabled cursor. Reduced-motion behavior remains covered by existing suites.

Measured minimum text contrast across normal, actual pointer hover, keyboard focus, and actual pointer active states on rendered toolbar/menu surfaces:

| Variant | Light | Dark |
| --- | ---: | ---: |
| Primary | 7.42:1 | 5.86:1 |
| Secondary | 7.87:1 | 10.86:1 |
| Neutral | 18.26:1 | 14.78:1 |
| Danger | 6.52:1 | 7.01:1 |

These are sampled enabled text-button states, not a claim that every pixel or legacy icon in the application was audited. Disabled controls are checked for recognizable state separately. Invite, Add, Review, Upload, Filters & Sort, Actions, Selection Mode, and Month/Year controls are included in the touched-page/regression matrices.

## Calendars

- Student mini calendar now shows server-scoped official deadline markers and uses the shared read-only popup.
- Student and Adviser full month calendars open the same read-only popup when a marked date is selected. Existing official management panels retain their separate permissions.
- `dashboard_day` permits Student GET reads using `deadline_scope()`. The same current recipient-group helper supplies Student popup group labels. Other targeted groups and creator internals are never returned by this action.
- Adviser mini calendar and Admin popup behavior remain covered. Reassignment tests verify that old adviser visibility and Student access to former adviser-created deadlines disappear on the next authoritative read.
- Personal reminders remain browser-local. Official and personal markers coexist on the same date; personal reminders never enter server deadline requests. Student popup View Calendar stays within the Student portal.
- Popup closure restores date focus, including dates whose DOM node was replaced during calendar refresh.
- Admin Year view spans the dashboard workspace instead of remaining in its narrow side column. It shows 3 columns at 1920/1366, 2 at 1024/768, and 1 at 390/375 in both themes. All twelve month cards fit their shell with natural page scrolling and no clipped internal year scrollbar.
- Month/Year toggles, year navigation, dates, deadline markers, and read-only popups remain functional. The deadline load/error status remains visible in either view.

## Admin navigation

The workspace always reserves the compact rail: 100px desktop, 88px below 900px. Expansion only changes the fixed drawer width. The drawer uses z-index 800 and a backdrop at 790; filters/actions remain below it and existing confirmation/review modals remain above it (native dialogs use the browser top layer).

Escape closes expanded navigation and returns focus to its toggle. Outside/backdrop clicks close it. Nested filter/action/native-dialog Escape handling retains precedence. Existing group expansion memory, navigation links, labels, role visibility, active-page indication, profile menu, branding, keyboard access, guide, and tour remain.

The full matrix records 48 collapsed-versus-expanded geometry samples for both current pages and both archive tabs, plus 12 focused Year-view samples. The main, heading, toolbar, table/card, calendar, and filter-trigger rectangles do not materially change when navigation opens. Example at 1920x1080: main rectangle before and after is `(x=100, y=0, width=1820, height=1080)`.

## Selection Mode

- Default is Off on current and archived Admin record pages. The Select column, row checkboxes, bulk toolbar, results/count shell are hidden.
- The labelled Selection Mode control exposes state with `aria-pressed`. On reveals current-page, all-matching, clear, count, and permitted bulk actions.
- Explicit Off clears selected IDs, page checkbox/indeterminate state, all-matching IDs/token, Hold input, and results. It performs no lifecycle operation.
- A selection generation check rejects late selection or preview responses after exit, clear, or population changes, even if the mode is turned on again.
- Material search changes clear selection immediately; existing filter dependency reconciliation and server reconstruction remain intact. Page/sort remain outside the population key.
- Current pages offer bulk Archive. Archive pages offer existing archived-state actions with existing backend checks. Backend role/state validation is independent of the UI mode.

## Validation and evidence

All browser runs use actual rendered templates/static assets with fixture APIs and blocked external fonts/icons. Endpoint tests execute the actual guards, SQL scopes, endpoints, or services with memory-only SQLite/PDO doubles. The installed application database, production, email, AI services, and migration tooling were not invoked.

| Suite | Result |
| --- | --- |
| Batch 4.5 full browser matrix | 1,989 checks, zero failures |
| Batch 4.5 final focused Year/button/scope/verification UI checks | 141 checks, zero failures |
| Batch 4.5 security | 168 checks, pass |
| Batch 1 browser regression | 1,279 checks, zero failures |
| Batch 2 browser regression | 1,032 checks, zero failures |
| Batch 3 browser regression | 2,277 checks, zero failures |
| Batch 4 browser regression, extended to both archive tabs | 2,368 checks, zero failures |
| Batch 2 read-only endpoint/scope/pagination | 71 checks, pass |
| Batch 3 filter/API/bulk reconstruction | 150 checks, pass |
| Batch 3 deadline/API/cancellation | 50 checks, pass |
| Batch 3 invitation/domain/assignment | 130 checks, pass |
| Existing official deadline endpoint/scope/security/delivery | 190 checks, pass |
| Batch 4 lifecycle request/service guards, extended to Restore/Hold | 91 checks, pass |
| Existing document workflow | 43 cases, pass |
| Existing research-group/notification scope | 197 checks, pass |
| Existing academic API | 1,343 checks, pass |

Security coverage includes archive route denial for anonymous/Student/Adviser callers; unauthorized lifecycle requests before database access; active/default/archived/all list and bulk populations; both populations in lifecycle state reads; Student A/B and Adviser A/B group isolation; mixed-group and global deadlines; forged group/student/creator/manage parameters; current reassignment; anonymous deadline reads; Student mutation denial and GET mutation rejection; invalid deployment verification before purge mutation; direct active-account purge rejection; and Hold blocking every purge method.

Responsive coverage: 1920x1080, 1366x768, 1024x768, 768x1024, 390x844, 375x812 in light and dark. Current/archived Student and Adviser pages, Adviser dashboard, Student full/mini calendars, Adviser full/mini calendars, Admin Month/Year calendars, collapsed/expanded navigation, Selection Mode On/Off, Filters & Sort, and Actions are covered. Zero, one, multiple, personal-only and combined official/personal dates are covered across focused and regression fixtures.

Accessibility checks include labels/state, safe literal deadline content, keyboard popup activation, focus return, Escape, menus/disclosures fitting the viewport, visible focus, button text contrast, disabled state, and existing reduced-motion assertions.

Evidence directories (local temporary artifacts, retained):

- Full Batch 4.5 screenshots/geometry: `C:\Users\khirz\AppData\Local\Temp\prism-batch45-XxbYog`.
- Final Year 3/2/1 layout and button-state metrics: `C:\Users\khirz\AppData\Local\Temp\prism-batch45-o4DMwy`.
- Final focused evidence including invalid-verification UI: `C:\Users\khirz\AppData\Local\Temp\prism-batch45-oDtgQK`.
- Batch 1 screenshots: `tests/v10-batch1-results` (ignored artifacts).
- Batch 2 screenshots: `C:\Users\khirz\AppData\Local\Temp\prism-batch2-ui-m4taw4`.
- Batch 3 screenshots: `C:\Users\khirz\AppData\Local\Temp\prism-batch3-ui-m2JELR`.
- Batch 4 extended screenshots: `C:\Users\khirz\AppData\Local\Temp\prism-batch4-after-XKzAu1`.

PHP syntax: 149 project PHP files passed. JS/CJS syntax: 35 tracked/new executable files passed. `git diff --check` passed; the staged diff is empty.

An initial broader scan also encountered pre-existing ignored `tests/shell-alignment-focus.js`, an insertion fragment with top-level await outside a module. It was preserved and excluded from the executable-file syntax count. Initial older UI test failures concerned superseded always-on selection/active-page retention placement; tests were updated for the expressly requested behavior and strengthened with archive-tab coverage. A real dark Actions hover contrast failure was corrected before the passing focused run. A sandbox Chrome debugger timeout was resolved by running the isolated harness with approved escalation. One failed older harness run also reported temporary Chrome-profile cleanup contention; subsequent completed regression runs exited successfully.

Validation limits: no installed-database transaction/deployment or live MySQL/MariaDB integration test was run. Archive/restore transaction and retention semantics are existing unchanged services; this batch validates their guards and the authorized list populations/UI reload paths. External icon/font raster rendering is outside the blocked-network fixture screenshots. No claim is made that the live deployment verifier is currently valid.

## Future Batch 12 requirement — documentation only

Final v10 will replace 24-hour expiry with persistent deployment-bound verification. Future evidence must remain valid indefinitely while manifest, database binding, schema, FK/security metadata, and visibility assumptions match. Relevant deployment/schema/security changes must invalidate evidence and fail closed. Final v10 must not require time-based renewal. None of this redesign is implemented here: the existing 86,400-second verifier remains unchanged.

## Files changed

```text
.gitignore
account_lifecycle_api.php
admin_people.php
advisers_api.php
assets/css/prism-ui.css
assets/css/prism-workspace.css
assets/js/admin-management.js
assets/js/admin-retention.js
assets/js/calendar.js
assets/js/dashboard-deadlines.js
assets/js/dashboard-sidebar.js
assets/js/prism-guidance.js
assets/js/role-calendar.js
calendar.php
calendar_deadlines_api.php
dashboard.php
includes/account_retention_bulk.php
includes/calendar_deadlines.php
includes/prism-navigation.php
research_adviser.php
role_portal.php
students_api.php
tests/calendar-deadlines-audit.php
tests/ui-audit.cjs
tests/v10-batch2-readonly.php
tests/v10-batch2-ui.cjs
tests/v10-batch3-filters.php
tests/v10-batch3-ui.cjs
tests/v10-batch4-security.php
tests/v10-batch4-ui.cjs
```

## Files added

```text
admin_archived_accounts.php
tests/v10-batch45-security.php
tests/v10-batch45-ui.cjs
PRISM_V10_BATCH4_5_ARCHIVE_WORKSPACE_REPORT.md
```

Ending worktree: the changed files above are modified and unstaged; the four added files above are untracked, along with the three unchanged pre-existing Batch 2–4 reports. No other tracked files are changed. The new test files are explicitly allowed by `.gitignore`; no tests were staged.

## Explicit non-changes

- NO schema change: `config.php` still declares `SCHEMA_VERSION = 9`.
- NO migration change: config migration, schema manifest, manual SQL, and migration tooling have no diff.
- NO retention semantic change.
- NO permanent-delete verification redesign.
- NO Student document workflow change.
- NO Adviser review semantic change.
- NO RPMS submission change.
- NO Admin Override change.
- NO notification persistence change.
- NO bulk document upload.
- NO Help & Support or Staff Registration Code implementation.
- NO code-structure reorganization, MVC/OOP conversion, or v10 schema.

No commit, push, merge, tag, deployment, staging, database migration,
Hostinger modification, production access, or production modification performed.
