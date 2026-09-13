"use server";

import { createClient } from "@/lib/supabase/server";
import { todayJakarta } from "@/lib/utils/date";

export interface DashboardData {
  pendingCount: number;
  openDiscrepancyCount: number;
  todayOmzet: number;
  todayCash: number;
  todayQris: number;
  todayDiscrepancyCount: number;
  trend7: { date: string; omzet: number }[];
  trend30: { date: string; omzet: number }[];
  top5Last30: { item_id: string; item_name: string; sold: number; total: number }[];
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatTrendDate(dateStr: string): string {
  return dateStr.slice(5);
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const today = todayJakarta();

  // Pending count
  const { count: pendingCount } = await supabase
    .from("daily_closings")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted");

  // Open discrepancies (ABS > 5000)
  const { data: openDiscrepancies } = await supabase
    .from("daily_closings")
    .select("cash_discrepancy")
    .eq("discrepancy_status", "open");

  const openDiscrepancyCount = (openDiscrepancies || []).filter(
    (d) => Math.abs(Number(d.cash_discrepancy) || 0) > 5000
  ).length;

  // Today's closing
  const { data: todayClosings } = await supabase
    .from("daily_closings")
    .select("total_system_omzet, cash_physical, qris_physical, cash_discrepancy, status")
    .eq("closing_date", today);

  const todayVerified = todayClosings?.find((c) => c.status === "verified");
  const todayOmzet = Number(todayVerified?.total_system_omzet) || 0;
  const todayCash = Number(todayVerified?.cash_physical) || 0;
  const todayQris = Number(todayVerified?.qris_physical) || 0;
  const todayDiscrepancyCount = todayVerified && Math.abs(Number(todayVerified.cash_discrepancy) || 0) > 5000 ? 1 : 0;

  // Trend 7 days
  const start7 = addDays(today, -6);
  const { data: trend7Data } = await supabase
    .from("daily_closings")
    .select("closing_date, total_system_omzet")
    .gte("closing_date", start7)
    .lte("closing_date", today)
    .order("closing_date", { ascending: true });

  const trend7Map = new Map((trend7Data || []).map((d) => [d.closing_date, Number(d.total_system_omzet) || 0]));
  const trend7 = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDays(start7, i);
    return { date: formatTrendDate(dateStr), omzet: trend7Map.get(dateStr) || 0 };
  });

  // Trend 30 days
  const start30 = addDays(today, -29);
  const { data: trend30Data } = await supabase
    .from("daily_closings")
    .select("closing_date, total_system_omzet")
    .gte("closing_date", start30)
    .lte("closing_date", today)
    .order("closing_date", { ascending: true });

  const trend30Map = new Map((trend30Data || []).map((d) => [d.closing_date, Number(d.total_system_omzet) || 0]));
  const trend30 = Array.from({ length: 30 }, (_, i) => {
    const dateStr = addDays(start30, i);
    return { date: formatTrendDate(dateStr), omzet: trend30Map.get(dateStr) || 0 };
  });

  // Top 5 last 30 days
  const { data: last30ClosingIds } = await supabase
    .from("daily_closings")
    .select("id")
    .gte("closing_date", start30)
    .lte("closing_date", today);

  const closingIds = last30ClosingIds?.map((c) => c.id) || [];
  let top5Last30: DashboardData["top5Last30"] = [];

  if (closingIds.length > 0) {
    const [{ data: itemsData }, { data: masterItemsData }] = await Promise.all([
      supabase
        .from("daily_closing_items")
        .select("item_id, sold_quantity")
        .in("closing_id", closingIds),
      supabase
        .from("master_items")
        .select("id, name, selling_price"),
    ]);

    const priceMap = new Map(
      (masterItemsData || []).map((i) => [i.id, { name: i.name, price: Number(i.selling_price) || 0 }])
    );

    const itemMap = new Map<string, { sold: number; name: string; price: number }>();
    (itemsData || []).forEach((row) => {
      const master = priceMap.get(row.item_id);
      const sold = Number(row.sold_quantity) || 0;
      const existing = itemMap.get(row.item_id);
      if (existing) {
        existing.sold += sold;
      } else {
        itemMap.set(row.item_id, {
          sold,
          name: master?.name || "Unknown",
          price: master?.price || 0,
        });
      }
    });

    top5Last30 = Array.from(itemMap.entries())
      .map(([item_id, data]) => ({
        item_id,
        item_name: data.name,
        sold: data.sold,
        total: data.sold * data.price,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }

  return {
    pendingCount: pendingCount || 0,
    openDiscrepancyCount,
    todayOmzet,
    todayCash,
    todayQris,
    todayDiscrepancyCount,
    trend7,
    trend30,
    top5Last30,
  };
}
