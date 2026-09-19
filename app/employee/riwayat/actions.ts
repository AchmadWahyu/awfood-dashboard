"use server";

import { createClient } from "@/lib/supabase/server";
import type { DailyClosing, Item, Supplier, Expense } from "@/lib/dummy/types";

export async function getClosingsByStaff(): Promise<DailyClosing[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: closings, error } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("staff_id", user.id)
    .order("closing_date", { ascending: false });

  if (error) {
    console.error("Error fetching closings:", error);
    return [];
  }

  return (closings || []).map((c) => ({
    id: c.id,
    date: c.closing_date,
    staff_id: c.staff_id,
    staff_name: "",
    status: c.status?.toLowerCase() || "submitted",
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
    verified_by: null,
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

export async function getClosingDetail(closingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: closing, error } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("id", closingId)
    .eq("staff_id", user.id)
    .single();

  if (error || !closing) return null;

  const { data: items, error: itemsError } = await supabase
    .from("daily_closing_items")
    .select("*")
    .eq("closing_id", closingId);

  if (itemsError) {
    console.error("Error fetching closing items:", itemsError);
  }

  const { data: masterItems, error: masterItemsError } = await supabase
    .from("master_items")
    .select("*");

  if (masterItemsError) {
    console.error("Error fetching master items:", masterItemsError);
  }

  const itemsMap = new Map((masterItems || []).map((i) => [i.id, i]));
  const expenses = await getExpensesByDate(closing.closing_date);

  const closingItems = (items || []).map((ci) => {
    const masterItem = itemsMap.get(ci.item_id);
    if (!masterItem) return null;
    return {
      id: ci.id,
      item_id: ci.item_id,
      stok_awal: ci.initial_stock,
      stok_akhir: ci.remaining_stock,
      terjual: ci.sold_quantity || (ci.initial_stock + ci.restock_stock) - ci.remaining_stock,
      total_rp: ((ci.sold_quantity || (ci.initial_stock + ci.restock_stock) - ci.remaining_stock)) * Number(masterItem.selling_price),
      item: {
        id: masterItem.id,
        name: masterItem.name,
        supplier_id: masterItem.supplier_id,
         type: masterItem.category as Item["type"],
        price_buy: Number(masterItem.cost_price),
        price_sell: Number(masterItem.selling_price),
        is_active: masterItem.is_active,
        created_at: masterItem.created_at,
      },
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    id: closing.id,
    date: closing.closing_date,
    staff_id: closing.staff_id,
    staff_name: "",
    status: closing.status?.toLowerCase() || "submitted",
    items: closingItems,
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
    verified_by: null,
    verified_at: closing.verified_at,
    created_at: closing.created_at,
    updated_at: closing.updated_at,
    expenses_cash_snapshot: Number(closing.expenses_cash_snapshot) || 0,
    expenses_qris_snapshot: Number(closing.expenses_qris_snapshot) || 0,
    expenses,
  } as DailyClosing;
}

export async function getStaffName(staffId: string): Promise<string> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", staffId)
    .single();

  return profile?.full_name || "Unknown";
}

export async function getItems(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_items")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching items:", error);
    return [];
  }

  return (data || []).map((i) => ({
    id: i.id,
    name: i.name,
    supplier_id: i.supplier_id,
     type: i.category as Item["type"],
    price_buy: Number(i.cost_price),
    price_sell: Number(i.selling_price),
    is_active: i.is_active,
    created_at: i.created_at,
  }));
}

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone_number,
    is_active: s.is_active,
    created_at: s.created_at,
  }));
}
