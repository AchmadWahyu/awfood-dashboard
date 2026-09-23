"use client";

import { useState, useTransition } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatRp } from "@/lib/utils/format";
import { todayJakarta } from "@/lib/utils/date";
import Link from "next/link";
import type { DashboardData } from "./actions";
import { getDashboardData } from "./actions";

interface Props {
  initialData: DashboardData;
  initialDate?: string;
}

function computeTrendLine(data: { date: string; omzet: number }[]) {
  const n = data.length;
  if (n === 0) return data.map((d) => ({ ...d, trendLine: d.omzet }));

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].omzet;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return data.map((d, i) => ({
    ...d,
    trendLine: Math.max(0, Math.round(slope * i + intercept)),
  }));
}

function formatDateLabel(dateStr: string): string {
  const today = todayJakarta();
  if (dateStr === today) return "Hari Ini";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function OwnerDashboardClient({ initialData, initialDate }: Props) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayJakarta());
  const [isPending, startTransition] = useTransition();
  const [trendRange, setTrendRange] = useState<7 | 30>(7);

  const rawTrend = trendRange === 7 ? data.trend7 : data.trend30;
  const trend = computeTrendLine(rawTrend);
  const dateLabel = formatDateLabel(selectedDate);

  async function handleDateChange(date: string) {
    setSelectedDate(date);
    startTransition(async () => {
      const newData = await getDashboardData(date);
      setData(newData);
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Dashboard Overview</h2>

      {/* Date Picker */}
      <div className="rounded-2xl border border-notch-border bg-paper-light p-4 shadow-sm">
        <label className="block text-xs text-ink-light mb-1.5">Pilih Tanggal</label>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            max={todayJakarta()}
            className="rounded-xl border border-notch-border bg-paper-light px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marker/30"
          />
        </div>
      </div>

      {/* Alerts — always visible */}
      {(data.pendingCount > 0 || data.openDiscrepancyCount > 0) && (
        <div className="rounded-2xl border border-marker/30 bg-marker-light/40 p-4 space-y-2">
          <h3 className="text-sm font-bold text-marker">⚠️ Pending Action</h3>
          {data.pendingCount > 0 && (
            <Link href="/owner/verifikasi" className="block text-xs text-ink hover:underline">
              {data.pendingCount} closing menunggu verifikasi
            </Link>
          )}
          {data.openDiscrepancyCount > 0 && (
            <Link href="/owner/selisih" className="block text-xs text-ink hover:underline">
              {data.openDiscrepancyCount} selisih terbuka memerlukan investigasi
            </Link>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isPending ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
              <p className="text-xs text-ink-light">Omzet {dateLabel}</p>
              <p className="text-2xl font-bold text-marker">{formatRp(data.todayOmzet)}</p>
              <p className="text-xs text-ink-light mt-1">Closing terverifikasi {dateLabel.toLowerCase()}</p>
            </div>
            <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
              <p className="text-xs text-ink-light">Kas Fisik {dateLabel}</p>
              <p className="text-2xl font-bold text-ink">{formatRp(data.todayCash)}</p>
              <p className="text-xs text-ink-light mt-1">Closing terverifikasi {dateLabel.toLowerCase()}</p>
            </div>
            <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
              <p className="text-xs text-ink-light">QRIS {dateLabel}</p>
              <p className="text-2xl font-bold text-ink">{formatRp(data.todayQris)}</p>
              <p className="text-xs text-ink-light mt-1">Closing terverifikasi {dateLabel.toLowerCase()}</p>
            </div>
          </>
        )}
        {/* Selisih — always visible */}
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <p className="text-xs text-ink-light">Selisih Terbuka</p>
          <p className="text-2xl font-bold text-marker">{data.openDiscrepancyCount}</p>
          <p className="text-xs text-ink-light mt-1">Kasus butuh investigasi</p>
        </div>
      </div>

      {/* Trend & Top 5 — always visible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">Tren Omzet</h3>
            <div className="flex rounded-lg border border-notch-border overflow-hidden">
              <button
                onClick={() => setTrendRange(7)}
                className={`px-3 py-1 text-xs font-medium ${trendRange === 7 ? "bg-marker text-white" : "bg-paper text-ink-light"}`}
              >
                7H
              </button>
              <button
                onClick={() => setTrendRange(30)}
                className={`px-3 py-1 text-xs font-medium ${trendRange === 30 ? "bg-marker text-white" : "bg-paper text-ink-light"}`}
              >
                30H
              </button>
            </div>
          </div>
          {trend.every((t) => t.omzet === 0) ? (
            <p className="text-xs text-ink-light">Belum ada data penjualan.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b6b6b" }} axisLine={{ stroke: "#e8e4dc" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6b6b6b" }} axisLine={{ stroke: "#e8e4dc" }} tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatRp(Number(value)), "Omzet"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e8e4dc", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="omzet" stroke="#A0522D" strokeWidth={2} dot={{ r: 3, fill: "#A0522D" }} activeDot={{ r: 5 }} />
                <Line type="linear" dataKey="trendLine" stroke="#6b6b6b" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 */}
        <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm">
          <h3 className="text-sm font-bold text-ink mb-4">Top 5 Item Terlaris 30 Hari Terakhir</h3>
          {data.top5Last30.length === 0 ? (
            <p className="text-xs text-ink-light">Belum ada data penjualan 30 hari terakhir.</p>
          ) : (
            <div className="space-y-3">
              {data.top5Last30.map((item, idx) => (
                <div key={item.item_id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marker text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink truncate" title={item.item_name}>{item.item_name}</p>
                    <p className="text-xs text-ink-light">{formatRp(item.total)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-marker tabular-nums">{item.sold} pcs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 animate-pulse">
      <div className="h-3 w-24 bg-ruled rounded" />
      <div className="h-8 w-32 bg-ruled rounded" />
      <div className="h-2.5 w-40 bg-ruled rounded" />
    </div>
  );
}
