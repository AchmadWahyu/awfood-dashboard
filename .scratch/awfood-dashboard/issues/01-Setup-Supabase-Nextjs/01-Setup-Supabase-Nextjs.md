# 01 — Setup: Supabase project + schema + Next.js deps

**What to build:** Buat project Supabase baru, apply schema dari `docs/agents/db_schema.sql`, install dependencies Next.js + Supabase client (`@supabase/supabase-js`, `@supabase/ssr`) + bcrypt, setup environment variables, dan setup client helpers (server component, server action, client).

**Blocked by:** None — can start immediately

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [01a — Create Supabase project](01a-Create-Supabase-Project.md)
- [01b — Apply schema SQL](01b-Apply-Schema-SQL.md)
- [01c — Install dependencies](01c-Install-Dependencies.md)
- [01d — Setup environment variables](01d-Setup-Env-Variables.md)
- [01e — Create Supabase client helpers](01e-Create-Supabase-Client-Helpers.md)

**Dependency graph:**
```
01a ──> 01b
      01c ──> 01d ──> 01e
```
