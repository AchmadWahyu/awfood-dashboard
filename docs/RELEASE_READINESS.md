# Release Readiness: `test/mvp2`

Dokumen ini mencatat pengecekan terakhir branch `test/mvp2` terhadap `main`.

## Status Saat Ini

- Branch: `test/mvp2`
- Perbandingan: `main...HEAD`
- Perubahan: 14 commit, 215 file, sekitar 24 ribu baris tambahan
- `npm run build`: lulus
- `npm run lint`: gagal, 90 error dan 63 warning
- `npm run test -- --run`: gagal, 4 dari 33 test
- `git diff --check`: trailing whitespace di banyak file
- Status rekomendasi: **belum siap merge atau deploy produksi**

## Priority List

### P0: Wajib Sebelum Merge

#### P0.1 Tutup kebocoran credential

Lokasi:

- `docs/agents/db_schema.sql:55-61`
- `docs/agents/db_schema.sql:75-91`

Masalah:

- Semua authenticated user dapat membaca seluruh `profiles`, termasuk `pin_hash` dan `auth_token`.
- RPC `get_staff_auth` dapat dipanggil oleh `anon` dan mengembalikan data credential.

Perbaikan:

- Batasi SELECT `profiles` ke kolom non-sensitif atau gunakan view aman.
- Jangan pernah expose `pin_hash`/`auth_token` ke client atau role `anon`.
- Ubah RPC menjadi operasi verifikasi server-side yang hanya mengembalikan hasil validasi atau identitas minimal.
- Tambahkan test akses anon, staff, dan owner.

Acceptance criteria:

- Anon tidak dapat membaca hash/token.
- Staff tidak dapat membaca credential staff lain.
- Login PIN tetap berhasil melalui server action.

#### P0.2 Kunci isolasi data closing berdasarkan role dan ownership

Lokasi:

- `docs/agents/db_schema.sql:184-215`
- `app/employee/riwayat/actions.ts:75-84`
- `app/employee/riwayat/actions.ts:147`

Masalah:

- Staff dapat mengambil closing staff lain hanya dengan mengetahui ID.
- `cash_initial` dikembalikan ke halaman staff.
- Insert `daily_closing_items` tidak memastikan `closing_id` milik user pengirim.

Perbaikan:

- Staff hanya boleh SELECT closing miliknya.
- Owner boleh SELECT seluruh closing.
- Staff tidak boleh melihat `cash_initial` jika ADR-0002 tetap menjadi source of truth.
- Batasi insert item ke closing yang dimiliki user dan berstatus sesuai.
- Tambahkan authorization check di server action, bukan hanya mengandalkan UI.

Acceptance criteria:

- Staff A tidak dapat membaca atau mengubah data Staff B.
- Staff tidak menerima `cash_initial`.
- Manipulasi langsung melalui Supabase API ditolak RLS.

#### P0.3 Lengkapi schema Request Edit

Lokasi:

- `docs/agents/db_schema.sql:251-259`
- `app/employee/request-edit/actions.ts:77-80`
- `app/owner/request-edit/actions.ts:176-179, 225`

Masalah:

Code menggunakan kolom `changes`, `approved_by`, `approved_at`, dan `notes`, tetapi schema tidak mendefinisikannya dan tidak ada migration terkait.

Perbaikan:

- Tambahkan migration untuk seluruh kolom tersebut.
- Pastikan tipe `changes` konsisten, disarankan `JSONB`.
- Jalankan migration pada staging dan uji create, approve, reject.

Acceptance criteria:

- Tiga alur Request Edit berjalan tanpa error SQL.
- Migration aman dijalankan pada database existing.

#### P0.4 Perbaiki approval Request Edit dan recalculation

Lokasi:

- `app/owner/request-edit/actions.ts:191-207`

Masalah:

- Payload disimpan sebagai object `{ items, cash_physical }`, tetapi approval memperlakukannya sebagai array.
- `cash_physical` dapat menjadi `0` secara diam-diam.
- Discrepancy dan snapshot expense tidak dihitung ulang.

Perbaikan:

- Parse `changes.items` dan `changes.cash_physical` secara eksplisit.
- Pertahankan `cash_initial` lama.
- Hitung ulang omzet dan discrepancy memakai formula ADR.
- Update closing dan request audit secara atomic.

Acceptance criteria:

- Approval tidak mengubah `cash_initial`.
- Nilai kas hasil edit sama dengan payload request.
- Discrepancy setelah approval konsisten dengan data terbaru.

### P1: Wajib Sebelum Deploy Produksi

#### P1.1 Pertahankan satu closing global per tanggal

Lokasi: `docs/agents/db_schema.sql:158`

Keputusan dikonfirmasi: satu staff yang sudah closing pada hari tersebut mengunci closing hari itu. Constraint `closing_date UNIQUE` dipertahankan.

#### P1.2 Gunakan hanya closing `verified` pada angka final

Lokasi:

- `app/owner/dashboard/actions.ts:72-113`
- `app/owner/laporan/actions.ts:10-20`

Tambahkan filter `status = 'verified'` untuk trend, top-5, KPI, sales report, dan export. Closing `submitted` atau `rejected` tidak boleh masuk angka bisnis final.

#### P1.3 Tegaskan keputusan visibility expense

Saat ini ada konflik antara spec pengeluaran dan implementasi:

- `.scratch/pencatatan-pengeluaran/spec.md:26,34`: staff tidak melihat expense.
- `docs/agents/migrations/006_allow_staff_read_expenses.sql`: semua authenticated dapat SELECT.
- `docs/CHECKLIST.md:186,191`: staff dapat melihat rincian expense di riwayat.

Pilih satu kebijakan, dokumentasikan di ADR/CONTEXT, lalu samakan RLS dan UI.

#### P1.4 Perbaiki formula dan restock detail

- `lib/calc.ts:69-75`: `calculateDiscrepancy()` obsolete dan salah formula; hapus atau samakan dengan ADR-0001.
- Detail verifikasi menggunakan `restock: 0`; gunakan `restock_stock` dari `daily_closing_items`.

#### P1.5 Perbaiki validasi dan atomicity

- Validasi semua input server-side: tanggal, nominal, item, quantity, status, dan ownership.
- Hindari N+1 query pada `submitClosing` (`getRestocksForItem()` per item).
- Gunakan database RPC/transaction agar closing dan item tidak tersimpan setengah.

### P2: Wajib Sebelum Release Candidate

#### P2.1 Pulihkan quality gate

- Perbaiki 4 test yang gagal, termasuk mock `.maybeSingle()` dan hasil insert row.
- Tambahkan test untuk verify, reject, discrepancy, expense CRUD, login, dan Request Edit.
- Kurangi `any` dan dead code hingga lint lulus.
- Bersihkan trailing whitespace.

#### P2.2 Perbaiki rate limiting

`app/login/actions.ts:36` memakai `Map` in-memory. Ini tidak dapat diandalkan pada serverless/multi-instance. Gunakan rate limiter berbasis storage atau proteksi Supabase/edge yang sesuai deployment target.

#### P2.3 Rapikan halaman non-production

- Evaluasi penghapusan `/prototype/penutupan` dari production.
- `/owner/karyawan` masih localStorage dan belum terhubung Supabase Auth; hapus dari navigasi atau tandai dev-only sampai siap.
- Pastikan halaman feature-flagged memang sengaja dapat atau tidak dapat dibuka melalui URL langsung.

### P3: Cleanup dan Dokumentasi

- Samakan istilah `payment_channel` vs `pocket` di spec dan schema.
- Samakan kategori `KUE_KONSI` vs `KONSINYASI_KUE`; hilangkan cast `as any` sebagai penutup mismatch.
- Pilih satu package manager dan satu lockfile (`package-lock.json` atau `pnpm-lock.yaml`).
- Dokumentasikan urutan migration, environment staging/production, dan rollback plan.

## Risk Register

| ID | Risiko | Dampak | Kemungkinan | Mitigasi | Priority |
|---|---|---|---|---|---|
| R1 | Credential staff bocor melalui RLS/RPC | Account takeover, brute-force dipercepat | Tinggi | Tutup SELECT/RPC credential, test role isolation | P0 |
| R2 | Staff membaca atau memanipulasi closing staff lain | Integritas audit dan privacy rusak | Tinggi | RLS ownership + server authorization | P0 |
| R3 | Request Edit gagal karena kolom database hilang | Fitur runtime error | Pasti saat dipakai | Migration schema lengkap | P0 |
| R4 | Approval edit men-zero-kan kas | Laporan dan discrepancy salah | Tinggi | Parse payload benar, test regression | P0 |
| R5 | Closing pending/rejected masuk laporan | KPI dan keputusan finansial salah | Tinggi | Filter `verified` | P1 |
| R6 | Beberapa staff tidak bisa closing di hari sama | Operasional terblokir | Sedang | Composite unique key | P1 |
| R7 | Closing tersimpan tanpa item | Data parsial dan rekonsiliasi salah | Sedang | Transaction/RPC | P1 |
| R8 | PIN brute-force melewati rate limiter | Account compromise | Sedang | Shared rate limiter | P2 |
| R9 | Deploy gagal karena migration belum diterapkan | Runtime SQL error | Tinggi | Staging migration rehearsal | P0 |
| R10 | Angka UI berbeda antar halaman | Hilang kepercayaan user | Sedang | Shared domain calculation + integration tests | P1 |

## Rekomendasi Phase

### Phase 17A: Security and Data Boundary

Scope: R1, R2, R9.

- Perbaiki profiles/RPC credential.
- Kunci RLS closing dan item.
- Putuskan visibility `cash_initial` dan expenses.
- Tambahkan test role isolation.

Exit criteria: seluruh negative authorization test lulus dan tidak ada credential sensitif di response.

### Phase 17B: Data Integrity and Workflow

Scope: R3, R4, R6, R7.

- Tambahkan migration Request Edit.
- Perbaiki approval/recalculation.
- Ubah unique constraint bila multi-staff closing diperlukan.
- Jadikan submit/edit atomic.

Exit criteria: closing, verify, reject, resolve, dan Request Edit lulus integration test.

### Phase 17C: Reporting Correctness

Scope: R5, R10.

- Filter seluruh laporan/dashboard/export ke `verified` sesuai kebutuhan.
- Satukan formula discrepancy dan restock.
- Uji angka dengan fixture verified/submitted/rejected.

Exit criteria: dashboard, laporan, detail, dan export menghasilkan angka yang sama.

### Phase 17D: Quality and Release Hardening

Scope: R8 dan P2/P3.

- Lint dan test harus lulus.
- Tambahkan E2E untuk login, closing, verify, dan akses role.
- Ganti rate limiter in-memory.
- Bersihkan prototype/dead code dan finalisasi deployment runbook.

Exit criteria: build, lint, unit/integration test, dan smoke E2E lulus di staging.

## Keputusan Terkonfirmasi

1. Satu closing global per tanggal; staff lain tidak dapat membuat closing pada tanggal yang sama.
2. Staff hanya dapat melihat riwayat closing miliknya sendiri.
3. `cash_initial` boleh dilihat staff secara read-only.
4. Staff boleh melihat rincian expense sesuai kebutuhan transparansi riwayat.
5. `/owner/karyawan` ikut release; `/prototype/*` dihapus dari production.
6. Dashboard/laporan memakai closing `verified` sebagai angka final.
7. Semua issue harus closed sebelum deploy; migration dijalankan manual melalui Supabase SQL Editor.
