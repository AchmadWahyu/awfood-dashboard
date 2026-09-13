# 13b — Ledger: Detail per supplier

**What to build:** Klik supplier → detail: riwayat penjualan per closing (dari daily_closing_items JOIN closing) + riwayat pembayaran (dari supplier_settlements).

**Blocked by:** 13a

**Status:** ready-for-agent

- [ ] Tabel riwayat penjualan: tanggal closing, item, qty, subtotal
- [ ] Tabel riwayat pembayaran: tanggal, nominal, metode, sumber (laci/owner)
- [ ] Total hutang tersisa
