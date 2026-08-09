"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useSyncStorage } from "@/lib/dummy/sync";
import { getSubmittedClosings, getClosingById, updateClosing, getItems, getExpenses, getSettlements, getSuppliers } from "@/lib/dummy/api";
import type { DailyClosing, Item, Supplier } from "@/lib/dummy/types";

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

interface SupplierGroup {
  supplier: Supplier | undefined
  items: (DailyClosing["items"][number] & { item: Item })[]
  totalTerjual: number
  totalOmzet: number
}

export default function OwnerVerifikasiPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));
  const [closings, setClosings] = useState<DailyClosing[]>(getSubmittedClosings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cashInitialInput, setCashInitialInput] = useState("");
  const [qrisInput, setQrisInput] = useState("");
  const [cashConfirm, setCashConfirm] = useState<boolean | null>(null);
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);

  const selected = useMemo(() => (selectedId ? getClosingById(selectedId) : null), [selectedId, version]);
  const items = useMemo(() => getItems(), [version]);
  const suppliers = useMemo(() => getSuppliers(), [version]);
  const expenses = useMemo(() => getExpenses(), [version]);
  const settlements = useMemo(() => getSettlements(), [version]);

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

  const refresh = () => setClosings(getSubmittedClosings());

  useEffect(() => { refresh(); }, [version]);
  useEffect(() => { setOpenSupplierId(null); }, [selectedId]);

  const handleVerify = () => {
    if (!selected || cashConfirm === null) return;
    const cashInitial = parseInt(cashInitialInput) || 0;
    const qris = parseInt(qrisInput) || 0;
    const expected = selected.total_omzet;
    const USE_ADVANCED_DISCREPANCY = false;
    const cashExpenses = USE_ADVANCED_DISCREPANCY ? expenses.filter((e) => e.date === selected.date && e.pocket === "CASH_LACI").reduce((s, e) => s + e.amount, 0) : 0;
    const drawerSettlements = USE_ADVANCED_DISCREPANCY ? settlements.filter((s) => s.closing_id === selected.id && s.paid_from_drawer).reduce((s, x) => s + x.amount, 0) : 0;
    const adjustedCash = (selected.cash_physical - cashInitial) + cashExpenses + drawerSettlements;
    const discrepancy = expected - (adjustedCash + qris);
    let status: DailyClosing["discrepancy_status"] = null;
    let resolution = null;
    if (Math.abs(discrepancy) > 5000) {
      status = "open";
    }
    updateClosing(selected.id, {
      status: "verified",
      cash_initial: cashInitial,
      qris_verified: qris,
      qris_verified_by: user!.id,
      qris_verified_at: new Date().toISOString(),
      discrepancy,
      discrepancy_status: status,
      discrepancy_resolution: resolution,
      verified_by: user!.id,
      verified_at: new Date().toISOString(),
    });
    setSelectedId(null);
    setCashInitialInput("");
    setQrisInput("");
    setCashConfirm(null);
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Verifikasi Closing</h2>
      {closings.length === 0 ? (
        <p className="text-sm text-ink-light">Tidak ada closing yang menunggu verifikasi.</p>
      ) : (
        <div className="space-y-2">
          {closings.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setCashInitialInput(""); setQrisInput(""); setCashConfirm(null); }}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${selectedId === c.id ? "border-marker bg-marker-light/30" : "border-notch-border bg-paper-light hover:bg-paper"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">{c.date}</span>
                <span className="text-xs text-ink-light">{c.staff_name}</span>
              </div>
              <div className="mt-1 flex gap-4 text-xs text-ink-light">
                <span>Omzet: {formatRp(c.total_omzet)}</span>
                <span>Kas: {formatRp(c.cash_physical)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink">Detail Closing {selected.date}</h3>

          {/* Accordion per supplier */}
          <div className="space-y-3">
            {supplierGroups.map((g) => {
              const sid = g.supplier?.id || "owner";
              const isOpen = openSupplierId === sid;
              return (
                <div key={sid} className="rounded-xl border border-cream-border overflow-hidden">
                  {/* Accordion Header */}
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
                      <span className="text-xs font-bold text-marker">
                        {formatRp(g.totalOmzet)}
                      </span>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={`text-ink-light transition-transform ${isOpen ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className="border-t border-cream-border">
                      <div className="overflow-x-auto">
                        <table className="aw-table min-w-[520px]">
                          <thead>
                            <tr>
                              <th>PRODUK</th>
                              <th className="text-right">MODAL</th>
                              <th className="text-right">JUAL</th>
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
                                <td className="text-right text-text-secondary">
                                  {formatRp(ci.item.price_buy)}
                                </td>
                                <td className="text-right text-text-secondary">
                                  {formatRp(ci.item.price_sell)}
                                </td>
                                <td className="text-center tabular-nums">{ci.stok_awal}</td>
                                <td className="text-center tabular-nums">{ci.stok_akhir}</td>
                                <td className="text-center font-bold tabular-nums">{ci.terjual}</td>
                                <td className="text-right font-bold text-marker tabular-nums">
                                  {formatRp(ci.total_rp)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Supplier Footer */}
                      <div className="table-footer flex items-center justify-between rounded-b-xl">
                        <span className="font-semibold">
                          Total {g.supplier?.name || "Minuman Milik Sendiri"}
                        </span>
                        <span className="font-bold">
                          {formatRp(g.totalOmzet)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {supplierGroups.length === 0 && (
              <p className="text-sm text-text-secondary py-4 text-center">
                Tidak ada item dengan transaksi.
              </p>
            )}
          </div>
          <div className="border-t border-ruled pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">Total Omzet</span>
              <span className="text-base font-bold text-marker">{formatRp(selected.total_omzet)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-light">Kas Fisik</span>
              <span className="tabular-nums">{formatRp(selected.cash_physical)}</span>
            </div>
            <div className="border-t border-ruled pt-3 space-y-3">
              <div>
                <label className="block text-xs text-ink-light mb-1">Uang kembalian awal di laci (wajib)</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-ink">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashInitialInput}
                    onChange={(e) => setCashInitialInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="w-48 rounded-xl border-2 border-ruled bg-transparent px-4 py-2 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-light mb-1">Konfirmasi Kas Fisik</label>
                <div className="flex gap-2">
                  <button onClick={() => setCashConfirm(true)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${cashConfirm === true ? "bg-notch-success text-notch-success-text" : "border border-notch-border text-ink-light"}`}>Sesuai</button>
                  <button onClick={() => setCashConfirm(false)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${cashConfirm === false ? "bg-red-50 text-red-600" : "border border-notch-border text-ink-light"}`}>Tidak Sesuai</button>
                </div>
              </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">QRIS Final (dari bank)</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-ink">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={qrisInput}
                  onChange={(e) => setQrisInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="w-48 rounded-xl border-2 border-ruled bg-transparent px-4 py-2 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={cashConfirm === null || cashInitialInput === ""}
              className="w-full rounded-xl bg-marker px-4 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors disabled:opacity-40"
            >
              Verifikasi Closing
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
