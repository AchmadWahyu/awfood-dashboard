"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { RequestEdit, DailyClosing, Item, Supplier } from "@/lib/dummy/types";
import { getAllRequestEdits, getRequestEditDetail, approveRequestEdit, rejectRequestEdit } from "./actions";
import { formatRp, formatDateDisplay, formatDateTime } from "@/lib/utils/format";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-ruled/30 text-ink-light",
  approved: "bg-notch-success text-notch-success-text",
  rejected: "bg-red-50 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

interface SupplierGroup {
  supplier: Supplier | undefined;
  items: (RequestEdit["items"][number] & { item: Item; old?: RequestEdit["items"][number] | undefined; changed: boolean; awalChanged: boolean; akhirChanged: boolean })[];
  totalTerjual: number;
  totalOmzet: number;
}

export default function OwnerRequestEditClient({
  initialEdits,
  initialItems,
  initialSuppliers,
}: {
  initialEdits: RequestEdit[];
  initialItems: Item[];
  initialSuppliers: Supplier[];
}) {
  const [edits, setEdits] = useState<RequestEdit[]>(initialEdits);
  const [items] = useState<Item[]>(initialItems);
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<RequestEdit | null>(null);
  const [closing, setClosing] = useState<DailyClosing | null>(null);
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && edits.some((e) => e.id === editId)) {
      openDetail(editId);
    }
  }, [searchParams, edits]);

  const supplierGroups = useMemo(() => {
    if (!selected || !closing) return [];
    const groups = new Map<string, SupplierGroup>();
    for (const i of selected.items) {
      const item = items.find((x) => x.id === i.item_id);
      if (!item) continue;
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
      const old = closing.items.find((ci) => ci.item_id === i.item_id);
      const changed = old && (old.stok_awal !== i.stok_awal || old.stok_akhir !== i.stok_akhir);
      const awalChanged = old && old.stok_awal !== i.stok_awal;
      const akhirChanged = old && old.stok_akhir !== i.stok_akhir;
      g.items.push({ ...i, item, old, changed: !!changed, awalChanged: !!awalChanged, akhirChanged: !!akhirChanged });
      g.totalTerjual += i.terjual;
      g.totalOmzet += i.total_rp;
    }
    return Array.from(groups.values());
  }, [selected, closing, items, suppliers]);

  const refresh = useCallback(async () => {
    const data = await getAllRequestEdits();
    setEdits(data);
  }, []);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setIsLoading(true);
    try {
      const detail = await getRequestEditDetail(id);
      if (detail) {
        setSelected(detail.requestEdit);
        setClosing(detail.closing);
      }
    } catch (error) {
      console.error("Error loading request edit detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setSelected(null);
    setClosing(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url.toString());
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

  const handleAction = async (r: RequestEdit, status: "approved" | "rejected") => {
    try {
      if (status === "approved") {
        await approveRequestEdit(r.id);
      } else {
        const reason = prompt("Alasan penolakan:");
        if (!reason) return;
        await rejectRequestEdit(r.id, reason);
      }
      await refresh();
      closeDetail();
    } catch (err: any) {
      alert(err.message || "Gagal memproses request edit.");
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Approval Request Edit</h2>
      {edits.length === 0 ? (
        <p className="text-sm text-ink-light">Belum ada request edit.</p>
      ) : (
        <div className="space-y-2">
          {edits.map((r) => {
            const closingData = closing?.id === r.closing_id ? closing : null;
            const newTotal = r.items.reduce((sum, i) => sum + i.total_rp, 0);
            const oldTotal = closingData?.total_omzet ?? 0;
            const delta = newTotal - oldTotal;
            return (
              <button
                key={r.id}
                onClick={() => openDetail(r.id)}
                className="w-full text-left rounded-xl border border-notch-border bg-paper-light px-4 py-3 shadow-sm hover:bg-paper transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink min-w-0 truncate">{closingData ? `Closing ${formatDateDisplay(closingData.date)}` : r.closing_id}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-light truncate">Oleh {r.requested_by}</span>
                  {r.status === "pending" ? (
                    <span className={`shrink-0 font-semibold tabular-nums ${delta >= 0 ? "text-notch-success-text" : "text-red-600"}`}>
                      {delta >= 0 ? "+" : ""}{formatRp(delta)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-ink-light">{formatRp(newTotal)}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isLoading && selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold">Memuat detail...</div>
        </div>
      )}

      {selected && closing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeDetail}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail request edit ${selected.id}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">
                Detail Request Edit {closing ? `(${formatDateDisplay(closing.date)})` : ""}
              </h3>
              <button onClick={closeDetail} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup detail">
                Tutup
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-ink-light">
              <span>Oleh {selected.requested_by}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_BADGE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
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
                              {g.items.map((i) => (
                                <tr key={i.id} className={i.changed ? "bg-marker-light/20" : ""}>
                                  <td className="font-medium">
                                    {i.item.name}
                                    {i.changed && <span className="ml-2 rounded bg-marker-light px-1.5 py-0.5 text-[10px] font-bold text-marker">berubah</span>}
                                  </td>
                                  <td className={`text-center tabular-nums ${i.awalChanged ? "font-bold text-marker" : ""}`}>
                                    {i.stok_awal}
                                  </td>
                                  <td className={`text-center tabular-nums ${i.akhirChanged ? "font-bold text-marker" : ""}`}>
                                    {i.stok_akhir}
                                  </td>
                                  <td className="text-center font-bold tabular-nums">{i.terjual}</td>
                                  <td className="text-right font-bold text-marker tabular-nums">{formatRp(i.total_rp)}</td>
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

            {(() => {
              const oldCash = closing.cash_physical;
              const oldOmzet = closing.total_omzet;
              const newOmzet = selected.items.reduce((sum, i) => sum + i.total_rp, 0);
              const kasChanged = oldCash !== selected.cash_physical;
              const omzetChanged = oldOmzet !== newOmzet;
              return (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded-lg bg-paper px-3 py-2">
                    <p className="text-[10px] text-ink-light">Kas Awal</p>
                    <p className="font-semibold text-ink tabular-nums">{formatRp(selected.cash_initial)}</p>
                  </div>

                  {(kasChanged || omzetChanged) && (
                    <div className="grid grid-cols-2 gap-2">
                      {kasChanged ? (
                        <div className="rounded-lg bg-paper px-3 py-2">
                          <p className="text-[10px] text-ink-light">Kas Fisik Lama</p>
                          <p className="font-semibold text-ink-light tabular-nums line-through">{formatRp(oldCash)}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-paper px-3 py-2">
                          <p className="text-[10px] text-ink-light">Kas Fisik</p>
                          <p className="font-semibold text-ink tabular-nums">{formatRp(selected.cash_physical)}</p>
                        </div>
                      )}
                      {omzetChanged ? (
                        <div className="rounded-lg bg-paper px-3 py-2">
                          <p className="text-[10px] text-ink-light">Omzet Lama</p>
                          <p className="font-semibold text-ink-light tabular-nums line-through">{formatRp(oldOmzet)}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-paper px-3 py-2">
                          <p className="text-[10px] text-ink-light">Omzet</p>
                          <p className="font-semibold text-ink tabular-nums">{formatRp(newOmzet)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(kasChanged || omzetChanged) && (
                    <div className="grid grid-cols-2 gap-2">
                      {kasChanged && (
                        <div className="rounded-lg bg-paper px-3 py-2 border border-marker">
                          <p className="text-[10px] text-marker">Kas Fisik Baru</p>
                          <p className="font-semibold text-marker tabular-nums">{formatRp(selected.cash_physical)}</p>
                        </div>
                      )}
                      {omzetChanged && (
                        <div className="rounded-lg bg-paper px-3 py-2 border border-marker">
                          <p className="text-[10px] text-marker">Omzet Baru</p>
                          <p className="font-semibold text-marker tabular-nums">{formatRp(newOmzet)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!kasChanged && !omzetChanged && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-paper px-3 py-2">
                        <p className="text-[10px] text-ink-light">Kas Fisik</p>
                        <p className="font-semibold text-ink tabular-nums">{formatRp(selected.cash_physical)}</p>
                      </div>
                      <div className="rounded-lg bg-paper px-3 py-2">
                        <p className="text-[10px] text-ink-light">Omzet</p>
                        <p className="font-semibold text-ink tabular-nums">{formatRp(newOmzet)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <p className="mt-3 text-xs text-ink-light break-words">{selected.reason}</p>

            {selected.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleAction(selected, "approved")} className="flex-1 rounded-xl bg-notch-success px-4 py-2.5 text-sm font-bold text-notch-success-text hover:opacity-80 transition-colors">
                  Setujui
                </button>
                <button onClick={() => handleAction(selected, "rejected")} className="flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:opacity-80 transition-colors">
                  Tolak
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
