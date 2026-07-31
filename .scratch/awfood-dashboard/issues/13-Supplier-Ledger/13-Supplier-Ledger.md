# 13 — Supplier Ledger + Pembayaran Owner

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
