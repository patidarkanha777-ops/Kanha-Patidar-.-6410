# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Global Default Deny**: Any path not explicitly matched under `/projects/{projectId}` or `/leads/{leadId}` is denied.
2. **Project Ownership & Immutability**: Every `/projects/{projectId}` document must have an `ownerId` matching `request.auth.uid` on creation. On update, `ownerId` and `createdAt` are strictly immutable, and `updatedAt` must equal `request.time`.
3. **Published Live Link Access**: A `/projects/{projectId}` document may be read via `get` if `resource.data.isPublished == true` (for 1-click shareable live preview links) OR if the requester is the authenticated owner (`resource.data.ownerId == request.auth.uid`). `list` queries on `/projects` are strictly restricted to `resource.data.ownerId == request.auth.uid`.
4. **PII Isolation on Leads**: `/leads/{leadId}` contains `visitorEmail` and `visitorName`. Both `get` and `list` are strictly restricted to the authenticated owner (`resource.data.ownerId == request.auth.uid`). Updates to leads are forbidden (immutable audit log), and only the owner can delete a lead.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing on Project Create**: `{ ownerId: "other_user_123", name: "Spoof", ... }` -> `PERMISSION_DENIED` (`ownerId != request.auth.uid`).
2. **Shadow Field Injection on Project Create**: `{ ..., isAdmin: true }` -> `PERMISSION_DENIED` (`keys().hasOnly(...)` rejects extra keys).
3. **Unverified Email Write**: Authenticated user with `email_verified == false` attempts to create a project -> `PERMISSION_DENIED`.
4. **ID Poisoning Attack**: Document ID with >128 characters or special characters (`project$123`) -> `PERMISSION_DENIED` (`isValidId` fails).
5. **Resource Exhaustion (1MB String)**: `customCss` > 50,000 chars -> `PERMISSION_DENIED`.
6. **Owner Hijack on Project Update**: Changing `ownerId` during update -> `PERMISSION_DENIED` (`incoming().ownerId == existing().ownerId`).
7. **Timestamp Forgery**: Client provides forged `createdAt` or `updatedAt` != `request.time` -> `PERMISSION_DENIED`.
8. **Unauthorized Private Project Read**: User B attempts `get` on User A's unpublished project (`isPublished == false`) -> `PERMISSION_DENIED`.
9. **Blanket Project List Scraping**: User B attempts `list` on `/projects` without `where('ownerId', '==', auth.uid)` -> `PERMISSION_DENIED`.
10. **PII Leak on Leads**: User B attempts `get` or `list` on `/leads/{leadId}` owned by User A -> `PERMISSION_DENIED`.
11. **Invalid FormType Enum on Lead**: `formType: "hack"` -> `PERMISSION_DENIED`.
12. **Lead Mutation Attempt**: Any user attempts `update` on `/leads/{leadId}` -> `PERMISSION_DENIED`.
