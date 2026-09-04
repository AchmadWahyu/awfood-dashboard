# 02c — Auth: Middleware + role protection

**What to build:** Middleware (`middleware.ts`) yang redirect unauthenticated users ke `/login`. Proteksi route: `/owner/*` hanya untuk role OWNER, `/employee/*` hanya untuk role STAFF.

**Blocked by:** 02a

**Status:** implemented (Next 16 pakai `proxy.ts`, bukan `middleware.ts`)

- [x] Middleware: baca session dari cookie, jika tidak ada → redirect `/login`
- [x] Cek role untuk `/owner/*` — hanya OWNER yang bisa akses
- [x] Cek role untuk `/employee/*` — hanya STAFF yang bisa akses
- [x] Allow `/login` dan `/login/pin` tanpa auth
- [x] Matcher config yang tepat (jangan middleware di semua route)

## Comments

- 2026-08-09 (implementasi langsung): Next.js 16 mengganti nama `middleware.ts` menjadi `proxy.ts` (root) dengan export `proxy()`. Yang diisi logikanya adalah `lib/supabase/proxy.ts` → `updateSession()`: redirect unauthenticated ke `/login`, lalu proteksi role `/owner/*` (OWNER) & `/employee/*` (STAFF) via query `profiles.role`. Root `proxy.ts` sudah ada sejak setup (issue 01), jadi tidak ada file baru.
- Catatan: cek role di middleware butuh GRANT SELECT `profiles` untuk `authenticated` (blok GRANTS di db_schema.sql section 9). Layout juga tetap memakai `useRequireRole` sebagai lapis kedua.

- **2026-08-09 (lanjutan):** Gejala "login owner sukses tapi balik ke /login" ternyata karena middleware gagal query `profiles` (role `authenticated` belum dapat GRANT) → role null → redirect balik. Sekarang middleware hanya redirect saat role TERKONFIRMASI tidak cocok; kalau query error, ia meneruskan request (lapis kedua: useRequireRole + RLS) + `console.error` untuk debugging. Root cause tetap GRANT — jalankan blok GRANTS section 9.
