# 09e — Verification: Hitung discrepancy

**What to build:** Sistem hitung discrepancy:
```
adjusted_cash = cash_physical + sum(paid_from_drawer payments)
discrepancy = expected_revenue - (adjusted_cash + qris_verified)
```
Tampilkan hasil discrepancy ke owner.

**Blocked by:** 09c, 09d

**Status:** ready-for-agent

- [ ] Pure function `calcDiscrepancy(expectedRevenue, cashPhysical, paymentsFromDrawer, qrisVerified)`
- [ ] Tampilkan: expected revenue, cash physical, + payments = adjusted cash, + QRIS, discrepancy
- [ ] Color coding: hijau jika ≤ 5000, merah jika > 5000
