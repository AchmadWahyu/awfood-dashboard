# 09e — Verification: Hitung discrepancy

**What to build:** Sistem hitung discrepancy saat verifikasi:
```
adjusted_cash = (cash_physical - cash_initial) + sum(expenses CASH_LACI) + sum(drawer supplier settlements)
discrepancy = total_omzet - (adjusted_cash + qris_verified)
```
Tampilkan hasil discrepancy ke owner.

**Blocked by:** 09c, 09d

**Status:** ready-for-agent

**Keputusan desain (ADR-0001 + ADR-0002):** Formula lengkap rekonsiliasi:
- `cash_initial` diinput **owner saat verifikasi (wajib)** — bukan staff (ADR-0002). Form verifikasi punya input "uang kembalian awal di laci".
- Uang yang keluar dari kantong ditambahkan kembali ke saldo yang diharapkan: pengeluaran `CASH_LACI` dan setoran supplier dari laci (ADR-0001).
- Tombol verifikasi terkunci sampai `cash_initial` terisi.

- [ ] Pure function `calcDiscrepancy(expectedRevenue, cashPhysical, cashInitial, expensesCashLaci, drawerSettlements, qrisVerified)`
- [ ] Input `cash_initial` (wajib) di form verifikasi
- [ ] Tampilkan: expected revenue, kas fisik, − kas awal, + pengeluaran CASH_LACI, + setoran dari laci = adjusted cash, + QRIS, discrepancy
- [ ] Color coding: hijau jika ≤ 5000, merah jika > 5000
