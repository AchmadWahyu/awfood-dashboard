# 06 — Restock Minuman (owner)

**What to build:** Halaman owner untuk mencatat restock minuman milik sendiri. Form pilih item (MINUMAN_OWNER), input qty, tanggal. Server action. Vitest untuk logic.

Route: `/owner/restock`

**Blocked by:** 05

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [06a — Halaman daftar riwayat restock](06a-Restock-History-Page.md)
- [06b — Form restock](06b-Restock-Form.md)
- [06c — Server action](06c-Restock-Server-Action.md)
- [06d — Vitest](06d-Restock-Vitest.md)

**Dependency graph:**
```
02c, 05a ──> 06a ──> 06b
01e ──> 06c ──> 06d
03b ──> 06d
```
