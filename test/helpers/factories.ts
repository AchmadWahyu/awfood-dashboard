// Factory functions for test data
// Usage: const supplier = makeSupplier({ name: "Bakery ABC" });

type ProfileFixture = {
  id: string;
  email: string;
  full_name: string;
  role: "OWNER" | "STAFF";
  staff_code: string;
  pin_hash: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SupplierFixture = {
  id: string;
  name: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ItemFixture = {
  id: string;
  supplier_id: string | null;
  name: string;
  category: "KONSINYASI_KUE" | "MINUMAN_OWNER" | "AYAM_PENYET";
  cost_price: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DailyClosingFixture = {
  id: string;
  date: string;
  staff_id: string;
  status: "submitted" | "verified" | "rejected";
  cash_initial: number;
  cash_physical: number;
  qris_verified: number | null;
  qris_verified_by: string | null;
  qris_verified_at: string | null;
  discrepancy: number | null;
  discrepancy_status: string | null;
  discrepancy_resolution: string | null;
  discrepancy_note: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type DailyClosingItemFixture = {
  id: string;
  closing_id: string;
  item_id: string;
  opening_stock: number;
  ending_stock: number;
  sold: number;
  unit_price: number;
  total: number;
  created_at: string;
};

type RestockFixture = {
  id: string;
  item_id: string;
  qty: number;
  date: string;
  created_at: string;
};

type ExpenseFixture = {
  id: string;
  category: string;
  custom_label: string | null;
  amount: number;
  pocket: "CASH_LACI" | "QRIS_AWFOOD";
  date: string;
  note: string | null;
  created_by: string;
  created_at: string;
};

export function makeProfile(overrides: Partial<ProfileFixture> = {}) {
  return {
    id: cryptoRandomId(),
    email: `user-${randInt()}@test.id`,
    full_name: `User ${randInt()}`,
    role: "STAFF",
    staff_code: `S${String(randInt(100)).padStart(3, "0")}`,
    pin_hash: null,
    is_active: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  };
}

export function makeSupplier(overrides: Partial<SupplierFixture> = {}) {
  return {
    id: cryptoRandomId(),
    name: `Supplier ${randInt()}`,
    phone_number: `08${randInt(9999999999)}`,
    is_active: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  };
}

export function makeItem(overrides: Partial<ItemFixture> = {}) {
  return {
    id: cryptoRandomId(),
    supplier_id: null,
    name: `Item ${randInt()}`,
    category: "KONSINYASI_KUE",
    cost_price: 5000,
    selling_price: 7000,
    is_active: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  };
}

export function makeDailyClosing(overrides: Partial<DailyClosingFixture> = {}) {
  return {
    id: cryptoRandomId(),
    date: isoDate(),
    staff_id: cryptoRandomId(),
    status: "submitted",
    cash_initial: 50000,
    cash_physical: 150000,
    qris_verified: null,
    qris_verified_by: null,
    qris_verified_at: null,
    discrepancy: null,
    discrepancy_status: null,
    discrepancy_resolution: null,
    discrepancy_note: null,
    verified_by: null,
    verified_at: null,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  };
}

export function makeDailyClosingItem(overrides: Partial<DailyClosingItemFixture> = {}) {
  return {
    id: cryptoRandomId(),
    closing_id: cryptoRandomId(),
    item_id: cryptoRandomId(),
    opening_stock: 20,
    ending_stock: 5,
    sold: 15,
    unit_price: 7000,
    total: 105000,
    created_at: isoNow(),
    ...overrides,
  };
}

export function makeRestock(overrides: Partial<RestockFixture> = {}) {
  return {
    id: cryptoRandomId(),
    item_id: cryptoRandomId(),
    qty: 50,
    date: isoDate(),
    created_at: isoNow(),
    ...overrides,
  };
}

export function makeExpense(overrides: Partial<ExpenseFixture> = {}) {
  return {
    id: cryptoRandomId(),
    category: "BAHAN_MINUMAN",
    custom_label: null,
    amount: 25000,
    pocket: "CASH_LACI",
    date: isoDate(),
    note: null,
    created_by: cryptoRandomId(),
    created_at: isoNow(),
    ...overrides,
  };
}

// --- utils ---

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function randInt(max = 100000): number {
  return Math.floor(Math.random() * max);
}

function isoNow(): string {
  return new Date().toISOString();
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
