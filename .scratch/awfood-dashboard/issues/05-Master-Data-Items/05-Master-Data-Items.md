# 05 — Master Data: Items CRUD (owner)

**What to build:** Halaman owner untuk manage items (kue konsinyasi + minuman). Item KONSINYASI_KUE terhubung ke supplier, item MINUMAN_OWNER tidak. Server action untuk setiap operasi. Vitest untuk CRUD logic.

Route: `/owner/items`

**Blocked by:** 04

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [05a — Halaman daftar items](05a-Item-List-Page.md)
- [05b — Form tambah item](05b-Item-Create-Form.md)
- [05c — Form edit item](05c-Item-Edit-Form.md)
- [05d — Soft-delete item](05d-Item-Soft-Delete.md)
- [05e — Server actions](05e-Item-Server-Actions.md)
- [05f — Vitest](05f-Item-Vitest.md)

**Dependency graph:**
```
02c, 04a ──> 05a ──> 05b ──> 05c
05a ──> 05d
01e ──> 05e ──> 05f
03b ──> 05f
```
