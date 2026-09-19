"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ItemType = "KONSINYASI_KUE" | "MINUMAN_OWNER" | "AYAM_PENYET";

export interface Item {
  id: string;
  supplier_id: string | null;
  name: string;
  category: ItemType;
  cost_price: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
}

export async function getItems(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getActiveItems(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_items")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getItemsBySupplier(supplierId: string): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_items")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBeverageItems(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_items")
    .select("*")
    .eq("category", "MINUMAN_OWNER")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const supplier_id = formData.get("supplier_id") as string | null;
  const category = formData.get("category") as ItemType;
  const cost_price = parseInt(formData.get("cost_price") as string) || 0;
  const selling_price = parseInt(formData.get("selling_price") as string) || 0;

  const { error } = await supabase.from("master_items").insert({
    name,
    supplier_id: supplier_id || null,
    category,
    cost_price,
    selling_price,
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/owner/items");
}

export async function updateItem(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const supplier_id = formData.get("supplier_id") as string | null;
  const category = formData.get("category") as ItemType;
  const cost_price = parseInt(formData.get("cost_price") as string) || 0;
  const selling_price = parseInt(formData.get("selling_price") as string) || 0;
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("master_items")
    .update({
      name,
      supplier_id: supplier_id || null,
      category,
      cost_price,
      selling_price,
      is_active,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/owner/items");
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("master_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/owner/items");
}

export async function toggleItemActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("master_items")
    .update({ is_active })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/owner/items");
}