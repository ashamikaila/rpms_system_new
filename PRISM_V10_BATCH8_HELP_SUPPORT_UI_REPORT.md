# PRISM V10 Batch 8 — Help & Support and UI refinements

Date: 2026-10-11. Local code-only implementation; all changes and this report remain unstaged.

## Repository checkpoint

Starting branch: `prism-v10-b07-notification-lifecycle`.

Starting HEAD: `04dafaebc98861ac7626d7b19500216dc8319fa5`.

Starting last five commits:

```text
04dafae Add notification lifecycle and campaign history
6890d56 Freeze v10 schema and add legal governance
23e898b Harden sessions and add bulk document uploads
3d32a73 Refine adviser routing and workspace UI
25557f2 Add archived account workspace and UI refinements
```

Starting tracked worktree was clean. Ten untracked reports were present: Batch 2, Batch 3, Batch 4.5, Batch 4, Batch 5A, Batch 5B, Batch 6 report, Batch 6 proposal, Batch 7 report, and schema contract. All ten remain preserved. Batch 7 campaign creation, lifecycle, delivery, ownership, and account-purge infrastructure was present before implementation.

Ending branch: `prism-v10-b08-help-support-ui`.

Ending HEAD: `04dafaebc98861ac7626d7b19500216dc8319fa5` (unchanged).

The requested branch was created from that checkpoint. No commit or staging occurred. The ending worktree listing is recorded below after verification.

## Source audit (reported before implementation)

### Help/navigation

Inspected Student `role_portal.php` and `assets/js/role-portal.js`, Adviser `research_adviser.php`, shared `includes/prism-navigation.php`, onboarding/profile pages, and Admin notification/navigation. Student Help opened an email-oriented modal with a `mailto:` action. Adviser had a mail link. Pending profile completion lacked a dedicated internal Support entry. Both role entries now link to `help_support.php`; profile completion also links there. Guided Help descriptions now describe the internal page and target the actual Student Help link.

### Auth/onboarding and Pending restrictions

Inspected `config.php` login/API guards, `current_user()`, account/onboarding bindings, forced password change, legal gate, session generation, same-origin POST controls, and session browser helpers. Existing password and current-policy requirements precede profile completion. Only the dedicated Help page and exact Help API action allowlist gain the Pending exception. Ordinary documents, IERB, reports, notification center, workflow and Admin routes retain existing gates. Public Privacy/Terms and logout retain their established access behavior.

### Notification campaigns

Inspected `notifications_api.php`, lifecycle and delivery helpers, sender/recipient histories, filters, campaign helper, support enum/category/correlation columns, and purge integration. Frozen v10 already supports `kind='support'`, the seven categories, `reply_to_campaign_id`, recipient identity bindings, independent recipient payloads, and sender history. Ordinary recipient binding deliberately requires completed profiles; a dedicated Support binding is therefore necessary for Pending requesters. It checks authoritative existing profile/account state without relaxing ordinary notification binding.

### Report/AI/export

Inspected AI provider/helpers, document summaries, report generation, PDF reports, CSV export helpers/endpoints, dashboard/research metrics, and generic notification queries. Research paths source research/student/document/IERB data rather than notification bodies. No Support query was added to these paths. Notification listing remains explicitly scoped to personal copies or owned campaigns. Ten actual fixture output paths were also exercised with a private Support sentinel stored in notification tables.

### Research Resources

Inspected the shared resources partial, resource CSS, page CSS and higher-specificity workspace rules. Excess shell padding, row padding/minimum height and grid gaps caused the large footprint. The higher-specificity workspace rules also had to be reduced for the compact rules to take effect. Official resource destinations, images, ordering and native details/summary controls remain intact.

### Stage/Calendar dashboard

Inspected Admin/Student dashboard markup, overview CSS, existing Stage/Year controls, Calendar and IERB grid placement. `align-items:start` and a natural-height Stage pipeline left a short panel beside Calendar. Stretching the paired panels and allowing the existing Stage cards to fill the panel addresses the empty region. Existing Stage counts, Year behavior and IERB source data remain unchanged.

### Public legal and legal consent UI

Inspected public legal renderer, `privacy.php`, `terms.php`, `legal_consent.php`, policy CSS, theme controls, logo asset and Login background. Text/link header controls and a small contained logo made the header weak. A body-height background image caused long legal documents to enlarge the image excessively. Legal publication and acceptance are independent of the presentation changes.

### Recent Notifications panel

Inspected Adviser dashboard grid/panel/list wrappers and breakpoints. The flex child had `max-height:640px`, preventing it from using the height available beside Documents to Review. Desktop now lets the list fill available panel space; stacked/mobile layouts retain a bounded, usable scroll area.

## Help & Support implementation

Main files: `help_support.php`, `help_support_api.php`, `includes/help_support.php`, `assets/js/help-support.js`, `assets/css/help-support.css`; existing notification composer/history and auth helpers are integrated directly.

- Allowed request roles: Active Student and Research/Capstone Adviser with an authoritative, unarchived profile binding, including Pending/incomplete profiles. Admin cannot use this request form.
- Gate order remains authenticated/current identity and valid account, required password change, current Privacy/Terms acceptance, then the narrow Support exception. Normal profile completion is still required for workspace access.
- Categories are exactly: Ask RPMS Staff; Report a Problem; Account/Access; Document/Submission; IERB Progress; Technical Issue; Other. The server validates the allowlist.
- Subject limit is 255 characters, matching the existing schema; message limit is the existing composer's 600 characters. Required fields, encoding, control characters, malformed IDs and oversized values are rejected. Text is escaped or assigned using `textContent`; no user HTML is interpreted.
- Browser-provided sender, recipients, category mutations during response, or reply correlation are rejected as unexpected fields. Server-side authenticated identity and database records determine authority.
- Submission runs in one transaction. The server locks/selects currently Active Admin accounts, uses the Batch 7 campaign helper once, and writes an independent in-app recipient copy for each eligible Admin. Existing Admin notification identity validity checks still apply.
- Zero Active Admins produces a clear error before a campaign exists; rollback prevents partial copies or fake success. The UI retains category/subject/message on errors.
- Admin membership is a submission-time snapshot. List/read operations never add recipients, and later activation/creation does not deliver old requests.
- Support is created as existing `Sent`/in-app available state, with `sent_at`; browser presentation says available in PRISM. No external delivery records or fake emailed labels are created. Support creation never calls a mail transport. Worker and low-level delivery helpers also explicitly skip Support.
- A busy guard and disabled send button prevent rapid repeated UI sends. A session-bound token is rotated only after successful commit; replays are rejected. Normal validation/zero-Admin failures retain the usable token and draft. PHP session serialization protects concurrent duplicate posts in that session. This adds no new database/idempotency schema or institutional message policy.
- My Requests and Support Responses use existing pagination, filters and archive/restore/delete presentation. Compact cards show metadata and open literal content in details. Pending response listing is restricted to its exact recipient identity and Support correlation; unrelated notifications and counts cannot leak through this API.

### Admin response and correlation

Admins locate requests using the existing Support kind filter. Their own recipient detail shows sender, category, subject, message and time, with Respond. The existing Admin composer enters Support response mode; it does not accept a browser-selected recipient or category.

The server requires the responding Admin's retained, nondeleted original Support Request recipient copy. It resolves the original campaign's sender and rechecks their current Active/unarchived profile state. The response is a new campaign created by the Batch 7 helper with `kind='support'`, original category and `reply_to_campaign_id` set to the original campaign ID, plus one independent Support Response copy for that requester. Pending requesters are eligible under this specific binding. Correlation is metadata, without chat/transcript/assignment semantics.

Any Admin retaining its own request copy can respond; multiple Admin responses remain independent messages. Deleting one Admin's copy revokes that Admin's response access without revoking another's. Requester sender-history deletion does not erase other Admins' retained copies or their response authority while the requester remains eligible. A purged or unavailable requester cannot receive a response.

### Lifecycle integration

Existing Batch 7 locks, ownership checks, read/archive/restore/delete transitions and body erasure are reused. The Student sender exception is limited to that Student's owned Support campaign; ordinary sender history remains unavailable to Students. Dedicated Support transitions first enforce request/response scope, then call the lifecycle helper. An archived item can be restored; deleted content is not reconstructed from a campaign or another recipient. Sender deletion and recipient deletion remain independent. Scheduled cancellation, Sending protection, worker and ordinary campaign behavior are retained and regression-tested.

## Support privacy

- Request and response bodies remain in existing campaign/copy storage only while permitted by the existing lifecycle rules.
- No Gmail, PHP mail, fallback delivery or external support provider is used. Transport doubles recorded zero Support mail calls, including accidental worker/low-level invocation. Since Support skips the transport/fallback, it adds no Support body or subject to `mail.log`.
- Audit entries contain action, actor, IDs and `support` kind only. Error logs use fixed content-free messages; exceptions are not logged with user bodies.
- AI, document summaries, research reports, exports and metrics do not ingest Support content. Sentinel tests inspect actual successful/fallback outputs, not just source comments.
- Existing account-purge behavior is unchanged: purged requester recipient copies cascade; sender history is erased/nullified; unrelated Admin copies survive. Purging a responding Admin erases its sender content and its own recipient copies without recovering deleted content or deleting other recipients' retained copies. Native frozen-v10 FK/purge checks passed.
- HTML-like subject/message input remains literal, including long content in mobile dialogs. No attachments, HTML rendering or content-bearing analytics were added.

## UI fix 1 — Research Resources

Measured from the same isolated rendered pages using committed HEAD CSS as baseline and final CSS as comparison, in both themes:

| Viewport | Previous shell height | Final shell height | Reduction |
| --- | ---: | ---: | ---: |
| 1920×1080 | 303.30 px | 211.30 px | 30.3% |
| 1366×768 | 303.30 px | 211.30 px | 30.3% |
| 1024×768 | 303.30 px | 211.30 px | 30.3% |
| 768×1024 | 287.30 px | 215.30 px | 25.1% |
| 390×844 | 375.30 px | 263.30 px | 29.8% |
| 375×812 | 375.30 px | 263.30 px | 29.8% |

The approximately 30–40% target is reached at its lower end on desktop and closely on phones; the tablet result is 25.1%, preserving readable controls. Removed excess padding and gaps without removing IERB, SDG or Research Agenda resources or changing their official image/link/content. Equal stacked rows and native keyboard accordion expansion remain tested. Desktop controls remain at least 44 px; phone resource summaries retain 60 px minimum height.

## UI fix 2 — Stage/Calendar space

The paired desktop grid now stretches Stage and Calendar to equal panel height. The existing four Stage cards remain a 2×2 layout and fill available space instead of leaving a large unused lower region. At 1920×1080 the measured Stage and Calendar heights both equal 510.73 px. No extra metrics or placeholder data were invented.

At the existing 1200 px breakpoint, panels stack with natural height. Year distribution retains its existing single-column/natural behavior. IERB Progress Monitor remains full-width below the pair (1765 px measured at 1920), rather than being squeezed into the unused Stage area. Desktop/tablet/phone widths and both themes passed overflow/placement checks.

## UI fix 3 — Legal header

`includes/legal_header.php` provides consistent public Privacy, Terms and consent presentation. Back to Login/PRISM is a styled native anchor, preserving JavaScript-disabled navigation and role routing. Pending Support uses Back to profile setup. The redundant underlined PRISM text link is removed. Branding uses the existing PRISM/CEU logo, with larger 196×76 px presentation and CSS framing of the transparent padding rather than a replacement image.

Text Theme is replaced with compact sun/moon SVG controls. SVGs are decorative; the button has a dynamically updated accessible name/title describing the target mode. Native keyboard button operation and both themes were tested. Consent checkboxes, policy snapshot/acceptance fields and published legal rendering remain unchanged. Actual JavaScript-disabled legal navigation was tested by disabling script execution in Chrome.

## UI fix 4 — Legal background

`assets/css/auth-background.css` shares the Login campus image (`assets/images/ceu_bg.png`), original purple/pink overlay and shared radial glow across Login, public policies, consent and Support. A fixed viewport pseudo-element uses centered `cover` framing, independent of document height. This prevents long legal pages from enlarging the image based on their entire document height. The layer is noninteractive and behind content; cards, theme contrast and scrolling remain readable. Framing/glow, long-document behavior and overflow were checked across the six sizes in both themes. Public policy access remains public and does not invoke authenticated login gates.

## UI fix 5 — Recent Notifications

The desktop Adviser list now uses `flex:1`, `min-height:0`, `max-height:none` and internal vertical scrolling inside the available panel. At 1920×1080 the panel measured 820.98 px, and the list used 714.55 px, ending at the panel's existing 21 px padding/border. The obsolete 640 px cap is removed. Long history remains internally scrollable; content and controls do not overflow.

On stacked/mobile layouts the existing bounded 360 px maximum remains. No read/unread, bell, recipient binding, count, filtering or lifecycle semantics were changed to obtain the height fix.

## Security matrix

| Case | Result |
| --- | --- |
| Pending Student / Pending Adviser | Request and own response access permitted after required gates |
| Complete Student / complete Adviser | Support permitted with ordinary security gates |
| Admin request form/API | Denied; Admin response uses existing composer |
| Active Admin snapshot | All currently eligible Active Admins get independent copies |
| Later Admin activation | Old requests do not acquire a new copy |
| Zero Admin | Rejected, transaction leaves no new campaign/copy; draft retained |
| Crafted recipient/sender/category/reply | Rejected; no client recipient/correlation authority |
| Cross-origin mutation / wrong method | Rejected by existing POST/same-origin controls |
| Missing/stale rendered generation | Rejected on Support reads and writes and response context/send |
| Forced password / missing current legal acceptance | Help exception cannot bypass these gates |
| Archived/inactive account or invalid profile | Rejected |
| Another user's request/response | Not found/denied by object ownership |
| Admin's deleted request copy | Cannot respond; another retained Admin copy remains usable |
| Duplicate successful send token | Rejected; busy guard issues one POST |
| Invalid UTF-8 / empty / oversized / controls | Rejected; literal HTML-like valid text is safe |
| Pending ordinary notifications/documents/IERB/reports | Still blocked |

## Verification and regression results

Tests use isolated SQLite/PDO fixtures, actual extracted auth/API code, mocked browser APIs and a fresh private MariaDB instance. Browser templates never load installed `config.php`; remote requests are blocked. No installed application database or production service was accessed. Native test tables are fresh fixtures built from existing frozen metadata, not an application migration. Historical migration tests were deliberately not invoked because this batch forbids migrations.

- Support functional/security/no-email/lifecycle: **144 checks passed**, `php tests/v10-batch8-support.php`.
- Support privacy: **10 actual output paths passed**, `php tests/v10-batch8-privacy.php`: AI summary success and full-fallback output, Progress/Student PDF reports, three CSV exports, IERB CSV, distribution and list/metrics.
- Private MariaDB 10.4.32: **61 existing lifecycle checks + 109 native assertions passed** on the final run, `php tests/v10-batch7-native.php --batch8`. Native total includes **83 Batch 7 + 26 Batch 8** assertions; the earlier run recorded 110, because conditional race-winner checks vary with the actual winner. Exercises real locks/races, FK ownership, purge, authoritative Support snapshot, Pending responses, partial legal reacceptance, independent multi-Admin approval and sole-Admin approval. Frozen schema parity checked afterward.
- Existing backend regression runner: **30 suites passed**. Includes auth/session/onboarding, CRUD/research groups, document workflow, PDF/DOCX validation, Adviser routing, reports/CSV/metrics, security, account lifecycle, notification ownership/filters/schedules and metadata mail fallback. Batch 7 API suite alone passed 213 checks; lifecycle suite passed 61; mail MIME/log/escaping suite passed 41.
- Batch 8 browser UI: **682 checks passed**, covering request/response flows, Admin existing composer, privacy/literal content, draft retention/duplicate busy state, generation headers, keyboard accordion/dialog/Escape/focus, all five layout fixes, actual script-disabled legal navigation, six viewports and both themes. The final three checks also verify literal response reading, phone viewport fit and focus return in a complete Student's ordinary Notification Center, reusing PRISM's existing read-only dialog styling.
- PHP syntax: **189 files passed**. JS/CJS syntax: **50 files passed**.
- `git diff --check`: passed (only configured LF→CRLF informational notices). Staged diff: empty.

Browser regression counts are recorded in the final results appendix. Early runs exposed obsolete assertions tied to the intentionally replaced email modal, 10 px resource gaps, and 640 px notification cap. They were rewritten to verify the required internal Help navigation, equal compact resource rows and real available-height scrolling. No ownership/security/content/accessibility assertion was removed. Fixtures also gained the exact Help presentation/API boundary; production bootstrap remains forbidden. The browser harness now actually disables JavaScript for those checks and sends correct native key codes for Enter/Escape. Two early successful functional runs encountered Windows-locked temporary Chrome profiles during cleanup; the harness now reports retained locked profiles separately from test failures while preserving its checked temporary-directory boundary.

Generated local screenshots, geometry and output logs are in ignored `tests/v10-batch8-results/`; they are evidence artifacts, not staged source. Earlier report/artifact files were preserved.

## Frozen schema proof

`config.php` still declares `const SCHEMA_VERSION = 10;`. Its diff only adds the narrow Help route/action profile exception. No table, column, index, foreign key or enum was added or changed. No migration was run; no schema-v11 was created.

`git diff --exit-code` passed for:

```text
includes/account_lifecycle_schema.json
tools/schema-v10-spec.json
includes/schema_v10_plan.json
includes/schema_v10_seed.json
tools/schema-v10-manual.sql
includes/schema_v10.php
tools/migrate-schema-v10.php
```

Native fixture inventory after Support/purge/legal operations also matched the existing frozen contract. Byte/blob verification is included in the ending evidence. No production schema or local installed database was modified.

## Explicit confirmations

- Student and Adviser can submit internal Help & Support requests.
- Pending Student/Adviser can use Support only after required password and current legal gates; ordinary workspace access remains blocked.
- Every currently eligible Active Admin receives an independent copy at submission time. Later-created/activated Admins do not receive old requests.
- Zero Active Admin safely rejects the request without partial creation.
- Support requests and Support Responses are **in-app only**, with no Gmail/PHP mail or body-bearing fallback/log entry.
- No attachment, chat/thread, SLA, assignment, priority or external-provider system was added.
- Admin responses use existing PRISM composer/campaign behavior, with server-resolved requester and correlation. Pending requesters can read only their own Support Responses under the narrow exception.
- Support bodies are excluded from AI/research reports/exports/metrics and audit details.
- Support lifecycle uses existing Batch 7 archive/restore/delete and purge rules.
- Research Resources is significantly more compact, preserving resources and keyboard accessibility; measured tablet reduction is transparently reported above.
- Stage/Calendar uses its desktop space; IERB remains full-width; Year and mobile layouts retain natural behavior.
- Privacy/Terms/consent use native Back buttons, accessible theme icons and cleaner larger branding without the redundant underlined text.
- Privacy/Terms/consent share Login's viewport framing/glow and avoid long-page image zoom.
- Recent Notifications fills its available desktop panel height and retains usable mobile scrolling.
- No B9 schema prerequisite was introduced: the existing frozen v10 Support-ready structures suffice for this implementation.
- Privacy/Terms publication/acceptance governance, account retention, permanent-delete rules, upload formats, routing/workflow semantics and Gmail/OAuth design were not redesigned.
- Production was neither accessed nor modified. No Hostinger or Google Cloud access/modification occurred.
- No commit, staging, push, merge, tag, deployment or application migration occurred.

## Final browser results and ending worktree evidence

All applicable Batch 1–7 browser suites completed with zero failures and exit code 0:

| Browser suite | Checks |
| --- | ---: |
| Batch 1 | 1,280 |
| Batch 2 | 1,056 |
| Batch 3 | 2,277 |
| Batch 4 | 2,368 |
| Batch 4.5 | 2,073 |
| Batch 5A | 959 |
| Batch 5B | 284 |
| Batch 6 | 750 |
| Batch 7 | 403 |

These were run as `node tests/ui-audit.cjs --batch1-only` through the corresponding `--batch7-only` flags (including `--batch45-only`, `--batch5a-only` and `--batch5b-only`). Batch 2 verifies the new internal Help page entry and guidance; Batch 4 verifies equal resource rows with the new 8 px gap; Batch 5A verifies the notification list can scroll within its actual available parent height. All original unrelated requirements remain asserted.

Together with Batch 8, the browser suites passed **12,132 checks** with no final failures. The newly added ordinary Student center test initially exposed a mock response containing the request fixture body; its fixture now contains the actual response body, and the final 682-check run passes. No production authorization or content assertion was weakened to address fixture failures.

Final native output is saved at `tests/v10-batch8-results/native.log`; Support/privacy output is in `support.log` and `privacy.log`; final Batch 8 browser output is in `browser.log`. Backend/syntax details remain in `tests/v10-batch7-results/regression-results.json` and `syntax-results.json`.

The following Git blob IDs are identical for committed HEAD and the working copy, checked with `git rev-parse HEAD:<path>` and `git hash-object --path=<path> <path>`:

| Frozen artifact | Identical blob ID |
| --- | --- |
| includes/account_lifecycle_schema.json | `2c1036078a06e5cda1c14d3f4ca4fe722703c80c` |
| tools/schema-v10-spec.json | `7b43e897edfc09936c15241ca366aaad002903a7` |
| includes/schema_v10_plan.json | `011e94d85fd8521d8dc47448f20695107289a655` |
| includes/schema_v10_seed.json | `fd29dc62d612fdf8c82f75bb9e0e375e314e1db1` |
| tools/schema-v10-manual.sql | `be9507520ec2bb0eb6e8fc8efb58b1a553613bb2` |
| includes/schema_v10.php | `bbd039f878c3e77629576667e109cc2757b692ae` |
| tools/migrate-schema-v10.php | `c2fdf3d9bcb25d1e29cecf71915de70cc228ea8e` |

Git's status cache lists `tests/v10-batch7-api.php` as modified, but `git diff --numstat -- tests/v10-batch7-api.php` and its content diff are empty; no change to that suite remains. The final status listing below reproduces Git's output without altering the index.

Ending branch: `prism-v10-b08-help-support-ui`. Ending HEAD: `04dafaebc98861ac7626d7b19500216dc8319fa5`. Index/staged diff: empty.

Ending `git status --short`:

```text
 M .gitignore
 M admin_notifications.php
 M assets/css/dashboard-overview.css
 M assets/css/prism-workspace.css
 M assets/css/public-legal.css
 M assets/css/research-resources.css
 M assets/css/style.css
 M assets/js/admin-notifications.js
 M assets/js/notification-history.js
 M assets/js/prism-guidance.js
 M assets/js/role-portal.js
 M complete_profile.php
 M config.php
 M includes/notification_delivery.php
 M includes/notification_lifecycle.php
 M includes/prism-navigation.php
 M includes/public_legal.php
 M legal_consent.php
 M notifications_api.php
 M role_portal.php
 M tests/archive-operational-audit.php
 M tests/document-workflow-audit.php
 M tests/research-group-audit.php
 M tests/ui-audit.cjs
 M tests/v10-batch2-ui.cjs
 M tests/v10-batch4-ui.cjs
 M tests/v10-batch5a-ui.cjs
 M tests/v10-batch6-template.php
 M tests/v10-batch7-api.php
 M tests/v10-batch7-native.php
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
?? PRISM_V10_SCHEMA_CONTRACT.md
?? assets/css/auth-background.css
?? assets/css/help-support.css
?? assets/js/help-support.js
?? assets/js/legal-theme.js
?? help_support.php
?? help_support_api.php
?? includes/help_support.php
?? includes/legal_header.php
?? tests/v10-batch8-native.php
?? tests/v10-batch8-privacy.php
?? tests/v10-batch8-support.php
?? tests/v10-batch8-template.php
?? tests/v10-batch8-ui.cjs
```

No commit, push, merge, tag, deployment, database migration,
schema change, Hostinger modification, Google Cloud modification,
production access, or production modification performed.
