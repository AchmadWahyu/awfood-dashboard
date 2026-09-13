"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { DailyClosing, Item, Supplier, ClosingItem, RequestEdit } from "@/lib/dummy/types";
import { getRequestEditsByStaff, getClosingDetailForRequestEdit, createRequestEdit } from "./actions";
import { formatRp, formatDateDisplay, formatDateTime } from "@/lib/utils/format";
import FormattedNumberInput from "@/components/FormattedNumberInput";

function NotebookInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      className="w-14 bg-transparent text-center outline-none border-0 border-b-2 border-ruled focus:border-marker transition-colors"
    />
  );
}

function calcTerjual(awal: number, akhir: number) {
  return Math.max(0, (awal || 0) - (akhir || 0));
}

interface Entry {
  productId: string;
  productName: string;
  hargaJual: number;
  stokAwal: number;
  stokAkhir: number;
}

interface Group {
  supplierId: string;
  supplierName: string;
  entries: Entry[];
}

export default function EmployeeRequestEditClient({
  initialClosings,
  initialItems,
  initialSuppliers,
  initialRequestEdits,
}: {
  initialClosings: DailyClosing[];
  initialItems: Item[];
  initialSuppliers: Supplier[];
  initialRequestEdits: RequestEdit[];
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [closings, setClosings] = useState<DailyClosing[]>(initialClosings);
  const [items] = useState<Item[]>(initialItems);
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [myReqs, setMyReqs] = useState<RequestEdit[]>(initialRequestEdits);
  const [closingId, setClosingId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [bevEntries, setBevEntries] = useState<Entry[]>([]);
  const [cashPhysical, setCashPhysical] = useState("");
  const [reason, setReason] = useState("");
  const [ok, setOk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequestEdit | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const selectedClosing = useMemo(() => {
    return closingId ? closings.find((c) => c.id === closingId) || null : null;
  }, [closingId, closings]);

  const loadClosing = async (id: string) => {
    setClosingId(id);
    setIsLoadingDetail(true);
    try {
      const c = await getClosingDetailForRequestEdit(id);
      if (!c) return;

      const buildGroups = () => {
        const result: Group[] = [];
        for (const s of suppliers) {
          const entries = c.items
            .map((ci) => {
              const def = items.find((i) => i.id === ci.item_id);
              return def && def.supplier_id === s.id
                ? { productId: def.id, productName: def.name, hargaJual: Number(def.price_sell), stokAwal: ci.stok_awal, stokAkhir: ci.stok_akhir }
                : null;
            })
            .filter((e): e is Entry => e !== null);
          if (entries.length > 0) result.push({ supplierId: s.id, supplierName: s.name, entries });
        }
        return result;
      };

      const buildBev = () =>
        c.items
          .map((ci) => {
            const def = items.find((i) => i.id === ci.item_id);
            return def && def.supplier_id === null
              ? { productId: def.id, productName: def.name, hargaJual: Number(def.price_sell), stokAwal: ci.stok_awal, stokAkhir: ci.stok_akhir }
              : null;
          })
          .filter((e): e is Entry => e !== null);

      setGroups(buildGroups());
      setBevEntries(buildBev());
      setCashPhysical(String(c.cash_physical || ""));
      setReason("");
      setOk(false);
    } catch (error) {
      console.error("Error loading closing:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get("closing");
    if (id && closings.some((c) => c.id === id)) {
      loadClosing(id);
    }
  }, [searchParams, closings]);

  useEffect(() => {
    const loadRequestEdits = async () => {
      if (!user?.id) return;
      const reqs = await getRequestEditsByStaff();
      setMyReqs(reqs);
    };
    loadRequestEdits();
  }, [user]);

  const updateEntry = useCallback((groupId: string, productId: string, field: "stokAwal" | "stokAkhir", value: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.supplierId === groupId
          ? { ...g, entries: g.entries.map((e) => (e.productId === productId ? { ...e, [field]: value } : e)) }
          : g
      )
    );
  }, []);

  const updateBev = useCallback((productId: string, field: "stokAwal" | "stokAkhir", value: number) => {
    setBevEntries((prev) => prev.map((e) => (e.productId === productId ? { ...e, [field]: value } : e)));
  }, []);

  const entryTotal = (e: Entry) => calcTerjual(e.stokAwal, e.stokAkhir) * e.hargaJual;
  const groupTotal = (g: Group) => g.entries.reduce((sum, e) => sum + entryTotal(e), 0);
  const bevTotal = bevEntries.reduce((sum, e) => sum + entryTotal(e), 0);
  const grandTotal = groups.reduce((sum, g) => sum + groupTotal(g), 0) + bevTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClosing || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const toClosingItems = (entries: Entry[]): ClosingItem[] =>
        entries.map((en) => {
          const t = calcTerjual(en.stokAwal, en.stokAkhir);
          return {
            id: `temp-${Date.now()}-${Math.random()}`,
            item_id: en.productId,
            stok_awal: en.stokAwal,
            stok_akhir: en.stokAkhir,
            terjual: t,
            total_rp: t * en.hargaJual,
          };
        });

      const allItems: ClosingItem[] = [...groups.flatMap((g) => toClosingItems(g.entries)), ...toClosingItems(bevEntries)];

      await createRequestEdit({
        closingId: selectedClosing.id,
        items: allItems,
        cashPhysical: parseInt(cashPhysical) || 0,
        reason,
      });

      setOk(true);
      setClosingId("");
      setGroups([]);
      setBevEntries([]);
      setCashPhysical("");
      setReason("");
      
      const reqs = await getRequestEditsByStaff();
      setMyReqs(reqs);
      
      setTimeout(() => setOk(false), 3000);
    } catch (err: any) {
      alert(err.message || "Gagal mengajukan request edit. Coba lagi.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDetail = useCallback(() => setSelectedReq(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDetail]);

  useEffect(() => {
    if (!selectedReq) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedReq]);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h2 className="text-lg font-bold text-ink">Request Edit</h2>

      <div className=" rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs text-ink-light mb-1">Closing</label>
          <select
            value={closingId}
            onChange={(e) => loadClosing(e.target.value)}
            required
            className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
          >
            <option value="">Pilih closing</option>
            {closings.map((c) => <option key={c.id} value={c.id}>                {formatDateDisplay(c.date)} — {c.staff_name}</option>)}
          </select>
        </div>

        {isLoadingDetail && (
          <div className="text-center py-4">
            <p className="text-sm text-ink-light">Memuat detail closing...</p>
          </div>
        )}

        {selectedClosing && !ok && !isLoadingDetail && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-ink-light">Ubah data penutupan lalu ajukan ke owner untuk disetujui.</p>

            {groups.map((g) => (
              <div key={g.supplierId} className="rounded-xl border border-notch-border p-4">
                <p className="mb-2 text-xs font-bold text-ink">{g.supplierName}</p>
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
                      {g.entries.map((en) => {
                        const terjual = calcTerjual(en.stokAwal, en.stokAkhir);
                        const hasData = en.stokAwal > 0 || en.stokAkhir > 0;
                        return (
                          <tr key={en.productId}>
                            <td className="font-medium whitespace-nowrap">{en.productName}</td>
                            <td className="text-center"><NotebookInput value={en.stokAwal} onChange={(v) => updateEntry(g.supplierId, en.productId, "stokAwal", v)} /></td>
                            <td className="text-center"><NotebookInput value={en.stokAkhir} onChange={(v) => updateEntry(g.supplierId, en.productId, "stokAkhir", v)} /></td>
                            <td className={`text-right font-bold ${hasData ? "text-ink" : "text-ink-light"}`}>{terjual}</td>
                            <td className={`text-right font-bold ${hasData ? "text-marker" : "text-ink-light"}`}>{formatRp(terjual * en.hargaJual)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-right text-xs text-ink-light">Subtotal: <span className="font-bold text-marker">{formatRp(groupTotal(g))}</span></p>
              </div>
            ))}

            {bevEntries.length > 0 && (
              <div className="rounded-xl border border-notch-border p-4">
                <p className="mb-2 text-xs font-bold text-ink">Minuman Milik Sendiri</p>
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
                      {bevEntries.map((en) => {
                        const terjual = calcTerjual(en.stokAwal, en.stokAkhir);
                        const hasData = en.stokAwal > 0 || en.stokAkhir > 0;
                        return (
                          <tr key={en.productId}>
                            <td className="py-2 pr-3 text-ink font-medium whitespace-nowrap">{en.productName}</td>
                            <td className="py-1 pr-2 text-center w-[72px]"><NotebookInput value={en.stokAwal} onChange={(v) => updateBev(en.productId, "stokAwal", v)} /></td>
                            <td className="py-1 pr-2 text-center w-[72px]"><NotebookInput value={en.stokAkhir} onChange={(v) => updateBev(en.productId, "stokAkhir", v)} /></td>
                            <td className={`py-2 px-3 text-right font-bold w-[72px] ${hasData ? "text-ink" : "text-ink-light"}`}>{terjual}</td>
                            <td className={`py-2 pl-3 text-right font-bold w-[120px] ${hasData ? "text-marker" : "text-ink-light"}`}>{formatRp(terjual * en.hargaJual)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-ink-light mb-1">Total kas di laci saat tutup</label>
              <FormattedNumberInput value={cashPhysical} onChange={setCashPhysical} placeholder="0" className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
            </div>

            <div>
              <label className="block text-xs text-ink-light mb-1">Alasan perubahan</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-marker-light/50 border border-marker/20 px-4 py-3">
              <div>
                <span className="text-xs text-ink-light">Total Omzet (usulan)</span>
                <p className="text-lg font-bold text-marker">{formatRp(grandTotal)}</p>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto rounded-xl bg-marker px-5 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors disabled:opacity-50">
                {isSubmitting ? "Mengajukan..." : "Ajukan Request Edit"}
              </button>
            </div>
          </form>
        )}

        {ok && <div className="rounded-lg bg-notch-success px-3 py-2 text-sm text-notch-success-text">Request edit berhasil diajukan!</div>}
      </div>

      <h3 className="text-sm font-bold text-ink">Riwayat Request Saya</h3>
      {myReqs.length === 0 ? (
        <p className="text-sm text-ink-light">Belum ada request.</p>
      ) : (
        <div className="space-y-2">
          {myReqs.map((r) => {
            const closing = closings.find((c) => c.id === r.closing_id);
            return (
              <button
                key={r.id}
                onClick={() => setSelectedReq(r)}
                className="w-full text-left rounded-xl border border-notch-border bg-paper-light px-4 py-3 text-sm shadow-sm hover:bg-paper transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink min-w-0 truncate">{closing ? `Closing ${formatDateDisplay(closing.date)}` : r.closing_id} — {formatRp(r.items.reduce((s, i) => s + i.total_rp, 0))}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                </div>
                <p className="mt-1 text-xs text-ink-light break-words">{r.reason}</p>
              </button>
            );
          })}
        </div>
      )}

      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeDetail}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail request edit ${selectedReq.id}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">
                Detail Request Edit {closings.find((c) => c.id === selectedReq.closing_id) ? `(${formatDateDisplay(closings.find((c) => c.id === selectedReq.closing_id)!.date)})` : ""}
              </h3>
              <button onClick={closeDetail} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup detail">
                Tutup
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-ink-light">
              <span>{formatDateTime(selectedReq.requested_at)}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_BADGE[selectedReq.status]}`}>{STATUS_LABEL[selectedReq.status]}</span>
            </div>

            <div className="overflow-x-auto mt-4">
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
                  {selectedReq.items.map((i) => {
                    const item = items.find((x) => x.id === i.item_id);
                    return (
                      <tr key={i.id}>
                        <td>{item?.name || i.item_id}</td>
                        <td className="text-center tabular-nums">{i.stok_awal}</td>
                        <td className="text-center tabular-nums">{i.stok_akhir}</td>
                        <td className="text-center font-bold tabular-nums">{i.terjual}</td>
                        <td className="text-right font-bold text-marker tabular-nums">{formatRp(i.total_rp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <div className="rounded-lg bg-paper px-3 py-2">
                <p className="text-[10px] text-ink-light">Kas Fisik</p>
                <p className="font-semibold text-ink tabular-nums">{formatRp(selectedReq.cash_physical)}</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-light break-words">{selectedReq.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
