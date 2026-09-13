# 06c — Restock: Server action

**What to build:** Server action `createRestock` — INSERT ke item_restocks dengan created_by dari session.

**Blocked by:** 01e

**Status:** ready-for-agent

- [ ] `actions/restocks.ts` — createRestock
- [ ] Ambil user_id dari session via `createServerActionClient`
- [ ] Return { success, data, error }
