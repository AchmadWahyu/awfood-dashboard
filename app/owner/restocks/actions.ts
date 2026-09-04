"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Restock {
  id: string;
  item_id: string;
  quantity: number;
  restock_date: string;
  created_at: string;
}

export async function getRestocks(): Promise<Restock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restocks")
    .select("*")
    .order("restock_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
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
  const item_id = formData.get("item_id") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 0;
  const restock_date = formData.get("restock_date") as string;

  const { error } = await supabase.from("restocks").insert({
    item_id,
    quantity,
    restock_date,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/owner/restocks");
}