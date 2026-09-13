# 02a — Auth: Owner login page (/login)

**What to build:** Halaman `/login` dengan form email + password. Sign in via Supabase Auth (`supabase.auth.signInWithPassword`). Redirect ke `/owner/dashboard` setelah sukses. Tampilkan error jika gagal.

**Blocked by:** 01e

**Status:** selesai — terverifikasi manual 2026-09-04

- [x] Form dengan input email + password
- [x] Submit → `signInWithPassword` via server action; hasil profil dipasang ke `AuthProvider` di klien
- [x] Redirect ke `/owner/dashboard` on success
- [x] Tampilkan error message on failure

## Comments

- 2026-08-01: Verified. Login owner berhasil redirect ke `/owner/dashboard`.
- Keputusan: akun owner dibuat manual di Supabase Dashboard (create user) lalu `role` diedit jadi `OWNER` via Table editor, karena form "Add user" di dashboard tidak menampilkan field metadata. Trigger `handle_new_user()` default `STAFF`. Seed script (02d) nanti akan set role/metadata dengan benar sejak awal.

- **2026-09-04:** Ditemukan bounce baru setelah login berhasil: redirect server-side menuju dashboard berjalan sebelum `AuthProvider` memiliki state `OWNER`, sehingga `useRequireRole` mengarahkan kembali ke `/login`. `ownerLogin` sekarang mengembalikan profil owner ke halaman login; halaman memasangnya ke provider, menunggu state tersedia, lalu bernavigasi ke `/owner/dashboard`. `npm run build` lulus. Login owner kemudian diverifikasi manual: tetap di dashboard setelah login dan refresh.
