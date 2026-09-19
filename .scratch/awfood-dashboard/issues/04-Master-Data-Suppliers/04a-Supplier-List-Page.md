# 04a — Suppliers: Halaman daftar supplier

**What to build:** Halaman `/owner/suppliers` dengan tabel daftar supplier: kolom nama, telepon, status aktif. Panggil server action `listSuppliers`.

**Blocked by:** 02c

**Status:** ready-for-agent

- [ ] Halaman `/owner/suppliers` (protected middleware)
- [ ] Tabel: nama, telepon, status aktif (badge hijau/merah)
- [ ] Server action `listSuppliers` — SELECT from suppliers WHERE is_active = true
