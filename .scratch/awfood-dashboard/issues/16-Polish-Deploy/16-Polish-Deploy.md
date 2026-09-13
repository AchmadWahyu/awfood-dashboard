# 16 — Polish + Deploy ke Cloudflare

**What to build:** Notifikasi badges untuk owner (pending items di sidebar/menu), error handling & loading states konsisten di semua halaman (skeleton loading, toast notification, error boundary), lalu deploy ke Cloudflare Pages dengan custom domain.

**Blocked by:** 14, 15

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [16a — Navigation badges](16a-Nav-Badges.md)
- [16b — Loading skeletons](16b-Loading-Skeleton.md)
- [16c — Toast notifications](16c-Toast-Notifications.md)
- [16d — Error boundary](16d-Error-Boundary.md)
- [16e — Cloudflare Pages setup](16e-Cloudflare-Setup.md)
- [16f — Custom domain + SSL](16f-Custom-Domain-SSL.md)

**Dependency graph:**
```
14a ──> 16a
16e ──> 16f
```
