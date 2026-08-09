"use client";

import { useState, useMemo } from "react";
import { getItems, getSuppliers, addItem, updateItem } from "@/lib/dummy/api";
import type { Item, ItemType } from "@/lib/dummy/types";

export default function OwnerItemsPage() {
  const [items, setItems] = useState<Item[]>(getItems);
  const suppliers = useMemo(() => getSuppliers().filter((s) => s.is_active), []);
  const [form, setForm] = useState({ name: "", supplier_id: "", type: "KUE_KONSI" as ItemType, price_buy: "", price_sell: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const refresh = () => setItems(getItems());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addItem({
      id: crypto.randomUUID(),
      name: form.name,
      supplier_id: form.supplier_id || null,
      type: form.type,
      price_buy: parseInt(form.price_buy) || 0,
      price_sell: parseInt(form.price_sell) || 0,
      is_active: true,
      created_at: new Date().toISOString(),
    });
    setForm({ name: "", supplier_id: "", type: "KUE_KONSI", price_buy: "", price_sell: "" });
    refresh();
  };

  const handleEdit = (i: Item) => {
    setEditId(i.id);
    setForm({ name: i.name, supplier_id: i.supplier_id || "", type: i.type, price_buy: String(i.price_buy), price_sell: String(i.price_sell) });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    updateItem(editId, {
      name: form.name,
      supplier_id: form.supplier_id || null,
      type: form.type,
      price_buy: parseInt(form.price_buy) || 0,
      price_sell: parseInt(form.price_sell) || 0,
    });
    setEditId(null);
    setForm({ name: "", supplier_id: "", type: "KUE_KONSI", price_buy: "", price_sell: "" });
    refresh();
  };

  const toggleActive = (i: Item) => {
    updateItem(i.id, { is_active: !i.is_active });
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Master Data Items</h2>
      <form onSubmit={editId ? handleUpdate : handleAdd} className=" rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Nama Item</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Jenis</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ItemType })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
              <option value="KUE_KONSI">Kue Konsinyasi</option>
              <option value="MINUMAN_OWNER">Minuman Owner</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-light mb-1">Supplier (kosongkan untuk minuman owner)</label>
          <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
            <option value="">— Tanpa Supplier —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Harga Modal</label>
            <input type="number" value={form.price_buy} onChange={(e) => setForm({ ...form, price_buy: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Harga Jual</label>
            <input type="number" value={form.price_sell} onChange={(e) => setForm({ ...form, price_sell: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">{editId ? "Update" : "Tambah"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", supplier_id: "", type: "KUE_KONSI", price_buy: "", price_sell: "" }); }} className="rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Batal</button>}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((i) => {
          const sup = suppliers.find((s) => s.id === i.supplier_id);
          return (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4">
              <div>
                <p className="text-sm font-bold text-ink">{i.name} {i.is_active ? "" : <span className="text-[10px] text-ink-light">(nonaktif)</span>}</p>
                <p className="text-xs text-ink-light">{i.type === "KUE_KONSI" ? `Konsinyasi${sup ? ` — ${sup.name}` : ""}` : "Minuman Owner"} · Beli {i.price_buy.toLocaleString("id-ID")} · Jual {i.price_sell.toLocaleString("id-ID")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(i)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
                <button onClick={() => toggleActive(i)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">{i.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
