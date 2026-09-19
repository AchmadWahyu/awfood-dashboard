import { getExpenses } from "./actions";
import { todayJakarta } from "@/lib/utils/date";
import PengeluaranClient from "./PengeluaranClient";

export default async function OwnerPengeluaranPage() {
  const today = todayJakarta();
  const expenses = await getExpenses(today);
  return <PengeluaranClient initialExpenses={expenses} initialDate={today} />;
}
