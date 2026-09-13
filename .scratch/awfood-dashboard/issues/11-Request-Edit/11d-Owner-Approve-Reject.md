# 11d — Request Edit: Owner approve/reject

**What to build:** Detail request: tampilkan snapshot usulan (items + kas fisik) dengan penanda item yang berubah vs closing saat ini. Tombol Approve (terapkan seluruh snapshot ke closing + status = APPROVED) atau Reject (status = REJECTED).

**Blocked by:** 11c, 11b

**Status:** ready-for-agent

**Keputusan desain (ADR-0002):** Saat approve, `cash_initial` **dipertahankan** dari closing (staff tidak bisa mengubahnya). Selisih dihitung ulang mengikuti data baru (items/kas fisik), pakai formula 09e.

- [ ] Tampilkan snapshot vs data lama, tandai item yang berubah
- [ ] Tombol Approve — server action `approveRequestEdit`: update closing (items, total_omzet, cash_physical), `cash_initial` dipertahankan, hitung ulang discrepancy
- [ ] Tombol Reject — server action `rejectRequestEdit`
- [ ] Toast + redirect
