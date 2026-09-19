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

Money that leaves a pocket without being revenue — supplier settlements from the drawer (`CASH_LACI`) and expenses (`CASH_LACI` / `QRIS_AWFOOD`) — is added back to the expected pocket balance before comparing. Full formula at verification:

`discrepancy = total_omzet − ((cash_physical − cash_initial) + sum(expenses CASH_LACI) + sum(drawer supplier settlements) + qris_verified)`

- Tolerance: Rp5.000/day
- Above tolerance → investigation (`open` / `resolved`)
- Resolution types: `data correction`, `covered by business`, `covered by employee`

## Expense (Pengeluaran)

Owner-only record of money out for trading goods: beverage ingredients, baking ingredients, and consumables (plastic, cardboard, receipts, stamps). Separate entity from supplier settlements and from beverage restock; never references a master item.

- Payment channels: `CASH_LACI` (from the cash drawer) or `QRIS_AWFOOD` (from the stall's QRIS balance)
- _Avoid_: operating cost, opex, uang keluar

## Pocket (Kantong)

One of the two money sources reconciled at closing: the cash drawer (`CASH_LACI`) or the QRIS AW Food balance (`QRIS_AWFOOD`). Money leaving a pocket — an expense or a supplier settlement — reduces its expected balance and is added back when reconciling.

## Expense Category (Kategori Pengeluaran)

Fixed list: `BAHAN_MINUMAN`, `BAHAN_KUE`, `PLASTIK`, `KARDUS`, `NOTA`, `STEMPEL_STIKER`, plus `LAINNYA` whose free-text label acts as its own category.

## Claim (Klaim)

Employee request to record damaged, stale, bonus, or internal-consumption items. Requires owner approval.

- States: `pending` → `approved` / `rejected`

## Request Edit

Employee request to correct data after submission. Owner must approve.

## Physical Cash (Kas Fisik)

Cash counted in the drawer at closing, reported by employee, verified by owner.

## Cash Initial (Kas Awal / Uang Kembalian)

Working capital the owner places in the cash drawer each morning to give change; the full drawer is returned to the owner each night (the drawer resets to zero). Because it varies day to day and only the owner knows its true value, the owner records it at verification — never the employee. It is subtracted from physical cash before comparing against expected revenue: `omzet_kas = cash_physical − cash_initial`.

- Owner-only: recorded at verification (required), not shown to employees in the closing form or history
- Employee request edits cannot change it; it is preserved from the closing
- _Avoid_: opening cash, modal awal

## QRIS Settlement

Total QRIS payment received, verified by owner against bank statement (not auto-integrated at this stage).

## Supplier Ledger (Buku Besar Supplier)

Outstanding debt balance per supplier, with payment history recorded by owner.

## Beverage (Minuman Milik Sendiri)

Owner's own beverage stock (not consignment). Restocked by owner only. Employee records ending stock at closing.
