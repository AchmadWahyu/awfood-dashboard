"use client";

import { useState, useMemo } from "react";
import { getSuppliers, addSupplier, updateSupplier, removeSupplier } from "@/lib/dummy/api";
import type { Supplier } from "@/lib/dummy/types";

export default function OwnerSupplierPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(getSuppliers);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const refresh = () => setSuppliers(getSuppliers());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addSupplier({
      id: crypto.randomUUID(),
      name: form.name,
      phone: form.phone || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    });
    setForm({ name: "", phone: "" });
    refresh();
  };

  const handleEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({ name: s.name, phone: s.phone || "" });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    updateSupplier(editId, { name: form.name, phone: form.phone || undefined });
    setEditId(null);
    setForm({ name: "", phone: "" });
    refresh();
  };

  const toggleActive = (s: Supplier) => {
    updateSupplier(s.id, { is_active: !s.is_active });
    refresh();
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
              {s.phone && <p className="text-xs text-ink-light">{s.phone}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleEdit(s)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
              <button onClick={() => toggleActive(s)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">{s.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
