# 10 — Investigasi Selisih (>5k: open → resolved)

**What to build:** Jika discrepancy > Rp5.000, closing tidak langsung diverified — masuk daftar investigasi. Halaman owner untuk lihat daftar selisih open, lihat detail, dan resolve dengan salah satu hasil: koreksi data, ditanggung usaha, atau ditanggung karyawan. Jika ditanggung karyawan → INSERT employee_deductions. Vitest.

Route: `/owner/discrepancies`

**Blocked by:** 09

**Status:** parent — lihat sub-tickets di bawah

**Sub-tickets:**
- [10a — Daftar selisih open](10a-Open-Discrepancy-List.md)
- [10b — Detail selisih](10b-Discrepancy-Detail.md)
- [10c — Resolve discrepancy](10c-Resolve-Discrepancy.md)
- [10d — Vitest](10d-Investigation-Vitest.md)

**Dependency graph:**
```
02c, 09e ──> 10a ──> 10b ──> 10c ──> 10d
03b ──> 10d
```
