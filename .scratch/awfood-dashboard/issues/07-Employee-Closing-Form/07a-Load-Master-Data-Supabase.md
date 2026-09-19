# 07a — Closing: Load master data from Supabase

**What to build:** Ganti hardcoded data di halaman penutupan dengan load data dari Supabase: daftar suppliers aktif + items aktif per supplier.

**Blocked by:** 02b, 05a

**Status:** ready-for-agent

- [ ] Server action `getClosingMasterData` — SELECT suppliers aktif + items aktif
- [ ] Halaman panggil server action di mount
- [ ] Loading state while fetching
