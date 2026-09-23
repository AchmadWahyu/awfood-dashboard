"use client";

import { useState, useEffect, startTransition } from "react";
import { useSyncStorage } from "@/lib/dummy/sync";
import { getClaims, updateClaim, getItems } from "@/lib/dummy/api";
import type { Claim } from "@/lib/dummy/types";

const TYPE_LABEL: Record<string, string> = {
  rusak: "Rusak",
  basi: "Basi",
  bonus: "Bonus",
  konsumsi_internal: "Konsumsi Internal",
};

export default function OwnerKlaimPage() {
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));
  const [claims, setClaims] = useState<Claim[]>(() => getClaims().sort((a, b) => +new Date(b.requested_at) - +new Date(a.requested_at)));
  const items = getItems();
  const refresh = () => setClaims(getClaims().sort((a, b) => +new Date(b.requested_at) - +new Date(a.requested_at)));

  useEffect(() => {
    startTransition(refresh);
  }, [version]);

  const handle = (id: string, status: "approved" | "rejected") => {
    updateClaim(id, { status, approved_by: "owner-1", approved_at: new Date().toISOString() });
    refresh();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Approval Klaim Barang</h2>
      {claims.length === 0 ? (
        <p className="text-sm text-ink-light">Belum ada klaim.</p>
      ) : (
        <div className="space-y-2">
          {claims.map((c) => {
            const item = items.find((i) => i.id === c.item_id);
            return (
              <div key={c.id} className="rounded-xl border border-notch-border bg-paper-light p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-ink">{TYPE_LABEL[c.type]} — {c.qty} pcs</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${c.status === "pending" ? "bg-ruled/30 text-ink-light" : c.status === "approved" ? "bg-notch-success text-notch-success-text" : "bg-red-50 text-red-600"}`}>
                    {c.status === "pending" ? "Menunggu" : c.status === "approved" ? "Disetujui" : "Ditolak"}
                  </span>
                </div>
                <p className="text-xs text-ink-light">Item: {item?.name || c.item_id}</p>
                <p className="text-xs text-ink-light mt-0.5">{c.notes}</p>
                {c.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => handle(c.id, "approved")} className="rounded-lg bg-notch-success px-3 py-1 text-xs font-bold text-notch-success-text hover:opacity-80 transition-colors">Setujui</button>
                    <button onClick={() => handle(c.id, "rejected")} className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:opacity-80 transition-colors">Tolak</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
