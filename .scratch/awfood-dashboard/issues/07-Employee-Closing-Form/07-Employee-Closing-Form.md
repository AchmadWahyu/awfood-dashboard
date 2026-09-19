# 07 — Employee Closing Form (Variant B → Supabase)

**What to build:** Migrasi prototype penutupan Variant B (Accordion) ke Supabase backend. Employee login → load master data (suppliers, items) dari Supabase → form accordion per supplier dengan input stok awal & stok akhir → live calculation terjual & total per supplier + grand total → input kas fisik → submit (INSERT daily_closings + daily_closing_items). Setelah submit tampilkan ringkasan + tombol request edit.

Route: `/employee/penutupan`

**Blocked by:** 02, 03, 05

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [07a — Load master data from Supabase](07a-Load-Master-Data-Supabase.md)
- [07b — Accordion UI per supplier](07b-Accordion-UI-Supplier-Stok.md)
- [07c — Live calculation](07c-Live-Calculations.md)
- [07d — Input kas fisik](07d-Input-Kas-Fisik.md)
- [07e — Submit closing](07e-Submit-Closing.md)
- [07f — Ringkasan setelah submit](07f-Submit-Summary.md)
- [07g — Tombol request edit](07g-Request-Edit-Button.md)
- [07h — Vitest pure functions](07h-Closing-Vitest-Pure-Functions.md)
- [07i — Vitest server action](07i-Closing-Vitest-Server-Action.md)

**Dependency graph:**
```
02b, 05a ──> 07a ──> 07b ──> 07c ──> 07e ──> 07f ──> 07g
                07b ──> 07d ──> 07e
                07c ──> 07h
                07e ──> 07i
01e ──> 07e
03b ──> 07h, 07i
```
