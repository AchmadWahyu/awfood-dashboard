# 07d — Closing: Input kas fisik

**What to build:** Input field untuk kas fisik (numeric only) di bagian bawah accordion. Wajib diisi sebelum submit.

**Blocked by:** 07b

**Status:** ready-for-agent

**Keputusan desain (sesi coaching + ADR-0002):** Staff **hanya** menginput kas fisik. Input "kas awal / uang kembalian" **DIBATALKAN** dari form staff — `cash_initial` diinput owner saat verifikasi (wajib), tidak pernah oleh staff. Lihat `docs/adr/0002-cash-initial-diinput-owner-saat-verifikasi.md`.

- [ ] Input numeric only (rupiah, formatted)
- [ ] Label: "Kas Fisik (Rp)" — total uang di laci saat tutup
- [ ] Wajib diisi (validasi sebelum submit)
- [ ] Simpan `cash_initial = 0` di `daily_closings` (nilai sebenarnya diisi owner saat verifikasi)
- [ ] `ALTER TABLE daily_closings ADD COLUMN cash_initial NUMERIC(12,2) DEFAULT 0 NOT NULL;` (kolom sudah ada di schema; diisi owner saat verifikasi)
