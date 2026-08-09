export type Role = "OWNER" | "STAFF";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  staff_code?: string;
  pin?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export type ItemType = "KUE_KONSI" | "MINUMAN_OWNER";

export interface Item {
  id: string;
  name: string;
  supplier_id?: string | null;
  type: ItemType;
  price_buy: number;
  price_sell: number;
  is_active: boolean;
  created_at: string;
}

export interface Restock {
  id: string;
  item_id: string;
  qty: number;
  date: string;
  created_at: string;
}

export type ClosingStatus = "draft" | "submitted" | "verified";

export interface ClosingItem {
  id: string;
  item_id: string;
  stok_awal: number;
  stok_akhir: number;
  terjual: number;
  total_rp: number;
}

export interface DailyClosing {
  id: string;
  date: string;
  staff_id: string;
  staff_name: string;
  status: ClosingStatus;
  items: ClosingItem[];
  total_omzet: number;
  cash_initial: number;
  cash_physical: number;
  qris_verified: number | null;
  qris_verified_by: string | null;
  qris_verified_at: string | null;
  discrepancy: number | null;
  discrepancy_status: "open" | "resolved" | null;
  discrepancy_resolution: "koreksi data" | "ditanggung usaha" | "ditanggung karyawan" | null;
  discrepancy_note: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ClaimType = "rusak" | "basi" | "bonus" | "konsumsi_internal";
export type ClaimStatus = "pending" | "approved" | "rejected";

export interface Claim {
  id: string;
  closing_id: string;
  item_id: string;
  type: ClaimType;
  qty: number;
  notes: string;
  status: ClaimStatus;
  requested_by: string;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

export type RequestEditStatus = "pending" | "approved" | "rejected";

export interface RequestEdit {
  id: string;
  closing_id: string;
  reason: string;
  status: RequestEditStatus;
  requested_by: string;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  items: ClosingItem[];
  cash_initial: number;
  cash_physical: number;
}

export type SettlementMethod = "tunai" | "transfer";

export interface SupplierSettlement {
  id: string;
  supplier_id: string;
  closing_id: string | null;
  amount: number;
  method: SettlementMethod;
  reference?: string;
  paid_from_drawer: boolean;
  paid_at: string;
  paid_by: string;
}

export type ExpenseCategory =
  | "BAHAN_MINUMAN"
  | "BAHAN_KUE"
  | "PLASTIK"
  | "KARDUS"
  | "NOTA"
  | "STEMPEL_STIKER"
  | "LAINNYA";

export type Pocket = "CASH_LACI" | "QRIS_AWFOOD";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  custom_label?: string;
  amount: number;
  pocket: Pocket;
  date: string;
  note?: string;
  created_by: string;
  created_at: string;
}

export interface EmployeeDeduction {
  id: string;
  staff_id: string;
  staff_name: string;
  closing_id: string;
  amount: number;
  reason: string;
  approved_by: string;
  approved_at: string;
  applied_at: string | null;
}

export interface SupplierLedgerEntry {
  id: string;
  supplier_id: string;
  type: "sale" | "settlement";
  date: string;
  amount: number;
  description: string;
  closing_id?: string | null;
  settlement_id?: string | null;
}
