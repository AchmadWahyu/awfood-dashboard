# 15 — Laporan & Export (.xlsx, .csv)

**What to build:** Halaman owner untuk generate laporan: laporan penjualan (filter date range), laporan supplier ledger, riwayat selisih. Export ke format Excel (.xlsx) dan CSV.

Route: `/owner/reports`

**Blocked by:** 09

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [15a — Laporan penjualan](15a-Sales-Report.md)
- [15b — Laporan supplier ledger](15b-Supplier-Ledger-Report.md)
- [15c — Riwayat selisih](15c-Discrepancy-History.md)
- [15d — Export .xlsx](15d-Export-Excel.md)
- [15e — Export .csv](15e-Export-CSV.md)

**Dependency graph:**
```
02c, 09g ──> 15a ──> 15b, 15c, 15d, 15e
13a ──> 15b
10c ──> 15c
```
