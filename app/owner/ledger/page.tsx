"use client";

import { useState, useMemo } from "react";
import { getSuppliers, getSettlements, addSettlement, getClosings, addLedgerEntry } from "@/lib/dummy/api";
import { todayLocal } from "@/lib/dummy/date";
import type { SupplierSettlement, SupplierLedgerEntry } from "@/lib/dummy/types";

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function OwnerLedgerPage() {
  const suppliers = useMemo(() => getSuppliers().filter((s) => s.is_active), []);
  const settlements = useMemo(() => getSettlements(), []);
  const closings = useMemo(() => getClosings(), []);
  const [ledger, setLedger] = useState<SupplierLedgerEntry[]>(() => {
    // build ledger from closings + settlements
    const entries: SupplierLedgerEntry[] = [];
    for (const c of closings) {
      for (const si of suppliers) {
        const items = c.items.filter((i) => {
          // lookup by item; simplified: we dont have item->supplier in closing item, skip detailed
          return false;
        });
        // Simplified: just dummy ledger
      }
    }
    return [];
  });

  const [form, setForm] = useState({ supplier_id: "", amount: "", method: "tunai" as "tunai" | "transfer", reference: "" });
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    addSettlement({
      id: crypto.randomUUID(),
      supplier_id: form.supplier_id,
      closing_id: null,
      amount: parseInt(form.amount) || 0,
      method: form.method,
      reference: form.reference,
      paid_from_drawer: false,
      paid_at: new Date().toISOString(),
      paid_by: "owner-1",
    });
    addLedgerEntry({
      id: crypto.randomUUID(),
      supplier_id: form.supplier_id,
      type: "settlement",
      date: todayLocal(),
      amount: parseInt(form.amount) || 0,
      description: `Pembayaran ${form.method}`,
      settlement_id: "",
    });
    setForm({ supplier_id: "", amount: "", method: "tunai", reference: "" });
  };

  const supplierBalance = (sid: string) => {
    // Simplified: just dummy calculation using settlements only
    const totalPaid = settlements.filter((s) => s.supplier_id === sid).reduce((sum, s) => sum + s.amount, 0);
    // total sale from closings per supplier is complex in dummy, return a placeholder
    return { paid: totalPaid, debt: 0 };
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Supplier Ledger</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {suppliers.map((s) => {
            const bal = supplierBalance(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSupplier(s.id)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${selectedSupplier === s.id ? "border-marker bg-marker-light/20" : "border-notch-border bg-paper-light hover:bg-paper"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">{s.name}</span>
                  <span className="text-xs text-ink-light">Dibayar: {formatRp(bal.paid)}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div>
          <form onSubmit={handlePay} className=" rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Pembayaran Supplier</h3>
            <div>
              <label className="block text-xs text-ink-light mb-1">Supplier</label>
              <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
                <option value="">Pilih supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-light mb-1">Nominal</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
              </div>
              <div>
                <label className="block text-xs text-ink-light mb-1">Metode</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as any })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
                  <option value="tunai">Tunai</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
            {form.method === "transfer" && (
              <div>
                <label className="block text-xs text-ink-light mb-1">Referensi</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
              </div>
            )}
            <button type="submit" className="w-full rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">Catat Pembayaran</button>
          </form>
        </div>
      </div>
    </div>
  );
}
