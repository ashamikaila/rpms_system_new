# PRISM v10 — Batch 10.5 persistent permanent-deletion verification

Implemented locally on 2026-10-11 (Asia/Manila). Security-critical code/evidence update against unchanged frozen database schema v10. No installed configuration was enabled. All changes and this report are unstaged.

## A. Starting checkpoint

| Check | Starting result |
| --- | --- |
| Branch | `prism-v10-b10-final-document-workflow` — expected base |
| HEAD | `af29293e4a26a8eb231dc44faa573d31781661e1` |
| Source version | `const SCHEMA_VERSION = 10` |
| Index/tracked worktree | Clean before edits |
| Existing local files | Thirteen untracked reports/contracts; preserved |
| Batch 10 | Incorporated **and committed**: HEAD subject is `Complete v10 Batch 10 document workflow and Admin UI fixes` |

Batch 10's workflow helper, approval/Return/version-history paths and native/HTTP tests are present. This establishes source incorporation, not deployment. Its earlier untracked report describes a precommit checkpoint; current Git HEAD is authoritative. No applicable AGENTS.md was found in the repository/checked parent locations. No subagents were used.

Starting `git status --short`:

```text
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
```

## B. Existing verification architecture and source audit

The starting audit was reported before implementation. Production chain: `config.php` → protected local constants → schema verifier → availability/API → lifecycle/purge/recovery services.

| Required audit question | Starting behavior |
| --- | --- |
| 1. Evidence generation | `tools/verify-account-lifecycle-schema.php` loads identity/schema helpers only, reads operator DB environment, starts a read-only transaction, calls an explicit global/scoped generator, rolls back, and emits two PHP definitions. No application bootstrap, seed or migration. |
| 2. Storage | Operator installs `PRISM_HARD_DELETE_SCHEMA_VERIFIED` and `PRISM_HARD_DELETE_VERIFICATION` in protected `config.local.php`, loaded before defaults. Missing evidence/gate disables deletion. `.htaccess` denies public access to local config, storage, tests, tools and reports. |
| 3. Authentication/binding | Version 2 is **not cryptographically signed**. Authenticity relies on trusted operator access to protected PHP config. It binds exact manifest SHA-256, database name, server hostname/port/server ID/version, mode and assurances; boolean alone is insufficient. Scoped evidence additionally binds visibility. There was no independent release-code fingerprint/installation authenticator. |
| 4. Expiration enforcement | `lifecycle_verification_evidence()` creates `issued_at` and `expires_at=issued_at+86400`. `lifecycle_verify_schema()` requires integer dates, checks future issue time, exact 86400-second interval, and `expires_at>time()`. CLI/docs advertise 24 hours/enabled windows. |
| 5. Generation invariants | Global generator requires direct global SELECT/TRIGGER; no fallback. Exact manifest table engines, ordered columns/types/nullability/defaults/keys/extras, indexes/uniqueness/ordered components, schema-qualified FK targets and DELETE/UPDATE rules, PRISM triggers/schema version; all 367 additional frozen-v10 constraint checks. Scoped generator adds explicit hidden-dependency exclusion and full visible metadata/grant assessment. Old generation did not explicitly test session FK enforcement; runtime did. |
| 6. Availability invariants | Evidence/mode/date/hash/DB checks; scoped live visibility equality; session `foreign_key_checks=1`; exact live manifest inventory and v10 checks. Global runtime did not repeat direct SELECT/TRIGGER visibility assertions. |
| 7. Destructive-boundary invariants | Admin `lifecycle_execute()`, Student/Adviser `retention_purge()` and `retention_recover()` independently call `lifecycle_verify_schema()` under `prism_migrate` before destructive work. Actor/password/account-state/retention/workflow/row locks/audit/quarantine remain separate. Bulk enters `retention_purge()` per eligible destructive target. |
| 8. Cross-deployment replay | Different recorded DB/server/manifest rejects evidence, but another application using identical recorded DB/config could reuse it; no cryptographic installation separation existed. |
| 9. Schema/manifest changes | Changed manifest hash fails. Live inventory detects missing/changed columns/indexes/FKs/rules and extra tables/dependencies/triggers/constraints with unchanged evidence. Scoped grant/visible-metadata changes fail its fingerprint. Hidden state remains operationally excluded. |
| 10. Frozen-v10 feasibility | Adapt the existing protected-config model using a versioned authenticated artifact and installation key; no DB evidence table/schema changes required. |

Scoped visibility uses SHOW GRANTS, SHOW DATABASES, visible tables, independent FK components and referential rules, and visible triggers. Every visible application schema needs direct schema-wide SELECT/TRIGGER; table/column-only or unrecognized inherited-role grants are insufficient. Unresolved FK rules, visible cross-schema PRISM FKs and all visible application triggers are rejected. `complete_visibility=false`; inaccessible schemas are not claimed verified. Global operator verification retains its original global privilege prerequisite.

Audited dependencies: `includes/account_identity.php`, `account_lifecycle.php`, `account_retention.php`, `account_retention_bulk.php`, `account_purge_files.php`, `account_lifecycle_schema.php`/JSON; frozen v10 validator/plan; lifecycle API; Admin account/shared Student/Adviser management and archive wrappers; account/management/retention/lifecycle-form scripts; config/local override integration and access controls; CLI verifier; operator and historical phpMyAdmin/manual migration procedures; lifecycle/retention/scoped/HTTP/concurrency/security and current v10 regressions. Local configuration definition **names only** were inspected; secrets were not printed, changed or executed.

Searches/tracing covered issue/expiry/age/86400 logic, manifest/database/visibility fingerprints, metadata, gates and caches. Password reset/invitation/staff-code lifetimes, sessions, bulk preview/checkpoint TTLs and purge recovery journals are separate and unchanged. Bulk retry caches return already committed outcomes; they do not authorize a new destructive target without its verifier.

## C. Implementation

Version 3 adds `validity_policy=deployment_invariants`, `verification_contract_sha256` and an HMAC-SHA256 `authenticator`. It retains manifest/database/server/mode/assurance/scoped visibility bindings and informational integer `issued_at`. No expiry field, age comparison, renewal job or cross-request validation cache exists.

`lifecycle_verification_key()` requires a unique random 256-bit installation key represented by 64 lowercase hex characters. Application defaults are disabled gate/empty evidence/**empty key**. A technical operator separately installs `PRISM_HARD_DELETE_VERIFICATION_KEY` in protected configuration. CLI receives the matching key as `PRISM_SCHEMA_VERIFY_KEY` through its process environment and never emits it or the DB password. No installed local key/evidence/configuration was enabled or changed.

`lifecycle_authenticate_evidence()` signs JSON of all fields except the authenticator. Validation checks explicit version/authenticity before trusting fields, then checks exact field inventory, policy, manifest/contract/DB binding and mode-specific conditions. Missing/truncated/corrupt/unauthenticated/unsupported evidence, signed mismatches, unknown fields and legacy expiry fields fail closed. Positive integer `issued_at` validates format; it is never compared with the clock.

The contract fingerprint hashes exact bytes of `includes/account_lifecycle_schema.php` and, for v10, `includes/schema_v10.php` and `includes/schema_v10_plan.json`. Manifest SHA-256 is independent. Format, bound-file, manifest, DB/server, key and protected live metadata differences invalidate proof. Unrelated CSS/text outside those files does not affect the fingerprint. This is not a whole-application-tree fingerprint; operator review remains necessary for protected operational assumptions that metadata cannot observe.

Both global generation and runtime now additionally use the existing visibility checker. Global operator grants remain mandatory; scoped web grants remain supported, but every application schema visible to the web account needs direct SELECT/TRIGGER visibility. No fallback is added. Scoped evidence still requires exact live assessment equality and `complete_visibility=false`. Generation now also requires FK enforcement; runtime keeps its enforcement check and every existing schema constraint.

Actual deletion, bulk targets and recovery retain their independent verification calls/advisory and row locks. Account-specific retention, grace, Hold, workflow, current actor/password/confirmation, audits, history and recoverable quarantine are untouched.

Availability success: **Permanent deletion available. Each account must still meet retention and eligibility requirements.** Verification/DB refusal is logged to protected server logs, while browser/API output is only: **Permanent deletion is unavailable because deployment verification is required. Contact the system operator.** Loading/network-error copy on management and Admin self-deletion is consistent. Account-specific blocks remain distinct.

Legacy v1/v2 is rejected even if unexpired. After separately authorized deployment, one new operator verification with the installation key establishes v3 evidence. No periodic renewal thereafter. Updated operator instructions retain local PHP/Remote MySQL/File Manager installation without assuming server SSH/root. phpMyAdmin/manual observations cannot create authenticated proof or bypass the verifier. No production access/config installation is authorized or performed here.

## D. Security analysis

- **Authenticity/integrity:** Complete evidence is HMAC-SHA256 authenticated; `hash_equals()` compares authenticators/hashes. Unknown versions/fields/legacy expiry fields fail. A boolean cannot substitute for proof and live checks. The trusted PHP artifact remains protected by existing config access controls; it is not an independently issued database certificate.
- **Replay/deployment binding:** Different installation keys reject copied evidence, in addition to manifest/contract/database/server checks. Deliberately cloning the secret and all recorded identity fields defeats installation separation. Unique keys and protected config/environment are essential; key rotation revokes prior evidence.
- **Drift/visibility:** Exact inventory/all frozen constraints remain authoritative. Both modes require live direct SELECT/TRIGGER visibility and reject unexpected visible triggers/cross-schema dependencies; scoped assessment also must equal its recorded fingerprint. FK checks must equal 1 at generation/runtime.
- **Boundary/concurrency:** Availability is advisory. Purge/Admin self-deletion/recovery independently verify under `prism_migrate`, then preserve current actor/password/account locks, safeguards, audit and files. Bulk validates each destructive target. Browser/request fields and stale responses cannot override this gate.
- **Errors:** Evidence/key/format/binding/schema/metadata/DB/FK failures disable deletion before mutation. HTTP tests assert sanitized refusal. Existing authentication/origin/legal/session guards remain authoritative.
- **Hosting limits:** Scoped metadata cannot rule out hidden incoming CASCADE/SET NULL relationships, external trigger/definer writes or uncoordinated DDL. Continuous operator/provider isolation and schema-change exclusions remain necessary. Arbitrary external DDL ignores the application advisory lock. Hidden RESTRICT references retain existing FK refusal/rollback behavior. No stronger claim of invisible-server verification is made.
- **Residual trust:** A compromised key/config/application runtime can defeat same-application HMAC. Existing DB/server identity fields are preserved; a clone deliberately reproducing those fields and the secret is indistinguishable. No new blind trust, authorization cache or static enable switch is introduced.

## E. System impact

All components preserve frozen v10. Production retention/lifecycle mutation, document/Override/Staff/legal/notification/Support implementations are unchanged.

| Every changed file/component | Existing → new behavior; dependencies/deletion/other-workflow impact; regression risk |
| --- | --- |
| `includes/account_lifecycle_schema.php` | Trusted expiring v2 → authenticated persistent v3/contract/key/global live visibility. CLI, availability, every purge/Admin delete/recovery use it. Missing key/legacy evidence intentionally disables deletion; no account eligibility changes. Security-critical gate. |
| `config.php` | Adds empty installation-key default beside false/empty gate defaults; local override integration/version unchanged. Separate operator key installation necessary; no automatic enabling. |
| `tools/verify-account-lifecycle-schema.php` | Requires private key environment; signs v3 and describes persistence. Read-only/no-bootstrap/no-key/password-output retained. Checkout/key must match deployment. |
| `ACCOUNT_LIFECYCLE_OPERATOR_VERIFICATION.md` | Replaces expiry/window renewal with v3 trust/installation/transition/current-v10/hosting limits. Historical lifecycle notes retained, migration actions marked outside this batch. Operators maintain continuous exclusions. |
| `admin_people.php`, `account.php` | Loading status uses permanent-deletion availability. Selectors/endpoints/account eligibility unchanged; copy-only risk. |
| `assets/js/admin-management.js`, `assets/js/account.js` | Loading/network-error wording directs Admin to operator. Server result still gates controls; account safeguards unchanged; copy-only risk. |
| `tests/account-lifecycle-mysql.php`, `tests/account-retention-mysql.php`, `tests/v10-batch6-mysql.php`, `tests/v10-batch7-native-fixture.php` | Existing generation fixtures receive synthetic test-only key, never a production default. Compatibility-only; migration-dependent suites not executed. |
| `tests/account-lifecycle-worker.php` | Supplies synthetic/injectable key to private worker. No production path. |
| `tests/account-lifecycle-http.php`, `tests/account-retention-http.php` | Private HTTP config includes matching synthetic key; legacy/modified evidence remains rejected. Expiry-edit test accurately described as tampering. Fixture-only. |
| `tests/account-lifecycle-shared-hosting.php`, `tests/account-retention-verification.php` | CLI fixtures provide key; assert absent expiry, retain legacy/future/extended edits as invalid evidence and every original safety scenario. No security test deleted. |
| `tests/v10-batch45-security.php` | Expected operator diagnostics captured privately and asserted; exact sanitized refusal asserted. Harness no longer treats required logs as unexpected stderr; checks strengthened. |
| `tests/v10-batch7-native.php` | Adds B10.5 matrix/HTTP flags. Fresh frozen-v10 construction, owned datadir checks/shutdown/cleanup unchanged; no migration invocation. |
| `tests/v10-batch105-native.php` (new) | Real MariaDB evidence/time/authenticity/binding/schema/visibility/API/actor/retention/purge matrix and metrics. Disposable mutations restored and exact manifest rechecked. |
| `tests/v10-batch105-worker.php` (new) | Unchanged production API dispatch with private DB/evidence/session/query fixtures. Origin/auth helpers are stubs here; real HTTP suite separately exercises production guards. |
| `tests/v10-batch105-http.php` (new) | Genuine PHP HTTP/session/origin/API boundary in private application copy; only DB bootstrap replaced. Fixture auth establishes private session; real guards remain active afterward. |
| `tests/v10-batch105-results.json` (new) | Assertion labels/query/timing artifact, no evidence/credentials. |
| `.gitignore` | Exposes four new test/result files for review; no application behavior. |
| This report (new) | Audit/change/test/limitations/schema/worktree record; unstaged documentation only. |

### Performance and reliability

Source-counted old v10 runtime SQL reads: global **376**, scoped **383**. Frozen constraint plan contributes **367**, inventory **7**, DB binding **1**, FK check **1**; scoped visibility adds **7**. New cost is **383** in either mode, excluding API actor/account-specific queries. Scoped SQL cost is unchanged; global adds seven mandatory visibility queries (about 1.9% more reads). HMAC/a few small file hashes add CPU/file I/O, not DB writes.

Measured private native availability: global **3539.61 ms**, scoped **3137.36 ms**, **383 verifier queries** each. Timing includes worker/API overhead/concurrent local fixture workloads, not production conditions. Existing frozen metadata validation takes seconds locally. Low-frequency availability works in this test environment; actual Hostinger latency/query/request budgets are unverified and may materially differ. No production performance claim, frozen-validator rewrite or cross-request authorization cache was introduced.

Each successful gate performs one full validation. Every destructive target independently validates; bulk preserves its yield/budget. Availability observations are read-only and do not prevent arbitrary external DDL. Existing advisory lock serializes cooperating destructive/maintenance operations and refuses busy operations safely. DB/visibility errors disable deletion. No stale browser response becomes authorization.

## F. Test results

Native tests use fresh MariaDB **10.4.32**, random loopback ports/passwords and owned temporary datadirs, verified against `@@datadir`. Harnesses stop services and remove private fixtures. Frozen-v10 tables are constructed from reviewed metadata, not migrated. **No application migration, installed DB/config bootstrap or production access occurred.**

| Exact command | Executed result |
| --- | --- |
| `C:/xampp/php/php.exe tests/v10-batch7-native.php --only105 --batch105 C:/xampp/mysql/bin` | PASS **203 B10.5 assertions**, **205 including two fixture prerequisites**. Genuine global/scoped CLI; evidence/time/drift/direct API/actor/retention matrix; real Student/Adviser/Admin deletion. |
| `C:/xampp/php/php.exe tests/v10-batch7-native.php --http105 C:/xampp/mysql/bin` | PASS **12 real HTTP assertions**, **14 including prerequisites**: unauthenticated 401, authenticated availability, minimal payload, origin 403, changed evidence 409, crafted flags, sanitized errors, drift after availability, restoration/removal. |
| `C:/xampp/php/php.exe -d extension=zip tests/v10-batch7-native.php --only10 --batch10 C:/xampp/mysql/bin` | PASS **237 cumulative native assertions**: **143 Batch 10** atomicity/rollback/authorization/concurrency/history checks; genuine upload/approval/Return/resubmission/role/session/legal/file HTTP regressions; **17 governance checks**. Document/IERB history preserved. |
| `C:/xampp/php/php.exe tests/v10-batch7-native.php --batch8 --batch9 C:/xampp/mysql/bin` | PASS **325 cumulative native assertions** plus **61 separately counted notification lifecycle checks**; notification races; Admin/Student/Adviser purge, archive/restore, Hold/grace/unresolved workflow/frozen parity; **26 Support/purge/legal**, **216 Batch 9 security/concurrency/HTTP** checks. |
| `python tools/run-batch7-regression.py` | Thirty isolated suites ran: **29 clean PASS**. B4.5's **168 behavioral assertions passed**, but harness exited **1** because expected new verifier logs went to stderr. Its revised fixture passed separately below; initial aggregate JSON retains original observation. |
| `C:/xampp/php/php.exe tests/v10-batch45-security.php` | Revised fixture PASS **169**, asserting sanitized refusals and both protected log entries. With the other 29 suites: **4,674 assertions**. No test removed/weakened. |
| `node tests/ui-audit.cjs --batch45-only` | PASS **2,073 browser checks**, **0 failures**. Current templates/assets, isolated mocked APIs, Student/Adviser/current/archive management, retention/verification controls, screen/theme/accessibility/guards. Temporary artifact directory `prism-batch45-mVOD3I`; production origins blocked. |
| `node tests/ui-audit.cjs --retention-only` | FAIL at legacy readiness assertion on `admin_students.php`, expecting old controls/verification text on current records. No later assertions reached; current architecture places them in Archived Accounts. |
| `node <temporary-baseline>/tests/ui-audit.cjs --retention-only` | **Same failure on unchanged HEAD**. Isolated baseline from `git archive --format=zip HEAD`; export-ignored test blobs from `git show HEAD:tests/...`. Temporary baseline removed. No DB/bootstrap. Confirms pre-existing browser limitation. |
| `python tools/run-batch7-regression.py --syntax-only` | PASS **205 PHP**, **53 JS/CJS** syntax files. Final supplemental `php -l tests/v10-batch105-worker.php`, `php -l account.php`, `node --check assets/js/account.js` also PASS after final session/copy edits. |
| `git diff --check` | PASS, no whitespace errors; ordinary LF/CRLF normalization notices only. |
| `git diff --cached --quiet` | PASS; index empty. |
| `git diff --exit-code -- <seven frozen artifacts>` | PASS; no frozen changes. |

The 203-check matrix covers valid/missing/empty/corrupt/truncated/unknown-version/legacy-v2/unauthenticated evidence, invalid authenticator, signed manifest/contract/policy/unknown-field/DB-name/hostname/port/server-ID/version mismatches, missing/disabled gate/key mismatch, invalid issue type and signed legacy expiry fields. It tests both availability/direct deletion, restored column/type/index/FK/delete-rule/update-rule/trigger mutations, visible incoming CASCADE dependency, SELECT/TRIGGER loss, metadata query errors and disabled FK checks. Refusals preserve accounts; schema changes after availability prevent deletion. Hold/grace/active/cleanup-retention/password/actor changes remain authoritative.

Time simulation uses signed historical issue timestamps for 0, 1, 7, 30, 180 and 365 days in **both modes** (12 positive assertions), with unchanged environment/clock. No system/DB time is changed. Historical values already exceed legacy TTL; only audit metadata varies. Source additionally proves clock access occurs only at generation, never validity determination.

Pure suite commands are `C:/xampp/php/php.exe -d extension=zip tests/<suite>.php`; assertion counts:

| Suite | Assertions |
| --- | --- |
| `email-format-audit` | 41 |
| `v10-batch7-lifecycle` | 61 |
| `v10-batch7-api` | 213 |
| `auth-flows` | 52 |
| `crud-audit` | 56 |
| `document-workflow-audit` | 48 |
| `notification-delivery-audit` | 293 |
| `research-group-audit` | 197 |
| `academic-api-audit` | 1343 |
| `alignment-audit` | 228 |
| `report-format-audit` | 274 |
| `backend-audit` | 87 |
| `tonight-polish-audit` | 99 |
| `hardening-audit` | 114 |
| `calendar-deadlines-audit` | 190 |
| `document-extraction-audit` | 37 |
| `document-summary-audit` | 297 |
| `document-summary-transport-audit` | 41 |
| `archive-operational-audit` | 85 |
| `csv-export-audit` | 93 |
| `v10-batch2-readonly` | 71 |
| `v10-batch3-filters` | 150 |
| `v10-batch3-invitations` | 130 |
| `v10-batch3-deadlines` | 50 |
| `v10-batch4-security` | 91 |
| `v10-batch45-security` | 169 |
| `v10-batch5a-routing` | 30 |
| `v10-batch5b-session` | 36 |
| `v10-batch5b-upload-validation` | 25 |
| `v10-batch6-upload-validation` | 73 |

Visible result artifact: `tests/v10-batch105-results.json`. Existing ignored `tests/v10-batch7-results/{regression-results.json,syntax-results.json,*.log}` record pure/syntax details. Native/HTTP/browser output was captured by tool results. Credential-bearing private fixtures/logs were removed; no verifier secrets/evidence are retained in the report/results.

Development runs stopped for missing synthetic key, wrong restored column order, SELECT loss before actor lookup, and missing CLI self-delete session. Fixtures were corrected with a separate synthetic key, exact ordinal restoration, table-only actor SELECT while schema-wide SELECT is revoked, and private session startup. Final matrix/HTTP runs pass; no production authorization/retention safeguard changed. The pre-existing legacy browser failure remains reported.

## G. Remaining limitations

- No Hostinger/production environment was contacted. Hosting privileges, isolation/hidden dependencies, deployment bytes and performance remain operator responsibilities under separate authorization.
- Separately deploying v3 requires one new verification and unique protected installation key. Old v2 fails closed until then. No production key/evidence installation was performed; Admins need no periodic technical work afterward.
- Maintain DDL/hidden-dependency exclusions continuously; disable deletion before relevant maintenance; protect config/key/private storage/operator logs; rotate/revoke proof if trust is lost.
- Full historical v8/v9 lifecycle/retention modes and B6 migration sweeps were **not run** because they invoke application migrations. Compatibility fixtures were updated minimally; current frozen-v10 fixture-only lifecycle/retention/constraints/purge/HTTP paths were run. Legacy migration regressions require separately permitted scope.
- Legacy `--retention-only` cannot complete even on unchanged HEAD; later assertions remain unexecuted. Current Archived Accounts browser suite passes 2,073 checks. Batch 10 backend/real HTTP ran; its separate full browser screenshot matrix was not rerun for this gate change.
- Pure aggregate initially recorded expected logging as a harness failure. Revised exact suite passes separately; its older JSON `passed=false` entry is preserved as run history, not hidden.
- External DDL can bypass the advisory lock. Hidden CASCADE/SET NULL effects rely on operational exclusion. Deliberately cloned keys/identity fields and compromised operator/application runtime remain trust limits.
- Local verification takes seconds; Hostinger practicality is unverified. No stale authorization cache hides that cost.

### Frozen schema proof

`SCHEMA_VERSION = 10`. No new/changed **application** tables, columns, indexes, FK rules or enums, no schema v11, no migration. Disposable mutation fixtures are restored/destroyed. Seven artifacts match HEAD in Git diff and canonical LF SHA-256:

| Artifact | Unchanged canonical SHA-256 |
| --- | --- |
| `includes/account_lifecycle_schema.json` | `ec424088b23a7a7ba5415fcf4e2fb602d7580df8c587d1ec1af541c7edb429ec` |
| `tools/schema-v10-spec.json` | `3f61af2d567ed4580f3ef9ce4a884c23f14de491bd2d50f434760425b55de663` |
| `includes/schema_v10_plan.json` | `06a1172030675ed9e35a461e769da77d64013e8e5dff7d46b4facdf99830406d` |
| `includes/schema_v10_seed.json` | `d2a8a83cb1d5669de99c7c783c47c48e4db25b0ec83fb91f3752eee13baca439` |
| `tools/schema-v10-manual.sql` | `50c1732abdd11c93e92e6182c393d719f3753848f98e75de5a62a750b123a3d4` |
| `includes/schema_v10.php` | `d4882cbb1021097e92e9ab78239ebefa131243d4f88d6efe81975dfc39ad06d4` |
| `tools/migrate-schema-v10.php` | `6ed76dd24673559083090b35dbbb7edcf1d3c25cd32ff1c4deb6bb1b63e46f8f` |

Unrelated document workflow, Admin Override, Staff Registration, legal governance, account-retention periods and notification deletion implementations are unchanged.

## H. Final worktree and required confirmations

Branch/HEAD/index unchanged. Tracked edits are unstaged; new files untracked. Thirteen starting reports/contracts preserved. New files:

- `PRISM_V10_BATCH10_5_PERSISTENT_DELETE_VERIFICATION_REPORT.md`
- `tests/v10-batch105-native.php`
- `tests/v10-batch105-worker.php`
- `tests/v10-batch105-http.php`
- `tests/v10-batch105-results.json`

**Confirmed:** persistent deployment-bound authenticated v3 replaces 24-hour v2; no fixed-time evidence expiry; secure legacy rejection; every production availability validates the current environment; every actual purge/Admin deletion/recovery independently revalidates; current schema/manifest/DB/server/contract/key differences invalidate proof; required visible metadata/SELECT/TRIGGER loss fails closed; unexpected visible triggers/dependencies fail closed; FK enforcement preserved; no periodic technical intervention for ordinary Admins; normal account retention/eligibility intact; frozen schema v10 unchanged; no migration/production access/modification; all implemented changes unstaged.

Final command outputs (tracked diff excludes the five new files listed above):

`git diff --stat`

```text
 .gitignore                                 |  4 ++
 ACCOUNT_LIFECYCLE_OPERATOR_VERIFICATION.md | 79 +++++++++++++-------------
 account.php                                |  2 +-
 admin_people.php                           |  2 +-
 assets/js/account.js                       |  2 +-
 assets/js/admin-management.js              |  4 +-
 config.php                                 |  2 +
 includes/account_lifecycle_schema.php      | 91 +++++++++++++++++++++++++-----
 tests/account-lifecycle-http.php           |  2 +-
 tests/account-lifecycle-mysql.php          |  1 +
 tests/account-lifecycle-shared-hosting.php |  6 +-
 tests/account-lifecycle-worker.php         |  1 +
 tests/account-retention-http.php           |  4 +-
 tests/account-retention-mysql.php          |  1 +
 tests/account-retention-verification.php   |  8 +--
 tests/v10-batch45-security.php             |  9 ++-
 tests/v10-batch6-mysql.php                 |  1 +
 tests/v10-batch7-native-fixture.php        |  1 +
 tests/v10-batch7-native.php                |  4 +-
 tools/verify-account-lifecycle-schema.php  |  4 +-
 20 files changed, 155 insertions(+), 73 deletions(-)
```

`git diff --name-only`

```text
.gitignore
ACCOUNT_LIFECYCLE_OPERATOR_VERIFICATION.md
account.php
admin_people.php
assets/js/account.js
assets/js/admin-management.js
config.php
includes/account_lifecycle_schema.php
tests/account-lifecycle-http.php
tests/account-lifecycle-mysql.php
tests/account-lifecycle-shared-hosting.php
tests/account-lifecycle-worker.php
tests/account-retention-http.php
tests/account-retention-mysql.php
tests/account-retention-verification.php
tests/v10-batch45-security.php
tests/v10-batch6-mysql.php
tests/v10-batch7-native-fixture.php
tests/v10-batch7-native.php
tools/verify-account-lifecycle-schema.php
```

`git status --short`

```text
 M .gitignore
 M ACCOUNT_LIFECYCLE_OPERATOR_VERIFICATION.md
 M account.php
 M admin_people.php
 M assets/js/account.js
 M assets/js/admin-management.js
 M config.php
 M includes/account_lifecycle_schema.php
 M tests/account-lifecycle-http.php
 M tests/account-lifecycle-mysql.php
 M tests/account-lifecycle-shared-hosting.php
 M tests/account-lifecycle-worker.php
 M tests/account-retention-http.php
 M tests/account-retention-mysql.php
 M tests/account-retention-verification.php
 M tests/v10-batch45-security.php
 M tests/v10-batch6-mysql.php
 M tests/v10-batch7-native-fixture.php
 M tests/v10-batch7-native.php
 M tools/verify-account-lifecycle-schema.php
?? PRISM_V10_BATCH10_5_PERSISTENT_DELETE_VERIFICATION_REPORT.md
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
?? tests/v10-batch105-http.php
?? tests/v10-batch105-native.php
?? tests/v10-batch105-results.json
?? tests/v10-batch105-worker.php
```

**No commit, push, merge, tag, deployment, database migration, schema change, Hostinger modification, Google Cloud modification, production access, or production modification performed.**
