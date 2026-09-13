# 07e — Closing: Submit (INSERT daily_closings + items)

**What to build:** Server action `submitClosing` — INSERT daily_closings (status SUBMITTED) + daily_closing_items. Set status jadi SUBMITTED langsung (tanpa DRAFT).

**Blocked by:** 01e, 07c, 07d

**Status:** ready-for-agent

- [ ] `actions/closings.ts` — submitClosing
- [ ] INSERT daily_closings (employee_id, total_expected_revenue, cash_physical, status = SUBMITTED)
- [ ] INSERT daily_closing_items untuk setiap item
- [ ] Return closing_id
