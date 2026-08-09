# 02b — Auth: Employee PIN login page (/login/pin)

**What to build:** Halaman `/login/pin` dengan input PIN 4-6 digit. Server action mencari user berdasarkan `pin_hash` (bcrypt compare) di tabel `profiles`. Buat Supabase session server-side, redirect ke `/employee/penutupan`.

**Blocked by:** 01e

**Status:** in-progress — blocker: RLS tidak mengizinkan anon membaca `profiles` saat login

- [x] Input PIN (4-6 digit, numeric only)
- [x] Server action: cari profile by role = STAFF, bcrypt compare pin_hash (actions.ts sudah ada)
- [ ] Buat session server-side via `createServerActionClient`
- [ ] Redirect ke `/employee/penutupan` on success
- [ ] Tampilkan error jika PIN salah

## Comments

- 2026-08-01: `staffLogin` sudah berfungsi secara logika (rate limit + bcrypt compare), tapi query `profiles` gagal saat user belum login karena 2 lapis keamanan:
  - **Lapis 1 — GRANT:** tabel dibuat via SQL editor → Supabase tidak otomatis grant `anon`. Error `42501`. Fix: `GRANT SELECT ON public.profiles TO anon;` (berlaku juga untuk semua tabel lain dari db_schema.sql).
  - **Lapis 2 — RLS:** policy "Authenticated users can view profiles" menolak anon → error `PGRST116` 0 rows.
- **Keputusan tertunda (lanjut di sesi berikutnya):** pilih cara bypass untuk lookup PIN saat belum ada session:
  - Opsi 1: service role client khusus server untuk verifikasi PIN (bypass RLS)
  - Opsi 2: SECURITY DEFINER function `verify_staff_pin(staff_code, pin)`
  - Opsi 3: buka policy anon ke `profiles` (TIDAK disarankan — bocor `pin_hash`)
- Note: error `42501` memunculkan pertanyaan — apakah semua tabel dari db_schema.sql butuh GRANT ke `anon`/`authenticated`? Perlu dicek saat lanjut.
- **KEPUTUSAN (2026-08-01):** pilih **Opsi 2 — SECURITY DEFINER function** `verify_staff_pin(staff_code, pin)`. Alasan: least privilege — `pin_hash` tidak pernah keluar dari database, `auth_token` baru dikembalikan setelah PIN benar, dan aplikasi tidak perlu service_role key sama sekali.
  - Konsep yang dipelajari: function Postgres dipanggil via `.rpc()`, `SECURITY DEFINER` menjalankan function dengan kekuatan pembuat (bypass RLS tapi terkunci di satu function), `pgcrypto.crypt()` bisa memverifikasi hash bcrypt `$2a$` buatan bcryptjs.
  - Langkah berikutnya (user yang eksekusi):
    1. `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
    2. Tulis function `verify_staff_pin` (RETURNS TEXT → kembalikan `auth_token`/NULL), `SET search_path = ''`, cek PIN pakai `crypt()`
    3. `GRANT EXECUTE ON FUNCTION ... TO anon;` (belum ada session saat login)
    4. Update `actions.ts` → ganti `.from("profiles").select(...)` dengan `.rpc("verify_staff_pin", ...)`; hapus `console.log("AAA")` di baris 67 (bocor kalau dipakai service client)
  - Dua pertanyaan yang dilempar ke user sebelum menulis (belum dijawab): kenapa `SET search_path = ''` penting, dan apa yang harus dikembalikan function supaya `actions.ts:81-86` bisa bikin session.

- **2026-08-05 (sesi coaching lanjutan):** User mencoba menulis function `verify_staff_pin` sendiri. Ditemukan 2 bug klasik saat belajar SQL Postgres — **momen belajar**:
  1. **Bug 1:** `SELECT auth_token FROM public.profiles WHERE staff_code = staff_code_input AND role = 'STAFF' AND crypt(pin_input, v_pin_hash)` → **salah:** `v_pin_hash` belum diisi (NULL), `crypt()` di `WHERE` syntax error, dan hasil SELECT tidak masuk ke variabel.
  2. **Bug 2:** Tidak ada `INTO` → variabel `v_auth_token` dan `v_pin_hash` tetap kosong.
  - **Fix yang diajarkan:** Gunakan `SELECT auth_token, pin_hash INTO v_auth_token, v_pin_hash FROM public.profiles WHERE staff_code = staff_code_input AND role = 'STAFF';` lalu cek `IF v_pin_hash IS NULL THEN RETURN NULL; END IF;`, baru verifikasi `IF crypt(pin_input, v_pin_hash) = v_pin_hash THEN RETURN v_auth_token; ELSE RETURN NULL; END IF;`.
  - **Primer konsep yang dipelajari:** Urutan harus SELECT dulu → cek NULL → baru crypt(). `crypt()` mengembalikan hash yang sama kalau PIN cocok, makanya dibandingkan dengan hash asli. `SET search_path = ''` mencegah attacker override tabel via schema palsu.
  - **Skeleton yang diberikan (siap eksekusi user di sesi berikutnya):**
    ```sql
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE OR REPLACE FUNCTION public.verify_staff_pin(
      staff_code_input TEXT,
      pin_input TEXT
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    DECLARE
      v_auth_token TEXT;
      v_pin_hash   TEXT;
    BEGIN
      SELECT auth_token, pin_hash
      INTO v_auth_token, v_pin_hash
      FROM public.profiles
      WHERE staff_code = staff_code_input
        AND role = 'STAFF';

      IF v_pin_hash IS NULL THEN
        RETURN NULL;
      END IF;

      IF crypt(pin_input, v_pin_hash) = v_pin_hash THEN
        RETURN v_auth_token;
      ELSE
        RETURN NULL;
      END IF;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.verify_staff_pin(TEXT, TEXT) TO anon;
    ```
  - **Langkah berikutnya (tunggu sesi selanjutnya):**
    1. User tulis function lengkap di SQL Editor & lapor hasil/error.
    2. Update `actions.ts`: ganti query `.from("profiles")...` dengan `.rpc("verify_staff_pin", ...)`; hapus `console.log("AAA")` baris 67.
    3. Test login PIN via `/login/pin`.

- **2026-08-05 (sesi coaching lanjutan — part 2):**
  - Extension `pgcrypto` sukses dibuat.
  - User belajar konsep: `DECLARE` (variabel di function), `BEGIN/END` (wajib di PL/pgSQL), `INTO` (simpan hasil SELECT ke variabel), kenapa `WHERE staff_code = ...` otomatis tahu dari `FROM public.profiles`.
  - User mencoba menulis function sendiri, tapi ada bug klasik: `IF crypt(pin_input, v_pin_hash) THEN` — kurang `= v_pin_hash`. Diperbaiki.
  - Skeleton function lengkap diberikan dan user run sukses.
  - **Bug baru ditemukan saat test browser:** `function crypt(text, text) does not exist`. Diagnose: `pgcrypto` extension ter-install di schema `extensions` (bukan `pg_catalog`), dan `SET search_path = ''` menghapus `extensions` dari pencarian.
  - Fix: recreate function dengan `SET search_path = 'public, extensions'` (atau prefix `extensions.crypt()`). User bilang "aman" saat run CREATE OR REPLACE.
  - **Tapi error masih muncul saat test via browser** → kemungkinan function yang aktif masih versi lama (cache/compilasi internal). Perlu verifikasi dengan `SELECT prosrc FROM pg_proc WHERE proname = 'verify_staff_pin';` di sesi berikutnya.
  - **Blocker saat ini:**
    1. Function `verify_staff_pin` perlu diverifikasi apakah sudah versi baru (dengan `search_path = 'public, extensions'`). Kalau masih versi lama → `DROP` lalu `CREATE` ulang.
    2. User lupa PIN staff → perlu reset `pin_hash` di Table Editor (generate hash bcrypt baru).
  - **Sudah selesai di sesi ini:**
    - `actions.ts` diupdate pakai `.rpc('verify_staff_pin')` — bersih, `bcryptjs` import dihapus, `console.log("AAA")` dihapus.
    - `app/login/pin/page.tsx` sudah ada (dari sesi sebelumnya).
