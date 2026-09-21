# Security Specification: Projeto Farda Firestore ABAC Rules

## 1. Data Invariants
- All operational and student entities belong strictly to `/users/{userId}/*`.
- A user can NEVER read, create, modify, or delete another user's profile, editais, plans, sessions, reviews, reminders, or simulados.
- Every single entity path variable must pass `isValidId` formatting (alphanumeric and hyphens, <= 128 characters).
- Field length boundary limits: string fields are checked for maximum size constraints to prevent Denial of Wallet attacks.

## 2. The "Dirty Dozen" Threat Scenarios
1. **Cross-Tenant Document Read**: User A attempts to read `/users/userB/editais/edital-1`. (Denied: `request.auth.uid == userId` fails).
2. **Cross-Tenant Collection List**: User A attempts to list `/users/userB/studySessions`. (Denied: `request.auth.uid == userId` fails).
3. **Unauthenticated Access**: Unauthenticated visitor attempts to read `/users/userA/settings/user_settings`. (Denied: `isSignedIn()` fails).
4. **Id Poisoning Injection**: User A attempts to create a document with a 2048-byte ID or path traversal like `../../../etc`. (Denied: `isValidId()` fails regex / length).
5. **Payload Oversize Injection**: User A attempts to send a 5MB notes string in `StudySession`. (Denied: `notes.size() <= 2000` limit fails).
6. **Cross-User Spoof Write**: User A attempts to write a session to `/users/userB/studySessions/sess-1` specifying `userId: userB`. (Denied: `isOwner(userId)` fails).
7. **Identity Mutation Attack**: User A attempts to change `userId` in an existing `edital` to claim ownership of another user's space. (Denied: `userId` check fails).
8. **Catch-All Probe Attack**: Attacker tries to query an unlisted root collection `/secret_keys/` or `/admins/`. (Denied: global `match /{document=**} { allow read, write: if false; }`).
9. **Junk Field Pollution**: Malicious client sends invalid data types (number instead of string title, array instead of number duration). (Denied: validator type check fails).
10. **Orphaned Subcollection Tamper**: Attacker creates a document in `/users/userB/reminders/rem-1`. (Denied: `isOwner(userId)` enforces strict match).
11. **Malicious Simulado Score Tamper**: Attacker creates simulado on another user's account. (Denied: `isOwner(userId)` fails).
12. **Null Resource Pointer Attack**: Rule logic accessing `incoming()` on delete or `existing()` on create. (Prevented: using context-specific checks).
