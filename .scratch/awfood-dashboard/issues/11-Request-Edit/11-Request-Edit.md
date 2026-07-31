# 11 — Request Edit (employee ajukan, owner approve)

**What to build:** Setelah closing di-submit, employee bisa ajukan request edit. Halaman employee: pilih closing, isi reason + data baru. Server action INSERT audit_request_edits (PENDING_OWNER). Halaman owner: lihat pending request, compare old vs new data, approve (terapkan perubahan) atau reject. Vitest.

Routes: `/employee/request-edit`, `/owner/request-edit`

**Blocked by:** 07

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [11a — Employee daftar closing](11a-Employee-Closing-List.md)
- [11b — Employee form request edit](11b-Employee-Request-Edit-Form.md)
- [11c — Owner daftar pending](11c-Owner-Pending-List.md)
- [11d — Owner approve/reject](11d-Owner-Approve-Reject.md)
- [11e — Vitest](11e-Request-Edit-Vitest.md)

**Dependency graph:**
```
02b, 07e ──> 11a ──> 11b
02c ──> 11c ──> 11d
11b ──> 11d
03b ──> 11e
```
