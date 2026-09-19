"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RequestEdit, DailyClosing, ClosingItem } from "@/lib/dummy/types";
import { getItems, getSuppliers } from "@/app/employee/riwayat/actions";

type RequestEditItemPayload = Partial<ClosingItem> & {
  initial_stock?: number;
  remaining_stock?: number;
  sold_quantity?: number;
};

type RequestEditChanges = {
  items: RequestEditItemPayload[];
  cash_physical: number | null;
};

function parseChanges(changes: unknown): RequestEditChanges {
  const parsed = typeof changes === "string" ? JSON.parse(changes) : changes;
  if (Array.isArray(parsed)) {
    return { items: parsed, cash_physical: null };
  }
  if (!parsed || typeof parsed !== "object") {
    return { items: [], cash_physical: null };
  }

  const value = parsed as { items?: unknown; cash_physical?: unknown };
  return {
    items: Array.isArray(value.items) ? value.items as RequestEditItemPayload[] : [],
    cash_physical: typeof value.cash_physical === "number" ? value.cash_physical : null,
  };
}

function mapRequestItems(
  items: RequestEditItemPayload[],
  prices: Map<string, number>,
): ClosingItem[] {
  return items.map((item, index) => {
    const opening = Number(item.stok_awal ?? item.initial_stock ?? 0);
    const ending = Number(item.stok_akhir ?? item.remaining_stock ?? 0);
    const sold = Number(item.terjual ?? item.sold_quantity ?? Math.max(0, opening - ending));
    return {
      id: String(item.id || `item-${index}`),
      item_id: String(item.item_id || ""),
      stok_awal: opening,
      stok_akhir: ending,
      terjual: sold,
      total_rp: sold * (prices.get(String(item.item_id || "")) || 0),
    };
  });
}

export async function getAllRequestEdits(): Promise<RequestEdit[]> {
  const supabase = await createClient();

  const { data: requestEdits, error } = await supabase
    .from("audit_request_edits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching request edits:", error);
    return [];
  }

  const items = await getItems();

  const prices = new Map(items.map((i) => [i.id, Number(i.price_sell)]));

  return (requestEdits || []).map((re) => {
    const changes = parseChanges(re.changes);
    const parsedItems = mapRequestItems(changes.items, prices);
    
    return {
      id: re.id,
      closing_id: re.target_id,
      reason: re.reason,
      status: re.status?.toLowerCase() || "pending",
      requested_by: re.staff_id,
      requested_at: re.created_at,
      approved_by: null,
      approved_at: null,
       items: parsedItems,
       cash_initial: 0,
       cash_physical: changes.cash_physical || 0,
    };
  });
}

export async function getRequestEditDetail(requestEditId: string) {
  const supabase = await createClient();

  const { data: requestEdit, error } = await supabase
    .from("audit_request_edits")
    .select("*")
    .eq("id", requestEditId)
    .single();

  if (error || !requestEdit) return null;

  const { data: closing, error: closingError } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("id", requestEdit.target_id)
    .single();

  if (closingError) {
    console.error("Error fetching closing:", closingError);
  }

  const { data: closingItems, error: itemsError } = await supabase
    .from("daily_closing_items")
    .select("*")
    .eq("closing_id", requestEdit.target_id);

  if (itemsError) {
    console.error("Error fetching closing items:", itemsError);
  }

  const [items, suppliers] = await Promise.all([
    getItems(),
    getSuppliers(),
  ]);

  const itemsMap = new Map(items.map((i) => [i.id, i]));
  const changes = parseChanges(requestEdit.changes);
  const prices = new Map(items.map((i) => [i.id, Number(i.price_sell)]));
  const parsedItems = mapRequestItems(changes.items, prices);

  const closingDetail: DailyClosing | null = closing ? {
    id: closing.id,
    date: closing.closing_date,
    staff_id: closing.staff_id,
    staff_name: "",
    status: closing.status?.toLowerCase() || "submitted",
    items: (closingItems || []).map((ci) => {
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
    }).filter((item): item is NonNullable<typeof item> => item !== null),
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
  } : null;

  return {
    requestEdit: {
      id: requestEdit.id,
      closing_id: requestEdit.target_id,
      reason: requestEdit.reason,
      status: requestEdit.status?.toLowerCase() || "pending",
      requested_by: requestEdit.staff_id,
      requested_at: requestEdit.created_at,
      approved_by: null,
      approved_at: null,
       items: parsedItems,
       cash_initial: 0,
       cash_physical: changes.cash_physical || 0,
    },
    closing: closingDetail,
    items,
    suppliers,
  };
}

export async function approveRequestEdit(requestEditId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("approve_request_edit", {
    request_edit_id: requestEditId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/owner/request-edit");
  revalidatePath("/employee/riwayat");

  return { success: true };
}

export async function rejectRequestEdit(requestEditId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("audit_request_edits")
    .update({
      status: "REJECTED",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notes: reason,
    })
    .eq("id", requestEditId);

  if (error) throw new Error(error.message);

  revalidatePath("/owner/request-edit");
  revalidatePath("/employee/riwayat");

  return { success: true };
}
