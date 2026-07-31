# 02b — Auth: Employee PIN login page (/login/pin)

**What to build:** Halaman `/login/pin` dengan input PIN 4-6 digit. Server action mencari user berdasarkan `pin_hash` (bcrypt compare) di tabel `profiles`. Buat Supabase session server-side, redirect ke `/employee/penutupan`.

**Blocked by:** 01e

**Status:** ready-for-agent

- [ ] Input PIN (4-6 digit, numeric only)
- [ ] Server action: cari profile by role = STAFF, bcrypt compare pin_hash
- [ ] Buat session server-side via `createServerActionClient`
- [ ] Redirect ke `/employee/penutupan` on success
- [ ] Tampilkan error jika PIN salah
