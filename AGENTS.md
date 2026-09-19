## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`.

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues: one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- When a skill says "publish to the issue tracker", create a new file under `.scratch/<feature-slug>/`

### Domain docs

- Read **`CONTEXT.md`** at the repo root before exploring — it is the domain glossary.
- Read **`docs/adr/`** for architectural decisions relevant to the area you're working in.
- Use the glossary's vocabulary when naming domain concepts (issues, tests, refactor proposals). Don't drift to synonyms the glossary explicitly avoids.
- If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.

## Status proyek (per 2026-09)

**MVP hybrid.** Data bisnis masih dummy/localStorage (`lib/dummy/*`), tetapi login owner dan staff sudah terhubung ke Supabase Auth. Phase 1-11 + 09b sudah selesai. Phase 14-16 (Dashboard, Laporan, Polish) adalah sisa pekerjaan untuk first release.

Fakta yang perlu diingat sebelum mengubah kode:

- **Data dummy** disimpan di localStorage (`awfood-mvp-*`), di-seed ulang tiap `/login` di-mount. Jangan bingung saat data "hilang" setelah refresh login.
- **Feature flags** untuk fitur yang off di first release: Restock, Klaim, Ledger, **Request Edit**. Kontrol di `lib/feature-flags.ts` (`restock`/`klaim`/`ledger`/`requestEdit`). Jangan hapus halamannya — hanya toggle flag.
- **Date picker dev-only** di form penutupan (`process.env.NODE_ENV === "development"`) untuk simulasi multi-hari. Jangan tampil di produksi.
- **Rekap Harian sudah dihapus** (MVP & plan) — jangan mengembalikannya tanpa keputusan baru.
- **`cash_initial` diinput owner saat verifikasi** (ADR-0002), bukan staff — staff tidak boleh melihat/mengubahnya.

## Coaching mode

> **Sementara dinonaktifkan untuk demo MVP.** Agent boleh langsung memberi kode jadi selama periode ini.

User belajar sambil mengerjakan — **"you drive, I navigate"**. User yang eksekusi (dashboard, terminal, tulis kode), agent yang mengajar, memverifikasi, dan meninjau. Bahasa: Indonesia.

## Progress singkat

- **Issue 01** — Setup Supabase + Next.js ✅
- **Issue 02** — Auth: Owner + Employee PIN login ✅
- **Phase 01-07** — Setup, Auth, Vitest, Master Data, Restock, Employee Closing ✅
- **Phase 09, 10, 11, 09b** — Owner Verification, Discrepancy, Request Edit (implemented), Pengeluaran ✅
- **Phase 08, 12, 13** — Employee Payment, Claims, Ledger `[~] Cancelled` untuk first release
- **Phase 14-16** — Dashboard, Laporan, Polish ⏳ Next
