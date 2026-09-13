"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Expense } from "@/lib/dummy/types";

export async function getExpenses(date?: string): Promise<Expense[]> {
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (date) {
    query = query.eq("expense_date", date);
  }

  const { data, error } = await query;

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

export async function getExpensesByDateRange(
  startDate: string,
  endDate: string
): Promise<Expense[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching expenses by date range:", error);
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

export async function addExpense(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const category = formData.get("category") as string;
  const pocket = formData.get("pocket") as string;
  const amount = parseInt(formData.get("amount") as string) || 0;
  const expenseDate = formData.get("expense_date") as string;
  const note = formData.get("note") as string;
  const customLabel = formData.get("custom_label") as string;

  const validCategories = [
    "BAHAN_MINUMAN",
    "BAHAN_KUE",
    "PLASTIK",
    "KARDUS",
    "NOTA",
    "STEMPEL_STIKER",
    "LAINNYA",
  ];
  const validPockets = ["CASH_LACI", "QRIS_AWFOOD"];

  if (!validCategories.includes(category)) throw new Error("Kategori tidak valid");
  if (!validPockets.includes(pocket)) throw new Error("Kantong tidak valid");
  if (amount <= 0) throw new Error("Nominal harus lebih dari 0");
  if (!expenseDate) throw new Error("Tanggal wajib diisi");

  const { error } = await supabase.from("expenses").insert({
    category,
    pocket,
    amount,
    expense_date: expenseDate,
    note: note || null,
    custom_label: category === "LAINNYA" ? customLabel || null : null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/owner/pengeluaran");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/owner/pengeluaran");
  return { success: true };
}
