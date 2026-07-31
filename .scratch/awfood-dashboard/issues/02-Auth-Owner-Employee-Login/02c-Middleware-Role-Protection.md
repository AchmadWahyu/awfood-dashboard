# 02c — Auth: Middleware + role protection

**What to build:** Middleware (`middleware.ts`) yang redirect unauthenticated users ke `/login`. Proteksi route: `/owner/*` hanya untuk role OWNER, `/employee/*` hanya untuk role STAFF.

**Blocked by:** 02a

**Status:** ready-for-agent

- [ ] Middleware: baca session dari cookie, jika tidak ada → redirect `/login`
- [ ] Cek role untuk `/owner/*` — hanya OWNER yang bisa akses
- [ ] Cek role untuk `/employee/*` — hanya STAFF yang bisa akses
- [ ] Allow `/login` dan `/login/pin` tanpa auth
- [ ] Matcher config yang tepat (jangan middleware di semua route)
