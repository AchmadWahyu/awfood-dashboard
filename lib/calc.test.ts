import { describe, it, expect } from "vitest";
import {
  calculateSold,
  calculateItemTotal,
  calculateSubtotal,
  calculateGrandTotal,
  calculateClosingItem,
  calculateDiscrepancy,
} from "./calc";

describe("calculateSold", () => {
  it("calculates sold correctly with no restock", () => {
    expect(calculateSold(100, 30)).toBe(70);
  });

  it("calculates sold correctly with restock", () => {
    expect(calculateSold(100, 30, 50)).toBe(120);
  });

  it("returns 0 when ending > opening + restock", () => {
    expect(calculateSold(10, 20)).toBe(0);
  });

  it("handles zero values", () => {
    expect(calculateSold(0, 0, 0)).toBe(0);
  });

  it("handles large numbers", () => {
    expect(calculateSold(10000, 2500, 5000)).toBe(12500);
  });
});

describe("calculateItemTotal", () => {
  it("calculates total correctly", () => {
    expect(calculateItemTotal(10, 5000)).toBe(50000);
  });

  it("returns 0 when sold is 0", () => {
    expect(calculateItemTotal(0, 10000)).toBe(0);
  });

  it("handles decimal prices", () => {
    expect(calculateItemTotal(3, 3500)).toBe(10500);
  });
});

describe("calculateSubtotal", () => {
  it("sums item totals correctly", () => {
    expect(calculateSubtotal([50000, 30000, 20000])).toBe(100000);
  });

  it("returns 0 for empty array", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("handles single item", () => {
    expect(calculateSubtotal([75000])).toBe(75000);
  });
});

describe("calculateGrandTotal", () => {
  it("sums subtotals correctly", () => {
    expect(calculateGrandTotal([100000, 150000, 50000])).toBe(300000);
  });

  it("returns 0 for empty array", () => {
    expect(calculateGrandTotal([])).toBe(0);
  });

  it("handles single supplier", () => {
    expect(calculateGrandTotal([250000])).toBe(250000);
  });
});

describe("calculateClosingItem", () => {
  it("calculates complete item output", () => {
    const input = {
      opening_stock: 100,
      ending_stock: 30,
      restock_stock: 50,
      selling_price: 5000,
    };

    const result = calculateClosingItem(input);

    expect(result.sold).toBe(120);
    expect(result.total).toBe(600000);
  });

  it("handles no restock", () => {
    const input = {
      opening_stock: 50,
      ending_stock: 20,
      restock_stock: 0,
      selling_price: 7000,
    };

    const result = calculateClosingItem(input);

    expect(result.sold).toBe(30);
    expect(result.total).toBe(210000);
  });
});

describe("calculateDiscrepancy", () => {
  it("calculates positive discrepancy (lebih)", () => {
    expect(calculateDiscrepancy(500000, 100000, 350000)).toBe(50000);
  });

  it("calculates negative discrepancy (kurang)", () => {
    expect(calculateDiscrepancy(400000, 100000, 350000)).toBe(-50000);
  });

  it("returns 0 when balanced", () => {
    expect(calculateDiscrepancy(450000, 100000, 350000)).toBe(0);
  });

  it("handles zero initial", () => {
    expect(calculateDiscrepancy(300000, 0, 250000)).toBe(50000);
  });
});
