"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createItem, updateItem, toggleItemActive, deleteItem, getItems, getBeverageItems } from "./actions";
import type { Item, ItemType } from "./actions";
import { formatNumber } from "@/lib/utils/format";
import FormattedNumberInput from "@/components/FormattedNumberInput";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function OwnerItemsClient({ 
  initialItems, 
  initialSuppliers, 
  initialBeverages 
}: { 
  initialItems: Item[];
  initialSuppliers: { id: string; name: string }[];
  initialBeverages: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [suppliers] = useState(initialSuppliers);
  const [beverages] = useState(initialBeverages);
  const [form, setForm] = useState({ 
    name: "", 
    supplier_id: "", 
    type: "KONSINYASI_KUE" as ItemType, 
    cost_price: "", 
    selling_price: "" 
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refresh = async () => {
    const data = await getItems();
    setItems(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("supplier_id", form.supplier_id || "");
    fd.append("category", form.type);
    fd.append("cost_price", form.cost_price);
    fd.append("selling_price", form.selling_price);
    try {
      await createItem(fd);
      toast.success("Item berhasil ditambahkan.");
      setForm({ name: "", supplier_id: "", type: "KONSINYASI_KUE", cost_price: "", selling_price: "" });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah item.");
    }
  };

  const handleEdit = (i: Item) => {
    setEditId(i.id);
    setForm({ 
      name: i.name, 
      supplier_id: i.supplier_id || "", 
      type: i.category, 
      cost_price: String(i.cost_price), 
      selling_price: String(i.selling_price) 
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("supplier_id", form.supplier_id || "");
    fd.append("category", form.type);
    fd.append("cost_price", form.cost_price);
    fd.append("selling_price", form.selling_price);
    fd.append("is_active", "true");
    try {
      await updateItem(editId, fd);
      toast.success("Item berhasil diperbarui.");
      setEditId(null);
      setForm({ name: "", supplier_id: "", type: "KONSINYASI_KUE", cost_price: "", selling_price: "" });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui item.");
    }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await toggleItemActive(id, !is_active);
      toast.success("Status item diperbarui.");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui status item.");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setConfirmOpen(false);
    try {
      await deleteItem(confirmId);
      toast.success("Item berhasil dihapus.");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus item.");
    } finally {
      setConfirmId(null);
    }
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
              <option value="KONSINYASI_KUE">Kue Konsinyasi</option>
              <option value="MINUMAN_OWNER">Minuman Owner</option>
              <option value="AYAM_PENYET">Ayam Penyet</option>
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
            <FormattedNumberInput value={form.cost_price} onChange={(raw) => setForm({ ...form, cost_price: raw })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Harga Jual</label>
            <FormattedNumberInput value={form.selling_price} onChange={(raw) => setForm({ ...form, selling_price: raw })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">{editId ? "Update" : "Tambah"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", supplier_id: "", type: "KONSINYASI_KUE", cost_price: "", selling_price: "" }); }} className="rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Batal</button>}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((i) => {
          const sup = suppliers.find((s) => s.id === i.supplier_id);
          return (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4">
              <div>
                <p className="text-sm font-bold text-ink">{i.name} {i.is_active ? "" : <span className="text-[10px] text-ink-light">(nonaktif)</span>}</p>
                <p className="text-xs text-ink-light">
                  {i.category === "KONSINYASI_KUE" ? `Konsinyasi${sup ? ` — ${sup.name}` : ""}` : i.category === "MINUMAN_OWNER" ? "Minuman Owner" : "Ayam Penyet"} · 
                  Beli {formatNumber(i.cost_price)} · 
                  Jual {formatNumber(i.selling_price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(i)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
                <button onClick={() => handleToggle(i.id, i.is_active)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">{i.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
                <button onClick={() => handleDelete(i.id)} className="rounded-lg border border-ruled px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Hapus</button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Item"
        description="Yakin ingin menghapus item ini? Aksi ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setConfirmId(null); }}
      />
    </div>
  );
}
