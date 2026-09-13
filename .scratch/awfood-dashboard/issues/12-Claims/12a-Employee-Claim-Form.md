# 12a — Claims: Employee form klaim

**What to build:** Employee pilih closing miliknya → form klaim per item: pilih item, claim_type (RUSAK_DI_LAPAK / BONUS_PELANGGAN / KONSUMSI_INTERNAL), qty, notes. Submit → INSERT item_claims (PENDING).

**Blocked by:** 02b, 07e

**Status:** ready-for-agent

- [ ] Halaman `/employee/claims` (protected STAFF)
- [ ] Pilih closing milik employee (dropdown/table)
- [ ] Form: pilih item dari closing, claim_type, qty, notes
- [ ] Server action `submitClaim` — INSERT item_claims (PENDING)
