"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Supplier {
  id: string;
  name: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
}

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getActiveSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSupplier(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string | null;

  const { error } = await supabase.from("suppliers").insert({
    name,
    phone_number: phone || null,
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/owner/suppliers");
}

export async function updateSupplier(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string | null;
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("suppliers")
    .update({ name, phone_number: phone || null, is_active })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/owner/suppliers");
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/owner/suppliers");
}

export async function toggleSupplierActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/owner/suppliers");
}