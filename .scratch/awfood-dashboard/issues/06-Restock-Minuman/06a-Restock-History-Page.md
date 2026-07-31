# 06a — Restock: Halaman daftar riwayat restock

**What to build:** Halaman `/owner/restock` dengan tabel riwayat restock minuman: item, qty, tanggal, dibuat oleh. Urut dari terbaru.

**Blocked by:** 02c, 05a

**Status:** ready-for-agent

- [ ] Halaman `/owner/restock` (protected middleware)
- [ ] Tabel: nama item, qty, tanggal, created_by
- [ ] Server action `listRestocks` — SELECT item_restocks JOIN items
