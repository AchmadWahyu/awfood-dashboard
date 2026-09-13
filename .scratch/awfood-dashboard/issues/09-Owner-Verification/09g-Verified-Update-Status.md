# 09g — Verification: Update closing status = VERIFIED

**What to build:** Server action `verifyClosing` — UPDATE daily_closings: status = VERIFIED, verified_by, verified_at, cash_physical_verified, qris_verified, discrepancy_amount, notes.

**Blocked by:** 01e, 09f

**Status:** ready-for-agent

- [ ] `actions/verification.ts` — verifyClosing
- [ ] Update semua field yang relevan
- [ ] Return success
