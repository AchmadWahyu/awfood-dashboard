# AW Food Dashboard

Dashboard konsinyasi stok + rekonsiliasi kas untuk jualan kue basah dan minuman dekat pintu masuk Kukel UI. Next.js + Tailwind CSS v4, mobile-first.

> **Status saat ini: MVP hybrid.** Data bisnis masih dummy/localStorage (`lib/dummy/*`), tetapi login owner dan staff sudah terhubung ke Supabase Auth. PRD (`AW Food About V2.md`) tetap menjadi target produksi.

## Dokumentasi

| File / Folder | Isi | Source of truth |
|---|---|---|
| `AW Food About V2.md` | Requirement lengkap produk (PRD) | **Produk** |
| `CONTEXT.md` | Glossary istilah domain | **Istilah** |
| `docs/CHECKLIST.md` | Plan & progress dashboard | **Progress** |
| `docs/adr/` | Keputusan arsitektur (why) | **Keputusan** |
| `docs/agents/` | Schema database + migrations | — |
| `.scratch/` | Issue tracker lokal: spec + tickets per fitur | **Tiket aktif** |
| `AGENTS.md` | Instruksi agent + status proyek | — |

## Status MVP dummy

- **Auth:** Supabase Auth via `lib/auth.tsx` — owner login email/password, staff login kode/PIN. Route `/owner/*` dan `/employee/*` diproteksi proxy dan role guard klien.
- **Data:** tersimpan di localStorage (`awfood-mvp-*`), di-seed ulang setiap `/login` di-mount. Refresh halaman login untuk reset data.
- **Form penutupan:** tanggal bisa dipilih manual via date picker **dev-only** (`process.env.NODE_ENV === "development"`), untuk simulasi multi-hari tanpa mengubah jam sistem.
- **Fitur off (first release):** Restock, Klaim, Ledger, dan **Request Edit** sengaja tidak diaktifkan pada rilis pertama (sampai waktu yang belum ditentukan), tapi bisa dikembalikan kapan saja via `lib/feature-flags.ts` — set `true` untuk memunculkannya di menu. Halaman tidak dihapus.

## Aturan

- Requirement baru ditulis ke `AW Food About V2.md`.
- Istilah baru: tambah ke `CONTEXT.md`, jangan tulis ulang di file lain.
- Keputusan arsitektur: tulis di `docs/adr/`, jangan diulang di tempat lain.
- Spec & tiket fitur aktif: `.scratch/<feature-slug>/` — satu fitur per direktori, spec di `spec.md`, tiket di `issues/NN-<slug>.md`.
