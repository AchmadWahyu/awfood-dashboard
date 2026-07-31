# 14 — Dashboard Overview (KPI, grafik, pending alerts)

**What to build:** Halaman utama owner (`/owner/dashboard`) dengan:
- Pending action alerts: jumlah request edit pending, selisih > 5k, klaim pending
- KPI cards: omzet hari ini (total expected revenue dari closing VERIFIED), kas vs QRIS (perbandingan), total utang supplier (dari supplier_ledger), status selisih (jumlah open)
- Grafik tren omzet 7/30 hari
- Top 5 kue terlaris (berdasarkan qty_sold dari closing VERIFIED)

**Blocked by:** 09, 11, 12

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [14a — Pending action alerts](14a-Pending-Alerts.md)
- [14b — KPI cards](14b-KPI-Cards.md)
- [14c — Grafik tren omzet](14c-Omzet-Trend-Chart.md)
- [14d — Top 5 kue terlaris](14d-Top-5-Items.md)

**Dependency graph:**
```
02c, 11c, 10a, 12b ──> 14a ──> 14b ──> 14c
                      14b ──> 14d
```
