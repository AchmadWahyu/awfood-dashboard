"use client";

import { useState, useCallback, useEffect } from "react";
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

  // Add form (inline)
  const [addForm, setAddForm] = useState({
    name: "",
    supplier_id: "",
    type: "KONSINYASI_KUE" as ItemType,
    cost_price: "",
    selling_price: ""
  });

  // Edit form (bottomsheet/modal)
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    supplier_id: "",
    type: "KONSINYASI_KUE" as ItemType,
    cost_price: "",
    selling_price: ""
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refresh = async () => {
    const data = await getItems();
    setItems(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", addForm.name);
    fd.append("supplier_id", addForm.supplier_id || "");
    fd.append("category", addForm.type);
    fd.append("cost_price", addForm.cost_price);
    fd.append("selling_price", addForm.selling_price);
    try {
      await createItem(fd);
      toast.success("Item berhasil ditambahkan.");
      setAddForm({ name: "", supplier_id: "", type: "KONSINYASI_KUE", cost_price: "", selling_price: "" });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah item.");
    }
  };

  const openEdit = (i: Item) => {
    setEditForm({
      id: i.id,
      name: i.name,
      supplier_id: i.supplier_id || "",
      type: i.category,
      cost_price: String(i.cost_price),
      selling_price: String(i.selling_price)
    });
    setEditOpen(true);
  };

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditForm({ id: "", name: "", supplier_id: "", type: "KONSINYASI_KUE", cost_price: "", selling_price: "" });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    const fd = new FormData();
    fd.append("name", editForm.name);
    fd.append("supplier_id", editForm.supplier_id || "");
    fd.append("category", editForm.type);
    fd.append("cost_price", editForm.cost_price);
    fd.append("selling_price", editForm.selling_price);
    fd.append("is_active", "true");
    try {
      await updateItem(editForm.id, fd);
      toast.success("Item berhasil diperbarui.");
      closeEdit();
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

  // Escape to close edit
  useEffect(() => {
    if (!editOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEdit();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [editOpen, closeEdit]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Master Data Items</h2>

      {/* Add Form — inline */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Nama Item</label>
            <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Jenis</label>
            <select value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value as ItemType })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
              <option value="KONSINYASI_KUE">Kue Konsinyasi</option>
              <option value="MINUMAN_OWNER">Minuman Owner</option>
              <option value="AYAM_PENYET">Ayam Penyet</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-light mb-1">Supplier (kosongkan untuk minuman owner)</label>
          <select value={addForm.supplier_id} onChange={(e) => setAddForm({ ...addForm, supplier_id: e.target.value })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
            <option value="">— Tanpa Supplier —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Harga Modal</label>
            <FormattedNumberInput value={addForm.cost_price} onChange={(raw) => setAddForm({ ...addForm, cost_price: raw })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Harga Jual</label>
            <FormattedNumberInput value={addForm.selling_price} onChange={(raw) => setAddForm({ ...addForm, selling_price: raw })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">Tambah</button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2">
        {items.map((i) => {
          const sup = suppliers.find((s) => s.id === i.supplier_id);
          return (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4">
              <div>
                <p className="text-sm font-bold text-ink">{i.name} {i.is_active ? "" : <span className="text-[10px] text-ink-light">(nonaktif)</span>}</p>
                <p className="text-xs text-ink-light">
                  {i.category === "KONSINYASI_KUE" ? `${sup ? `${sup.name}` : ""}` : i.category === "MINUMAN_OWNER" ? "Minuman Owner" : "Ayam Penyet"} ·
                </p>
                <p className="text-xs text-ink-light">Beli {formatNumber(i.cost_price)} · </p>
                <p className="text-xs text-ink-light">Jual {formatNumber(i.selling_price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(i)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
                <button onClick={() => handleToggle(i.id, i.is_active)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">{i.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
                <button onClick={() => handleDelete(i.id)} className="rounded-lg border border-ruled px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Hapus</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Bottomsheet / Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={closeEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit item"
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink">Edit Item</h3>
              <button onClick={closeEdit} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup">
                Tutup
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Nama Item</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Jenis</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as ItemType })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
                    <option value="KONSINYASI_KUE">Kue Konsinyasi</option>
                    <option value="MINUMAN_OWNER">Minuman Owner</option>
                    <option value="AYAM_PENYET">Ayam Penyet</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-light mb-1">Supplier (kosongkan untuk minuman owner)</label>
                <select value={editForm.supplier_id} onChange={(e) => setEditForm({ ...editForm, supplier_id: e.target.value })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
                  <option value="">— Tanpa Supplier —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Harga Modal</label>
                  <FormattedNumberInput value={editForm.cost_price} onChange={(raw) => setEditForm({ ...editForm, cost_price: raw })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Harga Jual</label>
                  <FormattedNumberInput value={editForm.selling_price} onChange={(raw) => setEditForm({ ...editForm, selling_price: raw })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">Update</button>
                <button type="button" onClick={closeEdit} className="rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
