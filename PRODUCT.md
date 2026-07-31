# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Karyawan (employee) — the person staffing the stall during operational hours (06:00–11:00). They use a tablet at the stall to input closing data after the shop closes. Multiple employees may share the same shift; each has a personal account/PIN for audit traceability.

**Secondary:** Owner — the business owner who verifies cash, reconciles QRIS, approves edits and claims, manages supplier debt, and investigates discrepancies. Uses the dashboard outside operational hours, primarily in the evening.

## Product Purpose

AW Food Dashboard is a consignment stock and cash reconciliation system for a traditional cake stall. It replaces paper-based supplier tracking and manual cash matching with a digital record that makes discrepancies traceable and reduces fraud opportunities.

## Positioning

Unlike generic POS systems that track every transaction at the point of sale, this system works *after* the shop closes: employees count remaining stock and cash, the system calculates what was sold, and the owner reconciles against bank settlement. This post-hoc model matches the real workflow where morning hours are too busy for per-transaction recording.

## Operating Context

- **Stall environment:** Outdoor market stall near Kukel UI, busy during university term, quiet during holidays
- **Hours:** Single daily shift 06:00–11:00
- **Hardware:** Tablet used by employee at stall; Owner uses dashboard on personal device (phone/computer) in the evening
- **Workflow:** Suppliers deliver goods on consignment with paper stock notes → Employee collects paper notes at opening → Shop runs without per-transaction recording → After closing, employee counts remaining stock and cash, inputs to tablet → Employee delivers cash and tablet to owner → Owner verifies cash against bank QRIS settlement
- **Payments:** Cash and QRIS (no credit/debit card, no e-wallet)
- **Language:** Indonesian (Bahasa Indonesia)

## Capabilities and Constraints

### Confirmed
- Stock tracking: opening stock and ending stock per supplier product per day
- Automatic calculation of units sold and revenue per product/supplier
- Employee cash reporting at closing (total physical cash in drawer)
- QRIS verification by owner against bank settlement (no automatic bank API integration at this stage)
- Discrepancy management with tolerance threshold (Rp5.000/day)
- Supplier ledger: debt balance and payment history (internal owner records)
- Employee accounts with PIN for audit trail
- Request edit workflow with owner approval
- Claims for damaged/stale/bonus/internal consumption items with owner approval
- Own-beverage stock tracking (separate from consignment)
- Export to Excel/CSV
- Notification indicators for pending actions (edit requests, discrepancies > Rp5.000, pending claims)
- Dashboard overview: KPIs, charts, top products
### Not in scope (confirmed)

- No per-transaction POS recording
- No automatic bank API integration
- No scheduled supplier payment automation
- No digital receipts for suppliers
- No discounts or promotions
- No photo uploads (removed to save storage)

### Resolved
- Beverage restocks by owner only (Jul 2026)

## Brand Commitments

- Name: AW Food (confirmed)
- No existing logo, color palette, or brand guidelines
- No visual identity assets to preserve
- Voice: straightforward, trustworthy, operational

## Design Preferences

- **Penutupan flow — UI Variant B (Accordion) preferred.** Accordion per supplier dengan tabel di dalamnya, ringkasan omzet real-time, input kas fisik di bagian terpisah, dan tombol simpan di grand total bar. Dinilai paling cocok untuk karyawan di tablet karena: (1) fokus per supplier tanpa overload informasi, (2) navigasi sederhana tanpa tombol prev/next, (3) grand total dan kas fisik selalu terlihat.

## Evidence on Hand

- `Q.md` — detailed requirement discussion summary (Indonesian)
- `AW Food About V2.md` — comprehensive requirements document
- `app/prototype/penutupan/` — existing prototype code for the closing flow (3 UI variants)
- Live website: https://www.awfood.id/
- No real user data, transaction history, or brand assets currently available

## Product Principles

1. **Post-hoc accuracy over real-time recording.** The system fits the actual workflow — input after closing — rather than forcing per-transaction tracking during busy hours.
2. **Traceability before blame.** Every action is logged to a user and timestamp. Discrepancies are investigated, not automatically penalized.
3. **Owner in control, employee empowered.** Employees can do their closing job independently; the owner retains final authority over approvals, verifications, and financial decisions.
4. **Simple and honest.** The UI is straightforward and trustworthy, not gamified or persuasive. It's a tool for getting a job done accurately.

## Accessibility & Inclusion

- Primarily used on a tablet by employees at a market stall (outdoor lighting, possible glare)
- Used at the end of a shift when the employee may be tired
- Owner may use on mobile/desktop at home in the evening
- Indonesian language interface required
