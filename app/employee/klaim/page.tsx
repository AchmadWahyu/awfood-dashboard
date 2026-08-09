"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useSyncStorage } from "@/lib/dummy/sync";
import { getActiveItems, getClosings, addClaim, getClaims } from "@/lib/dummy/api";
import type { ClaimType } from "@/lib/dummy/types";

const TYPES: { value: ClaimType; label: string }[] = [
  { value: "rusak", label: "Rusak" },
  { value: "basi", label: "Basi" },
  { value: "bonus", label: "Bonus" },
  { value: "konsumsi_internal", label: "Konsumsi Internal" },
];

export default function EmployeeKlaimPage() {
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));
  const { user } = useAuth();
  const items = useMemo(() => getActiveItems(), [version]);
  const closings = useMemo(() => getClosings().filter((c) => c.status !== "draft"), [version]);
  const [closingId, setClosingId] = useState("");
  const [itemId, setItemId] = useState("");
  const [type, setType] = useState<ClaimType>("rusak");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [ok, setOk] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClaim({
      id: crypto.randomUUID(),
      closing_id: closingId,
      item_id: itemId,
      type,
      qty: parseInt(qty) || 1,
      notes,
      status: "pending",
      requested_by: user!.id,
      requested_at: new Date().toISOString(),
      approved_by: null,
      approved_at: null,
    });
    setOk(true);
    setItemId("");
    setQty("1");
    setNotes("");
    setTimeout(() => setOk(false), 3000);
  };

  const myClaims = useMemo(() => getClaims().filter((c) => c.requested_by === user?.id).sort((a, b) => +new Date(b.requested_at) - +new Date(a.requested_at)), [user, version]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h2 className="text-lg font-bold text-ink">Klaim Barang</h2>
      <form onSubmit={handleSubmit} className=" rounded-2xl border border-notch-border bg-paper-light p-6 shadow-sm space-y-4">
        {ok && <div className="rounded-lg bg-notch-success px-3 py-2 text-sm text-notch-success-text">Klaim berhasil diajukan!</div>}
        <div>
          <label className="block text-xs text-ink-light mb-1">Closing</label>
          <select value={closingId} onChange={(e) => setClosingId(e.target.value)} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
            <option value="">Pilih tanggal closing</option>
            {closings.map((c) => <option key={c.id} value={c.id}>{c.date} — {c.staff_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-light mb-1">Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} required className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
            <option value="">Pilih item</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-light mb-1">Jenis</label>
            <select value={type} onChange={(e) => setType(e.target.value as ClaimType)} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Qty</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-light mb-1">Keterangan</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker" />
        </div>
        <button type="submit" className="w-full rounded-xl bg-marker px-4 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors">Ajukan Klaim</button>
      </form>

      <h3 className="text-sm font-bold text-ink">Riwayat Klaim Saya</h3>
      {myClaims.length === 0 ? (
        <p className="text-sm text-ink-light">Belum ada klaim.</p>
      ) : (
        <div className="space-y-2">
          {myClaims.map((c) => (
            <div key={c.id} className="rounded-xl border border-notch-border bg-paper-light p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{TYPES.find((t) => t.value === c.type)?.label} — {c.qty} pcs</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${c.status === "pending" ? "bg-ruled/30 text-ink-light" : c.status === "approved" ? "bg-notch-success text-notch-success-text" : "bg-red-50 text-red-600"}`}>
                  {c.status === "pending" ? "Menunggu" : c.status === "approved" ? "Disetujui" : "Ditolak"}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-light">{c.notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
