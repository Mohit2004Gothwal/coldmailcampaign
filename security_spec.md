# Cold Mail Campaign Automator - Security Specification

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be accessed or modified by `request.auth.uid == userId`.
2. **Subcollection Containment**: Sent email records `/users/{userId}/sent_mails/{mailId}` and settings `/users/{userId}/settings/{settingId}` belong strictly to the authenticated parent `userId`.
3. **Immutability Invariant**: Sent emails are tamper-proof audit records. Once created, they cannot be modified. They can only be deleted or read by their owner.
4. **Relational Sync**: Every `sent_mails` record must have `incoming().userId == userId && incoming().userId == request.auth.uid`.
5. **No Cross-User Access**: Unauthenticated requests or requests with mismatched UIDs are rejected with PERMISSION_DENIED.
6. **Payload Size Guard**: Subject lines are limited to <= 512 characters, body to <= 25,000 characters, recipient email to <= 256 characters.

## 2. The "Dirty Dozen" Payloads (Vulnerability Scenarios)
1. **Unauthenticated User Profile Read**: Anonymous/unauthenticated `get /users/victim-123` -> Rejected.
2. **Cross-Tenant User Profile Write**: Attacker (`uid: attacker`) attempts `setDoc(/users/victim-123, { ... })` -> Rejected.
3. **Spoofed Sender UID in SentMail**: Attacker creates `/users/attacker/sent_mails/mail-1` with `userId: 'victim'` -> Rejected (fails identity integrity).
4. **Injected Subcollection to Foreign User**: Attacker writes directly to `/users/victim/sent_mails/mail-evil` -> Rejected (fails parent userId match).
5. **Modification of Immutable Sent Mail**: User attempts `updateDoc(/users/user1/sent_mails/mail-1, { body: 'tampered' })` -> Rejected (sent logs are write-once).
6. **Oversized Field Attack (Denial of Wallet)**: Attacker attempts to insert a 2MB string in `subject` -> Rejected (`.size() <= 512` guard).
7. **Junk Characters in Mail ID**: Attacker targets `/users/user1/sent_mails/$$$evil_id%%%` -> Rejected (`isValidId` regex guard).
8. **Blanket List Scraping**: Non-owner attempts `list /users/{userId}/sent_mails` without authentication -> Rejected.
9. **Settings Hijack**: Attacker updates `/users/victim/settings/campaign` to overwrite draft template -> Rejected.
10. **Ghost Field / Shadow Key Injection**: Attacker includes `isAdmin: true` in `UserProfile` -> Rejected (keys validation).
11. **Malicious Email Format Injection**: Attacker injects 10,000 characters into email field -> Rejected.
12. **Unbounded Pending Queue Injection**: Setting `pendingEmails` with oversized payload > 1,000 items -> Rejected.
