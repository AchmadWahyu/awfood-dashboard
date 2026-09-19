-- ============================================================================
-- RESET TEST DATA — Closing, Verifikasi, Selisih, Pengeluaran
-- ============================================================================
-- ⚠️  DEV / TESTING ONLY. Jangan di-run di production.
--
-- Tabel yang di-reset:
--   - daily_closing_items   (child, ikut terhapus via CASCADE)
--   - daily_closings        (parent)
--   - expenses              (pengeluaran owner)
--   - employee_deductions   (potongan gaji dari selisih)
--   - audit_request_edits   (permintaan edit closing)
--
-- Setelah reset, kamu bisa ulangi flow:
--   1. Staff submit penutupan
--   2. Owner input pengeluaran (opsional)
--   3. Owner verifikasi closing
--   4. Owner resolve selisih (kalau ada)
-- ============================================================================

BEGIN;

-- Hapus semua data transaksional
DELETE FROM public.audit_request_edits;
DELETE FROM public.employee_deductions;
DELETE FROM public.expenses;
DELETE FROM public.daily_closings;
-- daily_closing_items terhapus otomatis karena ON DELETE CASCADE

COMMIT;
