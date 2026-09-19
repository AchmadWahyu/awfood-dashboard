# 01b — Setup: Apply schema SQL

**What to build:** Run `docs/agents/db_schema.sql` against the new Supabase project (via SQL Editor). This creates all tables, views, enums, and RLS policies.

**Blocked by:** 01a

**Status:** ready-for-agent

- [ ] SQL script runs without errors
- [ ] All tables created (profiles, suppliers, items, daily_closings, daily_closing_items, etc.)
- [x] All views created (supplier_ledger) — **DEFERRED**: view `supplier_ledger` tidak ada di `db_schema.sql`. Dibangun bersama issue 13 (Supplier Ledger) karena logikanya belum detail di spec.
- [ ] All enums created
- [ ] RLS policies applied
