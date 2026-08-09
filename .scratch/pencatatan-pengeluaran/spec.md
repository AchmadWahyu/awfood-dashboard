# Spec: Pencatatan Pengeluaran

Status: dirancang via /grilling + /domain-modeling (2026-08-06). Keputusan arsitektur: ADR-0001.

## Tujuan

1. Menjelaskan selisih rekonsiliasi — uang yang keluar dari kantong tanpa menjadi omzet.
2. Mengetahui pengeluaran per kategori per bulan.

## Model

Entitas baru `expenses`, owner-only, satu entri = satu kategori (flat), tidak menunjuk item mana pun.

| Field | Tipe | Catatan |
|---|---|---|
| id | UUID | |
| expense_date | date | tanggal beli, boleh backdate |
| category | text | `BAHAN_MINUMAN`, `BAHAN_KUE`, `PLASTIK`, `KARDUS`, `NOTA`, `STEMPEL_STIKER` |
| custom_category | text nullable | dipakai saat category = `LAINNYA`; label = nama kategori |
| payment_channel | text | `CASH_LACI` \| `QRIS_AWFOOD` |
| amount | numeric | nominal rupiah |
| note | text nullable | keterangan opsional |
| created_by | uuid → profiles | owner |
| created_at | timestamptz | |

RLS: `is_owner()` untuk read & write. Staff tidak melihat sama sekali.

## Keputusan terkunci

- Terpisah dari `supplier_settlements`, `employee_deductions`, dan entri restock minuman.
- Channel: `CASH_LACI` | `QRIS_AWFOOD` — dua kantong yang direkonsiliasi; uang keluar dari kantong menambah "saldo yang diharapkan" kantong tersebut.
- Margin minuman: `cost_price` di `master_items` (tidak terhubung ke entri pengeluaran).
- Permukaan: verifikasi closing (pengeluaran hari itu per channel) + rekap bulanan per kategori.
- Staff tidak melihat entri pengeluaran; selisih closing terjelaskan saat owner verifikasi.

## Rumus rekonsiliasi

- `adjusted_cash = (cash_physical − cash_initial) + sum(setoran supplier CASH_LACI) + sum(pengeluaran CASH_LACI)`
- `adjusted_qris = qris_physical + sum(pengeluaran QRIS_AWFOOD)`
- Dibandingkan dengan omzet kantong masing-masing; selisih di luar toleransi Rp5.000 masuk investigasi (lihat 5.6 PRD).

Catatan: `cash_initial` (uang kembalian awal di laci) diinput **owner saat verifikasi (wajib)**, bukan staff — lihat ADR-0002. Rumus discrepancy lengkap ada di ticket 09e.
