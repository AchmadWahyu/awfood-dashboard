# 07c — Closing: Live calculation (terjual, subtotal, grand total)

**What to build:** Live calculation: `terjual = stok_awal - stok_akhir`, subtotal per supplier (`sum(terjual * sell_price)`), grand total (`sum(subtotal)`). Update real-time saat input berubah.

**Blocked by:** 07b

**Status:** ready-for-agent

- [ ] `calcTerjual(stokAwal, stokAkhir)` — number, pure function
- [ ] `calcSubtotal(items: ClosingItem[])` — sum of terjual * sell_price
- [ ] `calcGrandTotal(suppliers: SupplierClosing[])` — sum of subtotals
- [ ] Live update display saat input berubah
