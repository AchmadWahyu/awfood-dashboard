# AW Food Dashboard — Domain Glossary

## Closing (Penutupan)

The end-of-shift process where employee counts remaining stock and physical cash, then inputs them into the tablet.

- States: `draft` → `submitted` → `verified`

## Consignment (Konsinyasi)

Supplier delivers goods on consignment: paid only for what is sold. Unsold goods are returned.

## Opening Stock (Stok Awal)

Stock quantity at start of shift, transcribed from supplier's paper delivery note.

## Ending Stock (Stok Akhir)

Stock quantity physically counted at closing.

## Discrepancy (Selisih)

Difference between expected revenue (calculated from units sold × price) and actual cash + QRIS collected.

- Tolerance: Rp5.000/day
- Above tolerance → investigation (`open` / `resolved`)
- Resolution types: `data correction`, `covered by business`, `covered by employee`

## Claim (Klaim)

Employee request to record damaged, stale, bonus, or internal-consumption items. Requires owner approval.

- States: `pending` → `approved` / `rejected`

## Request Edit

Employee request to correct data after submission. Owner must approve.

## Physical Cash (Kas Fisik)

Cash counted in the drawer at closing, reported by employee, verified by owner.

## QRIS Settlement

Total QRIS payment received, verified by owner against bank statement (not auto-integrated at this stage).

## Supplier Ledger (Buku Besar Supplier)

Outstanding debt balance per supplier, with payment history recorded by owner.

## Beverage (Minuman Milik Sendiri)

Owner's own beverage stock (not consignment). Restocked by owner only. Employee records ending stock at closing.
