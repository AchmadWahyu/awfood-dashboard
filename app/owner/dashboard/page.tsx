"use client";

import { useState, useMemo } from "react";
import { useSyncStorage } from "@/lib/dummy/sync";
import { getClosings, getItems, getPendingRequestEdits } from "@/lib/dummy/api";
import { todayLocal } from "@/lib/utils/date";
import { formatRp } from "@/lib/utils/format";
import Link from "next/link";

export default function OwnerDashboardPage() {
  const [version, setVersion] = useState(0);
  useSyncStorage(() => setVersion((v) => v + 1));
  const closings = useMemo(() => getClosings(), [version]);
  const items = useMemo(() => getItems(), [version]);
  const pendingEdits = useMemo(() => getPendingRequestEdits(), [version]);

  const today = todayLocal();
  const todayClosing = closings.find((c) => c.date === today);

  const totalOmzet = closings.reduce((sum, c) => sum + (c.total_omzet || 0), 0);
  const totalCash = closings.reduce((sum, c) => sum + (c.cash_physical || 0), 0);
  const totalQris = closings.reduce((sum, c) => sum + (c.qris_verified || 0), 0);

  const openDiscrepancies = closings.filter((c) => c.discrepancy_status === "open");

  // 7 days trend
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const trend = last7.map((date) => {
    const c = closings.find((x) => x.date === date);
    return { date: date.slice(5), omzet: c?.total_omzet || 0 };
  });
  const maxTrend = Math.max(...trend.map((t) => t.omzet), 1);

  // Top 5 items
  const itemMap = new Map<string, number>();
  closings.forEach((c) => c.items.forEach((i) => itemMap.set(i.item_id, (itemMap.get(i.item_id) || 0) + i.terjual)));
  const top5 = Array.from(itemMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Dashboard Overview</h2>

      {/* Alerts */}
      {(pendingEdits.length > 0 || openDiscrepancies.length > 0) && (
        <div className="rounded-2xl border border-marker/30 bg-marker-light/40 p-4 space-y-2">
          <h3 className="text-sm font-bold text-marker">⚠️ Pending Action</h3>
          {/* Request Edit — dinonaktifkan di first release */}
          {/* {pendingEdits.length > 0 && (
            <Link href="/owner/request-edit" className="block text-xs text-ink hover:underline">{pendingEdits.length} request edit menunggu approval</Link>
          )} */}
          {openDiscrepancies.length > 0 && (
            <Link href="/owner/selisih" className="block text-xs text-ink hover:underline">{openDiscrepancies.length} selisih terbuka memerlukan investigasi</Link>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-xs text-ink-light">Total Omzet</p>
          <p className="text-2xl font-bold text-marker">{formatRp(totalOmzet)}</p>
          <p className="text-[10px] text-ink-light mt-1">Semua periode</p>
        </div>
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-xs text-ink-light">Kas Fisik (terverifikasi)</p>
          <p className="text-2xl font-bold text-ink">{formatRp(totalCash)}</p>
          <p className="text-[10px] text-ink-light mt-1">Dari closing terverifikasi</p>
        </div>
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-xs text-ink-light">QRIS Terverifikasi</p>
          <p className="text-2xl font-bold text-ink">{formatRp(totalQris)}</p>
          <p className="text-[10px] text-ink-light mt-1">Dari closing terverifikasi</p>
        </div>
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-xs text-ink-light">Selisih Terbuka</p>
          <p className="text-2xl font-bold text-marker">{openDiscrepancies.length}</p>
          <p className="text-[10px] text-ink-light mt-1">Kasus butuh investigasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <h3 className="text-sm font-bold text-ink mb-4">Tren Omzet 7 Hari</h3>
          {trend.every((t) => t.omzet === 0) ? (
            <p className="text-xs text-ink-light">Belum ada data penjualan.</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {trend.map((t) => (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-marker/80 hover:bg-marker transition-colors"
                    style={{ height: `${(t.omzet / maxTrend) * 100}%`, minHeight: 4 }}
                    title={formatRp(t.omzet)}
                  />
                  <span className="text-[10px] text-ink-light">{t.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 */}
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <h3 className="text-sm font-bold text-ink mb-4">Top 5 Item Terlaris</h3>
          {top5.length === 0 ? (
            <p className="text-xs text-ink-light">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {top5.map(([itemId, qty], idx) => (
                <div key={itemId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-marker text-white text-[10px] font-bold">{idx + 1}</span>
                    <span className="text-ink">{items.find((i) => i.id === itemId)?.name || itemId}</span>
                  </div>
                  <span className="font-bold text-marker">{qty} pcs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
