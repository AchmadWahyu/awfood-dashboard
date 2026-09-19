# ADR-0002: Cash Initial (uang kembalian) diinput owner saat verifikasi, bukan staff

Status: accepted

Cash awal (`cash_initial`) adalah working capital yang owner taruh di laci tiap pagi; nilainya berubah tiap hari dan seluruh kas dikembalikan ke owner tiap malam (laci reset ke nol). Karena hanya owner yang tahu nilai sebenarnya, keputusan: `cash_initial` dicatat owner saat verifikasi (wajib, bersama QRIS final) — staff tidak menginput maupun melihatnya, dan request edit staff tidak dapat mengubahnya.

Keputusan ini mengoreksi desain awal (tercatat di coaching.md) bahwa staff mengisi `cash_initial` saat closing. Formula selisih menjadi lengkap sesuai ADR-0001:

`discrepancy = total_omzet − ((cash_physical − cash_initial) + sum(expenses CASH_LACI) + sum(setoran supplier dari laci) + qris_verified)`

Considered options:
- Staff mengisi `cash_initial` di form penutupan (desain awal) — ditolak: staff bukan sumber kebenaran untuk uang yang ditaruh owner; membuka peluang salah entri dan discrepancy palsu.
- Owner set pagi hari sebagai action terpisah — ditolak: menambah permukaan input baru yang harus dijaga konsistensinya, padahal nilainya hanya dipakai saat rekonsiliasi malam.

Consequences:
- Form staff hanya punya satu input kas: `cash_physical`.
- Verifikasi terblokir sampai `cash_initial` terisi.
- Saat request edit disetujui, selisih dihitung ulang dengan `cash_initial` yang dipertahankan dari closing.
