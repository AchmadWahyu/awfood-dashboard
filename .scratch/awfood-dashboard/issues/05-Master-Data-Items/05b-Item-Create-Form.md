# 05b — Items: Form tambah item

**What to build:** Form tambah item: nama, category (KONSINYASI_KUE / MINUMAN_OWNER), supplier dropdown (hanya jika category = KONSINYASI_KUE), buy_price, sell_price. Server action `createItem`.

**Blocked by:** 05a, 04a

**Status:** ready-for-agent

- [ ] Form: nama (required), category (radio/dropdown), supplier (conditional, required if KUE), buy_price, sell_price
- [ ] Server action `createItem` — INSERT into items
- [ ] Validasi: buy_price ≤ sell_price
- [ ] Toast/feedback setelah sukses
