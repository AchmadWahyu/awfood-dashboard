# 04 — Master Data: Suppliers CRUD (owner)

**What to build:** Halaman owner untuk manage supplier: lihat daftar (tabel), tambah, edit, soft-delete. Server action untuk setiap operasi. Vitest untuk CRUD logic.

Route: `/owner/suppliers`

**Blocked by:** 02, 03

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [04a — Halaman daftar supplier](04a-Supplier-List-Page.md)
- [04b — Form tambah supplier](04b-Supplier-Create-Form.md)
- [04c — Form edit supplier](04c-Supplier-Edit-Form.md)
- [04d — Soft-delete supplier](04d-Supplier-Soft-Delete.md)
- [04e — Server actions](04e-Supplier-Server-Actions.md)
- [04f — Vitest](04f-Supplier-Vitest.md)

**Dependency graph:**
```
02c ──> 04a ──> 04b ──> 04c
04a ──> 04d
01e ──> 04e ──> 04f
03b ──> 04f
```
