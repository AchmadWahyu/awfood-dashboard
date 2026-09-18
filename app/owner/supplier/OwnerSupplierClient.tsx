"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { createSupplier, updateSupplier, toggleSupplierActive, deleteSupplier, getSuppliers } from "./actions";
import type { Supplier } from "./actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function OwnerSupplierClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  
  // Add form (inline)
  const [addForm, setAddForm] = useState({ name: "", phone: "" });

  // Edit form (bottomsheet/modal)
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", phone: "" });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refresh = async () => {
    const data = await getSuppliers();
    setSuppliers(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    const fd = new FormData();
    fd.append("name", addForm.name);
    fd.append("phone", addForm.phone || "");
    try {
      await createSupplier(fd);
      toast.success("Supplier berhasil ditambahkan.");
      setAddForm({ name: "", phone: "" });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah supplier.");
    }
  };

  const openEdit = (s: Supplier) => {
    setEditForm({ id: s.id, name: s.name, phone: s.phone_number || "" });
    setEditOpen(true);
  };

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditForm({ id: "", name: "", phone: "" });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    const fd = new FormData();
    fd.append("name", editForm.name);
    fd.append("phone", editForm.phone || "");
    fd.append("is_active", "true");
    try {
      await updateSupplier(editForm.id, fd);
      toast.success("Supplier berhasil diperbarui.");
      closeEdit();
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui supplier.");
    }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await toggleSupplierActive(id, !is_active);
      toast.success("Status supplier diperbarui.");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui status supplier.");
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
      await deleteSupplier(confirmId);
      toast.success("Supplier berhasil dihapus.");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus supplier.");
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
      <h2 className="text-xl font-bold text-ink">Master Data Supplier</h2>
      
      {/* Add Form — inline */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-md">
        <div>
          <label className="block text-xs text-ink-light mb-1">Nama Supplier</label>
          <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
        </div>
        <div>
          <label className="block text-xs text-ink-light mb-1">Telepon (opsional)</label>
          <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">Tambah</button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2">
        {suppliers.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4">
            <div>
              <p className="text-sm font-bold text-ink">{s.name} {s.is_active ? "" : <span className="text-[10px] text-ink-light">(nonaktif)</span>}</p>
              {s.phone_number && <p className="text-xs text-ink-light">{s.phone_number}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(s)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
              <button onClick={() => handleToggle(s.id, s.is_active)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">{s.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
              <button onClick={() => handleDelete(s.id)} className="rounded-lg border border-ruled px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Hapus</button>
            </div>
          </div>
        ))}
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
            aria-label="Edit supplier"
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink">Edit Supplier</h3>
              <button onClick={closeEdit} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup">
                Tutup
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs text-ink-light mb-1">Nama Supplier</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
              </div>
              <div>
                <label className="block text-xs text-ink-light mb-1">Telepon (opsional)</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
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
        title="Hapus Supplier"
        description="Yakin ingin menghapus supplier ini? Aksi ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setConfirmId(null); }}
      />
    </div>
  );
}
