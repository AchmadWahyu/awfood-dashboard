import { useCallback, useEffect, useState } from "react"

export interface Product {
  id: string
  name: string
  hargaJual: number
  supplierId: string
}

export interface Supplier {
  id: string
  name: string
}

export interface StokEntry {
  productId: string
  stokAwal: number
  stokAkhir: number
}

export interface SupplierInput {
  supplierId: string
  entries: StokEntry[]
}

export interface PenutupanState {
  supplierInputs: SupplierInput[]
  totalKasFisik: string
  submitted: boolean
  submittedAt: string | null
}

export const suppliers: Supplier[] = [
  { id: "s1", name: "Aneka Kue Basah" },
  { id: "s2", name: "Donat Manis" },
  { id: "s3", name: "Minuman Segar" },
]

export const products: Product[] = [
  { id: "p1", name: "Pastel", hargaJual: 2000, supplierId: "s1" },
  { id: "p2", name: "Lemper", hargaJual: 2000, supplierId: "s1" },
  { id: "p3", name: "Sosis Solo", hargaJual: 3000, supplierId: "s1" },
  { id: "p4", name: "Donat Gula", hargaJual: 2500, supplierId: "s2" },
  { id: "p5", name: "Donat Coklat", hargaJual: 3000, supplierId: "s2" },
  { id: "p6", name: "Donat Keju", hargaJual: 3000, supplierId: "s2" },
  { id: "p7", name: "Es Teh", hargaJual: 3000, supplierId: "s3" },
  { id: "p8", name: "Es Jeruk", hargaJual: 4000, supplierId: "s3" },
]

export function getProductsBySupplier(supplierId: string): Product[] {
  return products.filter((p) => p.supplierId === supplierId)
}

export function getSupplier(id: string): Supplier | undefined {
  return suppliers.find((s) => s.id === id)
}

export function filterSupplierInputs(inputs: SupplierInput[], query: string): SupplierInput[] {
  if (!query.trim()) return inputs
  const q = query.toLowerCase()
  return inputs
    .map((si) => {
      const supplierMatch = getSupplier(si.supplierId)?.name.toLowerCase().includes(q)
      if (supplierMatch) return si
      const filteredEntries = si.entries.filter((e) => {
        const p = products.find((x) => x.id === e.productId)
        return p?.name.toLowerCase().includes(q)
      })
      return { ...si, entries: filteredEntries }
    })
    .filter((si) => si.entries.length > 0)
}

export function calcTerjual(entry: StokEntry): number {
  return Math.max(0, (entry.stokAwal || 0) - (entry.stokAkhir || 0))
}

export function calcTotal(entry: StokEntry, hargaJual: number): number {
  return calcTerjual(entry) * hargaJual
}

function createInitialState(): PenutupanState {
  return {
    supplierInputs: suppliers.map((s) => ({
      supplierId: s.id,
      entries: getProductsBySupplier(s.id).map((p) => ({
        productId: p.id,
        stokAwal: 0,
        stokAkhir: 0,
      })),
    })),
    totalKasFisik: "",
    submitted: false,
    submittedAt: null,
  }
}

const STORAGE_KEY = "awfood-prototype-penutupan"

export function usePenutupanState() {
  const [state, setState] = useState<PenutupanState>(createInitialState)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch { }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, loaded])

  const updateStok = useCallback(
    (supplierId: string, productId: string, field: "stokAwal" | "stokAkhir", value: number) => {
      setState((prev) => ({
        ...prev,
        supplierInputs: prev.supplierInputs.map((si) =>
          si.supplierId === supplierId
            ? {
                ...si,
                entries: si.entries.map((e) =>
                  e.productId === productId ? { ...e, [field]: value } : e,
                ),
              }
            : si,
        ),
      }))
    },
    [],
  )

  const setTotalKasFisik = useCallback((value: string) => {
    setState((prev) => ({ ...prev, totalKasFisik: value }))
  }, [])

  const submit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      submitted: true,
      submittedAt: new Date().toLocaleString("id-ID"),
    }))
  }, [])

  const reset = useCallback(() => {
    setState(createInitialState())
  }, [])

  const editRequest = useCallback(() => {
    setState((prev) => ({ ...prev, submitted: false, submittedAt: null }))
  }, [])

  return { state, loaded, updateStok, setTotalKasFisik, submit, reset, editRequest }
}
