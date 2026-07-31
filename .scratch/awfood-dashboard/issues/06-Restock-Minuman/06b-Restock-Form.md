# 06b — Restock: Form restock minuman

**What to build:** Form tambah restock: pilih item (dropdown filter item MINUMAN_OWNER), input qty, tanggal (default hari ini).

**Blocked by:** 06a

**Status:** ready-for-agent

- [ ] Dropdown item: filter hanya MINUMAN_OWNER yang aktif
- [ ] Input qty (number, min 1)
- [ ] Input tanggal (date picker, default hari ini)
- [ ] Server action `createRestock` — INSERT item_restocks
- [ ] Toast/feedback setelah sukses
