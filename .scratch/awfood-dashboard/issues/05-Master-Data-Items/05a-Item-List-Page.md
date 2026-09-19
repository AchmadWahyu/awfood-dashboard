# 05a — Items: Halaman daftar items

**What to build:** Halaman `/owner/items` dengan tabel daftar items: nama, category (kue/minuman), supplier (jika kue), harga beli, harga jual, status aktif. Filter tabs/category: Semua / Kue / Minuman.

**Blocked by:** 02c, 04a

**Status:** ready-for-agent

- [ ] Halaman `/owner/items` (protected middleware)
- [ ] Tabel: nama, category badge, supplier (nullable), buy_price, sell_price, status aktif
- [ ] Filter tab: Semua / Kue / Minuman
- [ ] Server action `listItems` — SELECT items JOIN suppliers
