"use client";

import { useState, useMemo, useCallback, useEffect, startTransition } from "react";
import type { DailyClosing, Item, Supplier } from "@/lib/dummy/types";
import { getClosingDetail } from "./actions";
import { formatRp, formatDateDisplay, formatDateTime } from "@/lib/utils/format";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  rejected: "Ditolak",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-ruled/30 text-ink-light",
  submitted: "bg-marker-light text-marker",
  verified: "bg-notch-success text-notch-success-text",
  rejected: "bg-red-50 text-red-600",
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

export default function EmployeeRiwayatClient({
  initialClosings,
  initialItems,
  initialSuppliers,
}: {
  initialClosings: DailyClosing[];
  initialItems: Item[];
  initialSuppliers: Supplier[];
}) {
  const [closings, setClosings] = useState<DailyClosing[]>(initialClosings);
  const [items] = useState<Item[]>(initialItems);
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return closings.find((c) => c.id === selectedId) || null;
  }, [selectedId, closings]);

  const loadClosingDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const detail = await getClosingDetail(id);
      if (detail) {
        setClosings((prev) =>
          prev.map((c) => (c.id === id ? detail : c))
        );
      }
    } catch (error) {
      console.error("Error loading closing detail:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load the selected closing detail as a non-urgent update while keeping the list responsive.
  useEffect(() => {
    if (selectedId) {
      startTransition(() => {
        void loadClosingDetail(selectedId);
      });
    }
  }, [selectedId, loadClosingDetail]);

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

  const closeDetail = useCallback(() => setSelectedId(null), []);

  // Reset the supplier accordion when the selected closing changes.
  useEffect(() => {
    startTransition(() => setOpenSupplierId(null));
  }, [selectedId]);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold text-ink">Riwayat Penutupan</h2>
      {closings.length === 0 ? (
        <div className="rounded-2xl border border-notch-border bg-paper-light p-8 text-center text-ink-light text-sm">Belum ada data penutupan.</div>
      ) : (
        <div className="space-y-3">
          {closings.map((c) => {
            const s = selisihView(c.discrepancy);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full text-left rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm hover:bg-paper transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-ink">{formatDateDisplay(c.date)}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-light">Oleh {c.staff_name}</span>
                  <span className="font-bold text-marker">{formatRp(c.total_omzet)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-light">
                  <span>Kas: {formatRp(c.cash_physical)}</span>
                  <span>QRIS: {c.qris_verified != null ? formatRp(c.qris_verified) : "-"}</span>
                  <span>Selisih: <span className={s.cls}>{s.text}</span></span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeDetail}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail penutupan ${selected.date}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-24 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            {isLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold">Memuat detail...</div>
              </div>
            )}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Detail Penutupan {formatDateDisplay(selected.date)}</h3>
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
                        <span className="text-sm font-bold text-marker">
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
                      <div className="border-t border-cream-border px-4 py-4 space-y-3">
                        {g.items.map((ci) => (
                          <div
                            key={ci.id}
                            className="rounded-xl border border-ruled bg-paper-light p-4"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <p className="text-sm font-semibold text-ink truncate">
                                {ci.item.name}
                              </p>
                              <span className="text-sm font-bold text-marker tabular-nums shrink-0">
                                {formatRp(ci.total_rp)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-light">
                              <div className="flex flex-col items-center gap-1 flex-[2]">
                                <p>Awal</p> <strong className="text-ink tabular-nums">{ci.stok_awal}</strong>
                              </div>
                              <div className="flex flex-col items-center gap-1 flex-[2]">
                                <p>Akhir</p> <strong className="text-ink tabular-nums">{ci.stok_akhir}</strong>
                              </div>
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <p>Terjual</p> <strong className="text-ink tabular-nums text-notch-success-text">{ci.terjual}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between rounded-xl bg-cream-card px-4 py-3 border border-cream-border">
                          <span className="font-semibold text-sm">
                            Total {g.supplier?.name || "Minuman Milik Sendiri"}
                          </span>
                          <span className="font-bold text-sm text-marker">
                            {formatRp(g.totalOmzet)}
                          </span>
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
                <span className="tabular-nums">
                  {selected.status === "verified"
                    ? (selected.qris_verified != null ? formatRp(selected.qris_verified) : "-")
                    : <span className="text-ink-light italic">Belum diisi owner</span>}
                </span>
              </div>

              {/* Breakdown Pengeluaran — pakai snapshot saat verifikasi */}
              {(selected.expenses_cash_snapshot > 0 || selected.expenses_qris_snapshot > 0) && (
                <>
                  <div className="rounded-lg bg-paper px-3 py-2 space-y-1 mt-2">
                    <p className="text-xs font-bold text-ink">Pengeluaran (disesuaikan)</p>
                    {(() => {
                      const expensesCash = selected.expenses_cash_snapshot;
                      const expensesQris = selected.expenses_qris_snapshot;
                      const revenueCash = selected.cash_physical - selected.cash_initial + expensesCash;
                      const revenueQris = (selected.qris_verified || 0) + expensesQris;
                      const totalRevenue = revenueCash + revenueQris;
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-ink-light">Cash Laci</span>
                            <span className="tabular-nums text-marker">+{formatRp(expensesCash)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-ink-light">QRIS AW Food</span>
                            <span className="tabular-nums text-marker">+{formatRp(expensesQris)}</span>
                          </div>
                          <div className="border-t border-ruled pt-1 mt-1 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-ink-light">Kas Fisik − Kas Awal + Pengeluaran Cash</span>
                              <span className="tabular-nums font-medium">{formatRp(revenueCash)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-ink-light">QRIS Final + Pengeluaran QRIS</span>
                              <span className="tabular-nums font-medium">{formatRp(revenueQris)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-ink">Total Revenue Aktual</span>
                              <span className="tabular-nums">{formatRp(totalRevenue)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* Rincian pengeluaran per item (live, bisa berbeda saat verifikasi) */}
              {selected.expenses && selected.expenses.length > 0 && (
                <div className="rounded-lg bg-paper px-3 py-2 space-y-1 mt-2">
                  <p className="text-xs font-bold text-ink">Rincian Pengeluaran</p>
                  <p className="text-xs text-ink-light">Data terkini — bisa berbeda saat verifikasi</p>
                  {selected.expenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink-light">
                        {e.category === "LAINNYA" ? e.custom_label || "Lainnya" : e.category.replace(/_/g, " ")}
                        {e.note && <span className="text-xs text-ink-light/60"> · {e.note}</span>}
                      </span>
                      <span className="tabular-nums text-marker">{formatRp(e.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm pt-1 border-t border-ruled">
                <span className="text-ink-light flex items-center gap-1">
                  Selisih
                  <button onClick={() => setShowInfo(true)} className="inline-flex items-center justify-center rounded-full bg-ruled/40 w-5 h-5 text-xs text-ink-light hover:bg-ruled/60 transition-colors" aria-label="Info selisih">
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

            {/* Request Edit — dinonaktifkan di first release */}
            {/* {selected.status !== "draft" && (
              <div className="border-t border-ruled pt-3 mt-4">
                <button
                  onClick={() => router.push(`/employee/request-edit?closing=${selected.id}`)}
                  className="w-full rounded-xl border-2 border-marker px-4 py-2.5 text-sm font-bold text-marker hover:bg-marker-light transition-colors"
                >
                  Ajukan Request Edit
                </button>
              </div>
            )} */}

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
                  const expected = selected.total_omzet;
                  const cashPhysical = selected.cash_physical;
                  const cashInitial = selected.cash_initial;
                  const expensesCash = selected.expenses_cash_snapshot;
                  const expensesQris = selected.expenses_qris_snapshot;
                  const qris = selected.qris_verified || 0;
                  const revenueCash = cashPhysical - cashInitial + expensesCash;
                  const revenueQris = qris + expensesQris;
                  const totalRevenue = revenueCash + revenueQris;
                  const discrepancy = expected - totalRevenue;
                  return (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Total Omzet</span>
                          <span className="tabular-nums font-medium text-ink">{formatRp(expected)}</span>
                        </div>
                      </div>

                      <div className="border-t border-ruled pt-2 space-y-2">
                        <p className="text-xs font-medium text-ink">Revenue Cash</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Kas Fisik</span>
                          <span className="tabular-nums font-medium text-ink">{formatRp(cashPhysical)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Kas Awal</span>
                          <span className="tabular-nums font-medium text-ink">-{formatRp(cashInitial)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Pengeluaran Cash</span>
                          <span className="tabular-nums font-medium text-ink">+{formatRp(expensesCash)}</span>
                        </div>
                        <div className="border-t border-ruled pt-1">
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-ink">Revenue Cash Aktual</span>
                            <span className="tabular-nums text-ink">{formatRp(revenueCash)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-ruled pt-2 space-y-2">
                        <p className="text-xs font-medium text-ink">Revenue QRIS</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">QRIS Final</span>
                          <span className="tabular-nums font-medium text-ink">{formatRp(qris)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink-light">Pengeluaran QRIS</span>
                          <span className="tabular-nums font-medium text-ink">+{formatRp(expensesQris)}</span>
                        </div>
                        <div className="border-t border-ruled pt-1">
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-ink">Revenue QRIS Aktual</span>
                            <span className="tabular-nums text-ink">{formatRp(revenueQris)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-ruled pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-ink">Total Revenue Aktual</span>
                          <span className="tabular-nums text-ink">{formatRp(totalRevenue)}</span>
                        </div>
                      </div>

                      {selected.expenses && selected.expenses.length > 0 && (
                        <div className="border-t border-ruled pt-3 space-y-2">
                          <p className="text-xs font-medium text-ink">Rincian Pengeluaran</p>
                          <p className="text-xs text-ink-light">Data terkini — bisa berbeda saat verifikasi</p>
                          {selected.expenses.map((e) => (
                            <div key={e.id} className="flex items-center justify-between text-sm">
                              <span className="text-ink-light">
                                {e.category === "LAINNYA" ? e.custom_label || "Lainnya" : e.category.replace(/_/g, " ")}
                                {e.note && <span className="text-xs text-ink-light/60"> · {e.note}</span>}
                              </span>
                              <span className="tabular-nums text-marker">{formatRp(e.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}

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
