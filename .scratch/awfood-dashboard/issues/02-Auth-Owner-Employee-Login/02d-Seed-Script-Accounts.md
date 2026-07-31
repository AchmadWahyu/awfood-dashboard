# 02d — Auth: Seed script (owner + staff accounts)

**What to build:** Script untuk membuat 1 akun owner (email+password via Supabase Auth) dan 2 akun staff (dummy auth user + `pin_hash` bcrypt di `profiles`). Bisa dijalankan via `npm run seed` atau satu kali.

**Blocked by:** 01b

**Status:** ready-for-agent

- [ ] 1 akun owner: sign up via Supabase Auth, insert profile role = OWNER
- [ ] 2 akun staff: sign up via Supabase Auth, insert profile role = STAFF + pin_hash (bcrypt dari PIN 4-6 digit)
- [ ] Script bisa di-re-run (upsert atau skip if exists)
