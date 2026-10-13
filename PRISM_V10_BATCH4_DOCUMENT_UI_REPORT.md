# PRISM V10 Batch 4 — Document UI and visual reconciliation

Local review report, 11 October 2026, Asia/Manila. All changes are unstaged.

## Starting branch, checkpoint and ending status

The repository was inspected and reported before implementation:

```text
git branch --show-current
prism-v10-b03-filter-guardrails

git rev-parse HEAD
1ed5464feb2875287a6d01f293146819bfe73f5e

git log -5 --oneline
1ed5464 Add PRISM filter and deadline guardrails
5675e5f Add PRISM dashboard guidance and deadline details
9191aeb Polish PRISM v10 interface and auth presentation
0d52de5 Support Hostinger legacy foreign key normalization
d7dc512 Implement final v9 account onboarding and lifecycle retention

git status --short
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
```

Batches 1–3 were present in the starting history and their existing implementation was audited. The two pre-existing untracked reports were preserved. The requested local branch was created with `git switch -c prism-v10-b04-document-ui`. Ending branch: `prism-v10-b04-document-ui`; HEAD remains `1ed5464feb2875287a6d01f293146819bfe73f5e`. The index is empty. No repository remote or hosted application was accessed.

## Rendered audit performed before implementation

`node tests/ui-audit.cjs --batch4-before` rendered the existing PHP templates in isolated Chrome fixtures at 1920×1080, 1366×768, 1024×768, 768×1024, 390×844 and 375×812, in light and dark themes. It produced 180 screenshots and 184 passing boundary/overflow checks. Those checks were observations of the starting UI, not evidence that it met the requested design. Desktop and mobile screenshots were visually inspected, and findings were communicated before changing production presentation files.

The audit covered Login, Account Setup, Student/Adviser Complete Profile, the Admin dashboard/resources, Student Records, Research Advisers, Documents, IERB, Account & Activity, Student My Documents, Adviser reviews, filters, retention controls and lifecycle controls. An additional Adviser Account combination was added to the final matrix.

Already satisfactory: Login's institutional imagery, absence of a Register CTA, password-eye interaction, the official Research Agenda asset, server-driven role/action visibility, Batch 3 academic cascades and the dominant Adviser review action.

Mismatches: onboarding used a separate plain card/background family; resources used uneven columns with IERB last; filter expansion consumed toolbar layout and stretched searches/buttons; management controls occupied excessive width; rows contained clusters of secondary actions; the lifecycle eye/control width and archive/disclosure alignment were inconsistent. These were presentation defects. No workflow or authorization redesign was needed.

The first isolated retention fixture lacked the current lifecycle API response. That fixture defect was corrected; it was not reported as an application failure.

## Latest UI issues and disposition

| Requested issue | Status | Final behavior or limit |
| --- | --- | --- |
| Establish Password and Complete Profile match Login | IMPLEMENTED | Reuse Login stylesheet, CEU asset, overlay, logo and card family. |
| Onboarding token/password/profile/security behavior | ALREADY SATISFIED | Existing handlers, validation and PHP security logic retained. |
| Password-eye functionality and attachment | IMPLEMENTED | Existing toggles retained; layout and keyboard behavior verified. |
| Stacked, equal Research Resources rows | IMPLEMENTED | IERB, SDG, Agenda in that order, with common sizing and interaction. |
| Official 2023–2028 Agenda and existing expanded content | ALREADY SATISFIED | Asset, alt text, full-size links and resource content retained. |
| Compact coherent buttons, search and toolbar wrapping | IMPLEMENTED | Semantic variants, typical 38px workspace controls, 44px mobile targets. |
| Filters float without stretching the page | IMPLEMENTED | Shared fixed, anchored, non-modal disclosure. |
| Filter viewport, layering, keyboard and focus behavior | IMPLEMENTED | Containment, scrolling, Escape/outside close and stable trigger focus. |
| Retention filters and separate maintenance controls | IMPLEMENTED | Inside Filters & Sort; opening makes no mutation request. |
| Persistent bulk-selection/action state | ALREADY SATISFIED | Remains visible outside the transient panel; shared compact treatment. |
| Admin lifecycle common alignment and validation placement | IMPLEMENTED | One form column, attached eye, wrapped checkbox text, local result area. |
| Permanent-delete safeguards and retention semantics | ALREADY SATISFIED | Original backend and confirmation flows retained. |
| Student, Adviser, Documents and IERB secondary action clusters | IMPLEMENTED | Existing authorized nodes moved into labelled Actions disclosures. |
| Dominant Review Document / Submit to RPMS actions | IMPLEMENTED | Remain visible with primary styling. Adviser file/review pair stays aligned. |
| Authoritative, read-only protocol display | IMPLEMENTED | Assigned Student value or `No protocol code yet.` in submission. |
| Protocol wording in existing Student views | IMPLEMENTED | Same missing-code wording in the existing Progress reveal; assigned-only dashboard/card visibility retained. |
| One catalog for new single uploads | IMPLEMENTED | One frozen 14-label catalog shared by the two upload views. |
| Historical document type readability and filters | ALREADY SATISFIED | Server/record legacy types remain in filters; historical values are not rewritten. |
| Batch 1, 2, 3 and full browser/CLI regression | IMPLEMENTED | Passing results below; existing contracts adapted only for authorized UI changes. |
| Database-backed lifecycle/retention integration reruns | BLOCKED | Their runner invokes migrations, prohibited by the absolute no-migration instruction. |
| Live staging/production and external font/icon rendering | PARTIALLY SATISFIED | Local actual-template rendering completed; hosted environments were not accessed, external fonts/icons were blocked. |

## Authentication visual reconciliation

`account_setup.php` and `complete_profile.php` now load `assets/css/style.css` before their existing scoped onboarding CSS. They use the existing `unified-login`, `background-overlay`, `login-card`, `logo-container` and `logo-main` classes, `assets/images/ceu_bg.png` and `assets/images/prismlogo1.png`. The Login overlay gradient, 25px card radius, translucent light card, blur, shadow and transparent-canvas logo crop are reused directly. Longer profile forms use a 560px maximum width, responsive padding, grouped academic fields and reserved alert space.

Inputs use the Login gray/pill family, primary submit buttons use its navy/pink treatment, and focus uses the existing pink language. The same light auth-card family is retained under both persisted theme settings, matching Login. Native controls explicitly use a light color scheme within that card, preventing dark native dropdowns on a light form. Early theme restoration is applied to Account Setup. Existing setup JavaScript, token handling, password policy/hashing, profile restrictions, invitation identity, required academic fields and same-origin handlers are unchanged.

## Research Resources

The shared PHP partial retains native `details`/`summary` elements and legitimate expanded content. Rows are full-width and stacked: IERB Portal, Sustainable Development Goals, Research Agenda. Width, padding, radius, border, plus/minus placement, typography and hover/focus treatment are shared. Mobile rows allow the long SDG title to wrap while preserving equal collapsed heights. The official `assets/images/research-agenda-2023-2028.png` remains contained with its original aspect ratio, meaningful alt text and full-size viewing link.

## Buttons and management toolbars

Shared primary, secondary, neutral and danger variants express purpose. Workspace toolbar/menu controls are typically 38px high with 8px gaps and consistent icon spacing; mobile controls use 44px targets. Auth submits retain Login's 52px pill treatment. Adviser Open File and Review Document stay equal-height and aligned, with Review styled as primary.

Student Records, Research Advisers, Documents and IERB now group compact search/actions/filters and wrap naturally. Desktop search is constrained to 320px; mobile search occupies the available row. Search debounce, endpoints, pagination and query meaning are unchanged. Existing table horizontal scrolling is preserved where necessary; it does not cause page overflow.

## Filters & Sort and retention organization

The shared helper positions one active floating panel with `position:fixed`, a 12px viewport margin, right alignment near its trigger, above/below placement and a scrollable viewport-limited height. ResizeObserver, window resizing and ancestor scrolling maintain its position. The DOM remains beside its trigger for native non-modal Tab order. There is no focus trap. `aria-controls`, `aria-expanded`, visible focus, Enter opening, Escape/outside closing and focus return are retained/tested.

Filters use z-index 500; action panels use 510. Existing navigation overlays, critical confirmations and native top-layer dialogs remain above them. No global oversized z-index was introduced.

Coverage includes Student Records, Research Advisers, Documents and IERB for authorized Admin/Adviser roles. All 84 final filter-opening cases passed the table-position assertion with less than 1px tolerance, viewport bounds, accessible state and zero additional POST requests. Batch 3's active counts, defaults, Clear behavior, Academic Unit → Program → Year Level cascade and validated server query behavior passed separately.

Lifecycle, Retention status and Profile status filters remain available inside the records panel. A separated Retention Maintenance section contains Review eligible accounts and the visibly destructive Run Retention Cleanup action. These retain their existing callbacks and security dialogs. Bulk selection, select-all matching, clear selection and selected-account actions remain outside the panel.

## Admin account lifecycle

Archive and expanded permanent-delete forms use one maximum-480px responsive column. Password inputs retain their labels, required state and current-password autocomplete. Eye controls sit inside the input's right edge and are vertically centered. Checkbox and text are separate flex children so continuation lines align with the label. Each form has a reserved live result region beneath its confirmation control, and errors are written to the submitted form's region. Archive is a compact danger action aligned with the fields; the permanent-delete disclosure shares the column and divider.

Both themes and all six requested sizes passed alignment, bounds, required fields and password-eye tests. The existing form payload, current-password checks, exact confirmation, self-target restrictions, another-active-Admin rule, sign-out handling, delete availability, schema-verification gate and retention rules are unchanged. The original backend files were not edited.

## Actions disclosures

Student Records and Research Advisers consolidate the existing role-authorized edit/lifecycle/invitation actions. Documents consolidate existing preview/download/version/review-secondary/summary/override/delete controls while retaining Review Document. IERB consolidates its applicable existing row actions. Student My Documents moves Preview and Download into Actions and keeps formal Submit to RPMS visible when its existing server flag permits it. The Adviser review list has one secondary Open File link beside the dominant Review Document action; that pair deliberately remains visible. Folder/course document views retain their file links and single summary affordance.

Menus move existing DOM nodes with their listeners and permission flags intact. They do not manufacture role permissions. Icon-only items gain visible text from their existing accessible name/title. Archive/delete/deny/override/remove-hold items use danger styling. Native button/link activation, arrow/Home/End navigation, outside click, Escape, viewport containment and dialog return to the original row's stable Actions trigger are verified. Menu items have full text width and 38px desktop/44px mobile targets.

## Protocol code and canonical catalog

The submission's existing read-only field reads `myRecord.protocolCode` from the existing authoritative Student response. Absence displays exactly `No protocol code yet.`. The existing Progress reveal uses that wording too. Dashboard and My Documents retain their established assigned-only code display rather than gaining duplicate empty-state cards. Tests cover undefined, null, empty, assigned, long and hostile literal values at seven widths, including 320px.

`PrismUI.documentTypes` is a frozen shared catalog, in this exact order:

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

New uploads use this catalog with an explicit blank selection. The prior local custom-type editor is a read-only catalog viewer. Historical server/record types remain readable and filterable, including old Protocol/Research Protocol values in fixtures. No historical data, mandatory document requirements, file transport, upload multiplicity or workflow rules were changed.

## Additional defects and regression-test reconciliation

Fixed: tablet toolbar stretching; a stale mobile flex-column rule; resource-height differences from long labels; Adviser action size/color inconsistency; lifecycle actions clipped by legacy 40×40 icon rules; a legacy `!important` 36px icon minimum overriding menu touch targets; dark native control colors on the light onboarding card; and modal focus attempting to return to an item in a closed menu. Legacy icon rules now exclude menu items instead of overriding the shared text-item component. A further summary-refresh defect returned focus to the first document after rows were re-rendered; the fallback now finds the selected document in the active table/folder/course view. Six new second-record assertions cover request identity and restored focus across all three views.

Existing tests were retained and updated for the authorized presentation: open the menu before measuring its links; expect the stable visible trigger on dialog close; preserve primary/secondary semantic distinction; start the non-modal Tab test at the panel's actual last control after maintenance was moved. The upload test now selects/asserts canonical Study Protocol while historical fixtures keep their old label. Lifecycle fixtures now provide current `account_state`, explicit archive/eligibility data and the current payload with reason. An obsolete test-only checkbox expectation was removed because that field was already absent from the starting v9 form. Contrast assertions composite translucent backgrounds correctly. Backend permission, payload, gate, history and confirmation expectations remain exercised; no security requirement was relaxed to make a test pass.

Deferred: MariaDB migration/concurrency/FK/quarantine integration coverage, because executing its runner violates the no-migration instruction. Live staging/production appearance and CDN font/icon delivery were not inspected because hosted access was prohibited/outside this local task. No schema/workflow/product-scope defect was repaired by expanding Batch 4.

## Verification results and exact commands

Each listed final result has zero failures. Browser runs use isolated actual-template fixtures, mocked API responses and an isolated Chrome profile. They do not load application `config.php`, send mail, invoke AI providers or connect to the application database. CLI suites use reviewed in-memory/temporary fixtures; some use disposable SQLite, never the installed MariaDB database. Counts across commands overlap and are not counts of unique requirements.

| Command | Passing checks / suites |
| --- | ---: |
| `node tests/ui-audit.cjs --batch4-before` | 184 baseline audit checks |
| `node tests/ui-audit.cjs --batch4-only` | 1,960 |
| `C:/xampp/php/php.exe tests/v10-batch4-security.php` | 73 |
| `node tests/ui-audit.cjs --batch1-only` | 1,279 |
| `node tests/ui-audit.cjs --batch2-only` | 1,020 |
| `node tests/ui-audit.cjs --batch3-only` | 2,265 |
| `node tests/ui-audit.cjs --academic-only` | 532 |
| `node tests/ui-audit.cjs --onboarding-only` | 599 |
| `node tests/ui-audit.cjs --retention-only` | 332 |
| `node tests/ui-audit.cjs --lifecycle-ui-only` | 1,297 |
| `node tests/ui-audit.cjs --student-protocol-only` | 1,382 |
| `node tests/ui-audit.cjs --document-summary-only` | 35 |
| `node tests/ui-audit.cjs --batch4-only --smoke` | 656 |
| `node tests/ui-audit.cjs` | 7,803 |
| `C:/xampp/php/php.exe tests/v10-batch2-readonly.php` | 68 |
| `C:/xampp/php/php.exe tests/v10-batch3-filters.php` | 150 |
| `C:/xampp/php/php.exe tests/v10-batch3-invitations.php` | 130 |
| `C:/xampp/php/php.exe tests/v10-batch3-deadlines.php` | 50 |
| `python tests/run-final-regression.py` | 27/27 CLI suites |
| `git diff --check` | PASS |

The new Batch 4 browser command includes four inherited template-boundary assertions. New standalone Batch 4 checks: 1,956 browser + 73 isolated security/behavior = **2,029**; command totals including those four inherited checks = **2,033**. The existing browser harness also gains 42 missing-protocol-reveal checks and six second-document summary request/focus checks, bringing newly introduced assertions to **2,077**. Earlier intermediate failures were corrected and rerun; only the final results above are acceptance evidence. The extra smoke command verifies the final native-control color-scheme correction at desktop/mobile in both themes.

Batch 1 verifies Login/session-expiry, Welcome, Adviser actions, provider wording, CSV, official Agenda and password eyes. Batch 2 verifies deadline markers/details, Adviser mini-calendar, tours/guides, loading and role scoping. Batch 3 verifies academic cascades, restored/invalid filters, exact invitation-domain warnings, multi-group deadlines and cancellation confirmation. The three additional Batch 3 PHP suites and Batch 2 read-only suite total 398 checks. Browser regression commands total **16,544** executed checks (including the focused summary command); the 27 CLI suites and four Batch 2/3 PHP suites total **5,527** checks. Combined counted regression total: **22,071**, with overlap between suites. The new Batch 4 module commands and baseline/smoke audits are listed separately above.

The final regression runner executes these exact commands (each with `C:/xampp/php/php.exe -d extension=zip`):

```text
tests/auth-audit.php
tests/auth-flows.php
tests/session-idle-audit.php
tests/security-audit.php
tests/rate-limit-audit.php
tests/logout-audit.php
tests/crud-audit.php
tests/document-workflow-audit.php
tests/notification-delivery-audit.php
tests/research-group-audit.php
tests/academic-audit.php
tests/academic-api-audit.php
tests/alignment-audit.php
tests/report-format-audit.php
tests/backend-audit.php
tests/tonight-polish-audit.php
tests/readiness-audit.php
tests/email-format-audit.php
tests/cache-audit.php
tests/final-regression-audit.php
tests/hardening-audit.php
tests/calendar-deadlines-audit.php
tests/document-extraction-audit.php
tests/document-summary-audit.php
tests/document-summary-transport-audit.php
tests/archive-operational-audit.php
tests/csv-export-audit.php
```

These produced 5,113 numerically reported checks plus 16 individual auth-audit PASS results, totaling **5,129** passing CLI checks. Exact outputs and command metadata are in ignored local `tests/final-regression-results/cli-results.json` and corresponding logs. Representative real isolated endpoints cover unauthorized Student record/document mutations, out-of-scope Adviser Student actions, document IDOR/file scope, upload/review/versioning, formal workflow, preview/download, archive/history, deadline access and authorization. The 60 new crafted lifecycle/retention requests run the original route/guards and reject anonymous/Student/Adviser calls, GET mutations, invalid methods and missing/cross-origin requests before database access. Thirteen additional cases run the original lifecycle implementation against PDO doubles for passwords, checkbox/exact confirmation, self-targeting, last active Admin, transactions, inactive actors and fail-closed delete schema gates.

Retention browser tests cover filter availability, maintenance isolation, selection, Hold, eligibility/password/identifier/recovery UX and expired gates. Lifecycle browser tests cover current-password/checkbox/exact-identifier confirmation, archive-first availability, protected history and failure recovery. These do **not** certify real MariaDB locking, file quarantine/recovery or migration behavior.

Not run: `C:/xampp/php/php.exe tests/account-lifecycle-runner.php --lifecycle`, `--lifecycle-remediation`, `--lifecycle-shared-hosting`, `--retention` and `--retention-manifest`. That runner loads `account-lifecycle-mysql.php` / `account-retention-mysql.php`, which invoke `PrismResetMigrationSQL\migrate($pdo)`. This is the only blocked regression portion and follows the user's explicit no-database-migration rule. No permission to override that rule was requested.

## Responsive, accessibility, theme and reduced-motion evidence

The final matrix covers 16 page/role combinations × six sizes × two themes = 192 rendered samples, with no accidental horizontal page overflow. It also saves 60 open-menu/filter screenshots. Keyboard assertions cover native resource expansion/collapse, password eyes, menu navigation, non-modal Tab, focus return, Escape and outside close. Labels, disclosure state, readonly protocol fields, required lifecycle inputs and live result regions are preserved. Enabled lifecycle danger contrast passes 4.5:1 checks in both themes, including hover. Mobile menu targets are at least 44px. Reduced-motion emulation checks changed resource/menu/button/password controls; transitions are disabled. Normal interactions use restrained 120–160ms shared transitions rather than flashing/pulsing effects.

Before evidence: `C:\Users\khirz\AppData\Local\Temp\prism-batch4-before-D7A6jM` (180 screenshots and metrics).

Final evidence: `C:\Users\khirz\AppData\Local\Temp\prism-batch4-after-u9Z8To` (252 screenshots and metrics). Representative desktop/mobile, light/dark, auth, resources, lifecycle, open-retention and open-action screenshots were visually inspected after the fixes. Final lifecycle results: `tests/lifecycle-results/student-delete-ui-results.json` (1,297 checks, no failures or exceptions).

External Google Fonts and Font Awesome requests were blocked by the isolated harness. Consequently these screenshots demonstrate fallback-font layout and icon container geometry, not successful external font/glyph delivery. Existing production CDN references are unchanged.

## Syntax and repository checks

PHP syntax: **176 files passed** with `C:/xampp/php/php.exe -l <file>`. JS syntax: **50 files passed**; CJS syntax: **15 files passed**, using `node --check <file>`. The existing `tests/shell-alignment-focus.js` is a browser-evaluation fragment rather than a standalone JS module and is excluded. Vendor, node_modules, backups, storage and .git directories are excluded. Recorded results: ignored `tests/final-regression-results/batch4-syntax.json`.

The exact scan was a PowerShell here-string piped to `python -`, containing:

```python
import pathlib, subprocess, json
root = pathlib.Path.cwd()
excluded = {'.git', 'vendor', 'node_modules', 'backups', 'storage'}
results = []
for kind, suffix, command in [('PHP','.php',['C:/xampp/php/php.exe','-l']),
                              ('JS','.js',['node','--check']),
                              ('CJS','.cjs',['node','--check'])]:
    files = sorted(p for p in root.rglob('*'+suffix)
                   if not excluded.intersection(p.relative_to(root).parts))
    fragments = [p for p in files if p.relative_to(root).as_posix()
                 == 'tests/shell-alignment-focus.js']
    files = [p for p in files if p not in fragments]
    failures = []
    for p in files:
        r = subprocess.run(command+[str(p)], capture_output=True, text=True)
        if r.returncode:
            failures.append({'file':str(p.relative_to(root)),
                             'output':r.stdout+r.stderr})
    results.append({'kind':kind,'count':len(files),'failures':failures,
                    'excluded_existing_fragments':
                    [str(p.relative_to(root)) for p in fragments]})
(root/'tests/final-regression-results/batch4-syntax.json').write_text(
    json.dumps(results,indent=2), encoding='utf-8')
print(json.dumps(results))
raise SystemExit(1 if any(r['failures'] for r in results) else 0)
```

The final changed protocol/test scripts also passed `node --check assets/js/role-portal.js`, `node --check tests/ui-audit.cjs`, `node --check tests/v10-batch4-ui.cjs` and `node --check assets/js/documents.js` after their final edits. `git diff --check` passed. `git diff --cached --name-only` returned no entries. `rg -n SCHEMA_VERSION config.php` confirms `const SCHEMA_VERSION = 9;` at line 190. `git diff --name-only` contains no migration/schema/SQL/config/backend policy changes.

## Files changed and added

| Modified file | Purpose |
| --- | --- |
| `.gitignore` | Make the two new test sources reviewable under existing test ignores. |
| `account.php` | Checkbox text wrappers and form-local live results. |
| `account_setup.php` | Login-family markup/styles and early theme restoration. |
| `complete_profile.php` | Login-family markup/styles. |
| `documents.php` | Read-only canonical catalog viewer. |
| `role_portal.php` | Blank required upload selector populated from the shared catalog. |
| `includes/research_resources.php` | Required stacked-resource order/title; content preserved. |
| `assets/css/admin-management.css` | Exclude menu items from legacy lifecycle icon rules. |
| `assets/css/onboarding.css` | Scoped Login-family reconciliation. |
| `assets/css/prism-ui.css` | Prevent toolbar stretching and legacy icon rules overriding menus. |
| `assets/css/prism-workspace.css` | Shared compact controls, panels, resources and lifecycle layout. |
| `assets/js/account.js` | Place lifecycle results in the submitted form. |
| `assets/js/admin-management.js` | Authorized action consolidation and stable dialog return focus. |
| `assets/js/admin-retention.js` | Maintenance placement and danger style; handlers retained. |
| `assets/js/adviser-dashboard.js` | Primary Review styling with aligned Open File action. |
| `assets/js/documents.js` | Canonical catalog, existing-action consolidation, summary focus. |
| `assets/js/ierbprog.js` | Existing authorized row-action consolidation. |
| `assets/js/prism-ui.js` | Shared frozen catalog and floating disclosure helpers. |
| `assets/js/role-portal.js` | Catalog, protocol wording, Actions and visible formal submission. |
| `tests/account-retention-ui.cjs` | Expect the visible menu trigger on dialog focus return. |
| `tests/ui-audit.cjs` | Batch 4 fixtures/routes and current presentation/payload assertions. |
| `tests/v10-batch1-ui.cjs` | Measure visible menu links and semantic primary review treatment. |
| `tests/v10-batch3-ui.cjs` | Tab assertion follows the relocated maintenance controls. |

Added: `tests/v10-batch4-ui.cjs`, `tests/v10-batch4-security.php`, and this report. Screenshots, syntax JSON and regression output are local ignored/temporary evidence, not deployment assets.

Ending `git status --short`:

```text
 M .gitignore
 M account.php
 M account_setup.php
 M assets/css/admin-management.css
 M assets/css/onboarding.css
 M assets/css/prism-ui.css
 M assets/css/prism-workspace.css
 M assets/js/account.js
 M assets/js/admin-management.js
 M assets/js/admin-retention.js
 M assets/js/adviser-dashboard.js
 M assets/js/documents.js
 M assets/js/ierbprog.js
 M assets/js/prism-ui.js
 M assets/js/role-portal.js
 M complete_profile.php
 M documents.php
 M includes/research_resources.php
 M role_portal.php
 M tests/account-retention-ui.cjs
 M tests/ui-audit.cjs
 M tests/v10-batch1-ui.cjs
 M tests/v10-batch3-ui.cjs
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
?? PRISM_V10_BATCH4_DOCUMENT_UI_REPORT.md
?? tests/v10-batch4-security.php
?? tests/v10-batch4-ui.cjs
```

## Scope confirmations

No schema or migration change; SCHEMA_VERSION remains 9. No core Student document workflow, Adviser approval, formal RPMS submission, Admin Override, post-submission return, notification persistence, account-retention policy or Admin lifecycle semantic change. No multi-file upload, Staff Registration Code, internal support, framework, OOP/MVC conversion, route relocation or code-structure reorganization. Presentation uses existing v9 fields/endpoints and introduces no database dependency.

No commit, push, merge, tag, deployment, staging, database migration,
Hostinger modification, production access, or production modification performed.
