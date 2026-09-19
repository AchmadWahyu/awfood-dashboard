"use server";
import { createClient } from "@/lib/supabase/server";

export async function getNavBadgeCounts() {
  const supabase = await createClient();
  const [{ count: pendingCount }, { data: openDiscs }] = await Promise.all([
    supabase.from("daily_closings").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("daily_closings").select("cash_discrepancy").eq("discrepancy_status", "open"),
  ]);
  const openDiscrepancyCount = (openDiscs || [])
    .filter((d) => Math.abs(Number(d.cash_discrepancy) || 0) > 5000).length;
  return { pendingCount: pendingCount || 0, openDiscrepancyCount };
}
