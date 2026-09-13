"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Restock {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  restock_date: string;
  created_by: string;
  creator_name: string;
  created_at: string;
}

export async function getRestocks(): Promise<Restock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restocks")
    .select(`
      *,
      master_items!inner(name),
      profiles!inner(full_name)
    `)
    .order("restock_date", { ascending: false });
  if (error) throw new Error(error.message);
  
  // Transform nested data to flat structure
  return (data ?? []).map((r: any) => ({
    id: r.id,
    item_id: r.item_id,
    item_name: r.master_items?.name ?? "Unknown",
    quantity: r.quantity,
    restock_date: r.restock_date,
    created_by: r.created_by,
    creator_name: r.profiles?.full_name ?? "Unknown",
    created_at: r.created_at,
  }));
}

export async function getRestocksByItem(itemId: string): Promise<Restock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restocks")
    .select("*")
    .eq("item_id", itemId)
    .order("restock_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function calcStockAwalMinuman(itemId: string, date: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restocks")
    .select("quantity")
    .eq("item_id", itemId)
    .lte("restock_date", date);
  if (error) throw new Error(error.message);
  return data?.reduce((sum, r) => sum + r.quantity, 0) ?? 0;
}

export async function createRestock(formData: FormData) {
  const supabase = await createClient();
  
  // Get current user for created_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const item_id = formData.get("item_id") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 0;
  const restock_date = formData.get("restock_date") as string;

  const { error } = await supabase.from("restocks").insert({
    item_id,
    quantity,
    restock_date,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/owner/restocks");
}