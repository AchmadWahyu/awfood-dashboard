# 12 — Klaim Barang (rusak, bonus, konsumsi)

**What to build:** Employee bisa catat klaim per item (RUSAK_DI_LAPAK, BONUS_PELANGGAN, KONSUMSI_INTERNAL) untuk closing yang sudah di-submit. Server action INSERT item_claims (PENDING). Halaman owner: lihat pending claims, approve (kurangi expected revenue di reconciliation) atau reject. Vitest.

Routes: `/employee/claims`, `/owner/claims`

**Blocked by:** 07

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [12a — Employee form klaim](12a-Employee-Claim-Form.md)
- [12b — Owner daftar pending claims](12b-Owner-Claim-List.md)
- [12c — Owner approve/reject claim](12c-Owner-Approve-Reject-Claim.md)
- [12d — Vitest](12d-Claims-Vitest.md)

**Dependency graph:**
```
02b, 07e ──> 12a
02c ──> 12b ──> 12c ──> 12d
03b ──> 12d
```
