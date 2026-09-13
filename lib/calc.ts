// Pure functions for closing calculations
// These are tested without any external dependencies

export interface ClosingItemInput {
  opening_stock: number;
  ending_stock: number;
  restock_stock: number;
  selling_price: number;
}

export interface ClosingItemOutput {
  sold: number;
  total: number;
}

/**
 * Calculate sold quantity: opening + restock - ending
 * Returns 0 if negative (shouldn't happen in valid data)
 */
export function calculateSold(
  opening: number,
  ending: number,
  restock: number = 0
): number {
  const sold = opening + restock - ending;
  return Math.max(0, sold);
}

/**
 * Calculate total revenue for an item: sold × selling_price
 */
export function calculateItemTotal(sold: number, sellingPrice: number): number {
  return sold * sellingPrice;
}

/**
 * Calculate subtotal for a group of items (e.g., per supplier)
 */
export function calculateSubtotal(itemTotals: number[]): number {
  return itemTotals.reduce((sum, total) => sum + total, 0);
}

/**
 * Calculate grand total (omzet) from all items
 */
export function calculateGrandTotal(subtotals: number[]): number {
  return subtotals.reduce((sum, subtotal) => sum + subtotal, 0);
}

/**
 * Calculate complete closing item (sold + total in one call)
 */
export function calculateClosingItem(
  input: ClosingItemInput
): ClosingItemOutput {
  const sold = calculateSold(
    input.opening_stock,
    input.ending_stock,
    input.restock_stock
  );
  const total = calculateItemTotal(sold, input.selling_price);
  return { sold, total };
}

/**
 * Calculate discrepancy: cash_physical - cash_initial - qris_final
 * Positive = lebih, Negative = kurang
 */
export function calculateDiscrepancy(
  cashPhysical: number,
  cashInitial: number,
  qrisFinal: number
): number {
  return cashPhysical - cashInitial - qrisFinal;
}
