import { describe, it, expect, vi } from "vitest";
import { createMockSupabaseClient } from "../../../test/helpers/mock-supabase";
import { makeItem, makeProfile } from "../../../test/helpers/factories";

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the server module
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { submitClosing } from "./actions";

describe("submitClosing", () => {
  it("should create closing and items successfully", async () => {
    const mockUser = makeProfile({ id: "staff-123", role: "STAFF" });
    const mockItem1 = makeItem({ id: "item-1", selling_price: 5000 });
    const mockItem2 = makeItem({ id: "item-2", selling_price: 7000 });

    const mockClient = createMockSupabaseClient({
      master_items: [mockItem1, mockItem2],
      daily_closings: [],
      daily_closing_items: [],
    });

    // Mock auth.getUser to return our test user
    mockClient.auth.getUser = () =>
      Promise.resolve({ data: { user: { id: mockUser.id } }, error: null });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const formData = new FormData();
    formData.append("date", "2026-09-06");
    formData.append("cash_physical", "150000");
    formData.append(
      "items",
      JSON.stringify([
        { item_id: "item-1", opening_stock: 100, ending_stock: 30, sold: 70, total: 350000 },
        { item_id: "item-2", opening_stock: 50, ending_stock: 20, sold: 30, total: 210000 },
      ])
    );

    const result = await submitClosing(formData);

    expect(result.success).toBe(true);
    expect(result.closingId).toBeDefined();

    // Verify closing was created
    expect(mockClient._data.daily_closings).toHaveLength(1);
    const closing = mockClient._data.daily_closings[0];
    expect(closing.closing_date).toBe("2026-09-06");
    expect(closing.cash_physical).toBe(150000);
    expect(closing.staff_id).toBe("staff-123");
    expect(closing.total_system_omzet).toBe(560000); // 350000 + 210000

    // Verify items were created
    expect(mockClient._data.daily_closing_items).toHaveLength(2);
  });

  it("should throw error when user is not authenticated", async () => {
    const mockClient = createMockSupabaseClient({
      daily_closings: [],
      daily_closing_items: [],
    });

    // Mock auth.getUser to return no user
    mockClient.auth.getUser = () =>
      Promise.resolve({ data: { user: null }, error: null });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const formData = new FormData();
    formData.append("date", "2026-09-06");
    formData.append("cash_physical", "150000");
    formData.append("items", JSON.stringify([]));

    await expect(submitClosing(formData)).rejects.toThrow("Unauthorized");
  });

  it("should handle empty items array", async () => {
    const mockUser = makeProfile({ id: "staff-123" });

    const mockClient = createMockSupabaseClient({
      daily_closings: [],
      daily_closing_items: [],
      restocks: [], // Empty restocks so no insert happens
    });

    mockClient.auth.getUser = () =>
      Promise.resolve({ data: { user: { id: mockUser.id } }, error: null });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const formData = new FormData();
    formData.append("date", "2026-09-06");
    formData.append("cash_physical", "100000");
    formData.append("items", JSON.stringify([]));

    const result = await submitClosing(formData);

    expect(result.success).toBe(true);
    expect(mockClient._data.daily_closings[0].total_system_omzet).toBe(0);
    expect(mockClient._data.daily_closing_items).toHaveLength(0);
  });

  it("should parse cash_physical as number", async () => {
    const mockUser = makeProfile({ id: "staff-123" });

    const mockClient = createMockSupabaseClient({
      daily_closings: [],
      daily_closing_items: [],
    });

    mockClient.auth.getUser = () =>
      Promise.resolve({ data: { user: { id: mockUser.id } }, error: null });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const formData = new FormData();
    formData.append("date", "2026-09-06");
    formData.append("cash_physical", "250000");
    formData.append("items", JSON.stringify([]));

    await submitClosing(formData);

    expect(mockClient._data.daily_closings[0].cash_physical).toBe(250000);
  });
});
