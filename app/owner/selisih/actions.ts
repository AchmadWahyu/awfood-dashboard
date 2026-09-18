"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DailyClosing, Expense } from "@/lib/dummy/types";
import { getItems } from "@/app/employee/riwayat/actions";

export async function getClosingsWithDiscrepancy(): Promise<DailyClosing[]> {
  const supabase = await createClient();

  const { data: closings, error } = await supabase
    .from("daily_closings")
    .select(`
      *,
      staff:staff_id(full_name)
    `)
    .eq("status", "verified")
    .neq("cash_discrepancy", 0)
    .order("closing_date", { ascending: false });

  if (error) {
    console.error("Error fetching closings with discrepancy:", error);
    return [];
  }

  return (closings || []).map((c) => ({
    id: c.id,
    date: c.closing_date,
    staff_id: c.staff_id,
    staff_name: c.staff?.full_name || "",
    status: (c.status?.toLowerCase() || "submitted") as DailyClosing["status"],
    items: [],
    total_omzet: Number(c.total_system_omzet) || 0,
    cash_initial: Number(c.cash_initial) || 0,
    cash_physical: Number(c.cash_physical) || 0,
    qris_verified: c.qris_physical ? Number(c.qris_physical) : null,
    qris_verified_by: null,
    qris_verified_at: null,
    discrepancy: c.cash_discrepancy ? Number(c.cash_discrepancy) : null,
    discrepancy_status: c.discrepancy_status?.toLowerCase() || null,
    discrepancy_resolution: c.discrepancy_resolution?.toLowerCase() || null,
    discrepancy_note: c.notes,
    verified_by: c.verified_by,
    verified_at: c.verified_at,
    created_at: c.created_at,
    updated_at: c.updated_at,
    expenses_cash_snapshot: Number(c.expenses_cash_snapshot) || 0,
    expenses_qris_snapshot: Number(c.expenses_qris_snapshot) || 0,
  }));
}

async function getExpensesByDate(date: string): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("expense_date", date)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }

  return (data || []).map((e) => ({
    id: e.id,
    category: e.category,
    custom_label: e.custom_label || undefined,
    amount: Number(e.amount) || 0,
    pocket: e.pocket,
    date: e.expense_date,
    note: e.note || undefined,
    created_by: e.created_by,
    created_at: e.created_at,
  }));
}

export async function getClosingDetail(closingId: string): Promise<DailyClosing | null> {
  const supabase = await createClient();

  const { data: closing, error } = await supabase
    .from("daily_closings")
    .select(`
      *,
      staff:staff_id(full_name)
    `)
    .eq("id", closingId)
    .single();

  if (error || !closing) {
    console.error("Error fetching closing detail:", error);
    return null;
  }

  const { data: closingItems, error: itemsError } = await supabase
    .from("daily_closing_items")
    .select("*")
    .eq("closing_id", closingId);

  if (itemsError) {
    console.error("Error fetching closing items:", itemsError);
  }

  const [items, expenses] = await Promise.all([
    getItems(),
    getExpensesByDate(closing.closing_date),
  ]);

  const itemsMap = new Map(items.map((i) => [i.id, i]));

  const closingItemsData = (closingItems || []).map((ci) => {
    const masterItem = itemsMap.get(ci.item_id);
    if (!masterItem) return null;
    const sold = ci.sold_quantity || (ci.initial_stock + ci.restock_stock) - ci.remaining_stock;
    return {
      id: ci.id,
      item_id: ci.item_id,
      stok_awal: ci.initial_stock,
      stok_akhir: ci.remaining_stock,
      terjual: sold,
      total_rp: sold * Number(masterItem.price_sell),
      item: masterItem,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    id: closing.id,
    date: closing.closing_date,
    staff_id: closing.staff_id,
    staff_name: closing.staff?.full_name || "",
    status: (closing.status?.toLowerCase() || "submitted") as DailyClosing["status"],
    items: closingItemsData,
    total_omzet: Number(closing.total_system_omzet) || 0,
    cash_initial: Number(closing.cash_initial) || 0,
    cash_physical: Number(closing.cash_physical) || 0,
    qris_verified: closing.qris_physical ? Number(closing.qris_physical) : null,
    qris_verified_by: null,
    qris_verified_at: null,
    discrepancy: closing.cash_discrepancy ? Number(closing.cash_discrepancy) : null,
    discrepancy_status: closing.discrepancy_status?.toLowerCase() || null,
    discrepancy_resolution: closing.discrepancy_resolution?.toLowerCase() || null,
    discrepancy_note: closing.notes,
    verified_by: closing.verified_by,
    verified_at: closing.verified_at,
    created_at: closing.created_at,
    updated_at: closing.updated_at,
    expenses_cash_snapshot: Number(closing.expenses_cash_snapshot) || 0,
    expenses_qris_snapshot: Number(closing.expenses_qris_snapshot) || 0,
    expenses,
  };
}

export async function resolveDiscrepancy(formData: {
  closingId: string;
  resolution: "koreksi data" | "ditanggung usaha" | "ditanggung karyawan";
  note: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("daily_closings")
    .update({
      discrepancy_status: "resolved",
      discrepancy_resolution: formData.resolution,
      notes: formData.note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formData.closingId);

  if (error) throw new Error(error.message);

  revalidatePath("/owner/selisih");
  revalidatePath("/employee/riwayat");

  return { success: true };
}

export async function addDeduction(formData: {
  staffId: string;
  amount: number;
  reason: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("employee_deductions")
    .insert({
      staff_id: formData.staffId,
      amount: formData.amount,
      reason: formData.reason,
      is_settled: false,
    });

  if (error) throw new Error(error.message);

  revalidatePath("/owner/selisih");

  return { success: true };
}
