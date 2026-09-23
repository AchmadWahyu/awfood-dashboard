"use client";

import { useState, useMemo, useEffect, useCallback, startTransition } from "react";
import { toast } from "sonner";
import type { DailyClosing, Item, Supplier } from "@/lib/dummy/types";
import { getClosingsWithDiscrepancy, getClosingDetail, resolveDiscrepancy, addDeduction } from "./actions";
import { formatRp, formatDateDisplay, formatDateTime } from "@/lib/utils/format";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-marker-light text-marker",
  resolved: "bg-notch-success text-notch-success-text",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Investigasi Terbuka",
  resolved: "Selesai",
};

function selisihView(d: number | null) {
  if (d == null) return { text: "-", cls: "text-ink-light" };
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

export default function SelisihClient({
  initialClosings,
  initialItems,
  initialSuppliers,
}: {
  initialClosings: DailyClosing[];
  initialItems: Item[];
  initialSuppliers: Supplier[];
}) {
  const [closings, setClosings] = useState<DailyClosing[]>(initialClosings);
  const items = useMemo(() => initialItems, [initialItems]);
  const suppliers = useMemo(() => initialSuppliers, [initialSuppliers]);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<"koreksi data" | "ditanggung usaha" | "ditanggung karyawan">("koreksi data");
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("closing");
  });
  const [selected, setSelected] = useState<DailyClosing | null>(null);
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClosingDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const detail = await getClosingDetail(id);
      if (detail) {
        setSelected(detail);
      }
    } catch (error) {
      console.error("Error loading closing detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load discrepancy detail or clear stale detail state after selection changes.
  useEffect(() => {
    if (selectedId) {
      startTransition(() => {
        void loadClosingDetail(selectedId);
      });
    } else {
      startTransition(() => setSelected(null));
    }
  }, [selectedId]);

  const refresh = async () => {
    const data = await getClosingsWithDiscrepancy();
    setClosings(data);
  };

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
    setSelected(null);
    syncUrl(null);
  }, [syncUrl]);

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

  // Reset the supplier accordion when the selected closing changes.
  useEffect(() => {
    startTransition(() => setOpenSupplierId(null));
  }, [selectedId]);

  const handleResolve = async (closingId: string) => {
    const c = closings.find((x) => x.id === closingId);
    if (!c || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await resolveDiscrepancy({
        closingId,
        resolution,
        note: note.trim(),
      });

      if (resolution === "ditanggung karyawan") {
        await addDeduction({
          staffId: c.staff_id,
          amount: Math.abs(c.discrepancy || 0),
          reason: note.trim() || "Selisih ditanggung karyawan",
        });
      }

      toast.success("Selisih berhasil diselesaikan.");
      setResolveId(null);
      setNote("");
      await refresh();
      closeDetail();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyelesaikan investigasi.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold text-ink">Investigasi Selisih</h2>

      {closings.length === 0 ? (
        <div className="rounded-2xl border border-notch-border bg-paper-light p-8 text-center text-ink-light text-sm">
          Belum ada selisih tercatat.
        </div>
      ) : (
        <div className="space-y-3">
          {closings.map((c) => {
            const s = selisihView(c.discrepancy);
            return (
              <button
                key={c.id}
                onClick={() => openDetail(c.id)}
                className="w-full text-left rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm hover:bg-paper transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-ink">{formatDateDisplay(c.date)}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_BADGE[c.discrepancy_status || "open"]}`}>
                    {STATUS_LABEL[c.discrepancy_status || "open"]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-light mb-1">
                  <span>Staff: {c.staff_name}</span>
                  <span>Omzet: {formatRp(c.total_omzet)}</span>
                </div>
                <p className="text-sm">
                  <span className="text-ink-light">Selisih:</span>{" "}
                  <span className={s.cls}>{s.text}</span>{" "}
                  <span className="text-xs text-ink-light">({c.discrepancy != null && c.discrepancy > 0 ? "kurang" : "lebih"})</span>
                </p>
                {c.discrepancy_status === "resolved" && (
                  <p className="mt-2 text-xs text-ink-light">Resolusi: <strong className="text-ink">{c.discrepancy_resolution}</strong> {c.discrepancy_note && `— ${c.discrepancy_note}`}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Sheet Detail */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail selisih ${selected.date}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            {isLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold">Memuat detail...</div>
              </div>
            )}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Detail Selisih {formatDateDisplay(selected.date)}</h3>
              <button onClick={closeDetail} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup detail">
                Tutup
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-ink-light">
              <span>Oleh {selected.staff_name}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_BADGE[selected.discrepancy_status || "open"]}`}>
                {STATUS_LABEL[selected.discrepancy_status || "open"]}
              </span>
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
                <span className="tabular-nums">{selected.qris_verified != null ? formatRp(selected.qris_verified) : "-"}</span>
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
                <span className="text-ink-light">Selisih</span>
                <span className={selisihView(selected.discrepancy).cls}>
                  {selisihView(selected.discrepancy).text}
                </span>
              </div>
              {selected.discrepancy_status === "resolved" && (
                <div className="flex items-center justify-between text-xs text-ink-light">
                  <span>Resolusi</span>
                  <span className="text-right">
                    <span className="font-semibold text-ink">{selected.discrepancy_resolution}</span>
                    {selected.discrepancy_note && ` — ${selected.discrepancy_note}`}
                  </span>
                </div>
              )}
              {selected.verified_at && (
                <div className="flex items-center justify-between text-xs text-ink-light">
                  <span>Diverifikasi</span>
                  <span>{formatDateTime(selected.verified_at)}</span>
                </div>
              )}
            </div>

            {selected.discrepancy_status !== "resolved" && (
              <div className="border-t border-ruled pt-3 mt-4 space-y-2">
                <p className="text-xs font-bold text-ink">Tindak Lanjut</p>
                {resolveId === selected.id ? (
                  <div className="space-y-2">
                    <select value={resolution} onChange={(e) => setResolution(e.target.value as typeof resolution)} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
                      <option value="koreksi data">Koreksi Data</option>
                      <option value="ditanggung usaha">Ditanggung Usaha</option>
                      <option value="ditanggung karyawan">Ditanggung Karyawan</option>
                    </select>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan" rows={2} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
                    <div className="flex gap-2">
                      <button onClick={() => setResolveId(null)} className="flex-1 rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Batal</button>
                      <button onClick={() => handleResolve(selected.id)} disabled={isSubmitting} className="flex-1 rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors disabled:opacity-40">
                        {isSubmitting ? "Memproses..." : "Selesaikan"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setResolveId(selected.id)} className="rounded-lg border border-marker px-3 py-1.5 text-xs font-bold text-marker hover:bg-marker-light transition-colors">Tindak Lanjuti</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
