# Security Specification - BarberPro BI

## 1. Data Invariants
- All data belongs to a specific user and is stored under `users/{userId}/...`.
- A user can only access (read/write) data if they are authenticated and their `uid` matches the `userId` in the path.
- Profissional ID in the document must be a valid string.
- Monthly production data must correspond to a valid profissional if applicable.
- All documents must have strict schema validation (types, sizes, required fields).

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

1. **Identity Spoofing**: Attempt to create a professional under `users/userA/profissionais` while logged in as `userB`.
2. **Path ID Injection**: Attempt to use a 2KB string as a `docId` to cause resource exhaustion.
3. **Ghost Field Update**: Attempt to add `isAdmin: true` to a professional document.
4. **Invalid Type Injection**: Attempt to set `cadeira` (chair) as a string instead of a number.
5. **Unauthorized List Query**: Attempt to query `users/userA/profissionais` while logged in as `userB`.
6. **Self-Assigned Permissions**: Attempt to create a user profile document with admin flags.
7. **Orphaned Write**: Attempt to save production data for a non-existent month (e.g., month 13). (Wait, month validation).
8. **PII Leak**: Attempt to read another user's basic info document.
9. **State Shortcut**: (N/A for this app as it's mostly CRUD).
10. **Shadow Key**: Create a professional with extra fields not in blueprint.
11. **Negative Money**: Set `valor` in `gastos` to a negative number.
12. **Future Dates**: (If applicable, but let's stick to basic type/size for now).

## 3. Test Runner (Conceptual)
See `firestore.rules.test.ts`.
