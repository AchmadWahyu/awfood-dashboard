# 02 — Auth: Owner login + Employee PIN login + middleware

**What to build:** Halaman login untuk owner (email+password via Supabase Auth) di `/login` dan halaman login employee (PIN 4-6 digit diverifikasi via server action) di `/login/pin`. Middleware untuk proteksi route: `/owner/*` hanya untuk role OWNER, `/employee/*` hanya untuk role STAFF. Seed script untuk buat akun owner dan staff (dummy auth user + PIN hash).

**Blocked by:** 01

**Status:** selesai — owner dan staff terverifikasi manual; eksekusi E2E otomatis tertunda environment

**Progress 2026-09-04:** Staff dan owner login sudah terverifikasi manual tidak bounce, termasuk setelah refresh. Konfigurasi Playwright dan spesifikasi regresi sudah ditambahkan, tetapi runner tidak dapat berjalan di terminal WSL saat ini.

**Sub-tickets:**
- [02a — Login page (/login)](02a-Login-Page-Owner.md)
- [02b — PIN login page (/login/pin)](02b-Login-Pin-Page-Employee.md)
- [02c — Middleware + role protection](02c-Middleware-Role-Protection.md)
- [02d — Seed script (owner + staff)](02d-Seed-Script-Accounts.md)

**Dependency graph:**
```
01e ──> 02a ──> 02c
01e ──> 02b
01b ──> 02d
```
