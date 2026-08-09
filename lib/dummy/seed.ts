import { setKey } from "./storage";
import type {
  User, Supplier, Item, Restock, DailyClosing, Claim, RequestEdit,
  SupplierSettlement, Expense, EmployeeDeduction, SupplierLedgerEntry,
} from "./types";

export const seedUsers: User[] = [
  {
    id: "owner-1",
    email: "owner@awfood.id",
    full_name: "Owner AW Food",
    role: "OWNER",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "staff-1",
    email: "staff-1@app.awfood.local",
    full_name: "Budi Karyawan",
    role: "STAFF",
    staff_code: "B001",
    pin: "1234",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "staff-2",
    email: "staff-2@app.awfood.local",
    full_name: "Ani Karyawan",
    role: "STAFF",
    staff_code: "A002",
    pin: "5678",
    created_at: "2024-01-01T00:00:00Z",
  },
];

export const seedSuppliers: Supplier[] = [
  { id: "sup-1", name: "Bu Sari", phone: "0812-1111-2222", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "sup-2", name: "Pak Budi", phone: "0812-3333-4444", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "sup-3", name: "Bu Rina", phone: "0812-5555-6666", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "sup-4", name: "Pak Agus", phone: "0812-7777-8888", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "sup-5", name: "Bu Dewi", phone: "0812-9999-0000", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

const KUE_NAMES = [
  "Pastel", "Lemper", "Sosis Solo", "Risoles", "Kroket",
  "Donat Gula", "Donat Coklat", "Donat Keju", "Donat Mesis", "Donat Ubi",
  "Lumpia Basah", "Lumpia Goreng", "Pisang Goreng", "Tahu Isi", "Tempe Mendoan",
  "Cilok", "Batagor", "Siomay", "Mie Goreng", "Bihun Goreng",
  "Nasi Uduk", "Nasi Kuning", "Ketupat", "Lontong", "Arem-Arem",
  "Bakpao", "Cakwe", "Martabak Mini", "Telur Gulung", "Pisang Coklat",
  "Roti Bakar", "Kue Cucur", "Kue Ape", "Kue Pukis", "Kue Mangkok",
  "Serabi", "Kue Cubit", "Kue Lumpur", "Kue Pancong", "Ronde",
  "Wedang Ronde", "Bubur Kacang Ijo", "Bubur Sumsum", "Es Puding", "Puding Coklat",
  "Brownies Kukus", "Bolu Gulung", "Kue Putu", "Dadar Gulung", "Klepon",
];

export const seedItems: Item[] = [
  ...KUE_NAMES.slice(0, 50).map((name, idx) => {
    const supplierIdx = idx % seedSuppliers.length;
    const priceBuy = 1000 + (idx % 5) * 500;
    return {
      id: `item-${idx + 1}`,
      name,
      supplier_id: seedSuppliers[supplierIdx].id,
      type: "KUE_KONSI" as const,
      price_buy: priceBuy,
      price_sell: priceBuy + 500,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
    };
  }),
  { id: "item-51", name: "Es Teh", supplier_id: null, type: "MINUMAN_OWNER", price_buy: 1000, price_sell: 3000, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "item-52", name: "Es Jeruk", supplier_id: null, type: "MINUMAN_OWNER", price_buy: 1500, price_sell: 4000, is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export function seedAll() {
  setKey("users", seedUsers);
  setKey("suppliers", seedSuppliers);
  setKey("items", seedItems);
  setKey("restocks", [] as Restock[]);
  setKey("closings", [] as DailyClosing[]);
  setKey("claims", [] as Claim[]);
  setKey("request_edits", [] as RequestEdit[]);
  setKey("settlements", [] as SupplierSettlement[]);
  setKey("expenses", [] as Expense[]);
  setKey("deductions", [] as EmployeeDeduction[]);
  setKey("ledger", [] as SupplierLedgerEntry[]);
  setKey("current_user", null as User | null);
  setKey("initialized", true);
}

export function clearAll() {
  if (typeof window === "undefined") return;
  const PREFIX = "awfood-mvp-";
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
