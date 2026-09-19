# 01 — Tabel expenses + RLS owner-only

Type: task
Status: open

Buat tabel `public.expenses` sesuai spec.md (kolom, enum kategori & channel).

- Enum kategori: `BAHAN_MINUMAN`, `BAHAN_KUE`, `PLASTIK`, `KARDUS`, `NOTA`, `STEMPEL_STIKER`, `LAINNYA`.
- Enum channel: `CASH_LACI`, `QRIS_AWFOOD`.
- RLS: SELECT/INSERT/UPDATE/DELETE hanya `is_owner()`. Staff tidak punya akses.
- `created_by` default ke `auth.uid()`.
