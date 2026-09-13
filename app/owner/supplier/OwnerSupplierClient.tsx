"use client";

import { useState } from "react";
import { createSupplier, updateSupplier, toggleSupplierActive, deleteSupplier, getSuppliers } from "./actions";
import type { Supplier } from "./actions";

export default function OwnerSupplierClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const refresh = async () => {
    const data = await getSuppliers();
    setSuppliers(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("phone", form.phone || "");
    await createSupplier(fd);
    setForm({ name: "", phone: "" });
    await refresh();
  };

  const handleEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({ name: s.name, phone: s.phone_number || "" });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("phone", form.phone || "");
    fd.append("is_active", "true");
    await updateSupplier(editId, fd);
    setEditId(null);
    setForm({ name: "", phone: "" });
    await refresh();
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await toggleSupplierActive(id, !is_active);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus supplier ini?")) return;
    await deleteSupplier(id);
    await refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Master Data Supplier</h2>
      <form onSubmit={editId ? handleUpdate : handleAdd} className=" rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-md">
        <div>
          <label className="block text-xs text-ink-light mb-1">Nama Supplier</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
        </div>
        <div>
          <label className="block text-xs text-ink-light mb-1">Telepon (opsional)</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">{editId ? "Update" : "Tambah"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", phone: "" }); }} className="rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Batal</button>}
        </div>
      </form>

      <div className="space-y-2">
        {suppliers.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4">
            <div>
              <p className="text-sm font-bold text-ink">{s.name} {s.is_active ? "" : <span className="text-[10px] text-ink-light">(nonaktif)</span>}</p>
              {s.phone_number && <p className="text-xs text-ink-light">{s.phone_number}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleEdit(s)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
              <button onClick={() => handleToggle(s.id, s.is_active)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">{s.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
              <button onClick={() => handleDelete(s.id)} className="rounded-lg border border-ruled px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}