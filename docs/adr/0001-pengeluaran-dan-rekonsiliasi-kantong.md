# ADR-0001: Pengeluaran barang dagangan dicatat terpisah dan ikut rekonsiliasi kantong

Status: accepted

Pengeluaran barang dagangan (bahan baku minuman/kue dan consumables: plastik, kardus, nota, stempel) dicatat sebagai entitas terpisah dari `supplier_settlements` — owner-only, tidak terhubung ke entri restock, dan margin-nya dihitung dari `master_items.cost_price`, bukan dari entri pengeluaran.

Mengoreksi asumsi awal (sesi sebelumnya) bahwa pengeluaran "tidak menyentuh laci kas": uang pengeluaran selalu keluar dari salah satu dari dua kantong yang direkonsiliasi — Kas Laci (`CASH_LACI`) atau QRIS AW Food (`QRIS_AWFOOD`). Rekonsiliasi menambahkan kembali pengeluaran dan setoran supplier dari kantong ke saldo kantong yang diharapkan, sehingga selisih yang tadinya "minus misterius" menjadi terjelaskan.

Considered options:
- `TRANSFER_OWNER` (dana pribadi owner) — ditolak: pengeluaran bisnis keluar dari kantong bisnis, bukan pribadi.
- Entri pengeluaran menunjuk ke item minuman — ditolak: bahan mentah bukan 1:1 dengan minuman jadi; margin sudah lewat `cost_price`.

Consequences:
- Rumus rekonsiliasi harian bertambah faktor pengeluaran per kantong.
- Staff tidak melihat entri pengeluaran (owner-only).
- Entri boleh backdate sebelum verifikasi owner; closing tetap mengikuti alur draft → submitted → verified.
