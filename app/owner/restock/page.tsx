"use client";

import { useState, useMemo } from "react";
import { getBeverageItems, addRestock, getRestocks } from "@/lib/dummy/api";
import { todayLocal } from "@/lib/utils/date";
import type { Restock } from "@/lib/dummy/types";

export default function OwnerRestockPage() {
  const bevs = useMemo(() => getBeverageItems(), []);
  const [restocks, setRestocks] = useState<Restock[]>(getRestocks);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(todayLocal());

  const refresh = () => setRestocks(getRestocks());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addRestock({
      id: crypto.randomUUID(),
      item_id: itemId,
      qty: parseInt(qty) || 0,
      date,
      created_at: new Date().toISOString(),
    });
    setQty("");
    refresh();
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Restock[]>();
    for (const r of restocks) {
      const arr = map.get(r.item_id) || [];
      arr.push(r);
      map.set(r.item_id, arr);
    }
    return map;
  }, [restocks]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Restock Minuman</h2>
      <form onSubmit={handleAdd} className=" rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-md">
        <div>
          <label className="block text-xs text-ink-light mb-1">Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
            <option value="">Pilih minuman</option>
            {bevs.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Qty</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Tanggal</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
        </div>
        <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">Catat Restock</button>
      </form>

      <div className="space-y-4">
        {bevs.map((b) => {
          const list = grouped.get(b.id) || [];
          const total = list.reduce((sum, r) => sum + r.qty, 0);
          return (
            <div key={b.id} className="rounded-xl border border-notch-border bg-paper-light p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-ink">{b.name}</span>
                <span className="text-xs text-ink-light">Total restock: <strong className="text-marker">{total}</strong></span>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-ink-light">Belum ada restock.</p>
              ) : (
                <div className="space-y-1">
                  {list.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs text-ink-light">
                      <span>{r.date}</span>
                      <span>+{r.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
