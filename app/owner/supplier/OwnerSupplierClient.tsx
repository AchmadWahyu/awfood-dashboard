"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { createSupplier, updateSupplier, toggleSupplierActive, deleteSupplier, getSuppliers } from "./actions";
import type { Supplier } from "./actions";
import { getItemsBySupplier } from "../items/actions";
import type { Item } from "../items/actions";
import { formatRp } from "@/lib/utils/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function OwnerSupplierClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredSuppliers = useMemo(() => {
    if (!debouncedQuery.trim()) return suppliers;
    const q = debouncedQuery.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [suppliers, debouncedQuery]);

  // Add form (inline)
  const [addForm, setAddForm] = useState({ name: "", phone: "" });

  // Edit form (bottomsheet/modal)
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", phone: "" });

  // Detail bottomsheet
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [detailItems, setDetailItems] = useState<Item[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const openDetail = async (s: Supplier) => {
    setDetailSupplier(s);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const items = await getItemsBySupplier(s.id);
      setDetailItems(items);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat item supplier.");
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailSupplier(null);
    setDetailItems([]);
  }, []);

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
      closeDetail();
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
      closeDetail();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus supplier.");
    } finally {
      setConfirmId(null);
    }
  };

  // Escape to close sheets
  useEffect(() => {
    if (!editOpen && !detailOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editOpen) closeEdit();
        else if (detailOpen) closeDetail();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [editOpen, detailOpen, closeEdit, closeDetail]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Master Data Supplier</h2>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-light/60">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari supplier..."
          className="w-full rounded-xl border-2 border-ruled bg-paper-light py-2.5 pl-10 pr-10 text-sm text-ink outline-none placeholder:text-ink-light/50 focus:border-marker transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
            aria-label="Hapus pencarian"
          >
            <XIcon />
          </button>
        )}
      </div>

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

      {/* List — clickable cards */}
      <div className="space-y-2">
        {filteredSuppliers.length === 0 ? (
          <p className="text-sm text-ink-light py-6 text-center">Tidak ada supplier yang cocok.</p>
        ) : (
          filteredSuppliers.map((s) => (
          <button
            key={s.id}
            onClick={() => openDetail(s)}
            className="w-full text-left rounded-xl border border-notch-border bg-paper-light p-4 hover:bg-paper transition-colors"
          >
            <p className="text-sm font-bold text-ink">{s.name} {s.is_active ? "" : <span className="text-[10px] text-ink-light">(nonaktif)</span>}</p>
            {s.phone_number && <p className="text-xs text-ink-light">{s.phone_number}</p>}
          </button>
        ))
        )}
      </div>

      {/* Detail Bottomsheet / Modal */}
      {detailOpen && detailSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail supplier ${detailSupplier.name}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink">{detailSupplier.name}</h3>
              <button onClick={closeDetail} className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors" aria-label="Tutup">
                Tutup
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-ink-light">
              {detailSupplier.phone_number && <span>{detailSupplier.phone_number}</span>}
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${detailSupplier.is_active ? "bg-notch-success text-notch-success-text" : "bg-ruled/30 text-ink-light"}`}>
                {detailSupplier.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => { closeDetail(); openEdit(detailSupplier); }} className="rounded-lg border border-notch-border px-3 py-1.5 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
              <button onClick={() => handleToggle(detailSupplier.id, detailSupplier.is_active)} className="rounded-lg border border-notch-border px-3 py-1.5 text-xs text-ink-light hover:bg-paper transition-colors">{detailSupplier.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
              <button onClick={() => handleDelete(detailSupplier.id)} className="rounded-lg border border-ruled px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">Hapus</button>
            </div>

            {/* Items */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-ink-light uppercase tracking-wide">Daftar Kue</h4>
              {detailLoading ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-notch-border bg-paper-light p-3 space-y-2">
                      <div className="h-4 w-32 bg-ruled rounded" />
                      <div className="h-3 w-48 bg-ruled rounded" />
                    </div>
                  ))}
                </div>
              ) : detailItems.length === 0 ? (
                <p className="text-sm text-ink-light py-4 text-center">Tidak ada kue dari supplier ini.</p>
              ) : (
                detailItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-notch-border bg-paper-light p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.is_active ? "bg-notch-success text-notch-success-text" : "bg-ruled/30 text-ink-light"}`}>
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-ink-light">
                      <span>Modal: <strong className="text-ink tabular-nums">{formatRp(item.cost_price)}</strong></span>
                      <span>Jual: <strong className="text-ink tabular-nums">{formatRp(item.selling_price)}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
