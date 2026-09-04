// Factory functions for test data
// Usage: const supplier = makeSupplier({ name: "Bakery ABC" });

export function makeProfile(overrides: Partial<any> = {}) {
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

export function makeSupplier(overrides: Partial<any> = {}) {
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

export function makeItem(overrides: Partial<any> = {}) {
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

export function makeDailyClosing(overrides: Partial<any> = {}) {
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

export function makeDailyClosingItem(overrides: Partial<any> = {}) {
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

export function makeRestock(overrides: Partial<any> = {}) {
  return {
    id: cryptoRandomId(),
    item_id: cryptoRandomId(),
    qty: 50,
    date: isoDate(),
    created_at: isoNow(),
    ...overrides,
  };
}

export function makeExpense(overrides: Partial<any> = {}) {
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
