# Coaching — Metode Belajar + Progress

## Status metode (DEMO MVP)

> **Coaching method DINONAKTIFKAN sementara** selama sesi diskusi dan update fitur untuk demo MVP (per 2026-08-06). Selama periode ini agent boleh langsung memberi kode jadi / implementasi penuh tanpa menunggu user menulis sendiri. Coaching method diaktifkan kembali setelah demo MVP selesai.

## Status MVP (per 2026-08-09)

MVP dummy (localStorage) sudah berjalan penuh untuk demo. Fakta penting:

- **Semua data dummy** di `lib/dummy/*`, auth dummy di `lib/auth.tsx` (owner email + staff kode/PIN `B001/1234`, `A002/5678`). Seed ulang tiap `/login` di-mount.
- **Feature flags** `lib/feature-flags.ts` mengontrol menu yang off di first release: Restock, Klaim, Ledger (off sampai waktu belum ditentukan, bisa turn on kapan saja). Halaman tidak dihapus, hanya toggle.
- **Rekap Harian (mock) dihapus** dari MVP dan plan (keputusan 2026-08-09) — jangan dikembalikan tanpa keputusan baru.
- **Date picker dev-only** di form penutupan untuk simulasi multi-hari.
- **`cash_initial` owner-only** saat verifikasi (ADR-0002).

## Metode belajar (default, diaktifkan kembali setelah demo MVP)

Model: **"you drive, I navigate"** — user yang eksekusi, agent yang mengajar & memverifikasi.

Alur per sub-ticket:
1. Agent kasih **primer konsep** singkat dulu — jelaskan *kenapa*, bukan cuma *gimana* (satu konsep per langkah, jangan dibanjiri)
2. User yang pegang kendali: klik dashboard, jalankan command, tulis kode
3. User **lapor balik** apa yang dia lihat (paste output, hasil query, dsb)
4. Agent verifikasi, koreksi, jelaskan apa yang terjadi

Aturan main:
- **Bahasa: Bahasa Indonesia**
- Profil user: nyaman dengan env vars + Next.js App Router. **Belum** SQL dan Server Actions → jelaskan dari dasar.
- **Terminal: user yang jalankan**, agent yang coach & interpretasi output
- **Kode: user yang tulis**, agent review setelahnya (jangan kasih kode jadi — kasih petunjuk/skeleton, biarkan user mencoba dulu)
- Kalau user menemukan perbedaan antara ticket dan docs resmi → itu **momen belajar**: dorong user cek sendiri dan putuskan, bukan langsung memutuskan
- Verifikasi harus **nyata** (query + paste hasil), bukan sekadar "iya sudah"
- Keputusan desain yang menyimpang dari ticket dicatat di ticket + di sini
- Jangan pernah minta user paste `service_role` key ke chat

## Progress

### Issue 01 — Setup Supabase + Next.js ✅ SELESAI

**Subtickets:**
- **01a** — Project dibuat di dashboard (ref: `rgussbbwygytyxqcthbn`)
- **01b** — 9 tabel dibuat dari `docs/agents/db_schema.sql`. View `supplier_ledger` **tidak ada** di schema → ditunda
- **01c** — `@supabase/supabase-js` 2.111.0, `@supabase/ssr` 0.12.4, `bcryptjs`
- **01d** — `.env.local` terisi (URL + anon + service role), sudah di gitignore
- **01e** — `lib/supabase/server.ts`, `lib/supabase/client.ts`, `proxy.ts`, `lib/supabase/proxy.ts`

**Keputusan yang diambil (menyimpang dari ticket asli):**
- `server.ts` pakai **anon key + cookies** (BUKAN service role seperti ticket) — supaya RLS tetap berlaku
- Struktur ikut **docs Supabase terbaru**: 2 client + proxy (ticket asli minta `server-action.ts` terpisah — sudah tidak ada di docs)
- Blok redirect di `lib/supabase/proxy.ts` sengaja **di-comment** → aktifkan di issue 02
- Nama env var: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (docs baru pakai `...PUBLISHABLE_KEY` — kita konsisten dengan `.env.local`)

**Daftar tunggu untuk issue berikutnya:**
- View `supplier_ledger` → issue 13
- Blok redirect proxy → issue 02
- `app/login/actions.ts` butuh kolom `staff_code` + `auth_token` di `profiles` (belum ada di schema) → issue 02

### Issue 02 — Auth: Owner login + Employee PIN login + middleware (sedang berjalan)

**Subtickets:**
- **02a** ✅ SELESAI — Owner login `/login` bekerja (signInWithPassword → redirect `/owner/dashboard`). Akun owner dibuat manual di dashboard.
- **02b** In progress — PIN login `/login/pin` sudah ditulis. Kolom `staff_code` + `auth_token` sudah ditambah ke `profiles` (ALTER TABLE + db_schema.sql). Blocker GRANT `42501` sudah di-fix per tabel. **Keputusan RLS: Opsi 2 — `SECURITY DEFINER` function `verify_staff_pin(staff_code, pin)`** (least privilege, tanpa service_role). `actions.ts` sudah diupdate pakai `.rpc()` — bersih dan benar. Skeleton function diberikan, user run sukses tapi **masih ada error `crypt() does not exist` saat test browser**. Perlu verifikasi function yang aktif (mungkin masih versi lama). User juga lupa PIN → perlu reset `pin_hash` sebelum test login end-to-end.
- **02c** Belum — `proxy.ts` sudah ada tapi blok redirect masih di-comment; belum ada `middleware.ts`.
- **02d** Belum — belum ada seed script.

**Keputusan yang diambil:**
- Form "Add user" Supabase Dashboard **tidak** menampilkan field metadata → akun owner dibuat manual, lalu `role` di-edit jadi `OWNER` langsung di Table editor (bypass RLS karena service role). Trigger `handle_new_user()` default `STAFF` via `COALESCE(metadata->>'role', 'STAFF')`.
- **Penemuan penting (02b):** tabel dari `db_schema.sql` dibuat via SQL editor → Supabase **tidak otomatis GRANT** ke role `anon`/`authenticated`. Semua tabel perlu dicek grant-nya. Error `42501 permission denied` = lapis GRANT, `PGRST116` = lapis RLS.
- **Penemuan baru (02b, sesi 2026-08-05):** `pgcrypto` di Supabase ter-install di schema `extensions` (bukan `pg_catalog`). `SET search_path = ''` menghapus `extensions` dari pencarian, makanya `crypt()` tidak ketemu. Fix: `SET search_path = 'public, extensions'` atau prefix `extensions.crypt()`. Tapi perlu diverifikasi function yang aktif karena `CREATE OR REPLACE` mungkin tidak mengganti versi internal yang tersimpan.

### Keputusan tambahan (dicatat saat sesi coaching, di luar issue flow)

- **`cash_initial` (uang kembalian awal) di `daily_closings`** — Ditemukan celah: schema/formula asumsi laci mulai dari nol, padahal setiap pagi owner menaruh uang kembalian (working capital) di laci, dan tiap malam seluruh kas dikembalikan ke owner (reset). Tanpa field ini, setiap hari muncul discrepancy palsu sebesar uang kembalian.
  - Keputusan awal: tambah kolom `cash_initial NUMERIC(12,2) DEFAULT 0 NOT NULL` di `daily_closings`, diisi staff saat closing.
  - **Dikoreksi sesi /grilling 2026-08-07 (ADR-0002):** `cash_initial` sekarang diinput **owner saat verifikasi (wajib)**, bukan staff. Staff tidak melihatnya sama sekali. Request edit staff tidak dapat mengubahnya. Form closing staff hanya punya `cash_physical`.
  - Dampak: ticket `07d` (form input kas awal) dibatalkan, `09e` (formula berubah → `omzet_kas = cash_physical − cash_initial + payment_laci` + pengeluaran CASH_LACI + setoran supplier dari laci), `docs/agents/db_schema.sql` ikut diupdate.
  - Eksekusi: `ALTER TABLE` di Supabase → dikerjakan di issue 07 (belum dieksekusi).

- **Pencatatan Pengeluaran (sesi /grilling + /domain-modeling, 2026-08-06)** — Fitur baru: entitas `expenses` owner-only (kategori tetap + `LAINNYA` label bebas, channel `CASH_LACI` | `QRIS_AWFOOD`, satu entri per kategori, tanpa referensi item). Tujuan: menjelaskan selisih rekonsiliasi dan rekap pengeluaran bulanan.
  - **Mengoreksi asumsi lama**: pengeluaran ternyata **ikut rekonsiliasi** (uang keluar dari kantong kas/QRIS), bukan "di luar laci". Lihat ADR-0001.
  - Dokumen: spec + 3 ticket di `.scratch/pencatatan-pengeluaran/`, istilah di `CONTEXT.md` (Expense, Pocket, Expense Category), rumus rekonsiliasi di spec.md.
  - Dokumentasi proyek dirapikan: `README.md` jadi indeks + aturan source of truth (PRD = `AW Food About V2.md` menang atas `PRODUCT.md`).

- **Fitur off di first release (sesi demo MVP, 2026-08-09)** — Restock, Klaim, dan Supplier Ledger sengaja **off di first release** (sampai waktu yang belum ditentukan), tapi bisa diaktifkan kapan saja. Keputusan: halaman **tidak dihapus**, dikendalikan feature flag `lib/feature-flags.ts` (set `true` untuk kembali). PRD tetap memuat ketiganya sebagai requirement produksi. Selisih laporan tetap snapshot saat verifikasi (pengeluaran yang dicatat setelah verifikasi tidak mengubah angka laporan — tidak di-sync).

- **Rekap Harian dihapus (sesi demo MVP, 2026-08-09)** — Halaman `app/*/rekap-harian`, `components/rekap/RekapHarianView.tsx`, dan `lib/rekap-data.ts` dihapus karena memakai mock data terpisah dan tidak masuk navigasi. Jangan dikembalikan tanpa keputusan baru.
