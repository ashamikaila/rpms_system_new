# PRISM V10 Schema Contract

Schema v10 is finalized and frozen by Batch 6. B7–B12 must use this contract without adding tables, columns, indexes or foreign keys. If a later requirement cannot be represented here, stop and obtain a revised design; do not silently create schema v11.

Schema v10 is frozen after Batch 6. B7–B12 are code-only against this contract.

This is the implementation contract for review. It does not authorize any installed, staging or production migration. The one persistent v9 → v10 staging migration remains subject to the owner’s separate authorization.

Canonical inventory: `includes/account_lifecycle_schema.json`; additive specification: `tools/schema-v10-spec.json`; exact SQL checks, generated-column/check constraints and seed invariants: `includes/schema_v10_plan.json`.

Inventory SHA-256: `ec424088b23a7a7ba5415fcf4e2fb602d7580df8c587d1ec1af541c7edb429ec`. There are 23 InnoDB tables, 240 columns, 88 ordered index components and 26 ordered FK components. No triggers. MariaDB display-width/default spelling is normalized by the verifier; logical definitions remain exact.

## Future-batch compatibility

| Batch | Persistent requirement | Frozen representation / mandatory behavior |
|---|---|---|
| B7 | One logical send, independent Sent History and recipient read/archive/delete | `notification_campaigns` plus existing `notifications`. Sender deletion erases campaign subject/message; recipient deletion erases only that row’s subject/message/delivery_info. B7 account-purge integration must erase the sender copy before its user FK becomes NULL, while other account recipient copies survive. Preserve other copies. Retain only identifier/actor/action/time/category audit. Cancel Scheduled before archive/delete; reject unstable Sending. Existing recipient type retains subtype semantics. |
| B8 | Seven support categories, active-Admin recipient snapshot, ordinary composer response | `kind=support`, `support_category`, `reply_to_campaign_id`. Insert recipient rows for active Admins at request time; do not synthesize later recipients. Correlation is optional one-way response context, with no ticket engine/chat/attachment/assignment/SLA. Exclude support bodies using campaign kind from AI/research/export/metrics paths. Pending users access future Support only after security/legal gates. |
| B9 | One global code, unrecoverable secret, acknowledgment clock, one winner | `staff_registration_code.slot=1` checked singleton; generation identifier, verifier only, creator, state, acknowledgment/expiry/consumption fields. Generate a secure secret and show once in the response, never DB/session/URL/log. Pending is unusable. Acknowledge starts 24 hours; lost pending secret requires regenerate. Lock singleton and conditionally consume while unexpired in the same registration transaction. Log generation identifier/action/actor/time only. No acceptance backfill. |
| B10 | Adviser Approve → automatic formal RPMS submission | In one controlled operation set existing `documents.review_status/reviewed_by/reviewed_at` and `rpms_submitted_at/rpms_submitted_by`, retain `version_no`, append document-ID-bound `activity_logs` events. No auto_submitted flag. |
| B10 | RPMS Return → new revision → review → resubmission | Append mandatory `rpms_returned_for_revision` event bound to original `documents.id`, Admin actor, `reason` and `created_at`. Do not clear original review/submission fields. Determine returned eligibility from the latest version-bound workflow event, ordered by `created_at,id`; update workflow/locking and unresolved-retention projections in B10 to treat a returned current version as unfinished. Insert new document with `supersedes_id` and incremented `version_no`, preserving original row; append review/resubmission events for new ID. Existing `is_current` controls current selection. |
| B11 | Override Approve/Revision/Deny and formal submission where eligible | Existing `documents.admin_override`, `override_reason`, `override_by`, `override_at`, review/submission fields and immutable version-bound `activity_logs` including `is_override` and mandatory reason. A comment with no state change stays a comment. Validate final state machine transactionally in B11. |
| B12 | Persistent deployment-bound hard-delete evidence | Configuration/private evidence file, manifest hash, database/server binding, complete schema/FK/check verification, FK enforcement and external-dependency/visibility assumptions. No new database table. Existing 24-hour expiry remains until B12 implements this code-only change. |
| B6 legal governance / acceptance | Versioned Privacy and Terms, immutable publication, independent/sole review, exact account acceptance | `legal_policies`, `legal_policy_versions`, `legal_policy_approvals`, `user_policy_acceptances`; explicit same-policy current pointer, one open candidate, unique review, account/exact-version key. |

## Legal and lifecycle invariants

- Exactly Privacy and Terms policy keys. Explicit current pointer must resolve a published version of the same policy with durable approved evidence and verified source hash. No MAX(version) or static-file fallback.
- Unique `(policy_id,version_number)` and generated `open_candidate = CASE WHEN state IN ('draft','pending') THEN 1 ELSE NULL END`, stored, with unique `(policy_id,open_candidate)`: at most one open candidate per policy. Pending, rejected and published text is immutable through all application paths. Rejected numbers are never reused.
- Approval has unique `version_id`; publication is one transaction with independently eligible reviewer (or password-confirmed explicit sole-Admin exception), audit, published state/time and current pointer. Bootstrap is a migration-only approval mode with no invented human approver.
- Exact account/version acceptance composite primary key. No IP, user-agent, role, proxy, auto-acceptance or session-only evidence. Current version changes invalidate only the changed policy. Archive/restore retains historical acceptance; restore still requires password setup and any newly published version.
- Account archive/restore, six-calendar-month retention, seven-day grace, Retention Hold, unresolved workflow and recoverable storage checks remain in existing lifecycle services. No new user FK uses RESTRICT. File rollback/finalization remains in the existing purge journal.

| New table / modified ownership | Archive / restore / hold / retention | Permanent purge / institutional history |
|---|---|---|
| notification_campaigns | Preserve sender history; no archive operation deletes it. Future sends must use existing account/purge locking. | Sender SET NULL; B7 must erase the purged account’s sender-copy subject/message with a tombstone before deleting the account. Other recipient copies survive. Self reply reference SET NULL if a campaign is actually removed. Do not retain a deleted body in audit. |
| notifications new recipient_user_id | Preserve current delivery during archive; legacy Sending/purge guards still apply. | Account-bound copies CASCADE, campaign deletion SET NULL. Legacy ownership rules remain for old NULL-bound rows. |
| legal_policies | Institutional pointer persists; no account dependency. | Policy/version cross-reference RESTRICT protects institutional history, never references a user. |
| legal_policy_versions | Preserve draft/history through archive and hold. Orphan draft can be adopted by an eligible Admin with audit. | Creator SET NULL; title/text/version/hash/history remain. No copied creator personal snapshot. |
| legal_policy_approvals | Durable review state survives archive/restore/retention. | Reviewer SET NULL; decision/mode/time/reason remain; version RESTRICT protects history. |
| user_policy_acceptances | Preserve exact historical evidence; restored account checks current pointer. | Subject CASCADE, version RESTRICT. No institutional text loss. |
| staff_registration_code | Pending/expiry logic belongs to B9; creator archiving grants no extra privilege. | Creator and consumer SET NULL; generation/state/time remain, verifier is erased on consumption/invalidation. Events in existing audit exclude secrets. |

## Complete table inventory

Defaults below use normalized canonical values: NULL denotes SQL NULL/no explicit non-null default. `EXTRA` records AUTO_INCREMENT/generated storage. Index rows preserve key order and prefixes. Every FK lists ON DELETE and ON UPDATE explicitly.

### account_invitations

Existing Student/Adviser invitation ownership, one-use setup verifier, inviter attribution and expiry; B6 never infers legal acceptance from invitation acceptance.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| user_id | int(11) | NO | NULL | PRI |  |
| invited_by_user_id | int(11) | YES | NULL | MUL |  |
| token_hash | char(64) | YES | NULL | UNI |  |
| expires_at | datetime | YES | NULL |  |  |
| accepted_at | datetime | YES | NULL |  |  |
| last_sent_at | datetime | NO | NULL |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| invitation_inviter | NO | invited_by_user_id | BTREE |
| PRIMARY | YES | user_id | BTREE |
| token_hash | YES | token_hash | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| invitation_inviter | invited_by_user_id | users (id) | SET NULL | RESTRICT |
| invitation_user | user_id | users (id) | CASCADE | RESTRICT |

### account_purge_jobs

Existing durable recovery journal binding for transactional account/file purge; B12 keeps deployment verification outside the database.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | char(32) | NO | NULL | PRI |  |
| account_type | varchar(20) | NO | NULL |  |  |
| account_id | int(11) | NO | NULL |  |  |
| identifier | varchar(100) | NO | NULL |  |  |
| actor_id | int(11) | NO | NULL |  |  |
| method | varchar(30) | NO | NULL |  |  |
| status | varchar(30) | NO | 'files_pending' | MUL |  |
| manifest_sha256 | char(64) | NO | NULL |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| completed_at | datetime | YES | NULL |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| PRIMARY | YES | id | BTREE |
| purge_job_status | NO | status, created_at | BTREE |

Foreign keys: none.

### activity_logs

Existing actor/action/entity/version/time/reason/before/after evidence. B7/B8 deletion events omit content; B9 events omit secrets/verifiers; B10 return/resubmission and B11 override append version-bound events.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| user_email | varchar(190) | YES | NULL |  |  |
| action | varchar(100) | NO | NULL |  |  |
| details | varchar(255) | YES | NULL |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| actor_name | varchar(190) | YES | NULL |  |  |
| actor_role | varchar(20) | YES | NULL |  |  |
| entity_type | varchar(40) | YES | NULL | MUL |  |
| entity_id | varchar(64) | YES | NULL |  |  |
| student_id | int(11) | YES | NULL | MUL |  |
| reason | text | YES | NULL |  |  |
| before_value | varchar(255) | YES | NULL |  |  |
| after_value | varchar(255) | YES | NULL |  |  |
| is_override | tinyint(1) | NO | 0 |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| lifecycle_entity | NO | entity_type, entity_id | BTREE |
| lifecycle_student | NO | student_id | BTREE |
| PRIMARY | YES | id | BTREE |

Foreign keys: none.

### advisers

Existing Adviser profile, assignment identity, archive/restore/retention/hold state. B10 reviewers remain governed by existing assignment checks.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| employee_id | varchar(100) | YES | NULL | UNI |  |
| full_name | varchar(190) | YES | NULL |  |  |
| email | varchar(190) | NO | NULL | UNI |  |
| department | varchar(190) | YES | NULL |  |  |
| assigned_groups | varchar(255) | YES | NULL |  |  |
| status | varchar(20) | NO | 'Active' |  |  |
| user_id | int(11) | YES | NULL | MUL |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| updated_at | datetime | NO | current_timestamp() |  | on update current_timestamp() |
| archived_at | datetime | YES | NULL | MUL |  |
| retention_hold | tinyint(1) | NO | 0 |  |  |
| retention_hold_at | datetime | YES | NULL |  |  |
| retention_hold_by | int(11) | YES | NULL |  |  |
| retention_hold_reason | varchar(500) | YES | NULL |  |  |
| purge_postponed_at | datetime | YES | NULL |  |  |
| purge_postponed_reason | varchar(255) | YES | NULL |  |  |
| restored_at | datetime | YES | NULL |  |  |
| profile_completed_at | datetime | YES | NULL | MUL |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| adviser_archive_lifecycle | NO | archived_at, retention_hold | BTREE |
| adviser_profile_completion | NO | profile_completed_at | BTREE |
| email | YES | email | BTREE |
| employee_id | YES | employee_id | BTREE |
| PRIMARY | YES | id | BTREE |
| user_id | NO | user_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| advisers_ibfk_1 | user_id | users (id) | SET NULL | RESTRICT |

### ai_outputs

Existing owned generated research outputs. B8 support bodies must be excluded from provider context and metrics.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | varchar(40) | NO | NULL | PRI |  |
| type | varchar(20) | NO | NULL |  |  |
| source_ref | varchar(255) | YES | NULL |  |  |
| prompt | text | YES | NULL |  |  |
| output | mediumtext | YES | NULL |  |  |
| status | varchar(20) | NO | 'Draft' |  |  |
| created_by | varchar(190) | YES | NULL |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| approved_at | datetime | YES | NULL |  |  |
| owner_student_id | int(11) | YES | NULL | MUL |  |
| owner_document_id | varchar(40) | YES | NULL | MUL |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| ai_owner_document | NO | owner_document_id | BTREE |
| ai_owner_student | NO | owner_student_id | BTREE |
| PRIMARY | YES | id | BTREE |

Foreign keys: none.

### calendar_deadlines

Existing official deadline author, scope, time and status; existing lifecycle unresolved-workflow guards remain.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| creator_user_id | int(11) | YES | NULL | MUL |  |
| title | varchar(190) | NO | NULL |  |  |
| description | text | YES | NULL |  |  |
| deadline_date | date | NO | NULL | MUL |  |
| target_scope | enum('all','groups') | NO | NULL |  |  |
| status | enum('Active','Cancelled') | NO | 'Active' |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| updated_at | datetime | NO | current_timestamp() |  | on update current_timestamp() |
| creator_name | varchar(190) | YES | NULL |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| deadline_creator | NO | creator_user_id | BTREE |
| deadline_date_status | NO | deadline_date, status | BTREE |
| PRIMARY | YES | id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| calendar_deadlines_ibfk_1 | creator_user_id | users (id) | SET NULL | RESTRICT |

### calendar_deadline_groups

Existing official deadline group visibility.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| deadline_id | int(11) | NO | NULL | PRI |  |
| research_group | varchar(190) | NO | NULL | PRI |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| deadline_group_lookup | NO | research_group, deadline_id | BTREE |
| PRIMARY | YES | deadline_id, research_group | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| calendar_deadline_groups_ibfk_1 | deadline_id | calendar_deadlines (id) | CASCADE | RESTRICT |

### calendar_deadline_recipients

Existing explicit Student deadline recipient snapshot.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| deadline_id | int(11) | NO | NULL | PRI |  |
| student_id | int(11) | NO | NULL | PRI |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| deadline_recipient_student | NO | student_id, deadline_id | BTREE |
| PRIMARY | YES | deadline_id, student_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| calendar_deadline_recipients_ibfk_1 | deadline_id | calendar_deadlines (id) | CASCADE | RESTRICT |
| calendar_deadline_recipients_ibfk_2 | student_id | students (id) | RESTRICT | RESTRICT |

### documents

Existing immutable revision identity, supersession/current selection, Adviser review, formal RPMS submission, Admin override, summary and ownership; B10/B11 reuse these exact fields.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | varchar(40) | NO | NULL | PRI |  |
| student_id | int(11) | YES | NULL | MUL |  |
| student_name | varchar(190) | YES | NULL |  |  |
| uploaded_by | varchar(190) | YES | NULL |  |  |
| uploaded_by_role | varchar(20) | YES | NULL |  |  |
| original_name | varchar(255) | NO | NULL |  |  |
| stored_name | varchar(255) | NO | NULL | MUL |  |
| mime | varchar(120) | YES | NULL |  |  |
| size | int(11) | YES | NULL |  |  |
| document_type | varchar(100) | YES | NULL |  |  |
| stage | varchar(20) | YES | NULL |  |  |
| version_no | int(11) | NO | 1 |  |  |
| is_current | tinyint(1) | NO | 1 |  |  |
| supersedes_id | varchar(40) | YES | NULL | MUL |  |
| notes | text | YES | NULL |  |  |
| review_status | varchar(30) | NO | 'Submitted' |  |  |
| review_remarks | text | YES | NULL |  |  |
| reviewed_by | varchar(190) | YES | NULL |  |  |
| reviewed_at | datetime | YES | NULL |  |  |
| detected_approval_date | date | YES | NULL |  |  |
| approval_date_source | varchar(20) | YES | NULL |  |  |
| ai_summary | text | YES | NULL |  |  |
| uploaded_at | datetime | NO | current_timestamp() |  |  |
| rpms_submitted_at | datetime | YES | NULL |  |  |
| rpms_submitted_by | varchar(190) | YES | NULL |  |  |
| admin_override | tinyint(1) | NO | 0 |  |  |
| override_reason | text | YES | NULL |  |  |
| override_by | varchar(190) | YES | NULL |  |  |
| override_at | datetime | YES | NULL |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| document_previous_version | NO | supersedes_id | BTREE |
| document_stored_file | NO | stored_name | BTREE |
| PRIMARY | YES | id | BTREE |
| student_id | NO | student_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| documents_ibfk_1 | student_id | students (id) | SET NULL | RESTRICT |

### ierb_history

Existing institutional stage/progress event history; workflow truth survives notification deletion.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| student_id | int(11) | NO | NULL | MUL |  |
| stage | varchar(20) | YES | NULL |  |  |
| status | varchar(30) | YES | NULL |  |  |
| note | text | YES | NULL |  |  |
| requirements | varchar(255) | YES | NULL |  |  |
| submission_date | date | YES | NULL |  |  |
| actor | varchar(190) | YES | NULL |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| PRIMARY | YES | id | BTREE |
| student_id | NO | student_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| ierb_history_ibfk_1 | student_id | students (id) | CASCADE | RESTRICT |

### legal_policies

B6 exactly two stable policies and explicit authoritative current pointers.

Engine: InnoDB. NEW in v10.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | enum('privacy','terms') | NO | NULL | PRI |  |
| current_version_id | int(11) | YES | NULL |  |  |

| v10 column | Required purpose / consumer |
|---|---|
| id | Only privacy/terms; no arbitrary client types. |
| current_version_id | Publication atomically moves pointer; null only during transactional bootstrap. |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| policy_current | NO | id, current_version_id | BTREE |
| PRIMARY | YES | id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| policy_current_fk | id, current_version_id | legal_policy_versions (policy_id, id) | RESTRICT | RESTRICT |

### legal_policy_approvals

B6 durable immutable publication/rejection evidence, including explicit bootstrap/sole-admin provenance.

Engine: InnoDB. NEW in v10.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| version_id | int(11) | NO | NULL | UNI |  |
| reviewer_user_id | int(11) | YES | NULL | MUL |  |
| decision | enum('approved','rejected') | NO | NULL |  |  |
| approval_mode | enum('independent','sole_admin','bootstrap') | NO | NULL |  |  |
| reason | varchar(500) | YES | NULL |  |  |
| reviewed_at | datetime | NO | current_timestamp() |  |  |

| v10 column | Required purpose / consumer |
|---|---|
| id | Decision identity. |
| version_id | One final decision per immutable candidate. |
| reviewer_user_id | Current reviewer, SET NULL on authorized account purge. |
| decision | Explicit review result. |
| approval_mode | Distinguish sole-admin exception and approved Batch 5B bootstrap. |
| reason | Mandatory rejection explanation; no passwords or personal snapshots. |
| reviewed_at | Server decision timestamp. |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| approval_reviewer | NO | reviewer_user_id | BTREE |
| approval_version | YES | version_id | BTREE |
| PRIMARY | YES | id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| approval_reviewer_fk | reviewer_user_id | users (id) | SET NULL | RESTRICT |
| approval_version_fk | version_id | legal_policy_versions (id) | RESTRICT | RESTRICT |

### legal_policy_versions

B6 immutable published/pending/rejected text, sequential numbers and one open candidate.

Engine: InnoDB. NEW in v10.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| policy_id | enum('privacy','terms') | NO | NULL | MUL |  |
| version_number | int(11) | NO | NULL |  |  |
| title | varchar(190) | NO | NULL |  |  |
| content | mediumtext | NO | NULL |  |  |
| change_summary | varchar(500) | NO | '' |  |  |
| state | enum('draft','pending','rejected','published') | NO | 'draft' |  |  |
| open_candidate | tinyint(4) | YES | NULL |  | STORED GENERATED |
| content_sha256 | char(64) | NO | NULL |  |  |
| creator_user_id | int(11) | YES | NULL | MUL |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| submitted_at | datetime | YES | NULL |  |  |
| published_at | datetime | YES | NULL |  |  |

| v10 column | Required purpose / consumer |
|---|---|
| id | Exact version identity referenced by acceptance. |
| policy_id | Stable policy identity. |
| version_number | Server-assigned monotonic number per policy, including rejected versions. |
| title | Public heading. |
| content | Structured plain source; every render escapes markup. |
| change_summary | Required before submission. |
| state | Rejected text remains immutable; start new candidate. |
| open_candidate | Unique nullable marker enforces one draft/pending candidate per policy. |
| content_sha256 | Exact source integrity; verified before rendering/acceptance/publication. |
| creator_user_id | Creator attribution without personal snapshots; SET NULL on purge. |
| created_at | Candidate creation. |
| submitted_at | Submission freezes candidate. |
| published_at | Publication/effective timestamp. |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| policy_creator | NO | creator_user_id | BTREE |
| policy_open_candidate | YES | policy_id, open_candidate | BTREE |
| policy_version_identity | YES | policy_id, id | BTREE |
| policy_version_number | YES | policy_id, version_number | BTREE |
| PRIMARY | YES | id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| version_creator_fk | creator_user_id | users (id) | SET NULL | RESTRICT |
| version_policy_fk | policy_id | legal_policies (id) | RESTRICT | RESTRICT |

Additional verified generated expression: `CASE WHEN state IN ('draft','pending') THEN 1 ELSE NULL END`, STORED. Generated unique candidate key is required even though the ordinary inventory records only the storage/type/key attributes.

### notifications

Existing recipient delivery/copy, subtype, status, read state, scheduling and Sending lease. B7 adds logical campaign/account binding and independent archive/delete timestamps; B8 uses recipient snapshots.

Engine: InnoDB. Modified in v10.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| recipient_type | varchar(20) | NO | NULL | MUL |  |
| recipient_id | int(11) | YES | NULL |  |  |
| recipient_email | varchar(190) | YES | NULL |  |  |
| recipient_name | varchar(190) | YES | NULL |  |  |
| subject | varchar(255) | YES | NULL |  |  |
| message | text | NO | NULL |  |  |
| type | varchar(50) | NO | 'Status Update' |  |  |
| status | varchar(20) | NO | 'Sent' |  |  |
| delivery_info | text | YES | NULL |  |  |
| scheduled_at | datetime | YES | NULL |  |  |
| sent_at | datetime | YES | NULL |  |  |
| read_at | datetime | YES | NULL |  |  |
| created_by | varchar(190) | YES | NULL |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| sending_started_at | datetime | YES | NULL |  |  |
| campaign_id | int(11) | YES | NULL | MUL |  |
| recipient_user_id | int(11) | YES | NULL | MUL |  |
| archived_at | datetime | YES | NULL |  |  |
| deleted_at | datetime | YES | NULL |  |  |

New columns: campaign_id correlates one logical send; recipient_user_id binds the stable account; archived_at and deleted_at represent independent recipient lifecycle. Old rows retain NULL new values and all legacy data.

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| notification_campaign | NO | campaign_id | BTREE |
| notification_recipient | NO | recipient_type, recipient_id | BTREE |
| notification_user | NO | recipient_user_id, created_at | BTREE |
| PRIMARY | YES | id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| notification_campaign_fk | campaign_id | notification_campaigns (id) | SET NULL | RESTRICT |
| notification_user_fk | recipient_user_id | users (id) | CASCADE | RESTRICT |

### notification_campaigns

B7 logical send and independent sender history; B8 one-way support and reply correlation.

Engine: InnoDB. NEW in v10.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| sender_user_id | int(11) | YES | NULL | MUL |  |
| kind | enum('staff','support','workflow','system') | NO | 'system' |  |  |
| support_category | enum('Ask RPMS Staff','Report a Problem','Account/Access','Document/Submission','IERB Progress','Technical Issue','Other') | YES | NULL |  |  |
| reply_to_campaign_id | int(11) | YES | NULL | MUL |  |
| subject | varchar(255) | YES | NULL |  |  |
| message | text | YES | NULL |  |  |
| status | varchar(20) | NO | 'Scheduled' |  |  |
| scheduled_at | datetime | YES | NULL |  |  |
| sent_at | datetime | YES | NULL |  |  |
| archived_at | datetime | YES | NULL |  |  |
| deleted_at | datetime | YES | NULL |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |

| v10 column | Required purpose / consumer |
|---|---|
| id | Stable logical message identifier. |
| sender_user_id | Authenticated sender; SET NULL on account purge. |
| kind | B7/B8 high-level category; existing recipient type preserves subtype. |
| support_category | B8 required request category; no ticket engine. |
| reply_to_campaign_id | B8 ordinary composer reply correlation, not a threaded ticket. |
| subject | Sender copy subject, erased when sender deletes their copy. |
| message | Sender copy body; recipient rows independently retain their copies. |
| status | B7 Scheduled/Sending/Sent/Failed/Cancelled; code must cancel before deleting. |
| scheduled_at | B7 schedule. |
| sent_at | B7 logical send completion. |
| archived_at | B7 independent sender archive. |
| deleted_at | B7 independent sender deletion tombstone; erase subject/message. |
| created_at | Send/request creation time. |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| campaign_reply | NO | reply_to_campaign_id | BTREE |
| campaign_sender | NO | sender_user_id, created_at | BTREE |
| PRIMARY | YES | id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| campaign_reply_fk | reply_to_campaign_id | notification_campaigns (id) | SET NULL | RESTRICT |
| campaign_sender_fk | sender_user_id | users (id) | SET NULL | RESTRICT |

### password_resets

Existing one-use reset/setup verifiers and expiry; legal acceptance is independently required after password setup.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| user_id | int(11) | NO | NULL | MUL |  |
| token | varchar(128) | NO | NULL | UNI |  |
| expires_at | datetime | NO | NULL |  |  |
| used | tinyint(1) | NO | 0 |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| PRIMARY | YES | id | BTREE |
| token | YES | token | BTREE |
| user_id | NO | user_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| password_resets_ibfk_1 | user_id | users (id) | CASCADE | RESTRICT |

### reports

Existing owned generated report metadata; B8 support content stays outside research reports/exports.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | varchar(40) | NO | NULL | PRI |  |
| title | varchar(255) | NO | NULL |  |  |
| type | varchar(50) | NO | NULL |  |  |
| filename | varchar(255) | NO | NULL | MUL |  |
| generated_by | varchar(190) | YES | NULL |  |  |
| generated_by_user_id | int(11) | YES | NULL |  |  |
| generated_at | datetime | NO | current_timestamp() |  |  |
| owner_student_id | int(11) | YES | NULL | MUL |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| PRIMARY | YES | id | BTREE |
| report_owner_student | NO | owner_student_id | BTREE |
| report_stored_file | NO | filename | BTREE |

Foreign keys: none.

### schema_meta

Canonical migration stamp. Final schema_version is 10; never advance until validation and seed invariants pass.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| k | varchar(40) | NO | NULL | PRI |  |
| v | varchar(40) | NO | NULL |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| PRIMARY | YES | k | BTREE |

Foreign keys: none.

### staff_registration_code

B9 singleton current generation and transactional consume; activity_logs stores secret-free events.

Engine: InnoDB. NEW in v10.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| slot | tinyint(4) | NO | 1 | PRI |  |
| generation_id | char(32) | NO | NULL | UNI |  |
| verifier_hash | varchar(255) | YES | NULL |  |  |
| state | enum('pending','acknowledged','invalidated','expired','consumed') | NO | 'pending' |  |  |
| creator_user_id | int(11) | YES | NULL | MUL |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| acknowledged_at | datetime | YES | NULL |  |  |
| expires_at | datetime | YES | NULL |  |  |
| consumed_at | datetime | YES | NULL |  |  |
| consumed_by_user_id | int(11) | YES | NULL | MUL |  |

| v10 column | Required purpose / consumer |
|---|---|
| slot | CHECK(slot=1) plus PK allows exactly one current global generation. |
| generation_id | Random nonsecret generation identity, used by audit after slot is replaced. |
| verifier_hash | Secure verifier only, cleared on invalidation/expiry/consume; never plaintext. |
| state | Unusable until acknowledgment; conditional locked consume permits one winner. |
| creator_user_id | Creator recorded; SET NULL on purge; pending generation must be invalidated by B9 if creator disappears. |
| created_at | Generation time. |
| acknowledged_at | Starts validity only after saved-code acknowledgment. |
| expires_at | Exactly acknowledgment + 24 hours, enforced by B9 code. |
| consumed_at | Successful registration timestamp. |
| consumed_by_user_id | Winning registration subject; SET NULL on purge. |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| PRIMARY | YES | slot | BTREE |
| staff_code_consumer | NO | consumed_by_user_id | BTREE |
| staff_code_creator | NO | creator_user_id | BTREE |
| staff_code_generation | YES | generation_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| staff_code_consumer_fk | consumed_by_user_id | users (id) | SET NULL | RESTRICT |
| staff_code_creator_fk | creator_user_id | users (id) | SET NULL | RESTRICT |

Additional enforced CHECK: `slot = 1`. Primary key guarantees only one singleton row; empty table is allowed before first generation.

### stage_labels

Existing configured IERB display labels.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| stage_key | varchar(20) | NO | NULL | PRI |  |
| label | varchar(190) | NO | NULL |  |  |
| updated_at | datetime | NO | current_timestamp() |  | on update current_timestamp() |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| PRIMARY | YES | stage_key | BTREE |

Foreign keys: none.

### students

Existing research/profile/assignment identity, current progress, archive/restore/retention/hold; B10 new revisions retain existing account ownership.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| student_id | varchar(100) | YES | NULL | UNI |  |
| full_name | varchar(190) | YES | NULL |  |  |
| email | varchar(190) | NO | NULL | UNI |  |
| research_title | varchar(255) | YES | NULL |  |  |
| research_group | varchar(190) | YES | NULL |  |  |
| course | varchar(255) | YES | NULL |  |  |
| adviser_id | int(11) | YES | NULL | MUL |  |
| stage | varchar(20) | NO | 'Stage 1' |  |  |
| status | varchar(30) | NO | 'On Track' |  |  |
| requirements | varchar(255) | YES | NULL |  |  |
| protocol_code | varchar(100) | YES | NULL |  |  |
| is_principal_investigator | tinyint(1) | NO | 0 |  |  |
| last_submission_date | date | YES | NULL |  |  |
| user_id | int(11) | YES | NULL | MUL |  |
| created_at | datetime | NO | current_timestamp() |  |  |
| updated_at | datetime | NO | current_timestamp() |  | on update current_timestamp() |
| academic_unit_key | varchar(64) | YES | NULL |  |  |
| program_key | varchar(80) | YES | NULL |  |  |
| year_level | varchar(40) | YES | NULL |  |  |
| academic_year | varchar(9) | YES | NULL |  |  |
| archived_at | datetime | YES | NULL | MUL |  |
| retention_hold | tinyint(1) | NO | 0 |  |  |
| retention_hold_at | datetime | YES | NULL |  |  |
| retention_hold_by | int(11) | YES | NULL |  |  |
| retention_hold_reason | varchar(500) | YES | NULL |  |  |
| purge_postponed_at | datetime | YES | NULL |  |  |
| purge_postponed_reason | varchar(255) | YES | NULL |  |  |
| restored_at | datetime | YES | NULL |  |  |
| profile_completed_at | datetime | YES | NULL | MUL |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| adviser_id | NO | adviser_id | BTREE |
| email | YES | email | BTREE |
| PRIMARY | YES | id | BTREE |
| student_archive_lifecycle | NO | archived_at, retention_hold | BTREE |
| student_id | YES | student_id | BTREE |
| student_profile_completion | NO | profile_completed_at | BTREE |
| user_id | NO | user_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| students_ibfk_1 | adviser_id | advisers (id) | SET NULL | RESTRICT |
| students_ibfk_2 | user_id | users (id) | SET NULL | RESTRICT |

### users

Existing authentication identity, role, active status, password-security state and account link. B6 acceptance binds to this stable ID; B9 future Staff-Code registration creates an active complete Admin without acceptance.

Engine: InnoDB. Existing v9 definition retained.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | NULL | PRI | auto_increment |
| username | varchar(100) | YES | NULL | UNI |  |
| password_hash | varchar(255) | NO | NULL |  |  |
| role | enum('admin','adviser','student') | NO | NULL |  |  |
| full_name | varchar(190) | YES | NULL |  |  |
| email | varchar(190) | NO | NULL | UNI |  |
| ref_id | varchar(100) | YES | NULL |  |  |
| status | varchar(20) | NO | 'Active' |  |  |
| must_change_password | tinyint(1) | NO | 0 |  |  |
| created_at | datetime | NO | current_timestamp() |  |  |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| email | YES | email | BTREE |
| PRIMARY | YES | id | BTREE |
| username | YES | username | BTREE |

Foreign keys: none.

### user_policy_acceptances

B6 account-bound Terms agreement / Privacy acknowledgment, including partial re-acknowledgment.

Engine: InnoDB. NEW in v10.

| Column | Type | Nullable | Default | Key marker | Extra |
|---|---|---|---|---|---|
| user_id | int(11) | NO | NULL | PRI |  |
| policy_version_id | int(11) | NO | NULL | PRI |  |
| accepted_at | datetime | NO | current_timestamp() |  |  |

| v10 column | Required purpose / consumer |
|---|---|
| user_id | Authenticated subject only; CASCADE on permanent purge. |
| policy_version_id | Exact immutable version, RESTRICT deletion. |
| accepted_at | Server timestamp; no IP/device data. |

| Index | Unique | Ordered columns (prefix if present) | Type |
|---|---|---|---|
| acceptance_version | NO | policy_version_id | BTREE |
| PRIMARY | YES | user_id, policy_version_id | BTREE |

| Foreign key | Columns | References | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| acceptance_user_fk | user_id | users (id) | CASCADE | RESTRICT |
| acceptance_version_fk | policy_version_id | legal_policy_versions (id) | RESTRICT | RESTRICT |
