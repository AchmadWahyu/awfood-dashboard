import { getExpenses } from "./actions";
import PengeluaranClient from "./PengeluaranClient";

export default async function OwnerPengeluaranPage() {
  const expenses = await getExpenses();
  return <PengeluaranClient initialExpenses={expenses} />;
}
