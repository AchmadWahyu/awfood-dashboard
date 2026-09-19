"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DailyClosing, ClosingItem, RequestEdit, Item } from "@/lib/dummy/types";
import { getItems } from "@/app/employee/riwayat/actions";

type RequestEditItemInput = Partial<ClosingItem> & {
  initial_stock?: number;
  remaining_stock?: number;
  sold_quantity?: number;
};

export async function getRequestEditsByStaff(): Promise<RequestEdit[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: requestEdits, error } = await supabase
    .from("audit_request_edits")
    .select("*")
    .eq("staff_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching request edits:", error);
    return [];
  }

  return (requestEdits || []).map((re) => {
    const itemsData = typeof re.changes === "string" ? JSON.parse(re.changes) : re.changes;
    const rawItems = Array.isArray(itemsData) ? itemsData : itemsData?.items;
    const parsedItems = (Array.isArray(rawItems) ? rawItems : []) as RequestEditItemInput[];
    const cashPhysical = !Array.isArray(itemsData) && typeof itemsData?.cash_physical === "number"
      ? itemsData.cash_physical
      : 0;
    
    return {
      id: re.id,
      closing_id: re.target_id,
      reason: re.reason,
      status: re.status?.toLowerCase() || "pending",
      requested_by: re.staff_id,
      requested_at: re.created_at,
      approved_by: re.approved_by ?? null,
      approved_at: re.approved_at ?? null,
      items: parsedItems.map((item, idx) => ({
        id: item.id || `item-${idx}`,
        item_id: item.item_id ?? "",
        stok_awal: item.stok_awal ?? item.initial_stock ?? 0,
        stok_akhir: item.stok_akhir ?? item.remaining_stock ?? 0,
        terjual: item.terjual ?? item.sold_quantity ?? 0,
        total_rp: item.total_rp ?? 0,
      })),
      cash_initial: 0,
      cash_physical: cashPhysical,
    };
  });
}

export async function createRequestEdit(formData: {
  closingId: string;
  items: ClosingItem[];
  cashPhysical: number;
  reason: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: closing, error: closingError } = await supabase
    .from("daily_closings")
    .select("id, status")
    .eq("id", formData.closingId)
    .eq("staff_id", user.id)
    .single();

  if (closingError || !closing) {
    throw new Error("Closing tidak ditemukan atau bukan milik staff ini");
  }

  if (closing.status === "draft" || closing.status === "rejected") {
    throw new Error("Closing belum dapat diajukan untuk request edit");
  }

  const { data: pendingRequest, error: pendingError } = await supabase
    .from("audit_request_edits")
    .select("id")
    .eq("target_id", formData.closingId)
    .eq("staff_id", user.id)
    .eq("status", "PENDING")
    .maybeSingle();

  if (pendingError) throw new Error(pendingError.message);
  if (pendingRequest) throw new Error("Masih ada request edit yang menunggu persetujuan");

  const { data: requestEdit, error } = await supabase
    .from("audit_request_edits")
    .insert({
      staff_id: user.id,
      target_table: "daily_closings",
      target_id: formData.closingId,
      reason: formData.reason,
      status: "PENDING",
      changes: {
        items: formData.items,
        cash_physical: formData.cashPhysical,
      },
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/employee/request-edit");
  revalidatePath("/employee/riwayat");

  return { success: true, requestEditId: requestEdit.id };
}

export async function getClosingDetailForRequestEdit(closingId: string) {
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

  const masterItems = await getItems();

  const itemsMap = new Map(masterItems.map((i) => [i.id, i]));
  const closingItems: (ClosingItem & { item: Item })[] = (items || []).map((ci) => {
    const masterItem = itemsMap.get(ci.item_id);
    if (!masterItem) return null;
    return {
      id: ci.id,
      item_id: ci.item_id,
      stok_awal: ci.initial_stock,
      stok_akhir: ci.remaining_stock,
      terjual: ci.sold_quantity || (ci.initial_stock + ci.restock_stock) - ci.remaining_stock,
      total_rp: ((ci.sold_quantity || (ci.initial_stock + ci.restock_stock) - ci.remaining_stock)) * Number(masterItem.price_sell),
      item: masterItem,
    };
  }).filter((item): item is ClosingItem & { item: Item } => item !== null);

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
  } as DailyClosing;
}
