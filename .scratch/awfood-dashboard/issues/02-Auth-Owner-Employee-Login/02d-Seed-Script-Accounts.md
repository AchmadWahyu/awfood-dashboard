# 02d — Auth: Seed script (owner + staff accounts)

**What to build:** Script untuk membuat 1 akun owner (email+password via Supabase Auth) dan 2 akun staff (dummy auth user + `pin_hash` bcrypt di `profiles`). Bisa dijalankan via `npm run seed` atau satu kali.

**Blocked by:** 01b

**Status:** implemented (perlu GRANT DB + re-run)

- [x] 1 akun owner: sign up via Supabase Auth, insert profile role = OWNER
- [x] 2 akun staff: sign up via Supabase Auth, insert profile role = STAFF + pin_hash (bcrypt dari PIN 4-6 digit)
- [x] Script bisa di-re-run (upsert atau skip if exists)

## Comments

- 2026-08-09 (implementasi langsung): `scripts/seed.mjs` + `npm run seed`. Idempotent: owner dibuat hanya jika belum ada (password default `Awfood123!`), staff selalu di-reset password = `auth_token` baru agar sinkron dengan `profiles.auth_token`.
- Blocker: supabase-js 2.111.0 tidak punya `admin.auth.admin.getUserByEmail` → pakai `listUsers` + filter.
- **Blocker DB:** `service_role` belum punya GRANT di `public.profiles` (`42501 permission denied`) → harus run blok GRANTS di db_schema.sql section 9 dulu, baru `npm run seed` ulang. Owner auth user sudah terlanjur dibuat (email `owner@awfood.id`, password `Awfood123!`).
- Akun: owner `owner@awfood.id` / `Awfood123!`; staff `B001`/`1234` (Budi), `A002`/`5678` (Ani), email `staff-B001@app.awfood.local` & `staff-A002@app.awfood.local`.

- **2026-08-09 (lanjutan):** Owner email di seed diganti ke akun asli (`awfood.owner@gmail.com`). Fix `getUserByEmail` jadi **case-insensitive** — Supabase menormalkan email ke huruf kecil (`staff-B001@...` tersimpan sebagai `staff-b001@...`), sehingga pencarian exact-match gagal dan `createUser` memunculkan "already been registered". Tambahan: error "already been registered" dari `createUser` ditangani dengan re-lookup, bukan langsung throw. Seed sekarang sukses: owner terdeteksi, staff B001 & A002 dibuat/di-reset. User "mengosongkan tabel" tapi `auth.users` tidak kosong (Supabase Auth) — jadi akun lama masih terdaftar; seed menyesuaikan diri.
