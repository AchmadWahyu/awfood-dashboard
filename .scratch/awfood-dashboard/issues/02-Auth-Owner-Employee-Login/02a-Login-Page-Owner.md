# 02a — Auth: Owner login page (/login)

**What to build:** Halaman `/login` dengan form email + password. Sign in via Supabase Auth (`supabase.auth.signInWithPassword`). Redirect ke `/owner/dashboard` setelah sukses. Tampilkan error jika gagal.

**Blocked by:** 01e

**Status:** ready-for-agent

- [ ] Form dengan input email + password
- [ ] Submit → `signInWithPassword` via browser client
- [ ] Redirect ke `/owner/dashboard` on success
- [ ] Tampilkan error message on failure
