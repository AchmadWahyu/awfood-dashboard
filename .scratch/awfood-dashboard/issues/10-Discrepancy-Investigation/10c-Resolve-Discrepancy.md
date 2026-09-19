# 10c — Investigation: Resolve discrepancy

**What to build:** Owner resolve dengan pilih hasil akhir: koreksi data (update stok), ditanggung usaha (catat notes), ditanggung karyawan (pilih staff + INSERT employee_deductions). Setelah resolve: update closing status = VERIFIED.

**Blocked by:** 10b

**Status:** ready-for-agent

- [ ] Radio: koreksi data, ditanggung usaha, ditanggung karyawan
- [ ] Jika "ditanggung karyawan": dropdown pilih staff + nominal
- [ ] Server action `resolveDiscrepancy` — UPDATE closing + INSERT employee_deductions jika perlu
- [ ] Toast sukses + redirect ke daftar
