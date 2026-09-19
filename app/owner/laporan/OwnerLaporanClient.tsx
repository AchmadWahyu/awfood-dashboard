"use client";

import { useState, useMemo, useEffect, useCallback, startTransition } from "react";
import type { DailyClosing, Item, Supplier, Expense, EmployeeDeduction } from "@/lib/dummy/types";
import { formatRp, formatDateDisplay, formatDateTime } from "@/lib/utils/format";
import { getSalesReport, getDiscrepancyReport, getExpensesReport, getDeductionsReport } from "./actions";
import { getClosingDetail } from "@/app/owner/verifikasi/actions";
import { getSuppliers } from "@/app/employee/riwayat/actions";
import { downloadXLSX, downloadCSV } from "@/lib/export";
import { todayJakarta } from "@/lib/utils/date";

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

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

interface SupplierGroup {
  supplier: Supplier | undefined;
  items: (DailyClosing["items"][number] & { item: Item })[];
  totalTerjual: number;
  totalOmzet: number;
}

type TabType = "penjualan" | "selisih";

export default function OwnerLaporanClient() {
  const today = todayJakarta();
  const defaultStart = addDays(today, -29);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(today);
  const [activeTab, setActiveTab] = useState<TabType>("penjualan");

  const [sales, setSales] = useState<DailyClosing[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DailyClosing[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("closing");
  });
  const [selected, setSelected] = useState<DailyClosing | null>(null);
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Fetch suppliers once
  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  // Fetch reports when dates change
  // Refresh report data without blocking the current view.
  useEffect(() => {
    let cancelled = false;
    startTransition(() => setLoading(true));
    Promise.all([
      getSalesReport(startDate, endDate),
      getDiscrepancyReport(startDate, endDate),
      getExpensesReport(startDate, endDate),
      getDeductionsReport(startDate, endDate),
    ]).then(([s, d, e, ded]) => {
      if (!cancelled) {
        setSales(s);
        setDiscrepancies(d);
        setExpenses(e);
        setDeductions(ded);
       startTransition(() => setLoading(false));
      }
    });
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  // Fetch selected closing detail
  // Clear stale detail data when no closing is selected.
  useEffect(() => {
    if (!selectedId) {
      startTransition(() => setSelected(null));
      return;
    }
    getClosingDetail(selectedId).then((detail) => {
      setSelected(detail);
    });
  }, [selectedId]);

  const supplierGroups = useMemo<SupplierGroup[]>(() => {
    if (!selected) return [];
    const groups = new Map<string, SupplierGroup>();
    for (const ci of selected.items as (DailyClosing["items"][number] & { item: Item })[]) {
      if (!ci.item) continue;
      if (ci.stok_awal === 0 && ci.terjual === 0) continue;
      const sid = ci.item.supplier_id || "owner";
      if (!groups.has(sid)) {
        groups.set(sid, {
          supplier: suppliers.find((s) => s.id === sid),
          items: [],
          totalTerjual: 0,
          totalOmzet: 0,
        });
      }
      const g = groups.get(sid)!;
      g.items.push(ci);
      g.totalTerjual += ci.terjual;
      g.totalOmzet += ci.total_rp;
    }
    return Array.from(groups.values());
  }, [selected, suppliers]);

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

  // Reset the supplier accordion when the selected closing changes.
  useEffect(() => {
    startTransition(() => setOpenSupplierId(null));
  }, [selectedId]);

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

  // Export functions
  const exportSalesXLSX = () => {
    const rows = sales.map((c) => ({
      Tanggal: c.date,
      Staff: c.staff_name,
      Status: STATUS_LABEL[c.status] || c.status,
      Omzet: c.total_omzet,
      Kas: c.cash_physical,
      QRIS: c.qris_verified ?? 0,
      Selisih: c.discrepancy ?? 0,
    }));
    downloadXLSX("laporan-penjualan.xlsx", rows);
  };

  const exportSalesCSV = () => {
    const rows = sales.map((c) => ({
      Tanggal: c.date,
      Staff: c.staff_name,
      Status: STATUS_LABEL[c.status] || c.status,
      Omzet: c.total_omzet,
      Kas: c.cash_physical,
      QRIS: c.qris_verified ?? 0,
      Selisih: c.discrepancy ?? 0,
    }));
    downloadCSV("laporan-penjualan.csv", rows);
  };

  const exportExpensesXLSX = () => {
    const rows = expenses.map((e) => ({
      Tanggal: e.date,
      Kategori: e.custom_label || e.category,
      Kantong: e.pocket,
      Nominal: e.amount,
      Catatan: e.note || "",
    }));
    downloadXLSX("laporan-pengeluaran.xlsx", rows);
  };

  const exportExpensesCSV = () => {
    const rows = expenses.map((e) => ({
      Tanggal: e.date,
      Kategori: e.custom_label || e.category,
      Kantong: e.pocket,
      Nominal: e.amount,
      Catatan: e.note || "",
    }));
    downloadCSV("laporan-pengeluaran.csv", rows);
  };

  const exportDeductionsXLSX = () => {
    const rows = deductions.map((d) => ({
      Staff: d.staff_name,
      Nominal: d.amount,
      Alasan: d.reason,
      Waktu: d.approved_at,
    }));
    downloadXLSX("laporan-potongan-gaji.xlsx", rows);
  };

  const exportDeductionsCSV = () => {
    const rows = deductions.map((d) => ({
      Staff: d.staff_name,
      Nominal: d.amount,
      Alasan: d.reason,
      Waktu: d.approved_at,
    }));
    downloadCSV("laporan-potongan-gaji.csv", rows);
  };

  const exportDiscrepancyXLSX = () => {
    const rows = discrepancies.map((c) => ({
      Tanggal: c.date,
      Staff: c.staff_name,
      Selisih: c.discrepancy ?? 0,
      Status: c.discrepancy_status || "-",
      Resolusi: c.discrepancy_resolution || "-",
    }));
    downloadXLSX("laporan-selisih.xlsx", rows);
  };

  const exportDiscrepancyCSV = () => {
    const rows = discrepancies.map((c) => ({
      Tanggal: c.date,
      Staff: c.staff_name,
      Selisih: c.discrepancy ?? 0,
      Status: c.discrepancy_status || "-",
      Resolusi: c.discrepancy_resolution || "-",
    }));
    downloadCSV("laporan-selisih.csv", rows);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Laporan & Export</h2>

      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs text-ink-light mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-notch-border bg-paper-light px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marker/30"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-ink-light mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-notch-border bg-paper-light px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marker/30"
          />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-sm font-bold text-ink">Export Penjualan</p>
          <p className="text-xs text-ink-light mt-1">{sales.length} records</p>
          <div className="flex gap-2 mt-3">
            <button onClick={exportSalesXLSX} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">XLSX</button>
            <button onClick={exportSalesCSV} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">CSV</button>
          </div>
        </div>
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-sm font-bold text-ink">Export Pengeluaran</p>
          <p className="text-xs text-ink-light mt-1">{expenses.length} records</p>
          <div className="flex gap-2 mt-3">
            <button onClick={exportExpensesXLSX} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">XLSX</button>
            <button onClick={exportExpensesCSV} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">CSV</button>
          </div>
        </div>
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-sm font-bold text-ink">Export Potongan Gaji</p>
          <p className="text-xs text-ink-light mt-1">{deductions.length} records</p>
          <div className="flex gap-2 mt-3">
            <button onClick={exportDeductionsXLSX} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">XLSX</button>
            <button onClick={exportDeductionsCSV} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">CSV</button>
          </div>
        </div>
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-sm font-bold text-ink">Export Selisih</p>
          <p className="text-xs text-ink-light mt-1">{discrepancies.length} records</p>
          <div className="flex gap-2 mt-3">
            <button onClick={exportDiscrepancyXLSX} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">XLSX</button>
            <button onClick={exportDiscrepancyCSV} className="flex-1 rounded-lg border border-notch-border px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors">CSV</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-notch-border overflow-hidden">
        <button
          onClick={() => setActiveTab("penjualan")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === "penjualan" ? "bg-marker text-white" : "bg-paper-light text-ink-light"}`}
        >
          Penjualan
        </button>
        <button
          onClick={() => setActiveTab("selisih")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === "selisih" ? "bg-marker text-white" : "bg-paper-light text-ink-light"}`}
        >
          Selisih
        </button>
      </div>

      {loading && <p className="text-xs text-ink-light">Memuat data...</p>}

      {/* Penjualan Tab */}
      {!loading && activeTab === "penjualan" && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-ink">Ringkasan Penjualan</h3>
          {sales.length === 0 ? (
            <p className="text-xs text-ink-light">Tidak ada data closing untuk rentang tanggal ini.</p>
          ) : (
            sales.map((c) => {
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
      )}

      {/* Selisih Tab */}
      {!loading && activeTab === "selisih" && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-ink">Laporan Selisih</h3>
          {discrepancies.length === 0 ? (
            <p className="text-xs text-ink-light">Tidak ada selisih untuk rentang tanggal ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="aw-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>TANGGAL</th>
                    <th>STAFF</th>
                    <th className="text-right">SELISIH</th>
                    <th className="text-center">STATUS</th>
                    <th className="text-center">RESOLUSI</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.map((c) => {
                    const s = selisihView(c.discrepancy);
                    return (
                      <tr key={c.id}>
                        <td className="font-medium">{formatDateDisplay(c.date)}</td>
                        <td>{c.staff_name}</td>
                        <td className={`text-right tabular-nums ${s.cls}`}>{s.text}</td>
                        <td className="text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.discrepancy_status === "open" ? "bg-marker-light text-marker" : "bg-notch-success text-notch-success-text"}`}>
                            {c.discrepancy_status === "open" ? "Terbuka" : "Resolved"}
                          </span>
                        </td>
                        <td className="text-center text-xs text-ink-light">
                          {c.discrepancy_resolution || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bottomsheet Detail */}
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
                  const omzet = selected.total_omzet;
                  const cashPhysical = selected.cash_physical;
                  const cashInitial = selected.cash_initial;
                  const expensesCash = selected.expenses_cash_snapshot || 0;
                  const expensesQris = selected.expenses_qris_snapshot || 0;
                  const qris = selected.qris_verified || 0;
                  const effectiveCash = cashPhysical - cashInitial + expensesCash;
                  const effectiveQris = qris + expensesQris;
                  const totalActual = effectiveCash + effectiveQris;
                  const discrepancy = omzet - totalActual;
                  return (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Omzet Sistem</span>
                          <span className="tabular-nums font-medium text-ink">+{formatRp(omzet)}</span>
                        </div>
                      </div>
                      <div className="border-t border-ruled pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Target Pendapatan</span>
                          <span className="tabular-nums text-ink">{formatRp(omzet)}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Kas Fisik di Laci</span>
                          <span className="tabular-nums font-medium text-ink">{formatRp(cashPhysical)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Kas Awal (modal)</span>
                          <span className="tabular-nums font-medium text-ink">-{formatRp(cashInitial)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Pengeluaran Cash</span>
                          <span className="tabular-nums font-medium text-ink">+{formatRp(expensesCash)}</span>
                        </div>
                      </div>
                      <div className="border-t border-ruled pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Pendapatan Cash Efektif</span>
                          <span className="tabular-nums text-ink">{formatRp(effectiveCash)}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">QRIS Final</span>
                          <span className="tabular-nums font-medium text-ink">{formatRp(qris)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Pengeluaran QRIS</span>
                          <span className="tabular-nums font-medium text-ink">+{formatRp(expensesQris)}</span>
                        </div>
                      </div>
                      <div className="border-t border-ruled pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Pendapatan QRIS Efektif</span>
                          <span className="tabular-nums text-ink">{formatRp(effectiveQris)}</span>
                        </div>
                      </div>

                      <div className="border-t border-ruled pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Total Pendapatan Aktual</span>
                          <span className="tabular-nums text-ink">{formatRp(totalActual)}</span>
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
