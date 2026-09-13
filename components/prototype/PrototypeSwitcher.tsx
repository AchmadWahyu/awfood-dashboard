"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

const LABELS: Record<string, string> = {
  A: "Wizard — Step by Step",
  B: "Card — Per Supplier",
  C: "Spreadsheet — Tabel Cepat",
}

export default function PrototypeSwitcher({ variants }: { variants: string[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const current = searchParams.get("variant") || variants[0]

  const goTo = useCallback(
    (v: string) => {
      const p = new URLSearchParams(searchParams.toString())
      p.set("variant", v)
      router.replace(`?${p.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const prev = () => {
    const idx = variants.indexOf(current)
    goTo(variants[(idx - 1 + variants.length) % variants.length])
  }

  const next = () => {
    const idx = variants.indexOf(current)
    goTo(variants[(idx + 1) % variants.length])
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = document.activeElement
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as HTMLElement).isContentEditable)) return
      if (e.key === "ArrowLeft") { e.preventDefault(); prev() }
      if (e.key === "ArrowRight") { e.preventDefault(); next() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">
      <button onClick={prev} className="hover:text-zinc-300 text-lg leading-none px-1" aria-label="Previous variant">
        ◀
      </button>
      <span className="min-w-[200px] text-center font-medium tabular-nums">
        {current} — {LABELS[current] || current}
      </span>
      <button onClick={next} className="hover:text-zinc-300 text-lg leading-none px-1" aria-label="Next variant">
        ▶
      </button>
    </div>
  )
}
