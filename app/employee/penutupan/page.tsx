import { getSuppliersForClosing, getItemsForClosing, getBeverageItemsForClosing, getClosingsByDate, getClosingWithItems } from "./actions";
import EmployeePenutupanClient from "./EmployeePenutupanClient";
import { todayJakarta } from "@/lib/utils/date";

export default async function EmployeePenutupanPage() {
  const today = todayJakarta();
  const [suppliers, items, beverages, todayClosings] = await Promise.all([
    getSuppliersForClosing(),
    getItemsForClosing(),
    getBeverageItemsForClosing(),
    getClosingsByDate(today),
  ]);

  // Debug: log ke console server
  console.log("[DEBUG] Today:", today);
  console.log("[DEBUG] Closings count:", todayClosings.length);
  console.log("[DEBUG] First closing:", todayClosings[0]);

  // Cek apakah sudah ada closing untuk hari ini (apapun statusnya)
  const existingClosing = todayClosings.length > 0 ? todayClosings[0] : undefined;
  const existingClosingDetail = existingClosing ? await getClosingWithItems(existingClosing.id) : null;

  return (
    <EmployeePenutupanClient
      initialSuppliers={suppliers}
      initialItems={items}
      initialBeverages={beverages}
      existingClosing={existingClosing}
      existingClosingDetail={existingClosingDetail}
    />
  );
}