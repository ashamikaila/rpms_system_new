# PRISM V10 — Batch 9 Staff Registration Code Report

Implementation and verification performed locally on 2026-10-11, Asia/Manila. This report is unstaged. No production configuration or service was loaded by the test fixtures.

## Checkpoint and worktree

The initial Batch 9 implementation started from Batch 8 (`aaa74486b404455522a8ae4d9b835e44303b40f5`) and created the requested `prism-v10-b09-staff-registration-code` branch without committing. Its original verification is retained below. The user subsequently supplied an existing Batch 9 checkpoint, `5b600d953a7f5dd983858d474914f7ac7a37ee52` (`Add secure Staff Registration Code flow`).

The UI placement correction starts and ends on `prism-v10-b09-staff-registration-code` at that existing `5b600d9` HEAD. No branch, index, or commit was changed during this correction. Twelve existing untracked PRISM reports/contracts were preserved, including this report.

The correction changes only:

- `account.php`: eligible Admin entry with the existing safe status service.
- `admin_people.php`: removes the old entry from both People views.
- `includes/staff_registration_card.php`: adds compact presentation to the existing partial.
- `assets/css/workspace-pages.css`: scoped card spacing matching surrounding account cards.
- `staff_registration_manage.php`: Account navigation context and return link only.
- `tests/v10-batch9-http.php`, `tests/v10-batch9-ui.cjs`: additional placement and identity assertions.
- `tests/ui-audit.cjs`: exact presentation include expansion and isolated status stub for existing UI regressions.
- This unstaged report.

## Final entry placement

Inspected the actual navigation definition in `includes/prism-navigation.php`: the existing **Account & Planning** group contains `['account.php', 'Account & Activity']`. This source mapping, rather than a filename assumption, identifies the production PHP page backing the navigation label.

The only Staff Registration entry/status card now appears on **Account & Activity** (`account.php`), after Profile/Security and before My account lifecycle. It reuses `includes/staff_registration_card.php` in compact mode. The shared state labels are No Current Code, Pending Confirmation, Active, Expired, Consumed, and Invalidated. The account page calls the existing `staff_overview` service and contains no duplicated Staff Code SQL, state normalization, or label mapping.

The card is rendered only after the existing login/legal/security gates, `legal_admin_eligible`, and successful service revalidation of the current Admin. A failed eligibility/status check hides it. Students, Advisers, Pending/inactive accounts, unaccepted Admins, and an Active Admin with incomplete identity receive no card or management link.

**Manage Staff Registration** remains an ordinary keyboard-accessible link to `staff_registration_manage.php`. That dedicated manager retains its full controls and now highlights the existing Account navigation context and returns to `account.php` via **Back to Account & Activity**.

The entry was completely removed from `admin_people.php`, so neither Student Records nor Research Advisers contains it. No Staff Registration sidebar/navbar entry was added; `includes/prism-navigation.php` is unchanged. It is no longer placed under Research Management. The full manager remains the dedicated management route, rather than a duplicate entry card on a second workspace page.

All generation, hashing, one-time plaintext, acknowledgement proof/Confirm Saved, 24-hour validity, invalidation, consumption, transactional registration, public registration, legal-consent routing, lifecycle rules, and frozen v10 schema are unchanged from `5b600d9`. The full-management portion of the reused partial is unchanged.

## Source audit

| Area | Before Batch 9 | Result |
| --- | --- | --- |
| `register.php` | Public form was enabled/disabled by a static configuration constant; fields were Employee ID, name, email, password, confirmation, and code. | Direct public access remains; the form is always reachable, labels are explicit, and a valid database-backed code is required to provision an Admin. |
| `register_process.php` | Compared submitted code with `ADMIN_REGISTRATION_CODE`; checked account fields; inserted an Admin outside a transaction; best-effort activity log; redirected to `login_admin.php`. | Uses the transactional Staff Code service, then a fresh authenticated session and `index.php`. |
| Static authority | `config.php` read a local/environment constant; registration view and processor used it. | All three production references were removed. An externally defined old constant is inert. No old value was copied into the database. |
| Password policy | `security.php::new_password_is_valid`: at least 12 UTF-8 characters, at most 200 bytes. | Same server helper, valid UTF-8, matching confirmation, standard `password_hash`. |
| Email policy | `is_allowed_email_domain`, `allowed_email_domains_hint`, configured `ALLOWED_EMAIL_DOMAINS`. Invitations also have shared onboarding identity helpers. | Same authoritative domain helper and retained-account/profile email checks; no separately hard-coded institutional domain. |
| Identifiers | Employee ID supplies both username and `ref_id`; users have frozen unique username/email indexes. Profiles can retain identities. | Bounded employee ID/username syntax; checks existing username/ref ID, Student ID, Adviser employee ID, email, and retained profiles. Native database uniqueness remains authoritative. |
| Rate limiting | Existing file-backed, locked, fail-closed `consume_auth_attempt`; registration uses eight attempts per IP per 900 seconds. | Retained before code verification, including malformed/wrong code and changed identifiers. No new rate-limit table. |
| Login/session | `login_process.php` regenerates the session and binds a fresh generation to the credential fingerprint. `current_user` checks idle time, Active state, and password fingerprint. | Registration uses the same authentication fields and boundary. Already authenticated browsers cannot create or switch to another account. |
| Request guards | Same-origin POST validation and B5B session-generation markers. | Retained. Management additionally requires a generation marker and a single-use session form nonce on every mutation. |
| Legal routing | `index.php`: password requirement, current legal consent, profile completion, role workspace. | New Admin has no fabricated acceptance evidence and is routed through current legal consent. |
| Admin completion | `onboarding_complete` returns true for an Admin by role. | No Student/Adviser profile or research group is created. Active Admin with a self-chosen password, `must_change_password=0`. |
| Management | People pages manage Students/Advisers, with Admin-specific controls and shared navigation. | The only entry/status card is on Account & Activity under Account & Planning, using the shared partial. No People-page card or Staff sidebar/navbar entry remains; only eligible Admins receive it. |
| Lifecycle | Admin self-archive/self-purge uses ordered Admin locks, explicit password/confirmation, and last-Admin protection. Frozen code FKs use `SET NULL`. | A narrow v10 hook invalidates a Pending creator flow inside that same transaction. Other lifecycle rules remain intact. |
| Activity logging | Public registration used best-effort `log_activity`; onboarding/legal use mandatory transactional audits. | Staff events use mandatory transactional entries containing generation ID, actor attribution, action, and server timestamp only. |

Audited `login.php`, `login_process.php`, `index.php`, `logout.php`, core configuration, security and rate-limit helpers, onboarding/identity creation, Admin People/navigation, account retention/lifecycle, legal-policy actor/population rules, and frozen users/code/acceptance metadata. Gmail/OAuth, Help & Support, invitations, notifications, document workflows, Admin Override, and permanent-delete verification were not redesigned.

## Frozen Staff Code contract

`staff_registration_code` is an InnoDB singleton: primary key `slot`, enforced `slot=1`, unique `generation_id`, nullable `verifier_hash`, five frozen states, nullable creator and consumer references, and creation/acknowledgement/expiry/consumption timestamps. Both user references are `ON DELETE SET NULL`. The table may be empty before first generation.

The existing contract safely supports the implementation. No schema artifact needed modification. `users` and `user_policy_acceptances` retain their frozen definitions and indexes; registration never inserts acceptance rows.

## Static code retirement

Removed the configuration/environment default and explanatory static-code configuration instructions from `config.php`; removed the form's constant-based enablement switch and the processor's plaintext constant comparison.

Former production references were `config.php`, `register.php`, and `register_process.php`. `tests/auth-flows.php` no longer defines the obsolete authority. `tools/verify-auth-visual.cjs` retains a historical, isolated presentation fixture constant; it does not participate in production authorization. Batch 9's HTTP fixture deliberately defines an obsolete synthetic constant and proves that submitting it cannot create an account or change the singleton. Ignored local configuration was not edited or exposed. Its obsolete literal was read only into memory for the private regression and rejected; any old definition there has zero registration authority.

The old snapshot-oriented auth visual tool assumes the pre-B9 registration implementation and is superseded for this changed flow by the source-faithful B9 HTTP/browser suite. Its legacy constant is not imported by application code.

## Code generation and one-time presentation

- Explicit Admin POST only. An eligible, credential-current Admin with current legal acceptance is revalidated under ordered user locks.
- `random_bytes(20)` supplies 160 bits of entropy; the code uses eight groups of five hexadecimal characters. `random_bytes(16)` separately supplies the generation identifier.
- Only `password_hash` output is persisted. There is no encryption or recoverable secret copy.
- The singleton starts Pending, with `acknowledged_at` and `expires_at` NULL. Generation replaces only a terminal or Pending generation. Active codes must first be explicitly invalidated.
- The generating POST response contains the plaintext once and includes Copy Code plus the saved-code warning. It is not carried through a redirect, flash message, session, or GET.
- A single-use form nonce is consumed before generation. POST refresh/replay cannot reveal the prior secret or create another generation. Responses use `Cache-Control: no-store`; `pagehide` removes the immediate secret/proof and a restored history page reloads the safe manager.
- Copy Registration Link is a separate action, using the centralized production public base: `https://www.rpmsceu.online/register.php`. There is no code/token/query/fragment in that link.

## Acknowledgement

The native confirmation form requires “I have securely saved this code.” Server confirmation requires the submitted confirmation value, exact current generation, Pending state, generating Admin, credential/security/legal eligibility, current session generation, current single-use form nonce, and a valid signed acknowledgement proof.

The proof is HMAC-SHA256 protected by a random 256-bit session signing key. Its payload contains generation ID, generating user ID, session-generation context, issue time, and a random nonce. It contains no Staff Code, verifier, password, or signing key. It lasts ten minutes and is supplied only by the immediate successful generation response. The session contains only the acknowledgement signing key and mutation nonce, never the Staff Code or a recoverable derivation of it. Proof/key material is acknowledgement capability and is not logged, emailed, placed in URLs, or used to authorize registration.

Successful acknowledgement sets `acknowledged_at=NOW()` and `expires_at=DATE_ADD(NOW(),INTERVAL 24 HOUR)` in the database transaction. It then redirects to a secret-free GET. Refresh/reopening never reconstructs the proof. If the immediate page is lost or the proof expires, the code remains unusable Pending and the Admin must generate a replacement. There is no Reveal Code or alternate acknowledgement route.

## Code lifecycle

| State | Authority and behavior |
| --- | --- |
| No Current Code | Safe overview; no passive generation. Eligible Admin can explicitly generate. |
| Pending Confirmation | Unusable; no validity clock. Lost plaintext/proof is not reconstructed. Another Admin cannot acknowledge it. |
| Active / Acknowledged | Usable only while the verifier exists and expiry is strictly greater than database server time. Creator need not be online or remain eligible after acknowledgement. |
| Expired | Rejected; safe lazy normalization records expiry and clears the verifier. |
| Invalidated | Explicit confirmed Admin POST, replacement of a Pending flow, or Pending creator departure clears the verifier. Safe generation/audit metadata remains. |
| Consumed | One successful Admin creation records consumer/time and clears the verifier atomically. Reuse is rejected. |

Replacement overwrites the singleton with a new generation and resets all old acknowledgement/expiry/consumption fields. Prior generation events remain in secret-free audit history. No replacement is pre-generated or stored for later revelation.

## Public Admin registration

The public form retains the existing institutional identity fields and PRISM auth presentation, adds explicit accessible labels and public legal links, and never reflects a submitted code into hidden fields, flash errors, successful responses, or browser storage. The Employee ID is the username; no extra username/profile fields were invented.

The service always creates `role=admin`, `status=Active`, and `must_change_password=0`, even if a crafted payload supplies another role/status. It checks the shared password/domain rules and identifier/profile uniqueness. Identity fields cannot contain a copy of the submitted code. Invalid, Pending, expired, consumed, invalidated, malformed, oversized, array, and invalid-encoding codes receive a generic unavailable response. Existing account validation errors do not consume an otherwise valid code.

The processor enforces same-origin POST and the existing IP limiter. An authenticated browser returns to `index.php` before provisioning. Successful anonymous registration regenerates the session ID, resets old session data, creates a fresh login generation, publishes the generation cookie, stores the password fingerprint and authoritative identity fields, and redirects to `index.php`. The existing legal gate then redirects to `legal_consent.php`; no acceptance is fabricated. Native form submissions use `Referrer-Policy: same-origin`, retaining same-origin evidence without sending the page URL to other origins. Login contains no Register/Create Admin/Staff Registration link.

## Transaction and concurrency

Staff services own a `READ COMMITTED` transaction with the existing ordered Admin primary-key locks followed by `SELECT ... WHERE slot=1 FOR UPDATE`. This coordinates with Admin lifecycle and legal governance. Reads under the singleton lock are authoritative; rendered UI state is not authority. Expected generation identifiers reject stale replacement/invalidation/acknowledgement requests.

Registration validates bounded fields, locks the singleton, safely normalizes terminal conditions, verifies via `password_verify`, rechecks retained identities, inserts one Admin, conditionally consumes the same still-acknowledged/unexpired generation, inserts mandatory audit records, and commits. The final conditional consumption reevaluates database time after account insertion. Any account, audit, uniqueness, or late-expiry failure rolls back both account and consumption. Expiry/lost-creator normalization can commit safely on an otherwise rejected attempt.

Native independent connections and readiness barriers cover concurrent consumption, replacement, acknowledgement/invalidation, expiry/registration, duplicate identity submissions, and creator deactivation/acknowledgement. Consumption has exactly one winner and one new user; a loser leaves no partial account or resurrected verifier. A native injected audit failure and a delayed account insert crossing expiry also prove rollback. `READ COMMITTED` avoids a stale-read replacement conflict observed with the newer disposable MariaDB engine while preserving explicit locking and conditional consumption.

## Secret privacy

| Destination | Evidence |
| --- | --- |
| Database | Generated plaintext compared against native code/audit/notification/campaign rows; only a verifier is stored and terminal transitions erase it. |
| PHP session | Controlled HTTP session files inspected after generation and registration; plaintext absent. Only unrelated authentication fields, mutation nonce, and acknowledgement key can persist. |
| URLs/history | Native response links/form actions and registration redirects remain code-free. Browser asserts the separate production link and checks the immediate response's URLs. |
| Activity/error logs | Mandatory fixed audit fields exclude submitted values, verifier, and proof. Exception details/SQL are never returned. Isolated HTTP server log was scanned for the generated secret. Existing unhandled handler logs exception class only. |
| Email/mail log | No mail transport calls are made by Staff Code services; the isolated HTTP fixture creates no mail log. |
| Notifications | No Staff Code notification/campaign is created; native persistent-row scans find no secret. |
| Reports/test artifacts | Test codes and database credentials stay in memory/process pipes. No code is printed in test summaries or this report. Browser profiles are disposable; the one-time UI screenshot hides the code before capture. |

Code generation, acknowledgement, invalidation, expiry, consumption, and Admin registration audit events contain generation ID, actor metadata, action, and database timestamp. Wrong-code attempts can update only the existing rate limiter, apart from legitimate lazy terminal normalization.

## Account lifecycle and existing governance

Pending creator archive/purge atomically invalidates the generation and clears its verifier after the unchanged last-Admin and explicit-confirmation checks. Lazy normalization also handles an externally inactive/missing/ineligible Pending creator. Archive followed by restoration cannot revive the Pending generation. Creator/consumer purge preserves generation/state/time with frozen user references set NULL; Staff Codes do not add a purge blocker.

Acknowledged codes are global and can be consumed after creator inactivity or purge. No creator browser session is needed by the registrant. The current last-Admin safeguard is retained and tested to leave the pending code untouched on refusal.

Existing B6 governance counts active eligible Admins, and separately requires current legal acceptance from the acting Admin. An unaccepted new Admin cannot create/approve/publish legal policy; registration does not alter those rules. The new account enters the active population only on commit.

Help & Support recipient snapshots and notification campaign/recipient behavior are unchanged. A newly registered Admin is not added to old support requests; future requests use the existing active-Admin snapshot. Student/Adviser invitations, profile completion, password reset, and configured institutional domains retain their existing mechanisms.

## Security test matrix

| Case | Result |
| --- | --- |
| Student / Adviser management GET and crafted POST | Denied by real role gates; service also rejects non-Admin actors. |
| Inactive/archived Admin | Session gate denies; service revalidates current eligibility. |
| Active Admin missing current legal acceptance | Routed to legal consent; service denies actions. |
| Cross-origin POST | 403; no mutation. |
| Stale session generation | 409; no mutation. |
| Replayed generation form | 409; no code redisplay/new generation. |
| Missing checkbox/proof, forged/expired proof, wrong generation/context/Admin/key | Rejected; Pending remains unusable. |
| Lost immediate generation page | Reopened page has no plaintext or proof; replacement required. |
| Wrong/missing/malformed/oversized/array/invalid-encoding code | No Admin; no consumption; well-formed wrong attempts preserve the unexpired singleton. |
| Pending / expired / invalidated / consumed code | Rejected; terminal verifier erased. |
| Old configured static code | Rejected despite an explicitly defined obsolete fixture constant. |
| Duplicate email/ID, disallowed domain, weak/mismatched password, missing/invalid fields | Rejected; valid code preserved. |
| Crafted role/status | Forced Active Admin; no non-Admin public creation path. |
| Existing signed-in browser submits registration | Existing identity retained; no second account creation. |
| Concurrent valid submissions | Exactly one successful account and consumption. |
| Audit failure / expiry while account insertion is delayed | Inserted user and consumption rolled back. |
| Pending creator archive / purge / last-Admin refusal | Correct invalidation or unchanged last-Admin refusal; no schema/FK failure. |
| Creator purge after acknowledgement / consumer purge | Global code or consumed history survives with NULL user reference. |
| New Admin legal gate and governance | No acceptance rows; current legal consent required; legal management denied before acceptance. |

## UI and accessibility

The compact Account & Activity card uses the same heading typography, padding, theme variables, and button/focus styles as surrounding account cards. All six statuses are expressed in text. The dedicated manager retains the existing workspace components for safe states and the immediate one-time display. No verifier, password hash, proof details, creator personal data, or consumer personal data is shown in the status overview. Created/confirmed/expiry/consumption times identify Asia/Manila.

Native labelled checkboxes, required form controls, keyboard buttons, explicit screen-reader input names, textual status, live copy/error/success feedback, wrapping metadata/errors, and visible focus are present. Copy failure provides manual-copy feedback. Invalidation explains that the code will no longer be usable and requires explicit server-confirmed submission. Confirmation works with ordinary native POST forms; JavaScript is not acknowledgement authority.

Browser verification covered `1920×1080`, `1366×768`, `1024×768`, `768×1024`, `390×844`, and `375×812`, in both workspace themes. No horizontal overflow was observed for any safe state, the immediate display, or public registration. The theme button, separate clipboard values, exact code-free link, confirmation, and removal of secret/proof after acknowledgement passed. The existing public auth page keeps its established public visual language; no new Login Register link was introduced. External fonts/icons were blocked in isolated browser verification; fallback rendering was used.

## Initial Batch 9 regression and validation

The original implementation checks passed. The placement correction verification is recorded separately below. Earlier failing runs were retained as diagnostics; the successful reruns below are the final results.

| Validation | Final result |
| --- | --- |
| Existing isolated PHP regressions | 30/30 suites passed. |
| Batch 8 Support and research/export privacy | 144 Support assertions and 10 real source-assembly exclusion paths passed. |
| Combined B7/B8/B9 disposable native run | 298 assertions passed, including 26 Batch 8 and 189 Batch 9 assertions; frozen parity. |
| Final B9 native/HTTP run, including actual obsolete local code | 192 Batch 9 assertions passed; 194 with private-instance/fixture checks; frozen parity. |
| Batch 1 browser | 1,280 assertions; zero failures. |
| Batch 2 browser | 1,056 assertions; zero failures. |
| Batch 3 browser | 2,277 assertions; zero failures. |
| Batch 4 browser | 2,368 assertions; zero failures. |
| Batch 4.5 browser, final rerun | 2,073 assertions; zero failures. |
| Batch 5A browser | 959 assertions; zero failures. |
| Batch 5B browser | 284 assertions; zero failures. |
| Batch 6 browser | 750 assertions; zero failures. |
| Batch 7 browser | 403 assertions; zero failures. |
| Batch 8 browser, corrected historical baseline | 682 assertions; zero failures. |
| Batch 9 real HTTP/browser matrix | 481 assertions; zero browser exceptions. |
| PHP syntax | 196 files passed; newly changed helpers/endpoints and People template also checked after their final edits. |
| JS/CJS syntax | 52 files passed. |
| `git diff --check` | Passed. |
| Frozen schema artifact diff | Empty. |
| Git index | No staged changes; HEAD unchanged. |

The original browser total across Batches 1-9 was 12,613 assertions. During the initial implementation, moving the card below the People table resolved four mobile Actions-menu positioning failures. The final correction removes that card from the People template entirely and verifies its new Account placement. The initial Batch 8 run compared the resource-size reduction to the already-refined Batch 8 HEAD; correcting only the historical comparison checkpoint preserved all original assertions and produced zero failures.

The final legacy-code regression parsed only the obsolete literal from ignored local configuration without executing the file or printing its value, then submitted it only to the private fixture. It created no user, did not consume/change the code, and left no new recoverable secret copy.

Evidence is in `tests/v10-batch9-results/native-final.log`, `native-legacy-final.log`, `browser-results.json`, `browser-regression.json`, individual browser logs, and `batch45-final.log`, with PHP/syntax results in `tests/v10-batch7-results`. Raw earlier failures are not relabelled as passing. The final native instance was MariaDB 12.1.2, in a disposable verified private datadir. The B9 screenshot is redacted; it contains no Staff Code.

Representative commands:

```text
python tools/run-batch7-regression.py
C:/xampp/php/php.exe tests/v10-batch8-support.php
C:/xampp/php/php.exe tests/v10-batch8-privacy.php
C:/xampp/php/php.exe tests/v10-batch7-native.php --batch9 --batch8 <portable-MariaDB-bin>
C:/xampp/php/php.exe tests/v10-batch7-native.php --batch9 --only9 --browser9 <portable-MariaDB-bin>
C:/xampp/php/php.exe tests/v10-batch7-native.php --batch9 --only9 <portable-MariaDB-bin>
node tests/ui-audit.cjs --batchN-only
node tests/ui-audit.cjs --batch45-only
```

`--batchN-only` above represents each supported individual Batch 1-8 suite, including 5A and 5B. No migration runner was invoked.

The authentication endpoint fixture now expects B9's fresh authenticated session and canonical redirect; actual verification/transactions are tested separately on native MariaDB and real HTTP endpoints. No security assertions were removed. The Batch 8 resource-size comparison was corrected from mutable `HEAD` to its actual pre-B8 Batch 7 checkpoint (`04dafae`) for both stylesheet baselines; the original reduction bounds and all other assertions are unchanged.

Migration-executing upgrade suites were not invoked. Native tests instantiate only the frozen manifest in a newly created, credential-protected, loopback-only MariaDB datadir and verify `@@datadir` ownership before use. Application fixture connections replace `db()` and never execute migration/bootstrap logic or load installed `config.local.php`. Temporary services and credentials are removed after verification. No production database, email, AI, or hosting service was used.

## Placement correction validation

The final placement was verified against actual source-rendered PHP pages and APIs on the disposable, ownership-verified native v10 fixture. No installed application configuration/database was used.

| Validation | Result |
| --- | --- |
| Batch 9 real HTTP/browser matrix | 1,345 assertions passed; zero browser exceptions. |
| Batch 9 native security/service/concurrency/HTTP | 217 assertions passed; 219 including fixture/ownership checks; frozen schema parity. |
| Existing Batch 4.5 People/archive workspace browser regression | 2,073 assertions passed; zero failures; assertions unchanged. |
| Authentication flow regression | 52 assertions passed. |
| Syntax and whitespace | Five changed PHP files and both changed CJS files passed syntax checks; `git diff --check` passed. |
| Protected-source comparison against `5b600d9` | 19 files unchanged, including all Staff Code services, public registration, legal/lifecycle/security helpers, navigation definition, frozen artifacts, and native security tests/helpers/workers. |
| Existing full-management presentation and assertions | Full-management markup, original HTTP security assertions, and all 15 original browser assertion lines preserved exactly. |
| Git state | No staged changes; existing HEAD `5b600d9` unchanged. |

The expanded browser matrix covers 1920x1080, 1366x768, 1024x768, 768x1024, 390x844, and 375x812, each in light and dark themes. It verifies all six concise Account statuses, exactly one eligible-Admin card, matching account heading typography and padding, no horizontal overflow, actual Tab/Enter navigation with visible focus, the unchanged dedicated management route and Account return link, and absence from both People views and the sidebar. Adviser and incomplete-identity Admin pages render without the card; Student, Pending/inactive Admin, and unaccepted Admin requests follow their existing gates. Native HTTP checks additionally prove that all excluded identities receive no card or management link.

The original one-time-display, acknowledgement, clipboard separation, code-free URLs, public form, and manager status browser assertions still run. The original native security/concurrency suite and all original HTTP security assertions remain unchanged. Screenshot review confirmed natural card spacing and readable textual status in the desktop light and 375px dark views; no Staff Code appears in those Account screenshots.

Correction evidence: `tests/v10-batch9-results/placement-native-browser.log`, `browser-results.json`, `placement-auth-flows.log`, `placement-batch45.log`, `placement-integrity.json`, `account-entry-1920-light.png`, and `account-entry-375-dark.png`. The private MariaDB/PHP services and fixture directories were shut down and removed by the test harness after completion. Syntax checks were run with `C:/xampp/php/php.exe -l` and `node --check`; the native/browser command is the same `--batch9 --only9 --browser9` command documented above.

## Schema proof

`SCHEMA_VERSION = 10` remains in `config.php`. Empty diff verified for:

- `includes/account_lifecycle_schema.json`
- `tools/schema-v10-spec.json`
- `includes/schema_v10_plan.json`
- `includes/schema_v10_seed.json`
- `tools/schema-v10-manual.sql`
- `includes/schema_v10.php`
- `tools/migrate-schema-v10.php`

Native `lifecycle_compare_schema` confirms frozen manifest parity after tests. No application table, column, index, FK, enum, schema version, migration DDL, or v11 artifact was added/changed. No migration was executed. Disposable fixture creation reproduces the existing contract, as required; it is not an application schema upgrade. No B10 feature was implemented; the frozen B6 contract remains the foundation for B10 without introducing a schema change in this batch.

## Explicit confirmations

- Exactly one global current Staff Registration Code slot exists; an empty table represents no generation yet.
- Only an unrecoverable verifier is persisted for the Staff Code.
- Plaintext is displayed once in the immediate generation response and is never stored in database/session, logged, put in a URL, emailed, sent through PRISM notifications, or copied into this report.
- Pending codes cannot register an Admin; their 24-hour clock has not started.
- Confirm Saved is server-authoritative and starts exactly 24 hours of validity.
- Lost pre-acknowledgement plaintext/proof cannot be revealed or reconstructed.
- Expired, invalidated, and consumed codes cannot be reused.
- Successful registration consumes the code transactionally; concurrent registrations have exactly one winner.
- Failed account validation, uniqueness checks, audit persistence, or late expiry cannot consume a code or leave a partial Admin.
- Old `ADMIN_REGISTRATION_CODE` has zero authorization effect.
- Login has no public Register link; direct `register.php` remains reachable and requires a valid acknowledged unexpired code.
- The registration link contains no code/token.
- Staff-Code-created accounts are Active Admins and profile-complete by the existing Admin model.
- Registration fabricates no Privacy/Terms acceptance; new Admins pass current legal consent before workspace access.
- The entry/status card exists only on Account & Activity for eligible Admins, with no People-page duplicate or new navigation link.
- Student/Adviser onboarding, last-Admin protection, Support snapshots, notification lifecycle, password reset, legal governance, and Gmail/OAuth are preserved.
- No B10 implementation/schema change was introduced; the existing frozen contract is retained for subsequent work.
- Production was not accessed or modified.

No commit, push, merge, tag, deployment, database migration,
schema change, Hostinger modification, Google Cloud modification,
production access, or production modification performed.
