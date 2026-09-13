"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSyncStorage } from "@/lib/dummy/sync";
import { getClosings, getClosingById, getItems, getExpenses, getSettlements, getDeductions, getSuppliers } from "@/lib/dummy/api";
import type { DailyClosing, Item, Supplier } from "@/lib/dummy/types";
import { formatRp, formatDateDisplay, formatDateTime } from "@/lib/utils/format";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Verifikasi",
  verified: "Terverifikasi",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-ruled/30 text-ink-light",
  submitted: "bg-marker-light text-marker",
  verified: "bg-notch-success text-notch-success-text",
};

function selisihView(d: number | null) {
  if (d == null) return { text: "-", cls: "text-ink-light" };
  if (Math.abs(d) <= 5000) {
    const sign = d > 0 ? "-" : d < 0 ? "+" : "";
    return { text: `${sign}${formatRp(Math.abs(d))}`, cls: "text-ink" };
  }
  const sign = d > 0 ? "-" : "+";
  const cls = d > 0 ? "text-red-600 font-bold" : "text-notch-success-text font-bold";
  return { text: `${sign}${formatRp(Math.abs(d))}`, cls };
}

interface SupplierGroup {
  supplier: Supplier | undefined;
  items: (DailyClosing["items"][number] & { item: Item })[];
  totalTerjual: number;
  totalOmzet: number;
}

export default function OwnerLaporanPage() {
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));
  const closings = useMemo(() => getClosings(), [version]);
  const expenses = useMemo(() => getExpenses(), [version]);
  const deductions = useMemo(() => getDeductions(), [version]);
  const items = useMemo(() => getItems(), [version]);
  const suppliers = useMemo(() => getSuppliers(), [version]);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("closing");
  });
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const selected = useMemo(() => (selectedId ? getClosingById(selectedId) : null), [selectedId, version]);

  const supplierGroups = useMemo<SupplierGroup[]>(() => {
    if (!selected) return [];
    const groups = new Map<string, SupplierGroup>();
    for (const ci of selected.items) {
      const item = items.find((x) => x.id === ci.item_id);
      if (!item) continue;
      if (ci.stok_awal === 0 && ci.terjual === 0) continue;
      const sid = item.supplier_id || "owner";
      if (!groups.has(sid)) {
        groups.set(sid, {
          supplier: suppliers.find((s) => s.id === sid),
          items: [],
          totalTerjual: 0,
          totalOmzet: 0,
        });
      }
      const g = groups.get(sid)!;
      g.items.push({ ...ci, item });
      g.totalTerjual += ci.terjual;
      g.totalOmzet += ci.total_rp;
    }
    return Array.from(groups.values());
  }, [selected, items, suppliers]);

  const syncUrl = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("closing", id);
    } else {
      url.searchParams.delete("closing");
    }
    window.history.replaceState({}, "", url.toString());
  }, []);

  const openDetail = (id: string) => {
    setSelectedId(id);
    syncUrl(id);
  };

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    syncUrl(null);
  }, [syncUrl]);

  useEffect(() => { setOpenSupplierId(null); }, [selectedId]);

  useEffect(() => {
    const onPop = () => {
      setSelectedId(new URLSearchParams(window.location.search).get("closing"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDetail]);

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSales = () => {
    const rows = [
      ["Tanggal", "Staff", "Status", "Omzet", "Kas Fisik", "QRIS", "Selisih"],
      ...closings.map((c) => [c.date, c.staff_name, c.status, String(c.total_omzet), String(c.cash_physical), String(c.qris_verified ?? 0), String(c.discrepancy ?? 0)]),
    ];
    downloadCSV("laporan-penjualan.csv", rows);
  };

  const exportExpenses = () => {
    const rows = [
      ["Tanggal", "Kategori", "Kantong", "Nominal", "Catatan"],
      ...expenses.map((e) => [e.date, e.category, e.pocket, String(e.amount), e.note || ""]),
    ];
    downloadCSV("laporan-pengeluaran.csv", rows);
  };

  const exportDeductions = () => {
    const rows = [
      ["Staff", "Closing", "Nominal", "Alasan", "Waktu Keputusan"],
      ...deductions.map((d) => [d.staff_name, d.closing_id, String(d.amount), d.reason, d.approved_at]),
    ];
    downloadCSV("laporan-potongan-gaji.csv", rows);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Laporan & Export</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={exportSales} className="rounded-2xl border border-notch-border bg-paper-light p-5 text-left hover:bg-paper transition-colors shadow-sm">
          <p className="text-sm font-bold text-ink">Export Penjualan</p>
          <p className="text-xs text-ink-light mt-1">{closings.length} records → CSV</p>
        </button>
        {/* <button onClick={exportExpenses} className="rounded-2xl border border-notch-border bg-paper-light p-5 text-left hover:bg-paper transition-colors shadow-sm">
          <p className="text-sm font-bold text-ink">Export Pengeluaran</p>
          <p className="text-xs text-ink-light mt-1">{expenses.length} records → CSV</p>
        </button> */}
        <button onClick={exportDeductions} className="rounded-2xl border border-notch-border bg-paper-light p-5 text-left hover:bg-paper transition-colors shadow-sm">
          <p className="text-sm font-bold text-ink">Export Potongan Gaji</p>
          <p className="text-xs text-ink-light mt-1">{deductions.length} records → CSV</p>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-ink">Ringkasan Penjualan</h3>
        {closings.length === 0 ? (
          <p className="text-xs text-ink-light">Belum ada data closing.</p>
        ) : (
          closings.map((c) => {
            const s = selisihView(c.discrepancy);
            return (
              <button
                key={c.id}
                onClick={() => openDetail(c.id)}
                className="w-full text-left rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm hover:bg-paper transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-ink">{formatDateDisplay(c.date)}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-ink-light">Oleh {c.staff_name}</span>
                  <span className="text-xs text-ink-light">Tap untuk detail</span>
                </div>
                <p className="text-2xl font-bold text-marker tabular-nums mb-4">{formatRp(c.total_omzet)}</p>
                <div className="grid grid-cols-3 gap-3 border-t border-ruled pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-ink-light">Kas</p>
                    <p className="text-sm font-semibold text-ink tabular-nums">{formatRp(c.cash_physical)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-ink-light">QRIS</p>
                    <p className="text-sm font-semibold text-ink tabular-nums">{formatRp(c.qris_verified || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-ink-light">Selisih</p>
                    <p className={`text-sm font-semibold tabular-nums ${s.cls}`}>{s.text}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeDetail}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail closing ${selected.date}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Detail Closing {selected.date}</h3>
              <button onClick={closeDetail} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup detail">
                Tutup
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-ink-light">
              <span>Oleh {selected.staff_name}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_STYLE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
            </div>

            <div className="space-y-3 mt-4">
              {supplierGroups.map((g) => {
                const sid = g.supplier?.id || "owner";
                const isOpen = openSupplierId === sid;
                return (
                  <div key={sid} className="rounded-xl border border-cream-border overflow-hidden">
                    <button
                      onClick={() => setOpenSupplierId(isOpen ? null : sid)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-cream-card/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: "#A0522D" }}>
                          {g.supplier?.name || "Minuman Milik Sendiri"}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {g.items.length} produk · {g.totalTerjual} pcs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-marker">{formatRp(g.totalOmzet)}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-ink-light transition-transform ${isOpen ? "rotate-180" : ""}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-cream-border">
                        <div className="overflow-x-auto">
                          <table className="aw-table min-w-[480px]">
                            <thead>
                              <tr>
                                <th>ITEM</th>
                                <th className="text-center">AWAL</th>
                                <th className="text-center">AKHIR</th>
                                <th className="text-center">TERJUAL</th>
                                <th className="text-right">TOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.items.map((ci) => (
                                <tr key={ci.id}>
                                  <td className="font-medium">{ci.item.name}</td>
                                  <td className="text-center tabular-nums">{ci.stok_awal}</td>
                                  <td className="text-center tabular-nums">{ci.stok_akhir}</td>
                                  <td className="text-center font-bold tabular-nums">{ci.terjual}</td>
                                  <td className="text-right font-bold text-marker tabular-nums">{formatRp(ci.total_rp)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="table-footer flex items-center justify-between rounded-b-xl">
                          <span className="font-semibold">Total {g.supplier?.name || "Minuman Milik Sendiri"}</span>
                          <span className="font-bold">{formatRp(g.totalOmzet)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {supplierGroups.length === 0 && (
                <p className="text-sm text-text-secondary py-4 text-center">Tidak ada item dengan transaksi.</p>
              )}
            </div>

            <div className="border-t border-ruled pt-3 mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">Total Omzet</span>
                <span className="text-base font-bold text-marker">{formatRp(selected.total_omzet)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-light">Kas Awal</span>
                <span className="tabular-nums">{formatRp(selected.cash_initial)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-light">Kas Fisik</span>
                <span className="tabular-nums">{formatRp(selected.cash_physical)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-light">QRIS Final</span>
                <span className="tabular-nums">{selected.qris_verified != null ? formatRp(selected.qris_verified) : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-light flex items-center gap-1">
                  Selisih
                  <button onClick={() => setShowInfo(true)} className="inline-flex items-center justify-center rounded-full bg-ruled/40 w-4 h-4 text-[10px] text-ink-light hover:bg-ruled/60 transition-colors" aria-label="Info selisih">
                    i
                  </button>
                </span>
                <span className={selisihView(selected.discrepancy).cls}>
                  {selisihView(selected.discrepancy).text}
                </span>
              </div>
              {selected.verified_at && (
                <div className="flex items-center justify-between text-xs text-ink-light">
                  <span>Diverifikasi</span>
                  <span>{formatDateTime(selected.verified_at)}</span>
                </div>
              )}
            </div>

            {showInfo && (
              <div className="absolute inset-0 z-50 flex flex-col bg-paper-light rounded-t-3xl p-6 pb-24 overflow-y-auto">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-ink">Detail Perhitungan Selisih</h3>
                  <button onClick={() => setShowInfo(false)} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup info">
                    Tutup
                  </button>
                </div>
                {(() => {
                  const USE_ADVANCED_DISCREPANCY = false;
                  const expected = selected.total_omzet;
                  const cashPhysical = selected.cash_physical;
                  const cashInitial = selected.cash_initial;
                  const cashExpenses = USE_ADVANCED_DISCREPANCY ? getExpenses().filter((e) => e.date === selected.date && e.pocket === "CASH_LACI").reduce((s, e) => s + e.amount, 0) : 0;
                  const drawerSettlements = USE_ADVANCED_DISCREPANCY ? getSettlements().filter((s) => s.closing_id === selected.id && s.paid_from_drawer).reduce((s, x) => s + x.amount, 0) : 0;
                  const qris = selected.qris_verified || 0;
                  const expectedTotal = cashInitial + expected;
                  const actualTotal = qris + cashPhysical;
                  const discrepancy = expectedTotal - actualTotal;
                  return (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Kembalian Laci Awal</span>
                          <span className="tabular-nums font-medium text-ink">+{formatRp(cashInitial)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Total Omzet</span>
                          <span className="tabular-nums font-medium text-ink">+{formatRp(expected)}</span>
                        </div>
                        {USE_ADVANCED_DISCREPANCY && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-ink-light">Pengeluaran Cash</span>
                              <span className="tabular-nums font-medium text-ink">+{formatRp(cashExpenses)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-ink-light">Settlement Drawer</span>
                              <span className="tabular-nums font-medium text-ink">+{formatRp(drawerSettlements)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="border-t border-ruled pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Total yang Seharusnya</span>
                          <span className="tabular-nums text-ink">{formatRp(expectedTotal)}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">QRIS Final</span>
                          <span className="tabular-nums font-medium text-ink">-{formatRp(qris)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Kas Fisik di Laci</span>
                          <span className="tabular-nums font-medium text-ink">-{formatRp(cashPhysical)}</span>
                        </div>
                      </div>
                      <div className="border-t border-ruled pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Total Aktual</span>
                          <span className="tabular-nums text-ink">{formatRp(actualTotal)}</span>
                        </div>
                      </div>

                      <div className="border-t border-ruled pt-3">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Selisih</span>
                          <span className={`tabular-nums ${discrepancy < 0 ? "text-notch-success-text" : discrepancy > 0 ? "text-red-600" : "text-ink-light"}`}>
                            {discrepancy === 0 ? "Rp 0" : `${discrepancy > 0 ? "-" : "+"}${formatRp(Math.abs(discrepancy))}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
