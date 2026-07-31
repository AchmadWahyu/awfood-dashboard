# 01e — Setup: Supabase client helpers

**What to build:** Ikut pola docs Supabase terbaru (2 server client digabung jadi 1) + proxy untuk refresh session:

- `lib/supabase/server.ts` — `createClient()` untuk Server Components, Server Actions, DAN Route Handlers (anon key + cookies)
- `lib/supabase/client.ts` — `createBrowserClient()` untuk client components (anon key)
- `proxy.ts` — proxy Next.js 16 untuk refresh token session tiap request (pengganti middleware, sebelumnya `server-action.ts` sudah tidak dipakai)

**Blocked by:** 01c, 01d

**Status:** ready-for-agent

- [x] `lib/supabase/server.ts` — `createClient()` using anon key + cookies
- [x] `lib/supabase/client.ts` — `createBrowserClient()` using anon key
- [x] `proxy.ts` di root project — refresh session via `getClaims()`
- [x] `pnpm dev` masih jalan tanpa error
