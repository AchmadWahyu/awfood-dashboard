# Development Plan — AW Food Dashboard

## Ringkasan

Stack: Next.js (App Router) + Supabase (PostgreSQL + Auth) + Tailwind CSS v4
Deploy target: Cloudflare
Testing framework: Vitest

Route structure: `/employee/*` dan `/owner/*` dalam satu Next.js app.

---

## Phase 0: Setup Proyek & Database

### 0.1 Setup Supabase
- [ ] Buat project Supabase baru
- [ ] Apply schema dari `docs/agents/db_schema.sql` (via Supabase SQL Editor atau migration)
- [ ] Buat dummy auth user untuk owner (seed awal via Supabase dashboard)

### 0.2 Setup Next.js + Dependencies
- [ ] Install Supabase client: `@supabase/supabase-js` + `@supabase/ssr`
- [ ] Install bcrypt untuk PIN hashing
- [ ] Install Vitest + @testing-library/react untuk testing
- [ ] Setup Supabase client helpers (server component, server action, client)
- [ ] Setup environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

### 0.3 Setup Auth Route
- [ ] Owner login page (`/login`) — email+password via Supabase Auth
- [ ] Employee login page (`/login/pin`) — server action verifikasi PIN
- [ ] Middleware untuk routing proteksi (`/employee/*` dan `/owner/*`)
- [ ] Seed script untuk buat akun staff (dummy auth user + pin_hash)

### 0.4 Setup Vitest
- [ ] Config Vitest (vitest.config.ts)
- [ ] Test helpers & mock Supabase client

---

## Phase 1: Master Data (Owner Only)

### 1.1 Halaman Manage Supplier
- [ ] Server action: list, create, update, soft-delete supplier
- [ ] UI: tabel supplier + form tambah/edit
- [ ] Vitest: test CRUD logic

### 1.2 Halaman Manage Items (Kue & Minuman)
- [ ] Server action: list, create, update, soft-delete item
- [ ] Item punya relasi ke supplier (untuk konsinyasi) atau category MINUMAN_OWNER
- [ ] UI: tabel item per supplier + form tambah/edit
- [ ] Vitest: test CRUD logic

### 1.3 Halaman Restock Minuman
- [ ] Server action: create restock record
- [ ] UI: form restock (pilih item, qty, date)
- [ ] Vitest: test restock affects running stock calculation

---

## Phase 2: Closing (Employee Flow)

### 2.1 Halaman Penutupan Toko (Variant B — Accordion)
- [ ] Prototype existing → migrate ke Supabase backend
- [ ] Load master data (suppliers + items) from Supabase
- [ ] Form stok awal & stok akhir per item, dikelompokkan per supplier (accordion)
- [ ] Live calculation: terjual, subtotal per supplier, grand total
- [ ] Input kas fisik
- [ ] Submit → INSERT daily_closings + daily_closing_items (status = DRAFT → SUBMITTED)
- [ ] Vitest: test calcTerjual, calcTotal, calcGrandTotal (pure functions)
- [ ] Vitest: test submit flow (server action)

### 2.2 Riwayat Closing (Employee)
- [ ] View daftar closing yang sudah disubmit
- [ ] Vitest: test query

### 2.3 Catat Pembayaran Supplier (Employee — dari Laci)
- [ ] UI: form pembayaran supplier (pilih supplier, nominal, cash/transfer)
- [ ] Server action: INSERT supplier_settlements (paid_from_drawer = TRUE)
- [ ] Vitest: test insert settlement

---

## Phase 3: Verifikasi & Rekonsiliasi (Owner Flow)

### 3.1 Halaman Daftar Closing Pending
- [ ] List all closing dengan status SUBMITTED
- [ ] Filter by date
- [ ] Badge notifikasi: jumlah pending

### 3.2 Halaman Verifikasi Closing (Satu Langkah)
- [ ] Tampilkan detail closing: stok per supplier, expected revenue, kas fisik
- [ ] Owner konfirmasi kas fisik (sesuai/tidak)
- [ ] Owner input QRIS final dari mutasi bank
- [ ] Sistem hitung selisih:
    ```
    adjusted_cash = cash_physical + sum(supplier_settlements.paid_from_drawer)
    discrepancy = expected_revenue - (adjusted_cash + qris_verified)
    ```
- [ ] Selisih ≤ Rp5.000 → auto resolve (masuk pendapatan lain atau ditutup owner)
- [ ] Selisih > Rp5.000 → status investigasi (open)
- [ ] Update daily_closings: status = VERIFIED, cash_discrepancy, verified_by, verified_at
- [ ] Vitest: test reconciliation calculation logic
- [ ] Vitest: test discrepancy handling (≤5000 vs >5000)

### 3.3 Investigasi Selisih
- [ ] UI: list selisih open
- [ ] Owner resolve: koreksi data, ditanggung usaha, atau ditanggung karyawan
- [ ] Jika ditanggung karyawan → INSERT employee_deductions
- [ ] Vitest: test resolution flow

---

## Phase 4: Request Edit, Klaim & Supplier Ledger

### 4.1 Request Edit
- [ ] Employee: form request edit (reason, data baru)
- [ ] Server action: INSERT audit_request_edits (status: PENDING_OWNER)
- [ ] Owner: approval page (compare old vs new data)
- [ ] Owner approve → update daily_closing_items + status audit
- [ ] Owner reject → status REJECTED
- [ ] Vitest: test request edit flow

### 4.2 Klaim Barang (Rusak, Bonus, Konsumsi)
- [ ] Employee: form klaim per item (type, qty, notes)
- [ ] Server action: INSERT item_claims (status: PENDING)
- [ ] Owner: approval page
- [ ] Owner approve → status APPROVED, kurangi expected revenue
- [ ] Owner reject → status REJECTED
- [ ] Vitest: test claim affects reconciliation

### 4.3 Supplier Ledger
- [ ] View: saldo hutang per supplier (dari view supplier_ledger)
- [ ] Detail: riwayat penjualan per supplier
- [ ] Vitest: test view query

### 4.4 Pembayaran Supplier (Owner)
- [ ] Form pembayaran (pilih supplier, nominal, metode, paid_from_drawer)
- [ ] Riwayat pembayaran
- [ ] Vitest: test insert settlement

---

## Phase 5: Dashboard & Laporan

### 5.1 Dashboard Overview (Owner)
- [ ] Pending action alerts (request edit, selisih > 5rb, klaim)
- [ ] KPI cards: omzet hari ini, kas vs QRIS, utang supplier, status selisih
- [ ] Grafik: tren omzet (7/30 hari), top 5 kue terlaris
- [ ] Data dari Supabase queries (bisa pake server actions atau langsung RLS)

### 5.2 Laporan & Export
- [ ] Laporan penjualan (filter by date range)
- [ ] Laporan supplier ledger
- [ ] Riwayat selisih
- [ ] Export ke .xlsx dan .csv

---

## Phase 6: Polish & Deploy

### 6.1 Notifikasi
- [ ] Badge/indicator pada menu owner untuk pending items

### 6.2 Error Handling & Loading States
- [ ] Consistent error UI
- [ ] Loading skeletons
- [ ] Toast notifications untuk success/error

### 6.3 Deploy ke Cloudflare
- [ ] Setup Cloudflare Pages (atau Cloudflare Workers untuk Next.js)
- [ ] Environment variables di Cloudflare dashboard
- [ ] Deploy production
- [ ] Custom domain: `dashboard.awfood.id`
- [ ] SSL

### 6.4 Testing Akhir
- [ ] E2E test untuk critical flows (optional — bisa nanti)
- [ ] UAT dengan owner

---

## Catatan Testing

Seam utama: **Vitest untuk pure business logic & server actions**.

Pure functions yang di-test:
- `calcTerjual(stokAwal, stokAkhir)`
- `calcTotal(terjual, hargaJual)`
- `calcGrandTotal(items)`
- `calcDiscrepancy(expectedRevenue, cashPhysical, qrisVerified, supplierPayments)`
- `resolveSelisih(discrepancy, threshold)`

Server actions yang di-test:
- Submit closing
- Verify closing
- Create request edit
- Approve/reject request edit
- Create claim
- Approve/reject claim
- Create supplier settlement
- PIN login

Tidak ada test untuk visual UI component pada fase awal (kecuali ada waktu).
