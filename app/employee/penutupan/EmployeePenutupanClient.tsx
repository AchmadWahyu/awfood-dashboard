"use client";

import { useState, useMemo, useCallback } from "react";
import { submitClosing } from "./actions";
import type { Supplier, Item, ClosingItem, ClosingRecord, ClosingSummaryItem } from "./actions";
import { todayJakarta } from "@/lib/utils/date";

function NotebookInput({ value, onChange, readOnly }: { value: number; onChange: (v: number) => void; readOnly?: boolean }) {
  return (
    <input
      type="number"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      disabled={readOnly}
      className="w-14 bg-transparent text-center outline-none border-0 border-b-2 border-ruled focus:border-marker disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    />
  );
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function EmployeePenutupanClient({
  initialSuppliers,
  initialItems,
  initialBeverages,
  existingClosing,
  existingClosingDetail,
}: {
  initialSuppliers: Supplier[];
  initialItems: Item[];
  initialBeverages: Item[];
  existingClosing: ClosingRecord | undefined;
  existingClosingDetail: { closing: ClosingRecord; items: ClosingSummaryItem[] } | null;
}) {
  const isSubmitted = !!existingClosing;
  const [closingDate, setClosingDate] = useState(todayJakarta());
  const [cashPhysical, setCashPhysical] = useState("");
  const [submittedAt, setSubmittedAt] = useState(existingClosing?.created_at || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const suppliers = initialSuppliers;
  const allItems = initialItems;
  const bevItems = initialBeverages;

  const supplierEntries = useMemo(() => {
    return suppliers.map((s) => ({
      supplierId: s.id,
      supplierName: s.name,
      entries: allItems
        .filter((i) => i.supplier_id === s.id)
        .map((i) => ({
          itemId: i.id,
          itemName: i.name,
          unitPrice: i.selling_price,
          openingStock: 0,
          endingStock: 0,
        })),
    }));
  }, [suppliers, allItems]);

  const beverageEntries = useMemo(() => {
    return bevItems.map((i) => ({
      itemId: i.id,
      itemName: i.name,
      unitPrice: i.selling_price,
      openingStock: 0,
      endingStock: 0,
    }));
  }, [bevItems]);

  const [supplierInputs, setSupplierInputs] = useState(supplierEntries);
  const [beverageInputs, setBeverageInputs] = useState(beverageEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(suppliers[0]?.id || null);

  const updateSupplierStok = useCallback(
    (supplierId: string, itemId: string, field: "openingStock" | "endingStock", value: number) => {
      setSupplierInputs((prev) =>
        prev.map((si) =>
          si.supplierId === supplierId
            ? {
                ...si,
                entries: si.entries.map((e) =>
                  e.itemId === itemId ? { ...e, [field]: value } : e
                ),
              }
            : si
        )
      );
    },
    []
  );

  const updateBeverageStok = useCallback(
    (itemId: string, field: "openingStock" | "endingStock", value: number) => {
      setBeverageInputs((prev) =>
        prev.map((e) => (e.itemId === itemId ? { ...e, [field]: value } : e))
      );
    },
    []
  );

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return supplierInputs;
    const q = searchQuery.toLowerCase();
    return supplierInputs
      .map((si) => {
        const supplierMatch = si.supplierName.toLowerCase().includes(q);
        if (supplierMatch) return si;
        const filteredEntries = si.entries.filter((e) => e.itemName.toLowerCase().includes(q));
        return { ...si, entries: filteredEntries };
      })
      .filter((si) => si.entries.length > 0);
  }, [supplierInputs, searchQuery]);

  const safeOpenId =
    openSupplierId && filteredSuppliers.some((si) => si.supplierId === openSupplierId)
      ? openSupplierId
      : filteredSuppliers.length > 0
      ? filteredSuppliers[0].supplierId
      : null;

  const calcTerjual = (awal: number, akhir: number) => {
    return Math.max(0, (awal || 0) - (akhir || 0));
  };

  const calcSupplierTotal = (entries: any[]) => {
    return entries.reduce((sum, e) => sum + calcTerjual(e.openingStock, e.endingStock) * e.unitPrice, 0);
  };

  const grandTotal = useMemo(() => {
    const supTotal = supplierInputs.reduce((sum, si) => sum + calcSupplierTotal(si.entries), 0);
    const bevTotal = beverageInputs.reduce((sum, e) => sum + calcTerjual(e.openingStock, e.endingStock) * e.unitPrice, 0);
    return supTotal + bevTotal;
  }, [supplierInputs, beverageInputs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted) return;
    setError("");
    setIsSubmitting(true);

    const items: ClosingItem[] = [];
    for (const si of supplierInputs) {
      for (const entry of si.entries) {
        const terjual = calcTerjual(entry.openingStock, entry.endingStock);
        items.push({
          item_id: entry.itemId,
          opening_stock: entry.openingStock,
          ending_stock: entry.endingStock,
          sold: terjual,
          total: terjual * entry.unitPrice,
        });
      }
    }
    for (const entry of beverageInputs) {
      const terjual = calcTerjual(entry.openingStock, entry.endingStock);
      items.push({
        item_id: entry.itemId,
        opening_stock: entry.openingStock,
        ending_stock: entry.endingStock,
        sold: terjual,
        total: terjual * entry.unitPrice,
      });
    }

    const formData = new FormData();
    formData.append("date", closingDate);
    formData.append("cash_physical", cashPhysical);
    formData.append("items", JSON.stringify(items));

    try {
      const result = await submitClosing(formData);
      setSubmittedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan closing. Coba lagi.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && existingClosingDetail) {
    const { closing, items: closingItems } = existingClosingDetail;
    const supplierGroups = new Map<string, { name: string; total: number }>();
    for (const item of closingItems) {
      const sid = item.supplier_id || "owner";
      if (!supplierGroups.has(sid)) {
        supplierGroups.set(sid, { name: item.supplier_name, total: 0 });
      }
      supplierGroups.get(sid)!.total += item.total;
    }

    return (
      <div className="mx-auto max-w-2xl py-12 px-4">
        <div className="rounded-2xl bg-paper-light border border-notch-border p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-notch-success">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6b47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink">Penutupan Berhasil Disimpan</h2>
          <p className="mt-1 text-sm text-ink-light">{closing.created_at}</p>
          <div className="mx-auto mt-6 max-w-sm space-y-2 border-t border-notch-border pt-5 text-left">
            {Array.from(supplierGroups.values()).map((g) => (
              <div key={g.name} className="flex items-center justify-between text-sm">
                <span className="text-ink-light">{g.name}</span>
                <span className="font-semibold text-marker">{formatRp(g.total)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-ruled pt-2 text-base font-bold">
              <span className="text-ink">Total Omzet</span>
              <span className="text-marker">{formatRp(closing.total_omzet)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-ink-light">Kas Fisik</span>
              <span className="font-semibold text-ink">{formatRp(closing.cash_physical)}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="/employee/request-edit" className="rounded-xl border-2 border-marker px-6 py-2.5 text-sm font-bold text-marker hover:bg-marker-light transition-colors">
              Ajukan Request Edit
            </a>
            <a href="/employee/riwayat" className="rounded-xl border-2 border-notch-border px-6 py-2.5 text-sm font-medium text-ink-light hover:bg-paper transition-colors">
              Lihat Riwayat
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      {error && (
        <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800">
          {error}
        </div>
      )}
      
      <div className="mb-2 rounded-xl border border-marker/20 bg-marker-light px-4 py-2.5 text-xs text-marker">
        Data akan disimpan ke Supabase. Pastikan koneksi aktif.
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kue atau supplier..."
          className="w-full rounded-xl border-2 border-ruled bg-paper-light py-2.5 pl-4 pr-10 text-sm text-ink outline-none placeholder:text-ink-light/50 focus:border-marker transition-colors"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink">✕</button>
        )}
      </div>

      {/* Konsinyasi per supplier */}
      <div className="flex items-center gap-3 border-l-4 border-marker pl-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-marker/60">Konsinyasi Supplier</span>
      </div>
      {filteredSuppliers.map((si) => {
        const isOpen = safeOpenId === si.supplierId;
        const total = calcSupplierTotal(si.entries);
        return (
          <div key={si.supplierId} className="rounded-2xl border border-notch-border bg-paper-light shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenSupplierId(isOpen ? null : si.supplierId)}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-paper transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-marker/40" />
                <span className="text-base font-bold text-ink">{si.supplierName}</span>
                {si.entries.filter((e: any) => (e.openingStock || 0) > 0).length > 0 && (
                  <span className="text-xs text-ink-light bg-ruled/20 rounded-full px-2.5 py-0.5">
                    {si.entries.filter((e: any) => (e.openingStock || 0) > 0).length} produk
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-marker">{formatRp(total)}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-ink-light transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-ruled px-6 py-4">
                <div className="overflow-x-auto">
                  <table className="aw-table min-w-[480px]">
                    <thead>
                      <tr>
                        <th>PRODUK</th>
                        <th className="text-center">STOK AWAL</th>
                        <th className="text-center">STOK AKHIR</th>
                        <th className="text-right">TERJUAL</th>
                        <th className="text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {si.entries.map((entry: any) => {
                        const terjual = calcTerjual(entry.openingStock, entry.endingStock);
                        const totalRow = terjual * entry.unitPrice;
                        const hasData = (entry.openingStock || 0) > 0 || (entry.endingStock || 0) > 0;
                        return (
                          <tr key={entry.itemId}>
                            <td className="font-medium whitespace-nowrap">{entry.itemName}</td>
                            <td className="text-center">
                              <NotebookInput value={entry.openingStock} onChange={(v) => updateSupplierStok(si.supplierId, entry.itemId, "openingStock", v)} />
                            </td>
                            <td className="text-center">
                              <NotebookInput value={entry.endingStock} onChange={(v) => updateSupplierStok(si.supplierId, entry.itemId, "endingStock", v)} />
                            </td>
                            <td className={`text-right font-bold tabular-nums ${hasData ? "text-ink" : "text-ink-light"}`}>{terjual}</td>
                            <td className={`text-right font-bold tabular-nums ${hasData ? "text-marker" : "text-ink-light"}`}>{formatRp(totalRow)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Minuman milik sendiri */}
      <div className="flex items-center gap-3 border-l-4 border-ink pl-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-light/60">Minuman Milik Sendiri</span>
      </div>
      <div className="rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="aw-table min-w-[480px]">
            <thead>
              <tr>
                <th>MINUMAN</th>
                <th className="text-center">STOK AWAL</th>
                <th className="text-center">STOK AKHIR</th>
                <th className="text-right">TERJUAL</th>
                <th className="text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {beverageInputs.map((entry) => {
                const terjual = calcTerjual(entry.openingStock, entry.endingStock);
                const totalRow = terjual * entry.unitPrice;
                const hasData = (entry.openingStock || 0) > 0 || (entry.endingStock || 0) > 0;
                return (
                  <tr key={entry.itemId}>
                    <td className="font-medium whitespace-nowrap">{entry.itemName}</td>
                    <td className="text-center">
                      <NotebookInput value={entry.openingStock} onChange={(v) => updateBeverageStok(entry.itemId, "openingStock", v)} />
                    </td>
                    <td className="text-center">
                      <NotebookInput value={entry.endingStock} onChange={(v) => updateBeverageStok(entry.itemId, "endingStock", v)} />
                    </td>
                    <td className={`text-right font-bold tabular-nums ${hasData ? "text-ink" : "text-ink-light"}`}>{terjual}</td>
                    <td className={`text-right font-bold tabular-nums ${hasData ? "text-marker" : "text-ink-light"}`}>{formatRp(totalRow)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kas Fisik */}
      <div className="rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-marker">Kas</h3>
        <div>
          <label className="block text-xs text-ink-light mb-1.5">Total uang kas di laci saat tutup</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-ink">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={cashPhysical}
              onChange={(e) => setCashPhysical(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="w-48 rounded-xl border-2 border-ruled bg-transparent px-4 py-2.5 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grand total & submit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-marker-light/50 border border-marker/20 px-6 py-4">
        <div>
          <span className="text-xs text-ink-light">Total Omzet</span>
          <p className="text-xl font-bold text-marker tabular-nums">{formatRp(grandTotal)}</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto rounded-xl bg-marker px-7 py-3 text-sm font-bold text-white hover:bg-marker-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Penutupan"}
        </button>
      </div>
    </div>
  );
}