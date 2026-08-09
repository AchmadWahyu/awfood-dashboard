# 06 — Restock Minuman (owner)

> **Status rilis: OFF di first release** (keputusan 2026-08-09). Fitur sengaja tidak diaktifkan pada rilis pertama sampai waktu yang belum ditentukan, tapi **bisa diaktifkan kapan saja** via feature flag `lib/feature-flags.ts` (`restock: true`). Halaman di MVP sudah ada di filesystem, hanya tidak muncul di navigasi. Ticket ini tetap target produksi.

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
