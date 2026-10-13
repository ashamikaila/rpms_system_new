# PRISM V10 — proposed Batch 6 persistence contract

Recorded before DDL implementation. Starting branch: prism-v10-b06-schema-legal-foundation. Starting HEAD: 23e898bca91b07ad938e2745da2b1183abc74605.

Source audit: v9 has 17 InnoDB tables. notifications already stores one recipient per row with read_at, delivery status, schedule and Sending claim time; there is no durable logical send or independent archive/delete. No support or staff-code subsystem exists. documents has version_no, is_current, supersedes_id, review_status/remarks/reviewer/time, rpms_submitted_at/by and override actor/reason/time. activity_logs has entity/version identity, actor, action, timestamp, reason, before/after; ierb_history preserves stage events. Public legal source is includes/legal/privacy.md and terms.md with an escaped structured renderer. No acceptance evidence exists.

Every discovered persistent document upload uses documents_api.php?action=upload -> prism_validate_upload -> prism_upload_one (single and bulk), reached by role_portal.php/Student and documents.php/Admin. Adviser upload is explicitly forbidden. Revisions use the same upload path. No IERB attachment or alternate replacement persistence route was found. The photo chooser is a local preview only.

B10/B11 require no new fields: retain original reviewed/submitted document rows, append version-bound RPMS-return and resubmission events to activity_logs (reason TEXT, actor, created_at), and create a new superseding revision. A return event must not clear or rewrite original review/submission evidence. Existing override fields and audit history represent override decisions. B12 evidence remains configuration/file based; no verifier table.

## notification_campaigns

NEW — B7 logical send and independent sender history; B8 one-way support and reply correlation.

| Column | Type / nullability / default | Required purpose |
|---|---|---|
| `id` | `INT NOT NULL AUTO_INCREMENT` | Stable logical message identifier. |
| `sender_user_id` | `INT NULL` | Authenticated sender; SET NULL on account purge. |
| `kind` | `ENUM('staff','support','workflow','system') NOT NULL DEFAULT 'system'` | B7/B8 high-level category; existing recipient type preserves subtype. |
| `support_category` | `ENUM('Ask RPMS Staff','Report a Problem','Account/Access','Document/Submission','IERB Progress','Technical Issue','Other') NULL` | B8 required request category; no ticket engine. |
| `reply_to_campaign_id` | `INT NULL` | B8 ordinary composer reply correlation, not a threaded ticket. |
| `subject` | `VARCHAR(255) NULL` | Sender copy subject, erased when sender deletes their copy. |
| `message` | `TEXT NULL` | Sender copy body; recipient rows independently retain their copies. |
| `status` | `VARCHAR(20) NOT NULL DEFAULT 'Scheduled'` | B7 Scheduled/Sending/Sent/Failed/Cancelled; code must cancel before deleting. |
| `scheduled_at` | `DATETIME NULL` | B7 schedule. |
| `sent_at` | `DATETIME NULL` | B7 logical send completion. |
| `archived_at` | `DATETIME NULL` | B7 independent sender archive. |
| `deleted_at` | `DATETIME NULL` | B7 independent sender deletion tombstone; erase subject/message. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Send/request creation time. |

Keys/indexes: PRIMARY (id) UNIQUE; campaign_sender (sender_user_id, created_at) INDEX; campaign_reply (reply_to_campaign_id) INDEX.

Foreign keys:
- campaign_sender_fk: (sender_user_id) → users (id), ON DELETE SET NULL, ON UPDATE RESTRICT.
- campaign_reply_fk: (reply_to_campaign_id) → notification_campaigns (id), ON DELETE SET NULL, ON UPDATE RESTRICT.

Account lifecycle: archive/restore preserves these rows and acceptance validity depends on current pointers. Retention Hold, six-calendar-month retention and seven-day purge grace stay in existing lifecycle code. No new account FK uses RESTRICT. Purge cascades account acceptance/recipient copies and nulls institutional creator/reviewer/sender/code attribution. Legal history remains; no unnecessary personal snapshots. Unresolved document workflow and recoverable file purge remain governed by existing checks. New B7/B8 sends must use existing recipient locking/purge guards; B9 events contain generation ID/action/actor/time only, never a secret/hash.

## legal_policies

NEW — B6 exactly two stable policies and explicit authoritative current pointers.

| Column | Type / nullability / default | Required purpose |
|---|---|---|
| `id` | `ENUM('privacy','terms') NOT NULL` | Only privacy/terms; no arbitrary client types. |
| `current_version_id` | `INT NULL` | Publication atomically moves pointer; null only during transactional bootstrap. |

Keys/indexes: PRIMARY (id) UNIQUE; policy_current (id, current_version_id) INDEX.

Foreign keys:
- policy_current_fk: (id, current_version_id) → legal_policy_versions (policy_id, id), ON DELETE RESTRICT, ON UPDATE RESTRICT.

Account lifecycle: archive/restore preserves these rows and acceptance validity depends on current pointers. Retention Hold, six-calendar-month retention and seven-day purge grace stay in existing lifecycle code. No new account FK uses RESTRICT. Purge cascades account acceptance/recipient copies and nulls institutional creator/reviewer/sender/code attribution. Legal history remains; no unnecessary personal snapshots. Unresolved document workflow and recoverable file purge remain governed by existing checks. New B7/B8 sends must use existing recipient locking/purge guards; B9 events contain generation ID/action/actor/time only, never a secret/hash.

## legal_policy_versions

NEW — B6 immutable published/pending/rejected text, sequential numbers and one open candidate.

| Column | Type / nullability / default | Required purpose |
|---|---|---|
| `id` | `INT NOT NULL AUTO_INCREMENT` | Exact version identity referenced by acceptance. |
| `policy_id` | `ENUM('privacy','terms') NOT NULL` | Stable policy identity. |
| `version_number` | `INT NOT NULL` | Server-assigned monotonic number per policy, including rejected versions. |
| `title` | `VARCHAR(190) NOT NULL` | Public heading. |
| `content` | `MEDIUMTEXT NOT NULL` | Structured plain source; every render escapes markup. |
| `change_summary` | `VARCHAR(500) NOT NULL DEFAULT ''` | Required before submission. |
| `state` | `ENUM('draft','pending','rejected','published') NOT NULL DEFAULT 'draft'` | Rejected text remains immutable; start new candidate. |
| `open_candidate` | `TINYINT GENERATED ALWAYS AS (CASE WHEN state IN ('draft','pending') THEN 1 ELSE NULL END) STORED` | Unique nullable marker enforces one draft/pending candidate per policy. |
| `content_sha256` | `CHAR(64) NOT NULL` | Exact source integrity; verified before rendering/acceptance/publication. |
| `creator_user_id` | `INT NULL` | Creator attribution without personal snapshots; SET NULL on purge. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Candidate creation. |
| `submitted_at` | `DATETIME NULL` | Submission freezes candidate. |
| `published_at` | `DATETIME NULL` | Publication/effective timestamp. |

Keys/indexes: PRIMARY (id) UNIQUE; policy_version_number (policy_id, version_number) UNIQUE; policy_version_identity (policy_id, id) UNIQUE; policy_open_candidate (policy_id, open_candidate) UNIQUE; policy_creator (creator_user_id) INDEX.

Foreign keys:
- version_policy_fk: (policy_id) → legal_policies (id), ON DELETE RESTRICT, ON UPDATE RESTRICT.
- version_creator_fk: (creator_user_id) → users (id), ON DELETE SET NULL, ON UPDATE RESTRICT.

Account lifecycle: archive/restore preserves these rows and acceptance validity depends on current pointers. Retention Hold, six-calendar-month retention and seven-day purge grace stay in existing lifecycle code. No new account FK uses RESTRICT. Purge cascades account acceptance/recipient copies and nulls institutional creator/reviewer/sender/code attribution. Legal history remains; no unnecessary personal snapshots. Unresolved document workflow and recoverable file purge remain governed by existing checks. New B7/B8 sends must use existing recipient locking/purge guards; B9 events contain generation ID/action/actor/time only, never a secret/hash.

## legal_policy_approvals

NEW — B6 durable immutable publication/rejection evidence, including explicit bootstrap/sole-admin provenance.

| Column | Type / nullability / default | Required purpose |
|---|---|---|
| `id` | `INT NOT NULL AUTO_INCREMENT` | Decision identity. |
| `version_id` | `INT NOT NULL` | One final decision per immutable candidate. |
| `reviewer_user_id` | `INT NULL` | Current reviewer, SET NULL on authorized account purge. |
| `decision` | `ENUM('approved','rejected') NOT NULL` | Explicit review result. |
| `approval_mode` | `ENUM('independent','sole_admin','bootstrap') NOT NULL` | Distinguish sole-admin exception and approved Batch 5B bootstrap. |
| `reason` | `VARCHAR(500) NULL` | Mandatory rejection explanation; no passwords or personal snapshots. |
| `reviewed_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Server decision timestamp. |

Keys/indexes: PRIMARY (id) UNIQUE; approval_version (version_id) UNIQUE; approval_reviewer (reviewer_user_id) INDEX.

Foreign keys:
- approval_version_fk: (version_id) → legal_policy_versions (id), ON DELETE RESTRICT, ON UPDATE RESTRICT.
- approval_reviewer_fk: (reviewer_user_id) → users (id), ON DELETE SET NULL, ON UPDATE RESTRICT.

Account lifecycle: archive/restore preserves these rows and acceptance validity depends on current pointers. Retention Hold, six-calendar-month retention and seven-day purge grace stay in existing lifecycle code. No new account FK uses RESTRICT. Purge cascades account acceptance/recipient copies and nulls institutional creator/reviewer/sender/code attribution. Legal history remains; no unnecessary personal snapshots. Unresolved document workflow and recoverable file purge remain governed by existing checks. New B7/B8 sends must use existing recipient locking/purge guards; B9 events contain generation ID/action/actor/time only, never a secret/hash.

## user_policy_acceptances

NEW — B6 account-bound Terms agreement / Privacy acknowledgment, including partial re-acknowledgment.

| Column | Type / nullability / default | Required purpose |
|---|---|---|
| `user_id` | `INT NOT NULL` | Authenticated subject only; CASCADE on permanent purge. |
| `policy_version_id` | `INT NOT NULL` | Exact immutable version, RESTRICT deletion. |
| `accepted_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Server timestamp; no IP/device data. |

Keys/indexes: PRIMARY (user_id, policy_version_id) UNIQUE; acceptance_version (policy_version_id) INDEX.

Foreign keys:
- acceptance_user_fk: (user_id) → users (id), ON DELETE CASCADE, ON UPDATE RESTRICT.
- acceptance_version_fk: (policy_version_id) → legal_policy_versions (id), ON DELETE RESTRICT, ON UPDATE RESTRICT.

Account lifecycle: archive/restore preserves these rows and acceptance validity depends on current pointers. Retention Hold, six-calendar-month retention and seven-day purge grace stay in existing lifecycle code. No new account FK uses RESTRICT. Purge cascades account acceptance/recipient copies and nulls institutional creator/reviewer/sender/code attribution. Legal history remains; no unnecessary personal snapshots. Unresolved document workflow and recoverable file purge remain governed by existing checks. New B7/B8 sends must use existing recipient locking/purge guards; B9 events contain generation ID/action/actor/time only, never a secret/hash.

## staff_registration_code

NEW — B9 singleton current generation and transactional consume; activity_logs stores secret-free events.

| Column | Type / nullability / default | Required purpose |
|---|---|---|
| `slot` | `TINYINT NOT NULL DEFAULT 1` | CHECK(slot=1) plus PK allows exactly one current global generation. |
| `generation_id` | `CHAR(32) NOT NULL` | Random nonsecret generation identity, used by audit after slot is replaced. |
| `verifier_hash` | `VARCHAR(255) NULL` | Secure verifier only, cleared on invalidation/expiry/consume; never plaintext. |
| `state` | `ENUM('pending','acknowledged','invalidated','expired','consumed') NOT NULL DEFAULT 'pending'` | Unusable until acknowledgment; conditional locked consume permits one winner. |
| `creator_user_id` | `INT NULL` | Creator recorded; SET NULL on purge; pending generation must be invalidated by B9 if creator disappears. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Generation time. |
| `acknowledged_at` | `DATETIME NULL` | Starts validity only after saved-code acknowledgment. |
| `expires_at` | `DATETIME NULL` | Exactly acknowledgment + 24 hours, enforced by B9 code. |
| `consumed_at` | `DATETIME NULL` | Successful registration timestamp. |
| `consumed_by_user_id` | `INT NULL` | Winning registration subject; SET NULL on purge. |

Keys/indexes: PRIMARY (slot) UNIQUE; staff_code_generation (generation_id) UNIQUE; staff_code_creator (creator_user_id) INDEX; staff_code_consumer (consumed_by_user_id) INDEX.

Foreign keys:
- staff_code_creator_fk: (creator_user_id) → users (id), ON DELETE SET NULL, ON UPDATE RESTRICT.
- staff_code_consumer_fk: (consumed_by_user_id) → users (id), ON DELETE SET NULL, ON UPDATE RESTRICT.

Account lifecycle: archive/restore preserves these rows and acceptance validity depends on current pointers. Retention Hold, six-calendar-month retention and seven-day purge grace stay in existing lifecycle code. No new account FK uses RESTRICT. Purge cascades account acceptance/recipient copies and nulls institutional creator/reviewer/sender/code attribution. Legal history remains; no unnecessary personal snapshots. Unresolved document workflow and recoverable file purge remain governed by existing checks. New B7/B8 sends must use existing recipient locking/purge guards; B9 events contain generation ID/action/actor/time only, never a secret/hash.

## notifications

MODIFIED — B7/B8 reuse existing recipient delivery copies with independent read/archive/delete and account binding.

| Column | Type / nullability / default | Required purpose |
|---|---|---|
| `campaign_id` | `INT NULL` | Logical send; null for preserved legacy copies with no fabricated campaign. |
| `recipient_user_id` | `INT NULL` | Future exact authenticated recipient binding; CASCADE on purge. Existing role/profile/email semantics remain. |
| `archived_at` | `DATETIME NULL` | Independent recipient archive. |
| `deleted_at` | `DATETIME NULL` | Independent recipient deletion; B7 erases subject/message/delivery_info without touching others. |

Keys/indexes: notification_campaign (campaign_id) INDEX; notification_user (recipient_user_id, created_at) INDEX.

Foreign keys:
- notification_campaign_fk: (campaign_id) → notification_campaigns (id), ON DELETE SET NULL, ON UPDATE RESTRICT.
- notification_user_fk: (recipient_user_id) → users (id), ON DELETE CASCADE, ON UPDATE RESTRICT.

Account lifecycle: archive/restore preserves these rows and acceptance validity depends on current pointers. Retention Hold, six-calendar-month retention and seven-day purge grace stay in existing lifecycle code. No new account FK uses RESTRICT. Purge cascades account acceptance/recipient copies and nulls institutional creator/reviewer/sender/code attribution. Legal history remains; no unnecessary personal snapshots. Unresolved document workflow and recoverable file purge remain governed by existing checks. New B7/B8 sends must use existing recipient locking/purge guards; B9 events contain generation ID/action/actor/time only, never a secret/hash.

## Future consumers

| Batch | Persistence | Additional migration |
|---|---|---|
| B7 | notification_campaigns; notifications.campaign_id/recipient_user_id/read_at/archived_at/deleted_at; activity_logs secret/content-free deletion events | None planned |
| B8 | campaign.kind=support, support_category, reply_to_campaign_id; snapshot current Admin users into recipient copies at send | None planned |
| B9 | staff_registration_code singleton; activity_logs generation events; users existing complete Admin identity | None planned |
| B10 | documents versions/review/RPMS submission; activity_logs document return/reason/resubmission; ierb_history | None planned |
| B11 | documents override fields; activity_logs reason/is_override and document version identity | None planned |
| B12 | deployment-bound verification file/config plus schema manifest | No DB schema |

Admin-count publication race: lock every users row in PK order with a full locking scan under SERIALIZABLE (next-key locks include insertion gaps), then lock policies in fixed order. Lifecycle account changes already lock affected users; registration/invitation inserts must wait on the locked range. Revalidate identity, active status, password-change eligibility and exact credential fingerprint inside the transaction. Count all currently active admin logins conservatively; a password-change restriction does not erase an active Admin from the independence rule.

Schema freeze will be declared only after disposable migration parity, compatibility, lifecycle, governance and gate validation.
