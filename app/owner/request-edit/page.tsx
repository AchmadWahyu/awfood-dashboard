"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSyncStorage } from "@/lib/dummy/sync";
import { getRequestEdits, updateRequestEdit, getItems, getSuppliers, updateClosing, getClosingById, getExpenses, getSettlements } from "@/lib/dummy/api";
import type { RequestEdit, Item, Supplier } from "@/lib/dummy/types";

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

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

export default function OwnerRequestEditPage() {
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));
  const [edits, setEdits] = useState<RequestEdit[]>(() => getRequestEdits().sort((a, b) => +new Date(b.requested_at) - +new Date(a.requested_at)));
  const items = useMemo(() => getItems(), [version]);
  const suppliers = useMemo(() => getSuppliers(), [version]);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("edit");
  });
  const selected = useMemo(() => edits.find((e) => e.id === selectedId) || null, [edits, selectedId]);
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);

  interface SupplierGroup {
    supplier: Supplier | undefined;
    items: (RequestEdit["items"][number] & { item: Item; old?: RequestEdit["items"][number] | undefined; changed: boolean; awalChanged: boolean; akhirChanged: boolean })[];
    totalTerjual: number;
    totalOmzet: number;
  }

  const supplierGroups = useMemo(() => {
    if (!selected) return [];
    const closing = getClosingById(selected.closing_id);
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
      const old = closing?.items.find((ci) => ci.item_id === i.item_id);
      const changed = old && (old.stok_awal !== i.stok_awal || old.stok_akhir !== i.stok_akhir);
      const awalChanged = old && old.stok_awal !== i.stok_awal;
      const akhirChanged = old && old.stok_akhir !== i.stok_akhir;
      g.items.push({ ...i, item, old, changed: !!changed, awalChanged: !!awalChanged, akhirChanged: !!akhirChanged });
      g.totalTerjual += i.terjual;
      g.totalOmzet += i.total_rp;
    }
    return Array.from(groups.values());
  }, [selected, items, suppliers]);

  const refresh = useCallback(() => setEdits(getRequestEdits().sort((a, b) => +new Date(b.requested_at) - +new Date(a.requested_at))), []);

  useEffect(() => { refresh(); }, [refresh, version]);
  useEffect(() => { setOpenSupplierId(null); }, [selectedId]);

  const syncUrl = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("edit", id);
    } else {
      url.searchParams.delete("edit");
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

  useEffect(() => {
    const onPop = () => {
      setSelectedId(new URLSearchParams(window.location.search).get("edit"));
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

  const handle = (r: RequestEdit, status: "approved" | "rejected") => {
    updateRequestEdit(r.id, { status, approved_by: "owner-1", approved_at: new Date().toISOString() });
    if (status === "approved") {
      const closing = getClosingById(r.closing_id);
      const totalOmzet = r.items.reduce((sum, i) => sum + i.total_rp, 0);
      const patch: Parameters<typeof updateClosing>[1] = {
        items: r.items,
        total_omzet: totalOmzet,
        cash_initial: closing?.cash_initial ?? 0,
        cash_physical: r.cash_physical,
      };
      if (closing && closing.qris_verified != null && closing.discrepancy != null) {
        const cashInitial = closing.cash_initial;
        const cashExpenses = getExpenses().filter((e) => e.date === closing.date && e.pocket === "CASH_LACI").reduce((s, e) => s + e.amount, 0);
        const drawerSettlements = getSettlements().filter((s) => s.closing_id === closing.id && s.paid_from_drawer).reduce((s, x) => s + x.amount, 0);
        const adjustedCash = (r.cash_physical - cashInitial) + cashExpenses + drawerSettlements;
        patch.discrepancy = totalOmzet - (adjustedCash + (closing.qris_verified || 0));
      }
      updateClosing(r.closing_id, patch);
    }
    refresh();
    closeDetail();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Approval Request Edit</h2>
      {edits.length === 0 ? (
        <p className="text-sm text-ink-light">Belum ada request edit.</p>
      ) : (
        <div className="space-y-2">
          {edits.map((r) => {
            const closing = getClosingById(r.closing_id);
            const newTotal = r.items.reduce((sum, i) => sum + i.total_rp, 0);
            const oldTotal = closing?.total_omzet ?? 0;
            const delta = newTotal - oldTotal;
            return (
              <button
                key={r.id}
                onClick={() => openDetail(r.id)}
                className="w-full text-left rounded-xl border border-notch-border bg-paper-light px-4 py-3 shadow-sm hover:bg-paper transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink min-w-0 truncate">{closing ? `Closing ${closing.date}` : r.closing_id}</span>
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

      {selected && (
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
                Detail Request Edit {getClosingById(selected.closing_id) ? `(${getClosingById(selected.closing_id)!.date})` : ""}
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
              const closing = getClosingById(selected.closing_id);
              const oldCash = closing?.cash_physical ?? 0;
              const oldOmzet = closing?.total_omzet ?? 0;
              const newOmzet = selected.items.reduce((sum, i) => sum + i.total_rp, 0);
              const kasChanged = oldCash !== selected.cash_physical;
              const omzetChanged = oldOmzet !== newOmzet;
              return (
                <div className="mt-3 space-y-2 text-sm">
                  {/* Baris 1: Kas Awal (full width) */}
                  <div className="rounded-lg bg-paper px-3 py-2">
                    <p className="text-[10px] text-ink-light">Kas Awal</p>
                    <p className="font-semibold text-ink tabular-nums">{formatRp(selected.cash_initial)}</p>
                  </div>

                  {/* Baris 2: Lama (Kas Fisik Lama | Omzet Lama) */}
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

                  {/* Baris 3: Baru (Kas Fisik Baru | Omzet Baru) */}
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

                  {/* Fallback: tidak ada perubahan sama sekali */}
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
                <button onClick={() => handle(selected, "approved")} className="flex-1 rounded-xl bg-notch-success px-4 py-2.5 text-sm font-bold text-notch-success-text hover:opacity-80 transition-colors">
                  Setujui
                </button>
                <button onClick={() => handle(selected, "rejected")} className="flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:opacity-80 transition-colors">
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
