# 11 — Request Edit (employee ajukan, owner approve)

**What to build:** Setelah closing di-submit, employee bisa ajukan request edit. Halaman employee: pilih closing, edit seluruh data penutupan (seperti form closing) + reason. Request disimpan sebagai **snapshot penuh** (items + kas fisik). Halaman owner: lihat pending request, lihat snapshot vs data lama, approve (terapkan perubahan + hitung ulang selisih) atau reject. Vitest.

Routes: `/employee/request-edit`, `/owner/request-edit`

**Blocked by:** 07

**Status:** parent — lihat sub-tickets di bawah

**Keputusan desain (ADR-0002):** Request edit memakai **snapshot penuh** (bukan per-field). Staff tidak bisa mengubah `cash_initial` — field tak tampil di form dan dipertahankan dari closing saat approve.

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
