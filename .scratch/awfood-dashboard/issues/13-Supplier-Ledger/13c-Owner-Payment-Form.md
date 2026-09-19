# 13c — Ledger: Owner bayar supplier (dari luar laci)

**What to build:** Form pembayaran supplier dari owner (paid_from_drawer = FALSE): pilih supplier, nominal, metode (cash/transfer).

**Blocked by:** 13b

**Status:** ready-for-agent

- [ ] Tombol "Bayar" di detail supplier
- [ ] Form: supplier (pre-filled), nominal, metode
- [ ] Server action `createOwnerPayment` — INSERT supplier_settlements (paid_from_drawer = FALSE)
