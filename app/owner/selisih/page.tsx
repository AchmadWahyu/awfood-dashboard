"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSyncStorage } from "@/lib/dummy/sync";
import { getClosings, getClosingById, getItems, getSuppliers, updateClosing, addDeduction } from "@/lib/dummy/api";
import type { DailyClosing, Item, Supplier } from "@/lib/dummy/types";

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

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

export default function OwnerSelisihPage() {
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));
  const [closings, setClosings] = useState<DailyClosing[]>(() => getClosings().filter((c) => c.discrepancy != null));
  const items = useMemo(() => getItems(), [version]);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<"koreksi data" | "ditanggung usaha" | "ditanggung karyawan">("koreksi data");
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("closing");
  });
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const selected = useMemo(() => (selectedId ? getClosingById(selectedId) : null), [selectedId, version]);

  const suppliers = useMemo(() => getSuppliers(), [version]);

  interface SupplierGroup {
    supplier: Supplier | undefined;
    items: (DailyClosing["items"][number] & { item: Item })[];
    totalTerjual: number;
    totalOmzet: number;
  }

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

  const refresh = () => setClosings(getClosings().filter((c) => c.discrepancy != null));

  useEffect(() => { refresh(); }, [version]);
  useEffect(() => { setOpenSupplierId(null); }, [selectedId]);

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

  const handleResolve = (closingId: string) => {
    const c = closings.find((x) => x.id === closingId);
    if (!c) return;
    updateClosing(closingId, {
      discrepancy_status: "resolved",
      discrepancy_resolution: resolution,
      discrepancy_note: note,
    });
    if (resolution === "ditanggung karyawan") {
      addDeduction({
        id: crypto.randomUUID(),
        staff_id: c.staff_id,
        staff_name: c.staff_name,
        closing_id: c.id,
        amount: Math.abs(c.discrepancy || 0),
        reason: note || "Selisih ditanggung karyawan",
        approved_by: "owner-1",
        approved_at: new Date().toISOString(),
        applied_at: null,
      });
    }
    setResolveId(null);
    setNote("");
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Investigasi Selisih</h2>
      {closings.length === 0 ? (
        <p className="text-sm text-ink-light">Belum ada selisih tercatat.</p>
      ) : (
        <div className="space-y-3">
          {closings.map((c) => {
            const s = selisihView(c.discrepancy);
            return (
              <button
                key={c.id}
                onClick={() => openDetail(c.id)}
                className="w-full text-left rounded-xl border border-notch-border bg-paper-light p-5 shadow-sm hover:bg-paper transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-ink">{c.date}</span>
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeDetail}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail selisih ${selected.date}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Detail Selisih {selected.date}</h3>
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
                  <span>{new Date(selected.verified_at).toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>

            {selected.discrepancy_status !== "resolved" && (
              <div className="border-t border-ruled pt-3 mt-4 space-y-2">
                <p className="text-xs font-bold text-ink">Tindak Lanjut</p>
                {resolveId === selected.id ? (
                  <div className="space-y-2">
                    <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
                      <option value="koreksi data">Koreksi Data</option>
                      <option value="ditanggung usaha">Ditanggung Usaha</option>
                      <option value="ditanggung karyawan">Ditanggung Karyawan</option>
                    </select>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan" rows={2} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
                    <div className="flex gap-2">
                      <button onClick={() => setResolveId(null)} className="flex-1 rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Batal</button>
                      <button onClick={() => handleResolve(selected.id)} className="flex-1 rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">Selesaikan</button>
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
