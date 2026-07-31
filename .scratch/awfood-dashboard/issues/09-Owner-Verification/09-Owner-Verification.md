# 09 — Owner Verifikasi Closing (satu langkah + selisih ≤5k)

**What to build:** Halaman owner untuk verifikasi closing. Lihat daftar closing pending (status SUBMITTED) → buka detail: tampilkan stok per supplier, expected revenue, kas fisik, dan supplier payments dari laci. Owner konfirmasi kas fisik, input QRIS final. Sistem hitung discrepancy:
```
adjusted_cash = cash_physical + sum(paid_from_drawer payments)
discrepancy = expected_revenue - (adjusted_cash + qris_verified)
```
Jika discrepancy ≤ Rp5.000 → auto resolve (catat di notes + discrepancy amount).
Update daily_closings: status = VERIFIED, verified_by, verified_at.
Vitest untuk reconciliation calculation & discrepancy handling.

Route: `/owner/verification`

**Blocked by:** 07, 08

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [09a — Daftar closing pending](09a-Pending-Closing-List.md)
- [09b — Detail closing](09b-Closing-Detail-Stok-Expected.md)
- [09c — Konfirmasi kas fisik](09c-Konfirmasi-Kas-Fisik.md)
- [09d — Input QRIS final](09d-Input-QRIS-Final.md)
- [09e — Hitung discrepancy](09e-Calculate-Discrepancy.md)
- [09f — Auto-resolve ≤ 5000](09f-Auto-Resolve-Small-Discrepancy.md)
- [09g — Update status VERIFIED](09g-Verified-Update-Status.md)
- [09h — Vitest](09h-Verification-Vitest.md)

**Dependency graph:**
```
02c, 07e ──> 09a ──> 09b ──> 09c ──> 09e ──> 09f ──> 09g
                09b ──> 09d ──> 09e
08c ──> 09b
01e ──> 09g
03b ──> 09h
```
