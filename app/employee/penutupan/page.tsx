"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useSyncStorage } from "@/lib/dummy/sync";
import {
  getSuppliers, getActiveItems, addClosing, getBeverageItems, getRestocksByItem, getClosingsByDate,
} from "@/lib/dummy/api";
import type { DailyClosing, ClosingItem } from "@/lib/dummy/types";
import { todayLocal } from "@/lib/dummy/date";

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

function calcTerjual(awal: number, akhir: number) {
  return Math.max(0, (awal || 0) - (akhir || 0));
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function EmployeePenutupanPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));

  const isDev = process.env.NODE_ENV === "development";
  const [closingDate, setClosingDate] = useState(todayLocal());
  const today = isDev ? closingDate : todayLocal();

  const suppliers = useMemo(() => getSuppliers().filter((s) => s.is_active), [version]);
  const allItems = useMemo(() => getActiveItems(), [version]);
  const bevItems = useMemo(() => getBeverageItems(), [version]);

  // Cek apakah sudah ada closing hari ini
  const existing = useMemo(() => getClosingsByDate(today)[0], [today, version]);
  const [isSubmitted, setIsSubmitted] = useState(!!existing && existing.status !== "draft");

  // State form
  const initialEntries = useMemo(() => {
    return suppliers.map((s) => ({
      supplierId: s.id,
      supplierName: s.name,
      entries: allItems
        .filter((i) => i.supplier_id === s.id)
        .map((i) => ({ productId: i.id, productName: i.name, hargaJual: i.price_sell, stokAwal: 0, stokAkhir: 0 })),
    }));
  }, [suppliers, allItems]);

  const initialBev = useMemo(() => {
    return bevItems.map((i) => {
      const restocks = getRestocksByItem(i.id);
      const totalRestock = restocks.reduce((sum, r) => sum + r.qty, 0);
      return { productId: i.id, productName: i.name, hargaJual: i.price_sell, stokAwal: totalRestock, stokAkhir: 0 };
    });
  }, [bevItems]);

  const [supplierInputs, setSupplierInputs] = useState(initialEntries);
  const [beverageInputs, setBeverageInputs] = useState(initialBev);
  const [cashPhysical, setCashPhysical] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(suppliers[0]?.id || null);
  const [submittedAt, setSubmittedAt] = useState(existing?.created_at || "");

  const handleDateChange = (date: string) => {
    setClosingDate(date);
    const ex = getClosingsByDate(date)[0];
    setIsSubmitted(!!ex && ex.status !== "draft");
    setSubmittedAt(ex?.created_at || "");
  };

  const updateStok = useCallback((supplierId: string, productId: string, field: "stokAwal" | "stokAkhir", value: number) => {
    setSupplierInputs((prev) =>
      prev.map((si) =>
        si.supplierId === supplierId
          ? { ...si, entries: si.entries.map((e) => (e.productId === productId ? { ...e, [field]: value } : e)) }
          : si
      )
    );
  }, []);

  const updateBev = useCallback((productId: string, field: "stokAwal" | "stokAkhir", value: number) => {
    setBeverageInputs((prev) =>
      prev.map((e) => (e.productId === productId ? { ...e, [field]: value } : e))
    );
  }, []);

  const filteredSupplierInputs = useMemo(() => {
    if (!searchQuery.trim()) return supplierInputs;
    const q = searchQuery.toLowerCase();
    return supplierInputs
      .map((si) => {
        const supplierMatch = si.supplierName.toLowerCase().includes(q);
        if (supplierMatch) return si;
        const filteredEntries = si.entries.filter((e) => e.productName.toLowerCase().includes(q));
        return { ...si, entries: filteredEntries };
      })
      .filter((si) => si.entries.length > 0);
  }, [supplierInputs, searchQuery]);

  const safeOpenId = openId && filteredSupplierInputs.some((si) => si.supplierId === openId)
    ? openId
    : filteredSupplierInputs.length > 0 ? filteredSupplierInputs[0].supplierId : null;

  const calcSupplierTotal = (entries: any[]) =>
    entries.reduce((sum, e) => sum + calcTerjual(e.stokAwal, e.stokAkhir) * e.hargaJual, 0);

  const grandTotal = useMemo(() => {
    const supTotal = supplierInputs.reduce((sum, si) => sum + calcSupplierTotal(si.entries), 0);
    const bevTotal = beverageInputs.reduce((sum, e) => sum + calcTerjual(e.stokAwal, e.stokAkhir) * e.hargaJual, 0);
    return supTotal + bevTotal;
  }, [supplierInputs, beverageInputs]);

  const submit = () => {
    const closingItems: ClosingItem[] = [];
    for (const si of supplierInputs) {
      for (const e of si.entries) {
        const t = calcTerjual(e.stokAwal, e.stokAkhir);
        closingItems.push({
          id: crypto.randomUUID(),
          item_id: e.productId,
          stok_awal: e.stokAwal,
          stok_akhir: e.stokAkhir,
          terjual: t,
          total_rp: t * e.hargaJual,
        });
      }
    }
    for (const e of beverageInputs) {
      const t = calcTerjual(e.stokAwal, e.stokAkhir);
      closingItems.push({
        id: crypto.randomUUID(),
        item_id: e.productId,
        stok_awal: e.stokAwal,
        stok_akhir: e.stokAkhir,
        terjual: t,
        total_rp: t * e.hargaJual,
      });
    }

    const closing: DailyClosing = {
      id: crypto.randomUUID(),
      date: today,
      staff_id: user!.id,
      staff_name: user!.full_name,
      status: "submitted",
      items: closingItems,
      total_omzet: grandTotal,
      cash_initial: 0,
      cash_physical: parseInt(cashPhysical) || 0,
      qris_verified: null,
      qris_verified_by: null,
      qris_verified_at: null,
      discrepancy: null,
      discrepancy_status: null,
      discrepancy_resolution: null,
      discrepancy_note: null,
      verified_by: null,
      verified_at: null,
      created_at: new Date().toLocaleString("id-ID"),
      updated_at: new Date().toLocaleString("id-ID"),
    };

    addClosing(closing);
    setIsSubmitted(true);
    setSubmittedAt(closing.created_at);
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4">
        <div className="rounded-2xl bg-paper-light border border-notch-border p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-notch-success">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6b47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 className="text-xl font-bold text-ink">Penutupan Berhasil Disimpan</h2>
          <p className="mt-1 text-sm text-ink-light">{submittedAt}</p>
          <div className="mx-auto mt-6 max-w-sm space-y-2 border-t border-notch-border pt-5 text-left">
            {supplierInputs.map((si) => (
              <div key={si.supplierId} className="flex items-center justify-between text-sm">
                <span className="text-ink-light">{si.supplierName}</span>
                <span className="font-semibold text-marker">{formatRp(calcSupplierTotal(si.entries))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-ruled pt-2 text-base font-bold">
              <span className="text-ink">Total Omzet</span>
              <span className="text-marker">{formatRp(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-ink-light">Kas Fisik</span>
              <span className="font-semibold text-ink">{formatRp(parseInt(cashPhysical) || 0)}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/employee/request-edit" className="rounded-xl border-2 border-marker px-6 py-2.5 text-sm font-bold text-marker hover:bg-marker-light transition-colors">
              Ajukan Request Edit
            </Link>
            <Link href="/employee/riwayat" className="rounded-xl border-2 border-notch-border px-6 py-2.5 text-sm font-medium text-ink-light hover:bg-paper transition-colors">
              Lihat Riwayat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div className="mb-2 rounded-xl border border-marker/20 bg-marker-light px-4 py-2.5 text-xs text-marker">
        Data tersimpan di browser (dummy). Refresh untuk reset seluruh data.
      </div>
      {isDev && (
        <div className="rounded-xl border border-notch-border bg-paper-light p-4 flex items-center gap-3">
          <label className="block text-xs text-ink-light" htmlFor="dev-closing-date">Tanggal closing (dev)</label>
          <input
            id="dev-closing-date"
            type="date"
            value={closingDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
          />
        </div>
      )}
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
      {filteredSupplierInputs.map((si) => {
        const isOpen = safeOpenId === si.supplierId;
        const total = calcSupplierTotal(si.entries);
        return (
          <div key={si.supplierId} className=" rounded-2xl border border-notch-border bg-paper-light shadow-sm overflow-hidden transition-shadow hover:shadow-md">
            <button onClick={() => setOpenId(isOpen ? null : si.supplierId)} className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-paper transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-marker/40" />
                <span className="text-base font-bold text-ink">{si.supplierName}</span>
                {si.entries.filter((e) => (e.stokAwal || 0) > 0).length > 0 && (
                  <span className="text-xs text-ink-light bg-ruled/20 rounded-full px-2.5 py-0.5">
                    {si.entries.filter((e) => (e.stokAwal || 0) > 0).length} produk
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-marker">{formatRp(total)}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-ink-light transition-transform ${isOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
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
                      {si.entries.map((entry) => {
                        const terjual = calcTerjual(entry.stokAwal, entry.stokAkhir);
                        const totalRow = terjual * entry.hargaJual;
                        const hasData = (entry.stokAwal || 0) > 0 || (entry.stokAkhir || 0) > 0;
                        return (
                          <tr key={entry.productId}>
                            <td className="font-medium whitespace-nowrap">{entry.productName}</td>
                            <td className="text-center"><NotebookInput value={entry.stokAwal} onChange={(v) => updateStok(si.supplierId, entry.productId, "stokAwal", v)} /></td>
                            <td className="text-center"><NotebookInput value={entry.stokAkhir} onChange={(v) => updateStok(si.supplierId, entry.productId, "stokAkhir", v)} /></td>
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
      <div className=" rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm">
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
                const terjual = calcTerjual(entry.stokAwal, entry.stokAkhir);
                const totalRow = terjual * entry.hargaJual;
                const hasData = (entry.stokAwal || 0) > 0 || (entry.stokAkhir || 0) > 0;
                return (
                  <tr key={entry.productId}>
                    <td className="font-medium whitespace-nowrap">{entry.productName}</td>
                    <td className="text-center"><NotebookInput value={entry.stokAwal} onChange={(v) => updateBev(entry.productId, "stokAwal", v)} /></td>
                    <td className="text-center"><NotebookInput value={entry.stokAkhir} onChange={(v) => updateBev(entry.productId, "stokAkhir", v)} /></td>
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
      <div className=" rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm">
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
          onClick={submit}
          className="w-full sm:w-auto rounded-xl bg-marker px-7 py-3 text-sm font-bold text-white hover:bg-marker-hover transition-colors shadow-sm"
        >
          Simpan Penutupan
        </button>
      </div>
    </div>
  );
}
