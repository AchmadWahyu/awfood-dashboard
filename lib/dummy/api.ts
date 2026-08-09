import { getKey, setKey } from "./storage";
import type {
  User, Supplier, Item, Restock, DailyClosing, Claim, RequestEdit,
  SupplierSettlement, Expense, EmployeeDeduction, SupplierLedgerEntry,
} from "./types";
import { seedAll } from "./seed";

function init() {
  if (typeof window === "undefined") return;
  if (!getKey<boolean>("initialized", false)) {
    seedAll();
  }
}

function list<T>(key: string): T[] {
  init();
  return getKey<T[]>(key, []);
}

function add<T extends { id: string }>(key: string, entity: T): T {
  const arr = list<T>(key);
  arr.push(entity);
  setKey(key, arr);
  return entity;
}

function update<T extends { id: string }>(key: string, id: string, patch: Partial<T>): T | null {
  const arr = list<T>(key);
  const idx = arr.findIndex((x: any) => x.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...patch } as T;
  setKey(key, arr);
  return arr[idx];
}

function remove<T extends { id: string }>(key: string, id: string): boolean {
  const arr = list<T>(key);
  const next = arr.filter((x: any) => x.id !== id);
  if (next.length === arr.length) return false;
  setKey(key, next);
  return true;
}

// Users
export const getUsers = () => list<User>("users");
export const addUser = (u: User) => add("users", u);
export const updateUser = (id: string, patch: Partial<User>) => update<User>("users", id, patch);
export const removeUser = (id: string) => remove<User>("users", id);
export const findUserByStaffCode = (code: string) => getUsers().find((u) => u.staff_code === code);
export const findUserByEmail = (email: string) => getUsers().find((u) => u.email === email);
export const getCurrentUser = (): User | null => getKey<User | null>("current_user", null);
export const setCurrentUser = (u: User | null) => setKey("current_user", u);

// Suppliers
export const getSuppliers = () => list<Supplier>("suppliers");
export const addSupplier = (s: Supplier) => add("suppliers", s);
export const updateSupplier = (id: string, patch: Partial<Supplier>) => update<Supplier>("suppliers", id, patch);
export const removeSupplier = (id: string) => remove<Supplier>("suppliers", id);

// Items
export const getItems = () => list<Item>("items");
export const addItem = (i: Item) => add("items", i);
export const updateItem = (id: string, patch: Partial<Item>) => update<Item>("items", id, patch);
export const removeItem = (id: string) => remove<Item>("items", id);
export const getActiveItems = () => getItems().filter((i) => i.is_active);
export const getItemsBySupplier = (sid: string) => getItems().filter((i) => i.supplier_id === sid && i.is_active);
export const getBeverageItems = () => getItems().filter((i) => i.type === "MINUMAN_OWNER" && i.is_active);

// Restocks
export const getRestocks = () => list<Restock>("restocks");
export const addRestock = (r: Restock) => add("restocks", r);
export const removeRestock = (id: string) => remove<Restock>("restocks", id);
export const getRestocksByItem = (itemId: string) => getRestocks().filter((r) => r.item_id === itemId);
export function calcStockAwalMinuman(itemId: string, date: string): number {
  const restocks = getRestocks().filter((r) => r.item_id === itemId && r.date <= date);
  return restocks.reduce((sum, r) => sum + r.qty, 0);
}

// Closings
export const getClosings = () => list<DailyClosing>("closings");
export const addClosing = (c: DailyClosing) => add("closings", c);
export const updateClosing = (id: string, patch: Partial<DailyClosing>) => update<DailyClosing>("closings", id, patch);
export const getClosingById = (id: string) => getClosings().find((c) => c.id === id);
export const getSubmittedClosings = () => getClosings().filter((c) => c.status === "submitted");
export const getClosingsByDate = (date: string) => getClosings().filter((c) => c.date === date);

// Claims
export const getClaims = () => list<Claim>("claims");
export const addClaim = (c: Claim) => add("claims", c);
export const updateClaim = (id: string, patch: Partial<Claim>) => update<Claim>("claims", id, patch);
export const getPendingClaims = () => getClaims().filter((c) => c.status === "pending");

// Request Edits
export const getRequestEdits = () => list<RequestEdit>("request_edits");
export const addRequestEdit = (r: RequestEdit) => add("request_edits", r);
export const updateRequestEdit = (id: string, patch: Partial<RequestEdit>) => update<RequestEdit>("request_edits", id, patch);
export const getPendingRequestEdits = () => getRequestEdits().filter((r) => r.status === "pending");

// Settlements
export const getSettlements = () => list<SupplierSettlement>("settlements");
export const addSettlement = (s: SupplierSettlement) => add("settlements", s);
export const getSettlementsByClosing = (closingId: string) => getSettlements().filter((s) => s.closing_id === closingId);
export const getSettlementsBySupplier = (supplierId: string) => getSettlements().filter((s) => s.supplier_id === supplierId);

// Expenses
export const getExpenses = () => list<Expense>("expenses");
export const addExpense = (e: Expense) => add("expenses", e);
export const getExpensesByDate = (date: string) => getExpenses().filter((e) => e.date === date);

// Deductions
export const getDeductions = () => list<EmployeeDeduction>("deductions");
export const addDeduction = (d: EmployeeDeduction) => add("deductions", d);

// Ledger
export const getLedger = () => list<SupplierLedgerEntry>("ledger");
export const addLedgerEntry = (e: SupplierLedgerEntry) => add("ledger", e);

// Reset
export { seedAll, clearAll } from "./seed";
