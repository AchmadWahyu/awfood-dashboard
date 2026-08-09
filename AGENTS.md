## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context — one `CONTEXT.md` at the root plus `docs/adr/` for decisions. See `docs/agents/domain.md`.

## Status proyek (per 2026-08)

**MVP dummy (localStorage).** Semua halaman berjalan dengan data dummy di browser (`lib/dummy/*`), auth dummy (`lib/auth.tsx`). Supabase sudah di-setup tapi belum terhubung ke halaman. PRD (`AW Food About V2.md`) tetap target produksi.

Fakta yang perlu diingat sebelum mengubah kode:

- **Data dummy** disimpan di localStorage (`awfood-mvp-*`), di-seed ulang tiap `/login` di-mount. Jangan bingung saat data "hilang" setelah refresh login.
- **Feature flags** untuk fitur yang off di first release: Restock, Klaim, Ledger. Kontrol di `lib/feature-flags.ts` (`restock`/`klaim`/`ledger`). Jangan hapus halamannya — hanya toggle flag.
- **Date picker dev-only** di form penutupan (`process.env.NODE_ENV === "development"`) untuk simulasi multi-hari. Jangan tampil di produksi.
- **Rekap Harian sudah dihapus** (MVP & plan) — jangan mengembalikannya tanpa keputusan baru.
- **`cash_initial` diinput owner saat verifikasi** (ADR-0002), bukan staff — staff tidak boleh melihat/mengubahnya.

## Coaching mode (wajib)

User belajar sambil mengerjakan — **"you drive, I navigate"**. User yang eksekusi (dashboard, terminal, tulis kode), agent yang mengajar, memverifikasi, dan meninjau. Bahasa: Indonesia.

> **Sementara dinonaktifkan untuk demo MVP** — lihat `docs/agents/coaching.md`. Selama periode ini agent boleh langsung memberi kode jadi.

Selalu baca `docs/agents/coaching.md` di awal sesi: aturan main lengkap + progress issue yang sudah selesai + keputusan yang sudah diambil. Jangan mengulang keputusan, jangan memberi kode jadi — beri petunjuk dan biarkan user mencoba dulu.
