# 03 — Integrasi rekonsiliasi & verifikasi closing

Type: task
Status: open

- Verifikasi closing menampilkan pengeluaran hari itu per channel.
- Rumus: `adjusted_cash = cash_physical + sum(setoran CASH_LACI) + sum(pengeluaran CASH_LACI)`; `adjusted_qris = qris_physical + sum(pengeluaran QRIS_AWFOOD)`.
- Selisih yang tadinya "minus misterius" terjelaskan setelah owner mengisi entri pengeluaran (backdate) sebelum verifikasi.
