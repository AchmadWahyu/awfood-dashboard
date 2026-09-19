# 03b — Setup: Test helpers (mock client + factories)

**What to build:** Buat helper functions untuk test:
- Mock Supabase client (`createMockSupabaseClient`) yang return fake data
- Factory functions untuk Profile, Supplier, Item, Closing

**Blocked by:** 03a

**Status:** ready-for-agent

- [ ] `test/helpers/mock-supabase.ts` — mock `from().select().eq()` chain
- [ ] `test/helpers/factories.ts` — factory untuk Profile, Supplier, Item, DailyClosing, DailyClosingItem
