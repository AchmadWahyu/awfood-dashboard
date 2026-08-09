# 13 — Supplier Ledger + Pembayaran Owner

> **Status rilis: OFF di first release** (keputusan 2026-08-09). Fitur sengaja tidak diaktifkan pada rilis pertama sampai waktu yang belum ditentukan, tapi **bisa diaktifkan kapan saja** via feature flag `lib/feature-flags.ts` (`ledger: true`). Halaman di MVP sudah ada di filesystem, hanya tidak muncul di navigasi. Ticket ini tetap target produksi.

**What to build:** Halaman owner untuk lihat saldo hutang per supplier (dari view `supplier_ledger`) + riwayat penjualan per supplier + form pembayaran supplier (dari luar laci, paid_from_drawer = FALSE). Detail per supplier: total terjual (qty_sold * buy_price), total dibayar, saldo hutang.

Routes: `/owner/supplier-ledger`

**Blocked by:** 09

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [13a — Tabel supplier ledger](13a-Ledger-Table.md)
- [13b — Detail per supplier](13b-Supplier-Detail.md)
- [13c — Form pembayaran owner](13c-Owner-Payment-Form.md)
- [13d — Vitest](13d-Ledger-Vitest.md)

**Dependency graph:**
```
02c, 09g ──> 13a ──> 13b ──> 13c ──> 13d
03b ──> 13d
```
