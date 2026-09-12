# AW Food Dashboard — Implementation Checklist

> SSOT progress dashboard. Format: `[x]` selesai, `[ ]` belum, `[-]` skip/tunda.

---

## Phase 01 — Setup Supabase + Next.js ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 01a | Create Supabase project | [x] |
| 01b | Apply schema SQL | [x] |
| 01c | Install dependencies | [x] |
| 01d | Setup environment variables | [x] |
| 01e | Create Supabase client helpers | [x] |

---

## Phase 02 — Auth: Owner + Employee Login ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 02a | Login page owner (`/login`) | [x] |
| 02b | PIN login page employee (`/login/pin`) | [x] |
| 02c | Middleware + role protection | [x] |
| 02d | Seed script accounts | [x] |

---

## Phase 03 — Setup Vitest ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 03a | Install Vitest + config | [x] |
| 03b | Test helpers (mock client + factories) | [x] |
| 03c | Verify `npm run test` | [x] |

---

## Phase 04 — Master Data: Suppliers (Owner) ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 04a | Halaman daftar supplier (`/owner/supplier`) | [x] |
| 04b | Form tambah supplier | [x] |
| 04c | Form edit supplier | [x] |
| 04d | Soft-delete supplier | [x] |
| 04e | Server actions CRUD | [x] |
| 04f | Vitest | [-] |

---

## Phase 05 — Master Data: Items (Owner) ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 05a | Halaman daftar items (`/owner/items`) | [x] |
| 05b | Form tambah item | [x] |
| 05c | Form edit item | [x] |
| 05d | Soft-delete item | [x] |
| 05e | Server actions CRUD | [x] |
| 05f | Vitest | [-] |

---

## Phase 06 — Restock Minuman (Owner) ✅

> ⚠️ Feature flag OFF di first release — halaman ada tapi tidak muncul di navigasi.

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 06a | Halaman riwayat restock (`/owner/restocks`) | [x] |
| 06b | Form restock | [x] |
| 06c | Server action | [x] |
| 06d | Vitest | [-] |

---

## Phase 07 — Employee Closing Form ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 07a | Load master data from Supabase | [x] |
| 07b | Accordion UI per supplier | [x] |
| 07c | Live calculation | [x] |
| 07d | Input kas fisik | [x] |
| 07e | Submit closing | [x] |
| 07f | Ringkasan setelah submit | [x] |
| 07g | Tombol request edit | [x] |
| 07h | Vitest pure functions | [x] |
| 07i | Vitest server action | [x] |

**Catatan:**
- Draft concept dihapus — closing langsung `submitted`
- `cash_initial` tidak diinput staff (owner-only saat verifikasi)

---

## Phase 08 — Employee Supplier Payment ⏳

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 08a | Halaman daftar pembayaran (`/employee/pembayaran`) | [ ] |
| 08b | Form pembayaran | [ ] |
| 08c | Server action | [ ] |
| 08d | Vitest | [-] |

---

## Phase 09 — Owner Verification ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 09a | Halaman pending closing (`/owner/verifikasi`) | [x] |
| 09b | Detail closing (item, stok, terjual) | [x] |
| 09c | Konfirmasi/reject closing | [x] |
| 09d | Input QRIS final | [x] |
| 09e | Kalkulasi selisih | [x] |
| 09f | Integrasi pengeluaran ke selisih | [x] |
| 09g | Closing verified | [x] |
| 09h | Vitest | [-] |

**Catatan:**
- Sudah migrasi dari localStorage ke Supabase (`actions.ts` + server component)
- Database schema ditambah: `status`, `verified_by`, `verified_at`, `updated_at`
- Migration: `docs/agents/migrations/001_add_closing_status.sql`
- **Rumus selisih baru:** `discrepancy = omzet − ((cash_physical − cash_initial + expenses_cash) + (qris + expenses_qris))`
- **Snapshot policy:** `expenses_cash_snapshot` & `expenses_qris_snapshot` disimpan saat verifikasi (frozen)

---

## Phase 10 — Discrepancy Investigation ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 10a | Halaman daftar selisih (`/owner/selisih`) | [x] |
| 10b | Detail selisih per closing | [x] |
| 10c | Update status investigasi (resolve) | [x] |
| 10d | Auto-add deduction karyawan | [x] |
| 10e | Breakdown pengeluaran di detail | [x] |
| 10f | Vitest | [-] |

**Catatan:**
- Sudah migrasi dari localStorage ke Supabase
- Resolusi: "koreksi data" | "ditanggung usaha" | "ditanggung karyawan"
- Kalau "ditanggung karyawan", otomatis insert ke `employee_deductions`
- **Detail selisih pakai snapshot** (`expenses_cash_snapshot` / `expenses_qris_snapshot`) — bukan query live dari tabel `expenses`. Ini menjaga integritas data closing yang sudah diverifikasi (frozen).

---

## Phase 11 — Request Edit ✅

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 11a | Employee: lihat riwayat closing (`/employee/riwayat`) | [x] |
| 11b | Employee: form request edit (`/employee/request-edit`) | [x] |
| 11c | Owner: list pending approval (`/owner/request-edit`) | [x] |
| 11d | Owner: approve/reject request | [x] |
| 11e | Vitest | [-] |

**Catatan:**
- Sudah migrasi dari localStorage ke Supabase
- Staff tidak bisa edit closing langsung — harus ajukan request edit
- **Bottom sheet riwayat staff menampilkan:** Kas Awal, Pengeluaran (snapshot), Rincian Pengeluaran (live), dan breakdown selisih lengkap — sama persis dengan owner

---

## Phase 09b — Pengeluaran (Owner) ✅

> Dikerjakan bersamaan Phase 09 (integrasi pengeluaran ke selisih).

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 09b-a | Tabel `expenses` di database | [x] |
| 09b-b | Server actions CRUD (`app/owner/pengeluaran/actions.ts`) | [x] |
| 09b-c | Halaman `/owner/pengeluaran` (server component + client) | [x] |
| 09b-d | Form tambah pengeluaran (kategori, kantong, nominal, tanggal) | [x] |
| 09b-e | Summary cards (total Cash, total QRIS) | [x] |
| 09b-f | Hapus pengeluaran | [x] |
| 09b-g | Staff bisa melihat rincian pengeluaran di riwayat closing | [x] |
| 09b-h | Vitest | [-] |

**Catatan:**
- Sudah migrasi dari localStorage ke Supabase
- RLS policy: **SELECT** untuk semua authenticated (staff bisa lihat); **INSERT/UPDATE/DELETE** owner-only
- Tidak ada edit — hanya add/delete (immutable by design)
- Migration: `docs/agents/migrations/002_add_expenses_table.sql` + `006_allow_staff_read_expenses.sql`

---

## Phase 12 — Claims (Klaim) ⏳

> ⚠️ Feature flag OFF di first release.
> Masih pakai localStorage dummy (`lib/dummy/api.ts`).

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 12a | Employee: form klaim (`/employee/klaim`) | [ ] |
| 12b | Owner: list klaim (`/owner/klaim`) | [ ] |
| 12c | Owner: approve/reject klaim | [ ] |
| 12d | Vitest | [-] |

---

## Phase 13 — Supplier Ledger ⏳

> ⚠️ Feature flag OFF di first release.
> Masih pakai localStorage dummy (`lib/dummy/api.ts`).

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 13a | Halaman ledger table (`/owner/ledger`) | [ ] |
| 13b | Detail supplier (histori) | [ ] |
| 13c | Owner payment | [ ] |
| 13d | Vitest | [-] |

---

## Phase 14 — Dashboard Overview ⏳

> Masih pakai localStorage dummy (`lib/dummy/api.ts`).

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 14a | Pending closing cards | [ ] |
| 14b | KPI cards | [ ] |
| 14c | Omzet trend chart | [ ] |
| 14d | Top 5 items | [ ] |

---

## Phase 15 — Reports & Export ⏳

> Masih pakai localStorage dummy (`lib/dummy/api.ts`).

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 15a | Sales report (`/owner/laporan`) | [ ] |
| 15b | Supplier ledger report | [ ] |
| 15c | Discrepancy report | [ ] |
| 15d | Export Excel | [ ] |
| 15e | Export CSV | [ ] |

---

## Phase 16 — Polish & Deploy ⏳

| Ticket | Deskripsi | Status |
|--------|-----------|--------|
| 16a | Nav badges (notification count) | [ ] |
| 16b | Loading skeletons | [ ] |
| 16c | Toast notifications | [ ] |
| 16d | Error boundaries | [ ] |
| 16e | Cloudflare setup | [ ] |
| 16f | Custom domain | [ ] |

---

## Ringkasan Status

| Phase | Status | Progress |
|-------|--------|----------|
| 01 | ✅ Clear | 5/5 |
| 02 | ✅ Clear | 4/4 |
| 03 | ✅ Clear | 3/3 |
| 04 | ✅ Clear | 5/6 |
| 05 | ✅ Clear | 5/6 |
| 06 | ✅ Clear | 3/4 |
| 07 | ✅ Clear | 9/9 |
| 08 | ⏳ Pending | 0/4 |
| 09 | ✅ Clear | 7/8 |
| 10 | ✅ Clear | 5/6 |
| 11 | ✅ Clear | 5/6 |
| 09b | ✅ Clear | 7/8 |
| 12 | ⏳ Pending | 0/4 (feature flag OFF) |
| 13 | ⏳ Pending | 0/4 (feature flag OFF) |
| 14 | ⏳ Pending | 0/4 |
| 15 | ⏳ Pending | 0/5 |
| 16 | ⏳ Pending | 0/6 |

**Total:** 58/86 sub-ticket selesai (67.4%)

---

## Halaman yang Sudah Migrasi ke Supabase ✅

| Halaman | File Actions | Catatan |
|---------|-------------|---------|
| `/employee/penutupan` | `app/employee/penutupan/actions.ts` | Submit closing |
| `/employee/riwayat` | `app/employee/riwayat/actions.ts` | Riwayat closing staff |
| `/employee/request-edit` | `app/employee/request-edit/actions.ts` | Ajukan edit |
| `/owner/verifikasi` | `app/owner/verifikasi/actions.ts` | Verifikasi closing |
| `/owner/selisih` | `app/owner/selisih/actions.ts` | Investigasi selisih |
| `/owner/request-edit` | `app/owner/request-edit/actions.ts` | Approval edit |
| `/owner/items` | `app/owner/items/actions.ts` | CRUD items |
| `/owner/supplier` | `app/owner/supplier/actions.ts` | CRUD suppliers |
| `/owner/restocks` | `app/owner/restocks/actions.ts` | Riwayat restock |
| `/owner/pengeluaran` | `app/owner/pengeluaran/actions.ts` | CRUD pengeluaran |

## Halaman yang Masih LocalStorage Dummy ⏳

| Halaman | Alasan |
|---------|--------|
| `/owner/dashboard` | Phase 14 belum dikerjakan |
| `/owner/laporan` | Phase 15 belum dikerjakan |
| `/owner/karyawan` | Belum ada phase |
| `/owner/ledger` | Feature flag OFF |
| `/owner/klaim` | Feature flag OFF |
| `/employee/klaim` | Feature flag OFF |

---

## Keputusan Penting (dari memory)

1. **cash_initial_staff_invisible** — Staff tidak mengubah `cash_initial` (input owner saat verifikasi). Tapi staff bisa **melihat** Kas Awal di riwayat closing untuk transparansi.
2. **closing_submitted_no_rewrite** — Setelah submit, staff tidak bisa rewrite closing hari yang sama. Harus ajukan request edit.
3. **restock_klaim_navigation_disabled** — Menu Restock & Klaim disembunyikan dari sidebar owner (tetap bisa diakses via URL).
4. **closing_dev_date_simulation** — Di dev, ada date picker untuk simulasi closing multi-tanggal. Di produksi, otomatis tanggal hari ini.
5. **expense_visibility** — Entri pengeluaran: **owner-only CRUD**, tapi staff bisa **SELECT/lihat** rincian pengeluaran di riwayat closing (transparansi).
6. **expense_channels** — Channel: CASH_LACI | QRIS_AWFOOD.
7. **expense_snapshot** — Saat verifikasi, total pengeluaran disimpan sebagai snapshot (`expenses_cash_snapshot`, `expenses_qris_snapshot`). Closing frozen — tidak berubah meski expense ditambah/dihapus setelah verifikasi.
8. **timezone_fix** — `todayJakarta()` dipakai untuk closing date agar server (UTC) dan client (Asia/Jakarta) konsisten.

---

## Database Schema Updates (Recent)

**Migration 001:** `docs/agents/migrations/001_add_closing_status.sql`
- Tabel `daily_closings` ditambah: `status`, `discrepancy_status`, `discrepancy_resolution`, `verified_by`, `verified_at`, `updated_at`

**Migration 002:** `docs/agents/migrations/002_add_expenses_table.sql`
- Tabel `expenses` (baru) — kategori, kantong, nominal, tanggal, catatan

**Migration 003:** `docs/agents/migrations/003_add_expense_snapshot.sql`
- Tabel `daily_closings` ditambah: `expenses_cash_snapshot`, `expenses_qris_snapshot`

**Migration 006:** `docs/agents/migrations/006_allow_staff_read_expenses.sql`
- RLS policy `expenses`: SELECT untuk semua authenticated; INSERT/UPDATE/DELETE owner-only

---

## File References

- **PRD:** `AW Food About V2.md`
- **ADR:** `docs/adr/`
- **Schema:** `docs/agents/db_schema.sql`
- **Migration:** `docs/agents/migrations/001_add_closing_status.sql`
- **Feature flags:** `lib/feature-flags.ts`
