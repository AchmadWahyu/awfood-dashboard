"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Supplier {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  supplier_id: string | null;
  category: string;
  cost_price: number;
  selling_price: number;
}

export interface ClosingItem {
  item_id: string;
  opening_stock: number;
  ending_stock: number;
  sold: number;
  total: number;
}

export interface ClosingRecord {
  id: string;
  date: string;
  status: string;
  total_omzet: number;
  cash_physical: number;
  cash_initial: number;
  qris_verified: number | null;
  discrepancy: number | null;
  discrepancy_status: string | null;
  created_at: string;
}

export async function getSuppliersForClosing(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getItemsForClosing(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_items")
    .select("id, name, supplier_id, category, cost_price, selling_price")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBeverageItemsForClosing(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_items")
    .select("id, name, supplier_id, category, cost_price, selling_price")
    .eq("category", "MINUMAN_OWNER")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRestocksForItem(itemId: string, date: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restocks")
    .select("quantity")
    .eq("item_id", itemId)
    .lte("restock_date", date);
  if (error) throw new Error(error.message);
  return data?.reduce((sum, r) => sum + r.quantity, 0) ?? 0;
}

export async function getClosingsByDate(date: string): Promise<ClosingRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("closing_date", date)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface ClosingItemRecord {
  id: string;
  closing_id: string;
  item_id: string;
  initial_stock: number;
  restock_stock: number;
  remaining_stock: number;
  created_at: string;
}

export async function getClosingItems(closingId: string): Promise<ClosingItemRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_closing_items")
    .select("*")
    .eq("closing_id", closingId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface ClosingSummaryItem {
  item_id: string;
  item_name: string;
  supplier_name: string;
  supplier_id: string | null;
  initial_stock: number;
  remaining_stock: number;
  sold: number;
  total: number;
}

export async function getClosingWithItems(closingId: string): Promise<{ closing: ClosingRecord; items: ClosingSummaryItem[] } | null> {
  const supabase = await createClient();

  const { data: closing, error: closingError } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("id", closingId)
    .single();

  if (closingError || !closing) return null;

  const { data: closingItems, error: itemsError } = await supabase
    .from("daily_closing_items")
    .select("*")
    .eq("closing_id", closingId);

  if (itemsError) throw new Error(itemsError.message);

  const { data: masterItems, error: masterItemsError } = await supabase
    .from("master_items")
    .select("id, name, supplier_id, selling_price, cost_price")
    .in("id", (closingItems || []).map((ci) => ci.item_id));

  if (masterItemsError) throw new Error(masterItemsError.message);

  const { data: suppliers, error: suppliersError } = await supabase
    .from("suppliers")
    .select("id, name")
    .in("id", (masterItems || []).map((mi) => mi.supplier_id).filter(Boolean));

  if (suppliersError) throw new Error(suppliersError.message);

  const itemsMap = new Map((masterItems || []).map((i) => [i.id, i]));
  const suppliersMap = new Map((suppliers || []).map((s) => [s.id, s]));

  const summaryItems: ClosingSummaryItem[] = (closingItems || []).map((ci) => {
    const masterItem = itemsMap.get(ci.item_id);
    const sold = ci.sold_quantity || (ci.initial_stock + ci.restock_stock) - ci.remaining_stock;
    const unitPrice = Number(masterItem?.selling_price || 0);
    return {
      item_id: ci.item_id,
      item_name: masterItem?.name || "Unknown",
      supplier_name: suppliersMap.get(masterItem?.supplier_id)?.name || "Minuman Milik Sendiri",
      supplier_id: masterItem?.supplier_id || null,
      initial_stock: ci.initial_stock,
      remaining_stock: ci.remaining_stock,
      sold,
      total: sold * unitPrice,
    };
  });

  return {
    closing: {
      id: closing.id,
      date: closing.closing_date,
      status: closing.status,
      total_omzet: Number(closing.total_system_omzet) || 0,
      cash_physical: Number(closing.cash_physical) || 0,
      cash_initial: Number(closing.cash_initial) || 0,
      qris_verified: closing.qris_physical ? Number(closing.qris_physical) : null,
      discrepancy: closing.cash_discrepancy ? Number(closing.cash_discrepancy) : null,
      discrepancy_status: closing.discrepancy_status,
      created_at: closing.created_at,
    },
    items: summaryItems,
  };
}

export async function submitClosing(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const date = formData.get("date") as string;
  const cashPhysical = parseInt(formData.get("cash_physical") as string) || 0;
  const itemsJson = formData.get("items") as string;
  const items: ClosingItem[] = JSON.parse(itemsJson);

  // Check if closing already exists for this date
  const { data: existingClosing } = await supabase
    .from("daily_closings")
    .select("id, status")
    .eq("closing_date", date)
    .maybeSingle();

  if (existingClosing) {
    throw new Error(`Closing untuk tanggal ${date} sudah ada. Status: ${existingClosing.status}`);
  }

  const totalOmzet = items.reduce((sum, i) => sum + i.total, 0);

  const { data: closing, error: closingError } = await supabase
    .from("daily_closings")
    .insert({
      closing_date: date,
      staff_id: user.id,
      cash_initial: 0,
      cash_physical: cashPhysical,
      qris_physical: 0,
      total_system_omzet: totalOmzet,
      cash_discrepancy: 0,
      status: "submitted",
      notes: null,
    })
    .select()
    .single();

  if (closingError) throw new Error(closingError.message);

  const closingItems = [];
  for (const item of items) {
    const restockQty = await getRestocksForItem(item.item_id, date);
    closingItems.push({
      closing_id: closing.id,
      item_id: item.item_id,
      initial_stock: item.opening_stock,
      restock_stock: restockQty,
      remaining_stock: item.ending_stock,
    });
  }

  const { error: itemsError } = await supabase
    .from("daily_closing_items")
    .insert(closingItems);

  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/employee/penutupan");

  return { success: true, closingId: closing.id };
}
