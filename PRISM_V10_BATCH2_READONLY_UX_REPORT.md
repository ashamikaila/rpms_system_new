# PRISM V10 - Batch 2 read-only UX report

Date: 2026-10-10 (Asia/Manila).

## Repository checkpoint

- STARTING BRANCH: `prism-v10-b02-readonly-ux`
- STARTING HEAD: `9191aebcc01be0fe533d9d4d27fb24e017837dfe`
- Starting `git status --short`: empty (clean tracked/untracked worktree).
- Ending branch and HEAD: unchanged.
- ENDING WORKTREE STATE: nine modified tracked files and five untracked additions, all unstaged. Index empty.
- No unrelated source, backup, configuration, or pre-existing report changed. Existing ignored browser test outputs were refreshed by their original test runners; new Batch 2 screenshots are in the temporary directory.

The following commands were run and reported before implementation:

```powershell
git branch --show-current
git rev-parse HEAD
git log -5 --oneline
git status --short
```

Starting log:

```text
9191aeb Polish PRISM v10 interface and auth presentation
0d52de5 Support Hostinger legacy foreign key normalization
d7dc512 Implement final v9 account onboarding and lifecycle retention
be75eaf Implement v9 account retention and controlled purge
4f4412d Polish shared navigation and workspace UI
```

Batch 1 is the committed HEAD checkpoint. Its report and implemented interface changes were inspected. Batch 1 was not reimplemented or reverted. Relevant original regression suites passed. The official Research Agenda image retains SHA-256 `6f0b1d29bf9962ab43c383bebc74df7d6733eda3e85e59d0e03aed929b025859`, matching the Batch 1 report.

## Read-only source audit before implementation

- Admin mini calendar: `dashboard.php` rendered personal reminders from its existing browser-local reminder key. It did not request official deadline dates or details. Its month dates opened the existing personal Tasks & Notes dialog; year cards selected a month.
- Adviser mini calendar: no mini calendar was present in `research_adviser.php`. Dashboard data came from existing student, document, profile and notification reads in `adviser-dashboard.js`.
- Existing Calendar: `calendar-deadlines.js` used `calendar_deadlines_api.php?action=dates` for grouped active deadline dates and `action=list` for the selected date's paginated records. Student Calendar uses this component through `role-calendar.js`; standalone Calendar uses `calendar.js`.
- Client-side detail: neither target dashboard had sufficient official deadline detail. The Calendar list returned title, date, target scope, status and sometimes group identifiers. It deliberately omitted group labels for Advisers reading Admin-created deadlines, so it could not fully supply the new popup without a narrowly scoped read-only adjustment.
- Backend authorization: `deadline_scope()` is shared by lists/counts/markers. Active visibility uses authenticated roles, current assignment-derived standardized research groups, and existing creator rules. Management scope is separate. Group labels derive from canonical `calendar_deadline_groups`; legacy free-text adviser labels are not used for scope.
- Shared navigation: Admin/Adviser use `includes/prism-navigation.php`; Student uses the role portal's existing menu and section controls. Existing page and API guards enforce role authorization, temporary-password restrictions and v9 Pending onboarding before these workspaces are rendered.
- Reusable UI: PRISM already has native `<dialog>` behavior on Adviser review and management screens, `prism-ui.css` button/dialog palette, and shared overlay dialogs in `prism-ui.js`. Batch 2 uses the native-dialog pattern and existing palette/button classes without changing review dialogs or the shared confirmation helper.
- Existing guidance: `prism-ui.js` has dismissible document/workflow hints. No multi-step role tour or readable navigation guide was present.
- Help/profile: Student Help opens the current mail-app preparation form; Adviser Research help links to Research Resources. Profile menus expose current account/activity/logout controls. No support backend was added.
- Theme/loading: early inline `prismTheme` initialization already applies dark theme before paint. Sidebar state applies during parsing and suppresses initial transitions. Dashboard panels already expose loading/busy states. Those initializers remain intact.
- Browser storage: existing theme, personal reminder, first-time hint and navigation state keys were inspected. Official deadlines remain server records and never enter personal reminder storage.

Actual navigation inspected:

| Viewer | Current items |
| --- | --- |
| Student | Dashboard; IERB Progress; My Documents; Calendar; Research Resources; Help and support; Notifications; Profile; Log out. Submit document is an existing Dashboard action. |
| Adviser | Dashboard; Assigned Students; Document Reviews; IERB Progress; Calendar; Research Resources; Research help; Notifications; Profile & settings; Activity logs; Log out. Invite Student is an existing Assigned Students control. |
| Admin | Dashboard; Student Records; Research Advisers; IERB Progress; Document Submissions; AI Progress Reports; Generated Reports; Data Export; Notifications; Account & Activity; Activity Logs; Personal Calendar; Settings; My account; Activity logs; Log Out. |

## Deadline data source and implementation

DEADLINE DATA SOURCE: existing canonical v9 deadline/group records through `calendar_deadlines_api.php`. Existing `dates` reads populate dashboard markers. New `action=dashboard_day` supplies paginated detail for a single validated `date`; it lives in the existing API and accepts GET only.

ADMIN CALENDAR IMPLEMENTATION: existing month/year calendar retained. Each date reserves an absolutely positioned Font Awesome `fa-calendar-day` marker. A date with one or more official deadlines displays one icon and an accessible count in its label, without a title inside the cell. Capture-phase activation on a marked date opens official detail before the existing personal-task handler. Unmarked month dates retain their existing personal reminder behavior. Marked year dates open detail; other year-card interactions retain month selection. Existing today highlighting remains intact.

ADVISER CALENDAR IMPLEMENTATION: a small Calendar panel was added to the existing right-side dashboard panels. It has month navigation, date buttons, loading status and a View Calendar link. It uses the same marker/detail script as Admin. Dates and labels remain within existing Adviser scope.

MULTIPLE DEADLINE BEHAVIOR: one icon per date; accessible label includes the count. The detail dialog requests every authorized page and renders every returned record, deduplicated by record ID. Tests retrieve 25 authorized endpoint records across three pages and render 12 browser fixture records across two pages. Each record shows title, full date, affected groups and status. Global records show All research groups for Admin or All currently assigned research groups for Adviser.

The popup contains only View Calendar and Close. No create, edit, cancel, delete or reschedule action is exposed. Titles/group text render through `textContent`. A load failure shows an explicit error, without partial records or a misleading empty list; closing and selecting the date retries. Closing during a request safely discards its result.

AUTHORIZATION CHECKS:

- New detail action uses existing `api_require_login`, then requires Admin/Adviser and GET.
- It uses `deadline_scope($pdo, $user)` with ordinary active visibility; client `manage`, creator/group and range parameters cannot widen its date or assignment scope.
- Adviser group labels are intersected with current server-derived authorized groups, including labels on Admin-created and formerly self-created records. Other targeted groups are omitted.
- Existing Student list/date permissions remain intact; Student is denied the new dashboard detail action.
- Anonymous access, malformed/missing/empty dates, array pagination, non-GET methods, crafted scope parameters and Pending Adviser access were tested.
- Cancelled records remain excluded from ordinary dashboard markers/detail, consistent with existing active Calendar visibility. Existing authorized management views remain the place for cancelled records/actions.
- Reassignment immediately removes previously applicable targeted deadlines.
- Existing inactive/invalid credential handling was exercised by the original real-guard authentication suite. The unchanged current-user guard rejects every non-Active account status, including Archived. Pending Student/Adviser workspaces remain behind the existing onboarding gate.

## Tutorial and navigation guide

The persistent restart/access location is the existing profile/account dropdown: Quick Tour and Navigation Guide. Each appears once. Admin/Adviser entries are inserted from the authenticated navigation partial; Student entries are in its existing profile menu.

FIRST-TIME BEHAVIOR: intentionally manual and non-disruptive. Opening Quick Tour shows Welcome to PRISM with Start Tour and Maybe Later / Skip. Guidance never auto-opens during page initialization or login. A completed/skipped user can restart at any time; the welcome text then offers a repeat tour. No recurring startup prompt or permanent dashboard card is added.

STUDENT TOUR STEPS (9):

1. Dashboard - research progress, document status and recent submissions.
2. Submit document - current upload location and Adviser/RPMS process.
3. My Documents - decisions, Preview/Download and currently available revision/submission controls.
4. IERB Progress - current stage and progress.
5. Calendar - authorized official deadlines and personal browser reminders.
6. Notifications - updates addressed to the Student.
7. Help and support - current form prepares a message in the email app.
8. Profile - current profile/password settings.
9. Research Resources - current SDG, Research Agenda and IERB resources.

ADVISER TOUR STEPS (9):

1. Dashboard - assigned counts, review queue, notifications and applicable deadlines.
2. Assigned Students - assigned records/progress and existing Invite Student location.
3. Document Reviews - assigned submissions, version history and current review/feedback tools.
4. IERB Progress - existing monitoring/search/filter tools.
5. Calendar - applicable official deadlines, personal reminders and existing permitted Calendar actions.
6. Notifications - current Notification Center.
7. Profile & settings - current account/security controls.
8. Activity logs - visible account activity.
9. Research Resources - currently available institutional resources; Research help shares this destination.

Invitation guidance is included in Assigned Students; no new invitation action or invitation semantics were added.

ADMIN TOUR STEPS (13):

1. Dashboard.
2. Student Records - existing records, invitation and permitted lifecycle controls.
3. Research Advisers - current directory, assignments, invitation/lifecycle controls.
4. Document Submissions.
5. IERB Progress.
6. Notifications.
7. Personal Calendar - current official deadlines and personal reminders.
8. Generated Reports.
9. AI Progress Reports.
10. Data Export.
11. Account & Activity.
12. Activity Logs.
13. Settings.

Account lifecycle guidance is attached to the existing Student Records/Research Advisers steps. There is no future Staff Registration Code, notification or internal-support feature description.

LOCAL STORAGE KEYS:

- `prismTour.student.v1`
- `prismTour.adviser.v1`
- `prismTour.admin.v1`

Values are only `finished` or `skipped`; no PII, identifiers, research data or deadline records are stored. Storage-denied browsers can still use all guidance controls. Escape/Skip record skipped; Finish records finished. Opening an explicit destination ends the current tour and leaves restart available.

NAVIGATION GUIDE IMPLEMENTATION: labels and destinations are read from the current rendered navigation/profile controls, plus Student's existing Submit document action. Descriptions are keyed to existing destinations/section controls, without a second maintained copy of labels. Guide labels are checked against every actual menu item in browser tests. Duplicate destinations may have their actual distinct guide labels; the tour visits each destination once. Logout is described in the guide and excluded from tour steps.

Tour controls: Back, Next, Skip, Finish and Step X of N. Steps do not navigate or mutate records; Open [current label] explicitly activates the existing destination control. Missing optional controls are excluded on construction. The centered native step dialog works without locating a tooltip against an absent card, empty table or collapsed menu. Guide entries invoke the current controls; activating Student Help preserves the existing form's focus.

Accessibility: native modal dialog semantics, labeled heading, focus on controls at open, Tab/Shift+Tab wrapping, Escape/backdrop dismissal, visible focus, live step text and restoration to the triggering control. Deadline dates are native buttons supporting mouse/touch/Enter/Space. Long content scrolls inside the dialog while actions stay reachable. Navigation/account controls behind a modal are inert through native dialog behavior.

## Flicker, loading, motion and responsive results

FLICKER / LOADING CHANGES: retained early theme/sidebar initialization. Guidance creates no overlay during startup. Calendar icon placement does not change cell dimensions; tests compare before/after cell heights. Calendar status starts as Loading official deadlines and shows empty text only after successful authoritative reads. Sequence checks prevent stale responses repainting a newer month. The read-only dialog is centered before display; late results do not update closed dialogs. Existing application loading behavior was not refactored.

ANIMATION / REDUCED-MOTION CHANGES: new markers/dialogs have no pulsing, flashing, bouncing or recurring animation. Existing PRISM button styling is reused. Scoped reduced-motion rules disable nonessential transitions/animation/scroll motion in these components; browser emulation passes. No body-wide hiding or new page transition was introduced.

RESPONSIVE RESULTS: Admin, Adviser and Student guidance plus both dashboard calendars/detail popups passed at 1920x1080, 1366x768, 1024x768, 768x1024, 390x844 and 375x812, in light and dark themes. No page-level horizontal overflow. Modal bounds/margins and internal horizontal containment pass. Controls remain reachable, including dense-date lists and collapsed/mobile navigation. Keyboard opening/closing and focus restoration pass. Empty/error states, retry, year-view activation, rapid month changes, current today styling and Pending guidance exclusions pass.

Final Batch 2 screenshot directory: `C:/Users/khirz/AppData/Local/Temp/prism-batch2-ui-UBLDKV/`. Mobile light/dark deadline and guide captures were reviewed. Isolated workspace fixtures block external fonts/icons, so screenshots use font fallbacks and do not verify CDN glyph rendering. Actual templates retain the existing Font Awesome stylesheet; the auth visual runner verified external font/icon loading separately. No live application pages or services were used.

## Files changed and added

FILES CHANGED:

- `.gitignore` - include only the two new regression modules in tracking eligibility.
- `assets/css/prism-workspace.css` - scoped read-only dialog, guide, marker and Adviser calendar styles.
- `calendar_deadlines_api.php` - GET-only scoped dashboard detail branch; existing list/create/cancel branches unchanged.
- `dashboard.php` - script/status integration and marker-ready month/year date buttons.
- `includes/prism-navigation.php` - authenticated guidance script and dropdown entry template.
- `research_adviser.php` - small Calendar panel and shared deadline script.
- `role_portal.php` - guidance script/profile menu entries and role metadata.
- `tests/calendar-deadlines-audit.php` - optional post-fixture-schema setup for Pending tests; original checks retained.
- `tests/ui-audit.cjs` - additive Batch 2 mock/runner flag; original assertions retained.

FILES ADDED:

- `assets/js/dashboard-deadlines.js`
- `assets/js/prism-guidance.js`
- `tests/v10-batch2-readonly.php`
- `tests/v10-batch2-ui.cjs`
- `PRISM_V10_BATCH2_READONLY_UX_REPORT.md`

## Exact test commands and totals

Commands ran from `C:/xampp/htdocs/rpms_system`. Browser runners used approved headless execution outside the sandbox after the first sandbox connection timed out. Endpoint tests use synthetic volatile SQLite memory fixtures or fake database objects; no application configuration bootstrap, existing application database, migration or live mail/AI endpoint was loaded.

| Exact command | Final successful result |
| --- | --- |
| `& C:\xampp\php\php.exe tests/v10-batch2-readonly.php` | 68 new checks |
| `node tests/ui-audit.cjs --batch2-only` | 1,020 new checks; 0 failures |
| `node tests/ui-audit.cjs --batch1-only` | 1,279 regression checks; 0 failures |
| `node tests/ui-audit.cjs --deadlines-only` | 237 regression checks; 0 failures |
| `node tests/ui-audit.cjs --onboarding-only` | 599 regression checks; 0 failures |
| `node tests/ui-audit.cjs --adviser-only` | 238 regression checks; 0 failures |
| `node tests/ui-audit.cjs --logout-only` | 731 regression checks; 0 failures |
| `node tests/ui-audit.cjs --resources-only` | 1,986 regression checks; 0 failures |
| `node tools/verify-auth-visual.cjs` | 490 regression checks |
| `& C:\xampp\php\php.exe tests/calendar-deadlines-audit.php` | 190 regression checks |
| `& C:\xampp\php\php.exe tests/auth-audit.php` | 16 regression cases |
| `& C:\xampp\php\php.exe tests/auth-flows.php` | 52 regression checks |
| `& C:\xampp\php\php.exe tests/alignment-audit.php` | 228 regression checks |
| `& C:\xampp\php\php.exe tests/notification-delivery-audit.php` | 293 regression checks |
| `& C:\xampp\php\php.exe tests/csv-export-audit.php` | 93 regression checks |
| `& C:\xampp\php\php.exe tests/logout-audit.php` | 28 regression checks |
| `& C:\xampp\php\php.exe tests/session-idle-audit.php` | 25 regression checks |
| `node tests/final-regression-ui.cjs` | 21 regression checks |
| `git diff --check` | Passed; no whitespace errors |
| `git diff --cached --name-only` | Empty; nothing staged |

NEW CHECK TOTALS: **1,088**, comprising 1,020 browser and 68 endpoint checks.

REGRESSION TOTALS: **6,506**, comprising 5,560 browser checks and 946 isolated guard/API/helper cases/assertions. Combined final successful checks: **7,594**. Counts exclude intermediate diagnostics and repeated successful runs.

PHP SYNTAX COUNT: **143 files**, zero failures, discovered by `rg` excluding vendor/backups.

JS/CJS SYNTAX COUNT: **35 runnable files**, zero failures, plus one existing non-standalone insertion fragment validated inside an async function. The unchanged ignored `tests/shell-alignment-focus.js` contains top-level await and return, so standalone CommonJS/module checks reject it; it was preserved rather than edited.

Exact final syntax commands:

```powershell
$phpFiles = @(rg --files -g '*.php' -g '!vendor/**' -g '!backups/**')
$failures = 0
foreach ($file in $phpFiles) {
    $result = & C:\xampp\php\php.exe -l $file 2>&1
    if ($LASTEXITCODE -ne 0) { $failures++; Write-Output $result }
}
$jsFiles = @(rg --files -g '*.js' -g '*.cjs' -g '!vendor/**' -g '!backups/**' -g '!tests/shell-alignment-focus.js')
foreach ($file in $jsFiles) {
    $result = node --check $file 2>&1
    if ($LASTEXITCODE -ne 0) { $failures++; Write-Output $result }
}
$fragment = Get-Content -LiteralPath tests/shell-alignment-focus.js -Raw
('async function verifyFragment(){' + [Environment]::NewLine + $fragment + [Environment]::NewLine + '}') | node --check
if ($LASTEXITCODE -ne 0 -or $failures -ne 0) { exit 1 }
```

Intermediate diagnostics caught and resolved a fixture request mapping issue, menu/dialog event propagation, focus wrapping/restoration and viewport centering. Additional tests protect existing Help focus and year-view highlighting. No original regression/security assertion was removed or weakened.

## Database/schema and scope proof

- **SCHEMA_VERSION unchanged: 9.** `config.php` current and HEAD Git object hashes both equal `1b6e8a8697c91d9f7b5ba5ad35c077b5c5e588ea`.
- **NO schema change.** No schema file changed; the lifecycle schema helper/JSON manifest remain untouched.
- **NO migration change.** No migration/manual SQL file changed or added, and no migration command ran. No test requires v10 migration. Batch 2 uses existing v9 deadline structures and remains compatible with the current staging v9 database.
- **NO workflow change.** Existing onboarding, invitation, account lifecycle, retention/purge, Adviser approval, RPMS submission and Admin Override code/semantics remain intact.
- **NO authentication semantic change.** Existing authentication/current-user/page/API guards remain byte-for-byte unchanged.
- **NO notification persistence change.** Existing delivery and notification backends/helpers are unchanged.
- **NO document backend change.** Existing upload, review, preview/download and submission endpoints are unchanged.
- **NO deadline mutation change.** `includes/calendar_deadlines.php`, `calendar-deadlines.js` and existing create/cancel branches are unchanged. New UI deadline requests are GET only.
- **NO code-structure reorganization.** Existing procedural routes/folders/components remain; no framework, tour library, OOP/MVC conversion or server-side tutorial storage was introduced.
- No Staff Registration or future support/notification feature was added. Help & Support backend remains unchanged.

Proof commands:

```powershell
git rev-parse HEAD:config.php
git hash-object config.php
git diff --name-only HEAD -- ':(glob)**/*schema*' ':(glob)**/*manifest*' ':(glob)**/*migration*'
git diff --name-only -- config.php tools includes/account_onboarding.php includes/calendar_deadlines.php workflow.php notifications_api.php documents_api.php
git diff --numstat -- includes/calendar_deadlines.php config.php workflow.php documents_api.php notifications_api.php assets/js/calendar-deadlines.js
git diff --cached --name-only
git diff --check
git branch --show-current
git rev-parse HEAD
git status --short
```

All protected-file diff commands returned empty. Index inspection returned empty. Diff check exited successfully (Git emitted only existing LF/CRLF normalization notices).

## Final git status --short

```text
 M .gitignore
 M assets/css/prism-workspace.css
 M calendar_deadlines_api.php
 M dashboard.php
 M includes/prism-navigation.php
 M research_adviser.php
 M role_portal.php
 M tests/calendar-deadlines-audit.php
 M tests/ui-audit.cjs
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? assets/js/dashboard-deadlines.js
?? assets/js/prism-guidance.js
?? tests/v10-batch2-readonly.php
?? tests/v10-batch2-ui.cjs
```

No commit, push, merge, tag, deployment, staging, database migration,
Hostinger modification, production access, or production modification performed.
