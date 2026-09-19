# Handoff: Staff Login Bounce Fix

**Date:** 2026-09-03
**Status:** owner dan staff terverifikasi manual; eksekusi E2E pending environment
**Focus:** Fix auth login flow that bounces back to `/login` after successful `signInWithPassword`

---

## TL;DR

Staff dan owner login sudah terverifikasi berhasil, tidak bounce, dan tetap berada di halaman tujuan setelah refresh. Spesifikasi Playwright tersedia; runner tidak dapat berjalan pada terminal WSL saat ini.

**Root cause terkonfirmasi:** redirect berasal dari `useRequireRole` di klien (bukan respons 3xx proxy). Setelah Server Action menyelesaikan login, `AuthProvider` masih menyimpan state user lama (`null`) ketika employee layout pertama kali mount.

**Fix:** `staffLogin` mengembalikan profil `STAFF`; halaman PIN menyetnya ke `AuthProvider`, menunggu state tersebut terpasang, baru bernavigasi ke `/employee/penutupan`. Adapter cookie dikembalikan ke pola standar `@supabase/ssr`.

**Update owner:** `ownerLogin` awalnya masih memakai redirect server-side sehingga mengalami race yang sama. Alurnya sekarang disamakan: action mengembalikan profil `OWNER`, halaman login memasang state provider, lalu bernavigasi ke `/owner/dashboard`.

---

## Root Cause

Redirect tidak datang dari proxy (`GET /employee/*` tidak mengembalikan 3xx), melainkan dari `useRequireRole("STAFF")` di browser. `AuthProvider` hidup di root layout; state awalnya masih `user = null` dari halaman login. Setelah `staffLogin` melakukan redirect server-side, employee layout dapat mount sebelum provider memiliki state staff baru, lalu lapis role guard mengirim pengguna kembali ke `/login`.

Cookie tidak menjadi akar masalah: `getAuthUser()` dapat membaca sesi dan profil `STAFF` di server. Browser tidak perlu membaca cookie secara langsung untuk perbaikan ini.

---

## Yang Sudah Dicoba (Chronologis)

### 1. IIFE removal di AuthProvider (`lib/auth.tsx`)
- Hapus IIFE `(async () => { getSession() })()` yang race dengan `onAuthStateChange`
- Tambah handle `INITIAL_SESSION` bersama `SIGNED_IN`
- **Hasil:** Masih bounce — `INITIAL_SESSION` fire tanpa user

### 2. httpOnly cookie override (`lib/supabase/server.ts`, `proxy.ts`)
- ubah `setAll` ke `{ ...options, httpOnly: false }` di server.ts dan proxy.ts
- **Hasil:** Cookie terlihat di DevTools tapi `document.cookie` tetap kosong

### 3. Raw Set-Cookie headers di proxy (`lib/supabase/proxy.ts`)
- bypass `NextResponse.cookies.set()`, buat raw `Set-Cookie` header strings via `supabaseResponse.headers.append('Set-Cookie', ...)`
- **Hasil:** Masih bounce

### 4. Grace period di useRequireRole
- Tambah state `settled` + timer 1 detik setelah `INITIAL_SESSION` fire tanpa user
- Dashboard sempat muncul tapi redirect setelah timer expire
- **Hasil:** `SIGNED_IN` tidak pernah fire dalam grace period

### 5. Server Action getAuthUser()
- Buat `getAuthUser()` di `app/login/actions.ts` yang baca session server-side via `createClient()` dari `lib/supabase/server.ts`
- Rewrite `AuthProvider` untuk panggil `getAuthUser()` alih-alih `createBrowserClient`
- Tambah logging `[server] getAuthUser:` ke terminal
- **Hasil:** Server membaca user dan profil `STAFF`, tetapi state provider belum tersinkron saat navigasi.

### 6. Sinkronisasi state sebelum navigasi (IMPLEMENTED)
- `staffLogin` kini mengembalikan profil `STAFF` setelah `signInWithPassword` sukses.
- Halaman `/login/pin` memasang profil itu ke `AuthProvider`, menunggu state tersedia, lalu menjalankan `router.replace("/employee/penutupan")`.
- Pemulihan sesi lama tidak boleh menimpa state login baru.

---

## Status Code Saat Ini

### File yang Diubah

**`lib/auth.tsx`** — `AuthProvider` tetap memulihkan sesi dari Server Action saat mount dan sekarang mengekspos `setAuthenticatedUser()` untuk login yang baru selesai. Tidak ada lagi subscription `onAuthStateChange`. `useRequireRole` tetap menjadi lapis kedua.

**`app/login/actions.ts`** — `getAuthUser()` membaca sesi tanpa logging debug. `staffLogin` mengembalikan profil staff alih-alih redirect server-side.

**`lib/supabase/proxy.ts`** — `setAll` memakai kembali `NextResponse.cookies.set()` sesuai pola resmi `@supabase/ssr`.

**`lib/supabase/server.ts`** — `setAll` meneruskan opsi cookie dari `@supabase/ssr` tanpa override `httpOnly`.

### File yang Tidak Diubah (Referensi)

- `lib/supabase/client.ts` — Browser Supabase client (tidak dipakai AuthProvider lagi)
- `proxy.ts` (root) — Next.js 16 proxy entry → `lib/supabase/proxy.ts`
- `app/employee/layout.tsx` — Employee layout panggil `useRequireRole("STAFF")`
- `app/login/pin/page.tsx` — Staff PIN login page
- `app/layout.tsx` — Root layout wrap children dalam `<AuthProvider>`
- `scripts/seed.mjs` — Buat owner + 2 staff dengan auth, profiles, PIN hashes

---

## Detail Teknis

- **Stack:** Next.js 16.2.10, React 19, @supabase/ssr 0.12.4, @supabase/supabase-js 2.111.0
- **Auth flow:** Staff input code+PIN → `staffLogin` server action → `get_staff_auth` RPC → bcrypt verify → `signInWithPassword` → action mengembalikan profil → client menyetel `AuthProvider` → navigasi `/employee/penutupan`. Owner mengikuti pola identik menuju `/owner/dashboard`.
- **Dua lapis auth:** (1) Server-side proxy (`proxy.ts` → `lib/supabase/proxy.ts`) cek `getUser()` + role, (2) Client-side `useRequireRole("STAFF")` di employee layout
- **Staff credentials:** Code `B001` / PIN `1234`, Code `A002` / PIN `5678`
- **Verifikasi:** staff dan owner lulus manual; E2E menunggu environment browser yang kompatibel.
- **@supabase/ssr 0.12.4 internals:** `createBrowserClient` default ke `documentCookieGetAll` (baca `document.cookie`). `DEFAULT_COOKIE_OPTIONS` punya `httpOnly: false`. Cookie chunks pakai prefix `base64-` + base64url encoding.

---

## Langkah Selanjutnya

### Verifikasi tersisa
1. Jalankan `npm run test:e2e` pada environment yang mendukung Playwright, dengan `E2E_STAFF_CODE`, `E2E_STAFF_PIN`, `E2E_OWNER_EMAIL`, dan `E2E_OWNER_PASSWORD` di environment lokal.
2. Pastikan URL dan konten tujuan tetap benar setelah submit serta reload, dan PIN salah tetap di halaman login.

---

## Suggested Skills

- `diagnosing-bugs` — untuk debugging systematic masalah cookie/httpOnly
- `code-review` — untuk review perubahan sebelum commit
- `cavecrew-investigator` — untuk explore internals @supabase/ssr jika investigasi lebih dalam diperlukan

---

## Konvensi Proyek

- **Bahasa:** Indonesia untuk semua komunikasi
- **Coaching mode:** Saat ini dinonaktifkan untuk demo MVP — agent boleh langsung beri kode jadi
- **Feature flags:** Restock, Klaim, Ledger OFF — jangan sentuh halaman mereka
- **Rekap Harian:** Dihapus dari MVP — jangan kembalikan
- **`cash_initial`:** Diinput owner saat verifikasi (ADR-0002)
