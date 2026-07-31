# 11b — Request Edit: Employee form request edit

**What to build:** Form request edit: pilih field yang diubah (stok awal/akhir item tertentu), input nilai baru, isi reason. Submit → INSERT audit_request_edits (PENDING_OWNER).

**Blocked by:** 11a

**Status:** ready-for-agent

- [ ] Tabel items dari closing: tampilkan old values + input new values
- [ ] Textarea: reason/alasan
- [ ] Server action `submitRequestEdit` — INSERT audit_request_edits (PENDING_OWNER)
- [ ] Data baru disimpan sebagai JSON di `new_data` column
