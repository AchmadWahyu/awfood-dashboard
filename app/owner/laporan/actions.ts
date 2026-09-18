"use server";

import { createClient } from "@/lib/supabase/server";
import type { DailyClosing, Expense, EmployeeDeduction } from "@/lib/dummy/types";

export async function getSalesReport(startDate: string, endDate: string): Promise<DailyClosing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_closings")
    .select("*, staff:staff_id(full_name)")
    .eq("status", "verified")
    .gte("closing_date", startDate)
    .lte("closing_date", endDate)
    .order("closing_date", { ascending: false });

  if (error) {
    console.error("Error fetching sales report:", error);
    return [];
  }

  return (data || []).map((c) => ({
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

export async function getDiscrepancyReport(startDate: string, endDate: string): Promise<DailyClosing[]> {
  const all = await getSalesReport(startDate, endDate);
  return all.filter((c) => c.discrepancy != null && c.discrepancy !== 0);
}

export async function getExpensesReport(startDate: string, endDate: string): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)
    .order("expense_date", { ascending: false });

  if (error) {
    console.error("Error fetching expenses report:", error);
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

export async function getDeductionsReport(startDate: string, endDate: string): Promise<EmployeeDeduction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_deductions")
    .select("*, staff:staff_id(full_name)")
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deductions report:", error);
    return [];
  }

  return (data || []).map((d) => ({
    id: d.id,
    staff_id: d.staff_id,
    staff_name: d.staff?.full_name || "",
    closing_id: "",
    amount: Number(d.amount) || 0,
    reason: d.reason,
    approved_by: "",
    approved_at: d.created_at,
    applied_at: d.is_settled ? d.created_at : null,
  }));
}
