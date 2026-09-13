"use client";

import { useState, useMemo } from "react";
import { getUsers, addUser, updateUser, removeUser } from "@/lib/dummy/api";
import type { User } from "@/lib/dummy/types";

export default function OwnerKaryawanPage() {
  const [users, setUsers] = useState<User[]>(getUsers);
  const [form, setForm] = useState({ full_name: "", staff_code: "", pin: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const refresh = () => setUsers(getUsers());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.staff_code.trim().toUpperCase();
    const email = `staff-${code}@app.awfood.local`;
    addUser({
      id: crypto.randomUUID(),
      email,
      full_name: form.full_name,
      role: "STAFF",
      staff_code: code,
      pin: form.pin,
      created_at: new Date().toISOString(),
    });
    setForm({ full_name: "", staff_code: "", pin: "" });
    refresh();
  };

  const handleEdit = (u: User) => {
    setEditId(u.id);
    setForm({ full_name: u.full_name, staff_code: u.staff_code || "", pin: u.pin || "" });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    updateUser(editId, { full_name: form.full_name, staff_code: form.staff_code.trim().toUpperCase(), pin: form.pin });
    setEditId(null);
    setForm({ full_name: "", staff_code: "", pin: "" });
    refresh();
  };

  const handleRemove = (id: string) => {
    removeUser(id);
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Manage Karyawan</h2>
      <form onSubmit={editId ? handleUpdate : handleAdd} className=" rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-md">
        <div>
          <label className="block text-xs text-ink-light mb-1">Nama Lengkap</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Kode Staff</label>
            <input value={form.staff_code} onChange={(e) => setForm({ ...form, staff_code: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">PIN (4 digit)</label>
            <input type="password" inputMode="numeric" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">{editId ? "Update" : "Tambah"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ full_name: "", staff_code: "", pin: "" }); }} className="rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Batal</button>}
        </div>
      </form>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4">
            <div>
              <p className="text-sm font-bold text-ink">{u.full_name} <span className="text-[10px] text-ink-light font-normal">({u.role})</span></p>
              <p className="text-xs text-ink-light">{u.email} {u.staff_code && `· ${u.staff_code}`}</p>
            </div>
            <div className="flex items-center gap-2">
              {u.role === "STAFF" && (
                <>
                  <button onClick={() => handleEdit(u)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Edit</button>
                  <button onClick={() => handleRemove(u.id)} className="rounded-lg border border-notch-border px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Hapus</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
