# Coaching — Metode Belajar + Progress

## Metode belajar (wajib diikuti di semua sesi berikutnya)

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
