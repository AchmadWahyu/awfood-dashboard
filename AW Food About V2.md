# Requirement Web Dashboard AW Food V2

> **Status implementasi (per 2026-09):** Dokumen ini adalah **target produksi** (Next.js + Supabase). MVP saat ini berjalan dengan **data dummy di browser** (`lib/dummy/*`) — lihat `README.md` untuk detail status MVP.  
> **Fitur OFF di first release:** Restock, Klaim, Supplier Ledger, dan **Request Edit** (sampai waktu yang belum ditentukan). Masing-masing **bisa diaktifkan kapan saja** via feature flag (`lib/feature-flags.ts`). Halaman & kode tetap ada — hanya disembunyikan dari navigasi. Semua tetap menjadi bagian dari requirement produksi.

## 1. Profil Bisnis

**Profil Usaha:** Jualan macam-macam kue basah (pastel, lemper, sosis solo, donat, dll.) dan minuman di dekat pintu masuk Kukel UI.
**Website:** https://www.awfood.id/
**Target Market:** Mahasiswa untuk jajan & warga sekitar.
**Jam Operasional:** Buka mulai jam 06.00 - 11.00 pagi setiap hari (1 shift operasional).
**Kelebihan Bisnis:** Terkadang mendapat pesanan snack box / nasi box, acara mahasiswa, danusan, maupun acara umum.
**Kekurangan Bisnis:** Volume penjualan bersifat musiman (ramai di hari kerja/kuliah, sepi di hari libur panjang atau long weekend).

**Tujuan Owner:**
- Memantau pendapatan, status keuangan, stok, dan kewajiban ke supplier.
- Mencocokkan uang tunai serta QRIS dengan penjualan yang tercatat.
- Mengurangi peluang fraud dan membuat selisih dapat ditelusuri.

## 2. Celah Kecurangan

- **Manipulasi Angka Stok Sisa (Korupsi Terencana):** Kasir mengambil uang tunai di laci, lalu memanipulasi angka stok sisa di laporan fisik agar seolah-olah barang sisa lebih banyak (terjual lebih sedikit), sehingga setoran uang cocok dengan hitungan stok kertas.
- **Alasan Gaib Kue Rusak / Dimakan / Bonus:** Mengklaim kue rusak/basi atau dijadikan bonus tanpa bukti untuk menutupi selisih kasir.
- **Pencatatan QRIS vs Tunai Ditukar:** Sengaja menukar laporan pembayaran tunai dan QRIS untuk membingungkan rekapitulasi harian.
- **Salah Hitung Manual (Human Error / Disengaja):** Kesalahan perkalian/penjumlahan stok awal dikurangi stok akhir pada kertas supplier.

## 3. Flow Operasional & Sistem Pencatatan

**Alur Buka Toko (06.00):** Supplier menitipkan kue beserta catatan kertas stok awal per produk. Kertas supplier dikumpulkan terlebih dahulu tanpa perlu langsung diinput karena jam buka adalah jam sibuk. Kue basi dari supplier saat datang langsung dikembalikan ke supplier (tidak dijual & tidak masuk tagihan).

**Alur Transaksi (06.00-11.00):** Penjualan langsung tunai dan QRIS sesuai harga tetap master data (tanpa diskon/obral). Karyawan tidak mencatat transaksi satu per satu saat toko buka.

**Alur Penutupan Toko (~11.00):** Setelah toko tutup, karyawan membaca catatan stok awal dari kertas supplier, menghitung stok fisik akhir setiap produk, lalu memasukkan stok awal dan stok akhir di tablet per supplier. Tablet menyediakan Kalkulator Kertas Supplier untuk membantu karyawan menyalin hitungan presisi ke kertas fisik supplier. Sistem menghitung jumlah terjual: stok awal - stok akhir.

**Serah Terima:** Wadah dikembalikan ke supplier. Karyawan datang ke rumah owner untuk menyerahkan wadah owner/supplier, tablet, dan uang kas. Owner menerima kas untuk verifikasi dan pencocokan akhir.

## 4. Modul Utama (Mini ERP)

1. **Stock Titipan Masuk & Konsinyasi:** Pencatatan stok awal dan stok akhir per supplier per hari.
2. **Sales & Income:** Rekapitulasi penjualan kue konsinyasi dan minuman milik sendiri.
3. **Supplier Ledger (Buku Besar Supplier):** Pencatatan saldo utang ke supplier dan riwayat pembayaran internal Owner.
4. **Cash Reconciliation & Audit:** Pencocokan kas fisik, verifikasi QRIS, dan penanganan selisih harian.

## 5. Persyaratan Detail

### 5.1 Model Operasional & Shift

Operasional berjalan dalam 1 shift per hari (06:00-11:00). Penjualan dilakukan sesuai harga pas di master data tanpa fitur diskon atau obral.

Ada beberapa karyawan yang dapat bekerja dalam shift yang sama. Setiap karyawan yang menggunakan tablet atau menangani kas wajib memiliki akun/PIN sendiri. Setiap hari harus ada satu **penanggung jawab penutupan** yang memegang tanggung jawab akhir rekonsiliasi. Karyawan lain dapat membantu, tetapi tindakan masing-masing tetap harus terlacak.

### 5.2 Fitur Kalkulator Kertas Supplier (Helper Penulisan)

Pada form penutupan tablet, data dikelompokkan per supplier. Setelah karyawan meng-input Stok Awal dan Stok Akhir, tablet otomatis menampilkan rangkuman kalkulasi (Terjual dan Total Rp) agar karyawan tinggal menyalin angka presisi tersebut ke kertas fisik supplier.

### 5.3 Hak Akses & Pembatasan Tampilan

- **Akses Karyawan (Bare Minimum):** Hanya dapat mengakses form Input Penutupan Toko dan Stok Akhir. ~~pengajuan Request Edit~~ *(OFF di first release)*. Karyawan tidak dapat melihat omzet, laporan keuangan, supplier ledger, atau halaman verifikasi.
- **Akses Owner:** Memiliki akses penuh ke seluruh modul (Master Data, Supplier Ledger, Verifikasi QRIS, Rekonsiliasi Kas, ~~Approval Request Edit~~ *(OFF di first release)*, Laporan Keuangan, dan Export Data).

### 5.4 Master Data & Fleksibilitas Harga

- **Pendaftaran Supplier / Kue Baru:** Hak wewenang penuh Owner. Jika ada kue baru di pagi hari, dicatat manual di kertas dulu dan di-input Owner pada malam hari.
- **Perubahan Harga:** Harga modal dan harga jual bersifat tetap (perubahan jarang, ~6 bulan sekali).
- **Soft Delete:** Data supplier dan kue yang tidak aktif di-arsip/soft delete (is_active = false) agar riwayat transaksi lama tidak hilang.

### 5.5 Penutupan Harian & Kontrol Kas

**Input Penutupan Karyawan:** Karyawan hanya meng-input Total Uang Kas Fisik di laci. Karyawan TIDAK PERLU meng-input nominal QRIS dan TIDAK PERLU mengunggah foto bukti (fitur foto ditiadakan untuk menghemat storage DB).

**Serah Terima Kas:** Kas diserahkan kepada owner melalui proses serah-terima setelah operasional selesai. Owner menghitung ulang kas dan mengonfirmasi hasilnya di sistem.

**Verifikasi QRIS:** Nominal QRIS sepenuhnya diverifikasi dan di-input oleh Owner dari mutasi/settlement bank. QRIS sudah langsung terhubung ke bank, sehingga owner dapat mengecek mutasi hari itu kapan pun setelah jam tutup toko melalui aplikasi bank. Owner memasukkan nominal QRIS final ke sistem lalu menandai status QRIS sebagai `terverifikasi`. Sistem mencatat siapa owner yang melakukan verifikasi, waktu verifikasi, dan nominal final.

Untuk tahap desain saat ini, sistem tidak wajib menarik mutasi bank otomatis. Owner dapat melakukan pengecekan di aplikasi bank, lalu memasukkan atau menandai hasil verifikasi QRIS di sistem.

### 5.6 Investigasi Selisih

**Ambang Toleransi:** Rp5.000 per hari.

**Selisih Kurang:**
- <= Rp5.000: Dapat langsung ditutup Owner. Tetap dicatat, tetapi tanpa investigasi penuh.
- > Rp5.000: Masuk status investigasi terbuka. Wajib melalui proses investigasi sebelum ada keputusan.

**Selisih Lebih:**
- <= Rp5.000: Pendapatan lain-lain/tip usaha.
- > Rp5.000: Masuk investigasi Owner. Selisih lebih tidak pernah memotong gaji karyawan.

**Status Investigasi:** `terbuka` -> `selesai`

**Hasil Akhir:**
- `koreksi data` -- data diperbaiki, selisih selesai.
- `ditanggung usaha` -- selisih ditanggung pemilik usaha.
- `ditanggung karyawan` -- selisih menjadi tanggungan karyawan, dipotong dari gaji. Hanya dapat dipilih jika ada bukti atau pengakuan yang cukup.

**Bukti yang Diakui:** Kronologi serah-terima, catatan tindakan dari akun/PIN karyawan, klarifikasi karyawan, atau pengakuan langsung.

**Aturan Tambahan:**
- Karyawan boleh melihat selisih dan menambahkan catatan, tetapi tidak boleh menutup status selisih sendiri.
- Selisih di atas ambang toleransi tidak otomatis menjadi tanggungan karyawan.
- Selisih dalam ambang toleransi hanya boleh ditutup oleh owner.

### 5.7 Klaim Barang (Rusak / Basi / Bonus / Konsumsi Internal)

Kue basi dari supplier saat datang langsung dikembalikan ke supplier (tidak dijual & tidak masuk tagihan). Kue rusak/basi di lapak atau dijadikan bonus/konsumsi internal dicatat klaimnya di sistem dan membutuhkan Approval Owner.

Karyawan boleh mencatat kejadian barang rusak, basi, bonus, atau konsumsi internal sebagai klaim. Klaim tidak langsung mengurangi kewajiban atau perhitungan final -- Owner wajib meninjau dan menyetujui klaim sebelum memengaruhi rekonsiliasi.

Sistem menyimpan:
- Status klaim: `menunggu approval`, `disetujui`, `ditolak`
- Pembuat klaim, waktu dibuat, yang menyetujui/menolak, dan waktu keputusan
- Untuk klaim bonus atau konsumsi internal, karyawan wajib mengisi keterangan yang jelas

### 5.8 Request Edit & Jejak Audit

**Request Edit:** Jika karyawan salah input setelah submit, wajib mengajukan Request Edit. Sistem mencatat ID karyawan, timestamp, dan nilai sebelum vs sesudah. Perubahan baru aktif setelah Approval Owner.  
> *(First release: Request Edit dinonaktifkan. Jika staff salah input, owner harus ditanya langsung atau dihandle di luar sistem.)*

**Input Susulan (Backdate):** Karyawan diizinkan input penutupan susulan jika terjadi kendala teknis hari sebelumnya.

**Jejak Audit:** Setiap karyawan yang menggunakan tablet atau menangani kas wajib memiliki akun/PIN sendiri. Sistem merekam pelaku dan waktu untuk tindakan penting, termasuk input/ubah data, koreksi, pembatalan, penutupan, dan serah-terima kas.

### 5.9 Potongan Gaji Karyawan

Sistem menyediakan tabel/halaman pencatatan daftar potongan per karyawan. Jika selisih diputuskan ditanggung karyawan, nominal masuk ke rekap potongan karyawan untuk dipotong manual oleh Owner saat penggajian.

Detail yang dicatat:
- Hubungan antara potongan gaji dan kasus selisih sumbernya
- Nominal, alasan, bukti, waktu keputusan, dan owner yang menyetujui
- Potongan dipotong penuh pada periode gaji berikutnya
- Karyawan dapat melihat rincian potongan gaji yang berasal dari kasus selisih

### 5.10 Hutang & Pembayaran Supplier

Dashboard menampilkan Supplier Ledger (saldo hutang per supplier). Rekap pembayaran bersifat catatan internal Owner di dashboard.

**Fitur:**
- Owner dapat melihat supplier mana yang masih memiliki hutang terbuka dan totalnya
- Owner boleh melakukan pembayaran sebagian
- Sistem menyimpan sisa saldo hutang setelah pembayaran sebagian
- Saat pembayaran sebagian, owner memilih hutang atau tanggal titipan mana yang dibayar (tidak otomatis ke hutang paling lama)

**Metode Pembayaran:**
- **Tunai:** Cukup dicatat tanpa bukti foto
- **Transfer:** Wajib menyimpan bukti transfer atau nomor referensi

Sistem tidak perlu membuat tanda terima atau rincian pembayaran untuk supplier pada tahap ini.

### 5.11 Minuman Milik Sendiri

Minuman adalah barang milik owner sendiri, bukan barang konsinyasi supplier. Uang penjualan minuman bercampur dengan kas dan QRIS dari penjualan kue, tetapi perlu dicatat terpisah agar pendapatan owner dan hutang supplier tidak tercampur.

**Model Pencatatan:**
- Restock minuman hanya dicatat oleh Owner di dashboard (owner-only)
- Karyawan mencatat stok akhir minuman saat penutupan
- Terjual dihitung dari: (Stok Awal + Restock Owner) - Stok Akhir
- Pendapatan minuman = jumlah terjual x harga jual

### 5.12 Fitur Sistem & Laporan

- **Export Data:** Laporan penjualan, supplier ledger, dan riwayat selisih dapat diunduh dalam format Excel (.xlsx) dan CSV.
- **Indikator Notifikasi Owner:** Badge icon / titik merah pada menu dashboard untuk memberi tahu Owner jika ada selisih > Rp5.000. ~~Request Edit pending~~ dan ~~klaim barang pending~~ *(OFF di first release — tidak ada badge untuk fitur yang dimatikan).*
- **Siklus Stok Konsinyasi (Reset Harian):** Stok sisa kue konsinyasi selalu direset ke 0 setiap akhir hari (tidak ada rollover/carryover).
- **Dashboard Overview:** Menampilkan Pending Action Alert, Kartu KPI (Omzet, Status Kas vs QRIS, Utang Supplier, Status Selisih), serta Grafik Tren Omzet & Top 5 Kue Terlaris.

### 5.13 Keputusan Teknis (Jul 2026)

- **Stack:** Next.js + Supabase (database PostgreSQL + Auth).
- **Auth Owner:** email + password via Supabase Auth (dashboard dari HP/komputer).
- **Auth Karyawan:** PIN 4-6 digit, diverifikasi via server action (bukan Supabase Auth). Setiap karyawan punya akun untuk jejak audit.
- **Registrasi Akun:** Seed manual -- Owner membuat akun karyawan dari dashboard.
- **Restock Minuman:** Owner-only.

## 6. Prinsip Produk

1. **Post-hoc accuracy over real-time recording.** Sistem cocok dengan alur kerja nyata — input setelah tutup — daripada memaksakan pencatatan per-transaksi saat jam sibuk.
2. **Traceability before blame.** Setiap aksi tercatat ke user dan timestamp. Selisih ditelusuri, tidak otomatis dipidana.
3. **Owner in control, employee empowered.** Karyawan bisa menyelesaikan penutupan secara mandiri; owner memegang otoritas final atas approval, verifikasi, dan keputusan finansial.
4. **Simple and honest.** UI straightforward dan trustworthy, tidak gamified atau persuasive. Alat untuk menyelesaikan pekerjaan dengan akurat.

## 7. Preferensi Desain

- **Penutupan flow — UI Variant B (Accordion) preferred.** Accordion per supplier dengan tabel di dalamnya, ringkasan omzet real-time, input kas fisik di bagian terpisah, dan tombol simpan di grand total bar. Dinilai paling cocok untuk karyawan di tablet karena: (1) fokus per supplier tanpa overload informasi, (2) navigasi sederhana tanpa tombol prev/next, (3) grand total dan kas fisik selalu terlihat.

## 8. Aksesibilitas & Konteks Penggunaan

- **Stall environment:** Lapak outdoor dekat Kukel UI, ramai saat semester aktif, sepi saat libur.
- **Hardware:** Tablet digunakan karyawan di lapak; owner menggunakan dashboard di perangkat pribadi (HP/komputer) di malam hari.
- **Pencahayaan:** Outdoor lighting, kemungkinan glare — UI perlu kontras cukup.
- **Kondisi karyawan:** Menggunakan di akhir shift ketika mungkin sudah lelah.
- **Bahasa:** Bahasa Indonesia.

## 9. Risiko yang Harus Ditangani Sistem

- Manipulasi stok akhir untuk menutup pengambilan uang tunai.
- Penggunaan alasan barang rusak, basi, dimakan, atau bonus tanpa bukti.
- Pertukaran atau salah rekap pembayaran tunai dan QRIS.
- Kesalahan hitung manual yang sengaja maupun tidak sengaja.
