"use client";

import { useState } from "react";
import { createRestock, getRestocks } from "./actions";
import type { Restock } from "./actions";
import type { Item } from "../items/actions";
import { todayLocal } from "@/lib/dummy/date";

export default function OwnerRestocksClient({ 
  initialRestocks, 
  initialBeverages 
}: { 
  initialRestocks: Restock[];
  initialBeverages: Item[];
}) {
  const [restocks, setRestocks] = useState<Restock[]>(initialRestocks);
  const [beverages] = useState(initialBeverages);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(todayLocal());

  const refresh = async () => {
    const data = await getRestocks();
    setRestocks(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("item_id", itemId);
    fd.append("quantity", qty);
    fd.append("restock_date", date);
    await createRestock(fd);
    setQty("");
    await refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Restock Minuman</h2>
      
      {/* Form */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-md">
        <div>
          <label className="block text-xs text-ink-light mb-1">Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
            <option value="">Pilih minuman</option>
            {beverages.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
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

      {/* Tabel Riwayat */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Riwayat Restock</h3>
        {restocks.length === 0 ? (
          <p className="text-xs text-ink-light">Belum ada restock.</p>
        ) : (
          <div className="space-y-2">
            {restocks.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4">
                <div>
                  <p className="text-sm font-bold text-ink">{r.item_name}</p>
                  <p className="text-xs text-ink-light">{r.restock_date} · oleh {r.creator_name}</p>
                </div>
                <span className="text-sm font-bold text-marker">+{r.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
