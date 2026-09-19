import { describe, it, expect } from "vitest";
import { createMockSupabaseClient } from "../helpers/mock-supabase";
import { makeProfile, makeSupplier, makeItem, makeDailyClosing, makeDailyClosingItem } from "../helpers/factories";

describe("mock-supabase", () => {
  it("should return mock data from select", async () => {
    const mockClient = createMockSupabaseClient({
      suppliers: [{ id: "s1", name: "Bakery ABC" }],
    });

    const { data } = await mockClient.from("suppliers").select("*");

    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Bakery ABC");
  });

  it("should filter with eq", async () => {
    const mockClient = createMockSupabaseClient({
      suppliers: [
        { id: "s1", name: "Bakery ABC", is_active: true },
        { id: "s2", name: "Cake XYZ", is_active: false },
      ],
    });

    const { data } = await mockClient.from("suppliers").select("*").eq("is_active", true);

    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Bakery ABC");
  });

  it("should insert new row", async () => {
    const mockClient = createMockSupabaseClient({ suppliers: [] });

    const { data } = await mockClient.from("suppliers").insert({ name: "New Supplier" });

    expect(data.name).toBe("New Supplier");
    expect(data.id).toBeDefined();
    expect(mockClient._data.suppliers).toHaveLength(1);
  });
});

describe("factories", () => {
  it("makeProfile creates valid profile", () => {
    const profile = makeProfile({ full_name: "John Doe" });

    expect(profile.full_name).toBe("John Doe");
    expect(profile.id).toBeDefined();
    expect(profile.email).toContain("@test.id");
    expect(profile.role).toBe("STAFF");
  });

  it("makeSupplier creates valid supplier", () => {
    const supplier = makeSupplier({ name: "Test Supplier" });

    expect(supplier.name).toBe("Test Supplier");
    expect(supplier.is_active).toBe(true);
  });

  it("makeItem creates valid item", () => {
    const item = makeItem({ name: "Kue Lapis", selling_price: 10000 });

    expect(item.name).toBe("Kue Lapis");
    expect(item.selling_price).toBe(10000);
    expect(item.category).toBe("KONSINYASI_KUE");
  });

  it("makeDailyClosing creates valid closing", () => {
    const closing = makeDailyClosing({ cash_physical: 200000 });

    expect(closing.cash_physical).toBe(200000);
    expect(closing.status).toBe("submitted");
    expect(closing.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("makeDailyClosingItem creates valid closing item", () => {
    const item = makeDailyClosingItem({ sold: 10, unit_price: 5000, total: 50000 });

    expect(item.sold).toBe(10);
    expect(item.unit_price).toBe(5000);
    expect(item.total).toBe(50000);
  });
});
