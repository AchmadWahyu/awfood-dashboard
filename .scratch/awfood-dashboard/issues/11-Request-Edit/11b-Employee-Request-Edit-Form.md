# 11b — Request Edit: Employee form request edit

**What to build:** Form request edit: pilih closing miliknya, lalu **edit seluruh data penutupan** — semua item (stok awal/akhir per supplier + minuman sendiri), kas fisik, dan isi reason. Nilai diisi ulang dari data closing yang dipilih (prefilled). Submit → INSERT request edit dengan **snapshot penuh** (items + cash_physical + reason), status PENDING.

**Blocked by:** 11a

**Status:** ready-for-agent

**Keputusan desain (ADR-0002):** Staff **tidak bisa mengubah `cash_initial`** — field tidak tampil di form; snapshot membawa `cash_initial` yang dipertahankan dari closing saat ini.

- [ ] Pilih closing milik staff (status non-draft)
- [ ] Form seperti form penutupan: tabel items per supplier (stok awal/akhir), minuman sendiri, kas fisik — prefilled dari closing
- [ ] Textarea: reason/alasan (wajib)
- [ ] Snapshot penuh disimpan (items + cash_physical + cash_initial dipertahankan) → `audit_request_edits`
- [ ] Server action `submitRequestEdit` — INSERT (PENDING_OWNER)
