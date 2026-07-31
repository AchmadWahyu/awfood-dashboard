# 08c — Supplier Payment: Server action

**What to build:** Server action `createSupplierPayment` — INSERT supplier_settlements dengan paid_from_drawer = TRUE.

**Blocked by:** 01e

**Status:** ready-for-agent

- [ ] `actions/supplier-payments.ts` — createSupplierPayment
- [ ] INSERT supplier_settlements (supplier_id, amount, payment_method, paid_from_drawer = TRUE)
- [ ] Ambil employee_id dari session
