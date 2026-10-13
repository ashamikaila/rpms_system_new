# PRISM V10 — Batch 5A UI / Adviser Routing Report

Date: October 11, 2026 (Asia/Manila). Local workspace only.

## Repository checkpoint

- STARTING BRANCH: `prism-v10-b04-5-archive-workspace`
- STARTING HEAD: `25557f26d780f2241278854bbb4a0655d969bc04`
- Starting last five commits: `25557f2`, `83ef1df`, `1ed5464`, `5675e5f`, `9191aeb`.
- Starting tracked worktree: clean; six unrelated untracked reports/artifacts were present and preserved.
- ENDING BRANCH: `prism-v10-b05a-ui-adviser-routing`
- ENDING HEAD: `25557f26d780f2241278854bbb4a0655d969bc04` (unchanged).
- ENDING WORKTREE: local, unstaged implementation and tests; exact final status recorded below after verification.

The requested branch was created from the reviewed Batch 4.5 checkpoint. A sandbox permission restriction on `.git` required an approved escalation for `git switch -c`; no index or commit operation was performed.

## Source audit and scope decisions

The source findings were reported before implementation. The application is procedural PHP with an existing shared UI kit; no code-structure conversion was needed.

- Authentication: inspected `index.php`, `login.php`, `login_process.php`, `loading.php`, legacy role login redirects, session/auth helpers in `config.php`, onboarding checks, password/profile routing, and the dashboard/IERB page gates. Login creates a credential-bound session and redirects through `index.php`; the original Adviser default was `ierbprog.php`. `loading.php` already redirects to `index.php`. Legacy role login pages redirect to `login.php`.
- Adviser dashboard: `research_adviser.php` is canonical. It uses a review table, paginated document reads, and separate profile/notification/calendar components. Its original grid placed reviews beside a stack of calendar, profile and notifications, aligned to the start rather than sharing a reviews/notifications row. The shared workspace stylesheet also retained a wide standalone review-action column.
- Badges: shared `PrismUI.badge()` and semantic colors already existed. `.is-small` padding, local stage/protocol/PI shapes, and badge rows differed. Stage/status and protocol/PI pairs in management records lacked a consistent wrapping gap. Adjacent document workflow/override badges also lacked a shared row.
- Review actions: `documents.js` explicitly kept Review Document outside `PrismUI.actionMenu()` as its primary action. The Adviser dashboard rendered a separate review button. IERB rows open document views through existing Actions; Student rows have no authorized review button. The real `documents_api.php` action flags and review checks remain authoritative.
- IERB: both roles share `ierbprog.php`. Search and Admin Add controls had labels above them while the generated Filters & Sort trigger was centered against their wrappers. The existing disclosure already floats above the layout and supports containment/focus handling.
- Admin dashboard: Search was functional: it supplied `q` to the IERB monitor API and had an input listener. Quick Actions was also functional: it opened the existing report modal and displayed report history. These were not dead controls. The user explicitly confirmed: “Remove both; preserve the existing alternative access.” Removal proceeded on that authorization, with working IERB management search and report access retained.

## Adviser login routing

Original normal path: `login_process.php → index.php → ierbprog.php`.

Final normal path: `login_process.php → index.php → research_adviser.php`.

`index.php` now explicitly redirects a required password change before testing profile completion. Previously, the role page performed that password-change redirect on the next request. This removes an unnecessary intermediate role-page hop without weakening the gate.

Precedence remains:

1. Incorrect credentials fail in `login_process.php`; no session is created.
2. Inactive login accounts are rejected; `current_user()` also invalidates inactive accounts, stale credential bindings, and expired sessions.
3. Authenticated accounts requiring a password change go to `change_password_required.php`.
4. Pending/incomplete Adviser profiles go to `complete_profile.php`.
5. Active completed Advisers go to `research_adviser.php`.

An archived profile with a still-Active login row fails the unchanged onboarding check and remains restricted to profile flow; it cannot enter the dashboard or review API. Ordinary archived/inactive login rows are denied. These existing restrictions were preserved, not redesigned.

Normal Student landing remains `student.php`; normal Admin landing remains `dashboard.php`. Authorized direct Adviser access to `ierbprog.php` remains allowed. Anonymous dashboard access redirects to login. Existing post-password-change and post-profile-completion destinations, and wrong-role fallback routing, were not changed: the requested change is the default successful-login destination.

## Adviser dashboard layout

- Reviews and recent notifications are now sibling panels in the same desktop grid row, using `minmax(0, 2fr) minmax(280px, 1fr)` and stretched shells.
- Calendar and account cards remain accessible in a following two-column grid; they stack below 700px.
- Reviews retain natural content height, existing pagination, and local horizontal table scrolling. The minimum table width was reduced from 760px to 650px; the former 180px action-column constraint was removed after consolidating actions.
- Reviews and notifications stack in their reading order at 1100px and below, including 1024×768, 768×1024, and both mobile sizes.
- Notification content scrolls independently (`overflow-y:auto`, `overscroll-behavior:contain`), with a desktop maximum of 640px and stacked maximum of 360px. Its labeled region is keyboard reachable.
- No artificial fixed review-shell height, stretching of notification messages, or notification ownership/read/persistence changes were introduced. The existing personal notification request (`preview=5&personal=1`) is unchanged; Notification Center still provides full history.

Measured example at 1920×1080: review and notification shells share `y=685.375` and `height=820.984375`, with a 20px column gap. This fixture intentionally contains extremely long hostile document names. Panel heights follow their content; wrapping/scrolling prevents page overflow.

## Shared badges / pills

Shared tokens live in `assets/css/prism-ui.css`; the workspace normalization uses existing semantic component classes in `assets/css/prism-workspace.css`.

- Minimum height: 28px; padding: 4px vertical / 10px horizontal.
- Radius: 999px; font: 12.5px / 600; line-height: 18px.
- Icon gap: 6px; border: 1px, preserving semantic border colors.
- `.prism-badges` and `.prism-pill-row`: wrapping flex rows with an 8px horizontal and vertical gap.
- Multi-line labels can grow naturally rather than overflowing their container.
- Stage/category/PI use the existing purple family; positive/on-track use green; pending uses amber; revision/danger retain the existing danger family; protocol identifiers/group chips use neutral colors.
- Representative light/dark contrast checks passed at ≥4.5:1, including alpha-composited dark backgrounds.

No status, stage, role, protocol identifier, PI meaning, or workflow label was renamed. Notification count indicators and unrelated decorative labels were not redesigned.

## Review Document under Actions

Changed controllers: `assets/js/adviser-dashboard.js` and `assets/js/documents.js` (Admin and Adviser Documents).

- Every authorized Review Document control is inside the existing Actions panel; no standalone duplicate remains.
- Adviser order: Open document, Review Document. Documents order: View, Download, Review Document, Version history, applicable summary/approval/comment tools, then denial/override/delete controls.
- Actions moves the existing DOM controls and retains their listeners. The existing menu helper and backend review implementation were not modified.
- Adviser dialog focus uses the existing `PrismUI.actionOrigin()` so cancellation/Escape returns to the visible Actions trigger, rather than a now-hidden item.
- Existing keyboard activation, arrow navigation, Escape, outside-click close, visible focus, `aria-expanded`, and viewport containment passed.
- Browser save checks for Admin Documents, Adviser Documents, and Adviser dashboard preserve `POST documents_api.php?action=review` and `{id, status, remarks}`.
- Denied-review fixtures still render legitimate file Actions and omit Review Document.

Real endpoint fixture tests verify crafted Student, unassigned Adviser, archived-student, superseded-version, and submitted-document review attempts remain denied. No assigned-Adviser scope, CSRF/same-origin checks, workflow eligibility, or permission flags changed.

## IERB toolbar

The shared IERB markup retains an accessible Search records label without an extra visible label row. Add IERB Entry is a direct Admin-only toolbar button. The existing floating filter disclosure and filter controls remain intact.

- Desktop Search: constrained to 320px wide / 38px tall.
- Desktop Add and Filters & Sort: 38px tall, aligned to the same vertical baseline with an 8px toolbar gap.
- Mobile Search: full available width / 44px tall; Add and Filters wrap below with 44px targets.
- Opening filters leaves toolbar position/height unchanged; the panel stays within the viewport.
- Both roles, both themes, and all six requested sizes passed. Adviser Add permission remains absent; create/workflow authorization was not changed.

## Admin dashboard

Following the user's explicit confirmation, removed Search, the Quick Actions toggle/dropdown, recent report mini-history, and their wrappers/listeners. Removed the dashboard-only report-history fetch/render code and calls. The IERB monitor no longer reads a removed Search element; its existing course filter, sort, metrics, record actions, and refresh remain intact.

A real Dashboard heading now occupies the header naturally. Theme, notifications, account menu, and navigation remain. The dashboard AI report button and report modal still work; report history and AI tools remain available through Reports and AI pages. Student Records, Research Advisers, IERB, Documents, and Archived Accounts search controls remain intact.

## Related defects found / fixed / deferred

Fixed: old wide standalone Adviser action column; hidden-menu-item focus return; tightly packed stage/status, protocol/PI, document workflow/override and Adviser group chips; compact-pill sizing differences; IERB wrapper-label misalignment; orphan Quick Actions handlers and unnecessary mini-history fetch.

Kept out of scope: existing onboarding completion/password success destinations, notification history data limits, bulk uploads, Help & Support, Staff Registration Code, automatic Adviser approval/submission behavior, RPMS Return to Student, Admin Override semantics, retention and permanent-delete implementation.

## Verification results

All checks use isolated rendered templates, mocked browser APIs, PDO doubles or volatile in-memory fixtures. Application configuration/bootstrap and persistent application databases were not executed. Browser traffic to external origins is blocked by the existing harness.

| Suite | Result |
| --- | --- |
| Batch 5A routing / real auth gates / review API origin gates | 30 passed |
| Existing authentication flows | 52 passed |
| Existing document workflow plus five crafted review cases | 48 passed |
| Batch 2 read-only/security | 71 passed |
| Batch 3 filters/API/security | 150 passed |
| Batch 3 invitations/API/domain/assignment | 130 passed |
| Batch 3 deadlines/API/group/cancellation | 50 passed |
| Batch 4 lifecycle/retention guards | 91 passed |
| Batch 4.5 route/list/bulk/deadline/purge gates | 168 passed |
| Batch 5A browser | 959 passed, 0 failures |
| Batch 1 browser | 1,280 passed, 0 failures |
| Batch 2 browser | 1,032 passed, 0 failures |
| Batch 3 browser | 2,277 passed, 0 failures |
| Batch 4 browser | 2,368 passed, 0 failures |
| Batch 4.5 browser | 2,073 passed, 0 failures |

Totals across the listed final runs: 9,989 browser assertions and 790 PHP routing/security/workflow checks, with zero final failures.

Responsive matrix: 1920×1080, 1366×768, 1024×768, 768×1024, 390×844, 375×812, in light and dark themes. Batch 5A covers Adviser dashboard/reviews, Admin Documents, Adviser Documents, Admin IERB, Adviser IERB, Admin dashboard, and representative management pills. No horizontal page overflow; local table/chart scrolling is retained. Notification scroll stress is DOM-only presentation testing.

Accessibility: keyboard-opened Actions and review dialogs, arrow navigation, Escape/focus restoration, outside-click close, visible focus, labeled notification scroll region, filter state and viewport containment, and responsive reading order passed. Badges retain textual meaning and semantic color differences.

Browser artifacts:

- Final Batch 5A: `C:\Users\khirz\AppData\Local\Temp\prism-batch5a-IQgxBo` (screenshots and geometry JSON).
- Batch 2: `C:\Users\khirz\AppData\Local\Temp\prism-batch2-ui-21dbJU`.
- Batch 3: `C:\Users\khirz\AppData\Local\Temp\prism-batch3-ui-m6BFdt`.
- Batch 1 screenshots: existing ignored `tests/v10-batch1-results` location.
- Batch 4: `C:\Users\khirz\AppData\Local\Temp\prism-batch4-after-qGie2k`.
- Batch 4.5: `C:\Users\khirz\AppData\Local\Temp\prism-batch45-PMsZVI`.

The initial sandboxed Chrome attempt timed out at `Page.enable`; the isolated harness then ran with approved local escalation. Initial new-test issues were corrected: the shared review dialog uses `.prism-dialog`, and a color parser needed a numeric regular expression. Batch 1 initially had one asynchronous test-readiness failure; its search assertion now waits for a completed empty-result response. Existing assertions for explicitly superseded standalone Review/Search controls were replaced with stricter requested-behavior and alternative-access assertions, not disabled or weakened. All other existing assertions remain.

PHP SYNTAX COUNT: 132 tracked/new PHP files passed.

JS/CJS SYNTAX COUNT: 36 tracked/new executable JS/CJS files passed. Pre-existing ignored scratch fragments and vendor files are outside this executable-file count.

`git diff --check`: passed. Staged diff: empty.

## Explicit boundary verification

- NO schema change: `SCHEMA_VERSION` remains 9; `config.php` is unchanged.
- NO migration change: no migration code, SQL, schema manifest or schema-version tool changed.
- NO bulk document upload: upload inputs, upload controller behavior, `documents_api.php`, filesystem handling, multi-file payloads, partial-success handling, concurrency and versioning code are unchanged. A direct comparison against HEAD confirms the complete Documents upload submit handler is identical.
- NO document workflow semantic change: `workflow.php` and document API are unchanged; 48 workflow/security fixtures pass.
- NO Adviser review permission change.
- NO RPMS submission change.
- NO Admin Override change.
- NO notification persistence change: notification APIs and delivery/persistence files are unchanged.
- NO account-retention semantic change.
- NO permanent-delete verification change.
- NO code-structure reorganization.

## Final git status

```text
 M .gitignore
 M assets/css/prism-ui.css
 M assets/css/prism-workspace.css
 M assets/js/admin-management.js
 M assets/js/adviser-dashboard.js
 M assets/js/documents.js
 M dashboard.php
 M ierbprog.php
 M index.php
 M research_adviser.php
 M tests/document-workflow-audit.php
 M tests/ui-audit.cjs
 M tests/v10-batch1-ui.cjs
?? PRISM_V10_BATCH2_READONLY_UX_REPORT.md
?? PRISM_V10_BATCH3_FILTER_GUARDRAILS_REPORT.md
?? PRISM_V10_BATCH4_5_ARCHIVE_WORKSPACE_REPORT.md
?? PRISM_V10_BATCH4_DOCUMENT_UI_REPORT.md
?? PRISM_V10_BATCH5A_UI_ADVISER_ROUTING_REPORT.md
?? "h -u origin prism-v10-b04-5-archive-workspace"
?? "pace and UI refinements\357\200\242"
?? tests/v10-batch5a-routing.php
?? tests/v10-batch5a-ui.cjs
```

All changes remain unstaged. The `.gitignore` additions only allow the two new Batch 5A regression files to be visible without force-staging. All six pre-existing untracked reports/artifacts remain present. No review/report was committed or staged.

No commit, push, merge, tag, deployment, staging, database migration,
Hostinger modification, production access, or production modification performed.
