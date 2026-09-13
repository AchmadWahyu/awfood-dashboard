"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import PrototypeSwitcher from "@/components/prototype/PrototypeSwitcher"
import { VariantA, VariantB, VariantC } from "./variants"
import { usePenutupanState, filterSupplierInputs } from "./data"

const VARIANTS = ["A", "B", "C"]
const VARIANT_MAP: Record<string, typeof VariantA> = { A: VariantA, B: VariantB, C: VariantC }

function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function PrototypePenutupan() {
  const searchParams = useSearchParams()
  const variant = searchParams.get("variant") || "A"
  const penutupan = usePenutupanState()
  const Variant = VARIANT_MAP[variant] || VariantA
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSupplierInputs = useMemo(
    () => filterSupplierInputs(penutupan.state.supplierInputs, searchQuery),
    [penutupan.state.supplierInputs, searchQuery],
  )

  return (
    <div className="min-h-screen notebook-bg pb-20">
      <header className="sticky top-0 z-10 border-b border-notch-border bg-paper-light/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-marker text-white text-xs font-bold">A</div>
            <h1 className="text-base font-bold text-ink">AW Food <span className="text-ink-light font-normal">—</span> <span className="text-marker">Penutupan Toko</span></h1>
          </div>
          <span className="text-xs text-ink-light">Prototype Karyawan</span>
        </div>
      </header>

      {!penutupan.loaded ? (
        <div className="flex items-center justify-center py-20 text-ink-light">Memuat...</div>
      ) : (
        <div className="mx-auto max-w-5xl px-4">
          {!penutupan.state.submitted && (
            <>
              <div className="mb-2 mt-4 rounded-xl border border-marker/20 bg-marker-light px-4 py-2.5 text-xs text-marker">
                Data tersimpan otomatis di penyimpanan browser. Coba refresh halaman.
              </div>
              <div className="relative mt-3 mb-4">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-light/60">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kue atau supplier..."
                  className="w-full rounded-xl border-2 border-ruled bg-paper-light py-2.5 pl-10 pr-10 text-sm text-ink outline-none placeholder:text-ink-light/50 focus:border-marker transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            </>
          )}
          <Variant
            state={penutupan.state}
            filteredSupplierInputs={filteredSupplierInputs}
            updateStok={penutupan.updateStok}
            setTotalKasFisik={penutupan.setTotalKasFisik}
            submit={penutupan.submit}
            reset={penutupan.reset}
            editRequest={penutupan.editRequest}
          />
        </div>
      )}

      <PrototypeSwitcher variants={VARIANTS} />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <PrototypePenutupan />
    </Suspense>
  )
}
