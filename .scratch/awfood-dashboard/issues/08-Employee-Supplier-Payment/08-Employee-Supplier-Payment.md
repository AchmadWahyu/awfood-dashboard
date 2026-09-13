# 08 — Employee Catat Pembayaran Supplier (dari laci)

**What to build:** Halaman employee untuk mencatat pembayaran supplier dari uang laci toko. Form pilih supplier, nominal, metode (cash/transfer). Server action INSERT supplier_settlements (paid_from_drawer = TRUE). Vitest.

Route: `/employee/supplier-payments`

**Blocked by:** 04, 07

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [08a — Halaman daftar pembayaran](08a-Payment-History-Page.md)
- [08b — Form catat pembayaran](08b-Payment-Form.md)
- [08c — Server action](08c-Payment-Server-Action.md)
- [08d — Vitest](08d-Payment-Vitest.md)

**Dependency graph:**
```
02b, 04a ──> 08a ──> 08b
01e ──> 08c ──> 08d
03b ──> 08d
```
