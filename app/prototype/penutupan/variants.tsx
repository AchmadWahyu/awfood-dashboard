"use client"

import { useMemo, useState } from "react"
import type { PenutupanState, SupplierInput, StokEntry } from "./data"
import {
  suppliers,
  getProductsBySupplier,
  getSupplier,
  calcTerjual,
  calcTotal,
} from "./data"

interface SharedProps {
  state: PenutupanState
  filteredSupplierInputs: SupplierInput[]
  updateStok: (supplierId: string, productId: string, field: "stokAwal" | "stokAkhir", value: number) => void
  setTotalKasFisik: (value: string) => void
  submit: () => void
  reset: () => void
  editRequest: () => void
}

function EmptySearch() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ink-light">
      <svg className="mb-3 w-10 h-10 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <p className="text-sm">Tidak ada kue atau supplier yang cocok</p>
    </div>
  )
}

function calcSupplierTotal(si: SupplierInput): number {
  return si.entries.reduce((sum, e) => {
    const p = getProductsBySupplier(si.supplierId).find((x) => x.id === e.productId)
    return sum + calcTotal(e, p?.hargaJual || 0)
  }, 0)
}

function calcGrandTotal(state: PenutupanState): number {
  return state.supplierInputs.reduce((sum, si) => sum + calcSupplierTotal(si), 0)
}

function NotebookInput({
  value,
  onChange,
  readOnly,
  className,
}: {
  value: number
  onChange: (v: number) => void
  readOnly?: boolean
  className?: string
}) {
  return (
    <input
      type="number"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      disabled={readOnly}
      className={`
        w-14 bg-transparent text-center outline-none
        border-0 border-b-2 border-ruled
        focus:border-marker focus:ring-0
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors
        ${className || ""}
      `}
    />
  )
}

function StokRow({
  entry,
  productName,
  hargaJual,
  onChange,
  readOnly,
  isLast,
}: {
  entry: StokEntry
  productName: string
  hargaJual: number
  onChange: (field: "stokAwal" | "stokAkhir", value: number) => void
  readOnly: boolean
  isLast?: boolean
}) {
  const terjual = calcTerjual(entry)
  const total = calcTotal(entry, hargaJual)
  const hasData = (entry.stokAwal || 0) > 0 || (entry.stokAkhir || 0) > 0
  return (
    <tr className={`notebook-row ${isLast ? "" : ""}`}>
      <td className="py-2 pr-3 text-ink font-medium whitespace-nowrap">{productName}</td>
      <td className="py-1 pr-2 text-center w-[72px]">
        <NotebookInput value={entry.stokAwal} onChange={(v) => onChange("stokAwal", v)} readOnly={readOnly} />
      </td>
      <td className="py-1 pr-2 text-center w-[72px]">
        <NotebookInput value={entry.stokAkhir} onChange={(v) => onChange("stokAkhir", v)} readOnly={readOnly} />
      </td>
      <td className={`py-2 px-3 text-right font-bold w-[72px] ${hasData ? "text-ink" : "text-ink-light"}`}>
        {terjual}
      </td>
      <td className={`py-2 pl-3 text-right font-bold w-[120px] ${hasData ? "text-marker" : "text-ink-light"}`}>
        Rp {total.toLocaleString("id-ID")}
      </td>
    </tr>
  )
}

function SubmittedView({
  state,
  onEditRequest,
  onReset,
}: {
  state: PenutupanState
  onEditRequest: () => void
  onReset: () => void
}) {
  const grandTotal = calcGrandTotal(state)
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="rounded-2xl bg-paper-light border border-notch-border p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-notch-success">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6b47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink">Penutupan Berhasil Disimpan</h2>
        <p className="mt-1 text-sm text-ink-light">{state.submittedAt}</p>

        <div className="mx-auto mt-6 max-w-sm space-y-2 border-t border-notch-border pt-5 text-left">
          {state.supplierInputs.map((si) => {
            const sup = getSupplier(si.supplierId)
            const total = calcSupplierTotal(si)
            if (!sup) return null
            return (
              <div key={si.supplierId} className="flex items-center justify-between text-sm">
                <span className="text-ink-light">{sup.name}</span>
                <span className="font-semibold text-marker">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            )
          })}
          <div className="flex items-center justify-between border-t border-ruled pt-2 text-base font-bold">
            <span className="text-ink">Total Omzet</span>
            <span className="text-marker">Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="text-ink-light">Kas Fisik</span>
            <span className="font-semibold text-ink">
              Rp {(parseInt(state.totalKasFisik) || 0).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={onEditRequest}
            className="rounded-xl border-2 border-marker px-6 py-2.5 text-sm font-bold text-marker hover:bg-marker-light transition-colors"
          >
            Ajukan Request Edit
          </button>
          <button
            onClick={onReset}
            className="rounded-xl border-2 border-notch-border px-6 py-2.5 text-sm font-medium text-ink-light hover:bg-paper transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───── Variant A: Wizard — Buku per Supplier ───── */
export function VariantA(props: SharedProps) {
  const { state, filteredSupplierInputs, updateStok, setTotalKasFisik, submit, editRequest } = props
  const [step, setStep] = useState(0)
  const isSubmitted = state.submitted

  const availableSuppliers = useMemo(
    () => filteredSupplierInputs.map((si) => getSupplier(si.supplierId)!).filter(Boolean),
    [filteredSupplierInputs],
  )

  const supplierSteps = availableSuppliers.map((s) => s.name)
  const totalSteps = supplierSteps.length + 1
  const safeStep = step > availableSuppliers.length ? 0 : step

  if (isSubmitted) {
    return <SubmittedView state={state} onEditRequest={editRequest} onReset={props.reset} />
  }

  if (availableSuppliers.length === 0) {
    return <EmptySearch />
  }

  const onKasStep = safeStep === availableSuppliers.length
  const currentSupplier = onKasStep ? null : availableSuppliers[safeStep]
  const safeSupplier = currentSupplier!
  const si = currentSupplier
    ? filteredSupplierInputs.find((x) => x.supplierId === currentSupplier.id)!
    : null
  const supplierProducts = si ? getProductsBySupplier(safeSupplier.id) : []

  return (
    <div className="notebook-page mx-auto max-w-3xl py-6">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto px-1 pb-1">
        {supplierSteps.map((name, i) => {
          const isActive = i === safeStep
          const isDone = i < safeStep
          return (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div
                className={`flex h-7 min-w-[28px] items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-marker text-white"
                    : isActive
                      ? "bg-marker text-white ring-2 ring-marker/30"
                      : "bg-ruled/30 text-ink-light"
                }`}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < supplierSteps.length - 1 && <div className={`mx-1 h-px w-5 ${isDone ? "bg-marker" : "bg-ruled"}`} />}
            </div>
          )
        })}
        <div className="flex items-center gap-1 shrink-0">
          <div className={`mx-1 h-px w-5 ${safeStep >= availableSuppliers.length ? "bg-marker" : "bg-ruled"}`} />
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              onKasStep
                ? "bg-marker text-white ring-2 ring-marker/30"
                : "bg-ruled/30 text-ink-light"
            }`}
          >
            Rp
          </div>
        </div>
      </div>

      <div className=" rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm">
        {!onKasStep && si && (
          <>
            <div className="mb-4 flex items-start gap-3 border-l-4 border-marker pl-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-marker/60">Kategori Supplier</span>
                <h3 className="text-lg font-bold text-ink">{safeSupplier.name}</h3>
              </div>
            </div>
            <p className="mb-4 text-xs text-ink-light">Masukkan stok awal dan stok akhir</p>
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-ink-light uppercase tracking-wider border-b border-ruled">
                  <th className="pb-2 text-left font-medium">Kue</th>
                  <th className="pb-2 text-center font-medium w-[72px]">Stok Awal</th>
                  <th className="pb-2 text-center font-medium w-[72px]">Stok Akhir</th>
                  <th className="pb-2 text-right font-medium w-[72px]">Terjual</th>
                  <th className="pb-2 text-right font-medium w-[120px]">Total Rp</th>
                </tr>
              </thead>
              <tbody>
                {si.entries.map((entry, idx) => {
                  const p = supplierProducts.find((x) => x.id === entry.productId)!
                  return (
                    <StokRow
                      key={entry.productId}
                      entry={entry}
                      productName={p.name}
                      hargaJual={p.hargaJual}
                      onChange={(field, value) => updateStok(safeSupplier.id, entry.productId, field, value)}
                      readOnly={false}
                      isLast={idx === si.entries.length - 1}
                    />
                  )
                })}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-between border-t border-ruled pt-3">
              <span className="text-sm text-ink-light">Subtotal {safeSupplier.name}</span>
              <span className="text-base font-bold text-marker">
                Rp {si ? calcSupplierTotal(si).toLocaleString("id-ID") : 0}
              </span>
            </div>
          </>
        )}

        {onKasStep && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-marker">Ringkasan Penutupan</h3>

            {state.supplierInputs.map((si) => {
              const sup = getSupplier(si.supplierId)
              const total = calcSupplierTotal(si)
              if (!sup) return null
              return (
                <div key={si.supplierId} className="flex items-center justify-between border-b border-ruled/50 py-2 text-sm">
                  <span className="font-medium text-ink">{sup.name}</span>
                  <span className="font-semibold text-marker">Rp {total.toLocaleString("id-ID")}</span>
                </div>
              )
            })}
            <div className="flex items-center justify-between border-t border-ruled pt-3 text-base font-bold">
              <span className="text-ink">Total Omzet</span>
              <span className="text-marker">Rp {calcGrandTotal(state).toLocaleString("id-ID")}</span>
            </div>

            <div className="border-t border-notch-border pt-5">
              <h4 className="mb-3 text-sm font-bold text-ink">Kas Fisik</h4>
              <label className="block text-xs text-ink-light mb-1.5">Total uang kas di laci</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-ink">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={state.totalKasFisik}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "")
                    setTotalKasFisik(v)
                  }}
                  placeholder="0"
                  className="w-48 rounded-xl border-2 border-ruled bg-transparent px-4 py-2.5 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, safeStep - 1))}
          disabled={safeStep === 0}
          className="rounded-xl border-2 border-notch-border px-5 py-2.5 text-sm font-medium text-ink-light hover:bg-paper-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Sebelumnya
        </button>
        <span className="text-xs text-ink-light">
          {onKasStep ? "Kas Fisik" : `${currentSupplier!.name}`} · {safeStep + 1} / {totalSteps}
        </span>
        {onKasStep ? (
          <button
            onClick={submit}
            className="rounded-xl bg-marker px-7 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors shadow-sm"
          >
            Simpan Penutupan
          </button>
        ) : (
          <button
            onClick={() => setStep(Math.min(availableSuppliers.length, safeStep + 1))}
            className="rounded-xl bg-marker px-5 py-2.5 text-sm font-medium text-white hover:bg-marker-hover transition-colors shadow-sm"
          >
            {safeStep < availableSuppliers.length - 1 ? "Selanjutnya →" : "Kas Fisik →"}
          </button>
        )}
      </div>
    </div>
  )
}

/* ───── Variant B: Accordion — Notebook per Supplier ───── */
export function VariantB(props: SharedProps) {
  const { state, filteredSupplierInputs, updateStok, setTotalKasFisik, submit, editRequest } = props
  const [openId, setOpenId] = useState<string | null>("s1")
  const isSubmitted = state.submitted

  const safeOpenId = openId && filteredSupplierInputs.some((si) => si.supplierId === openId)
    ? openId
    : filteredSupplierInputs.length > 0
      ? filteredSupplierInputs[0].supplierId
      : null

  if (isSubmitted) {
    return <SubmittedView state={state} onEditRequest={editRequest} onReset={props.reset} />
  }

  if (filteredSupplierInputs.length === 0) {
    return <EmptySearch />
  }

  // Reset openId only if it no longer exists in filtered list
  if (openId && !filteredSupplierInputs.some((si) => si.supplierId === openId)) {
    setOpenId(safeOpenId)
  }

  return (
    <div className="notebook-page mx-auto max-w-3xl py-6 space-y-4">
      <div className="flex items-center gap-3 border-l-4 border-marker pl-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-marker/60">Kategori Supplier</span>
      </div>

      {filteredSupplierInputs.map((si) => {
        const sup = getSupplier(si.supplierId)
        const products = getProductsBySupplier(si.supplierId)
        const isOpen = safeOpenId === si.supplierId
        const total = calcSupplierTotal(si)

        return (
          <div
            key={si.supplierId}
            className=" rounded-2xl border border-notch-border bg-paper-light shadow-sm overflow-hidden transition-shadow hover:shadow-md"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : si.supplierId)}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-paper transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-marker/40" />
                <span className="text-base font-bold text-ink">{sup?.name}</span>
                {si.entries.filter((e) => (e.stokAwal || 0) > 0).length > 0 && (
                  <span className="text-xs text-ink-light bg-ruled/20 rounded-full px-2.5 py-0.5">
                    {si.entries.filter((e) => (e.stokAwal || 0) > 0).length} produk
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-marker">
                  Rp {total.toLocaleString("id-ID")}
                </span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`text-ink-light transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-ruled px-6 py-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-medium text-ink-light uppercase tracking-wider border-b border-ruled">
                      <th className="pb-2 text-left font-medium">Kue</th>
                      <th className="pb-2 text-center font-medium w-[72px]">Stok Awal</th>
                      <th className="pb-2 text-center font-medium w-[72px]">Stok Akhir</th>
                      <th className="pb-2 text-right font-medium w-[72px]">Terjual</th>
                      <th className="pb-2 text-right font-medium w-[120px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {si.entries.map((entry, idx) => {
                      const p = products.find((x) => x.id === entry.productId)!
                      return (
                        <StokRow
                          key={entry.productId}
                          entry={entry}
                          productName={p.name}
                          hargaJual={p.hargaJual}
                          onChange={(field, value) => updateStok(si.supplierId, entry.productId, field, value)}
                          readOnly={false}
                          isLast={idx === si.entries.length - 1}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* Kas Fisik */}
      <div className=" rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-marker">Kas Fisik</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-ink">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={state.totalKasFisik}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "")
              setTotalKasFisik(v)
            }}
            placeholder="0"
            className="w-48 rounded-xl border-2 border-ruled bg-transparent px-4 py-2.5 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
          />
        </div>
      </div>

      {/* Grand total & submit */}
      <div className="flex items-center justify-between rounded-2xl bg-marker-light/50 border border-marker/20 px-6 py-4">
        <div>
          <span className="text-xs text-ink-light">Total Omzet</span>
          <p className="text-xl font-bold text-marker">Rp {calcGrandTotal(state).toLocaleString("id-ID")}</p>
        </div>
        <button
          onClick={submit}
          className="rounded-xl bg-marker px-7 py-3 text-sm font-bold text-white hover:bg-marker-hover transition-colors shadow-sm"
        >
          Simpan Penutupan
        </button>
      </div>
    </div>
  )
}

/* ───── Variant C: Spreadsheet — Tabel Cepat ───── */
export function VariantC(props: SharedProps) {
  const { state, filteredSupplierInputs, updateStok, setTotalKasFisik, submit, editRequest } = props
  const isSubmitted = state.submitted

  if (isSubmitted) {
    return <SubmittedView state={state} onEditRequest={editRequest} onReset={props.reset} />
  }

  if (filteredSupplierInputs.length === 0) {
    return <EmptySearch />
  }

  const allRows = useMemo(() => {
    const rows: { supplierName: string; supplierId: string; productName: string; hargaJual: number; entry: StokEntry }[] = []
    for (const si of filteredSupplierInputs) {
      const sup = getSupplier(si.supplierId)
      const products = getProductsBySupplier(si.supplierId)
      for (const entry of si.entries) {
        const p = products.find((x) => x.id === entry.productId)!
        rows.push({ supplierName: sup?.name || "", supplierId: si.supplierId, productName: p.name, hargaJual: p.hargaJual, entry })
      }
    }
    return rows
  }, [filteredSupplierInputs])

  let lastSupplierId = ""

  return (
    <div className="notebook-page mx-auto max-w-5xl py-6">
      <div className="mb-4 flex items-center gap-3 border-l-4 border-marker pl-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-marker/60">Kategori Supplier</span>
      </div>

      <div className=" overflow-hidden rounded-2xl border border-notch-border bg-paper-light shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-ink-light uppercase tracking-wider border-b-2 border-ruled">
                <th className="px-5 py-3 text-left font-medium w-40">Supplier</th>
                <th className="px-4 py-3 text-left font-medium min-w-[120px]">Kue</th>
                <th className="px-3 py-3 text-center font-medium w-16">Harga</th>
                <th className="px-2 py-3 text-center font-medium w-[72px]">Stok Awal</th>
                <th className="px-2 py-3 text-center font-medium w-[72px]">Stok Akhir</th>
                <th className="px-3 py-3 text-right font-medium w-[72px]">Terjual</th>
                <th className="px-5 py-3 text-right font-medium w-[120px]">Total Rp</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((row) => {
                const isNewSupplier = row.supplierId !== lastSupplierId
                if (isNewSupplier) lastSupplierId = row.supplierId
                const terjual = calcTerjual(row.entry)
                const total = calcTotal(row.entry, row.hargaJual)
                const hasData = (row.entry.stokAwal || 0) > 0 || (row.entry.stokAkhir || 0) > 0

                return (
                  <tr
                    key={row.entry.productId}
                    className={`transition-colors hover:bg-paper ${
                      isNewSupplier ? "border-t-2 border-t-ruled" : "border-t border-ruled/30"
                    }`}
                  >
                    <td className={`px-5 py-2.5 ${isNewSupplier ? "bg-marker-light/30" : ""}`}>
                      {isNewSupplier && (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-1 rounded-full bg-marker" />
                          <span className="font-bold text-ink">{row.supplierName}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink">{row.productName}</td>
                    <td className="px-3 py-2.5 text-center text-ink-light font-medium">
                      {row.hargaJual.toLocaleString("id-ID")}
                    </td>
                    <td className="px-1 py-2.5 text-center">
                      <NotebookInput
                        value={row.entry.stokAwal}
                        onChange={(v) => updateStok(row.supplierId, row.entry.productId, "stokAwal", v)}
                      />
                    </td>
                    <td className="px-1 py-2.5 text-center">
                      <NotebookInput
                        value={row.entry.stokAkhir}
                        onChange={(v) => updateStok(row.supplierId, row.entry.productId, "stokAkhir", v)}
                      />
                    </td>
                    <td className={`px-3 py-2.5 text-right font-bold ${hasData ? "text-ink" : "text-ink-light"}`}>
                      {terjual}
                    </td>
                    <td className={`px-5 py-2.5 text-right font-bold ${hasData ? "text-marker" : "text-ink-light"}`}>
                      Rp {total.toLocaleString("id-ID")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kas Fisik + Total + Submit */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-notch-border bg-paper-light px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-ink-light">Kas Fisik:</span>
          <span className="text-lg font-semibold text-ink">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={state.totalKasFisik}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "")
              setTotalKasFisik(v)
            }}
            placeholder="0"
            className="w-40 rounded-xl border-2 border-ruled bg-transparent px-4 py-2.5 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
          />
        </div>
        <div className="text-right">
          <span className="text-xs text-ink-light">Total Omzet</span>
          <p className="text-xl font-bold text-marker">Rp {calcGrandTotal(state).toLocaleString("id-ID")}</p>
        </div>
      </div>

      <button
        onClick={submit}
        className="mt-4 w-full rounded-2xl bg-marker py-3.5 text-base font-bold text-white hover:bg-marker-hover transition-colors shadow-sm"
      >
        Simpan Penutupan
      </button>
    </div>
  )
}
