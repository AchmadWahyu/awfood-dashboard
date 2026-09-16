import EmployeeRiwayatClient from "./EmployeeRiwayatClient";
import { getClosingsByStaff, getItems, getSuppliers } from "./actions";

export default async function EmployeeRiwayatPage() {
  const [closings, items, suppliers] = await Promise.all([
    getClosingsByStaff(),
    getItems(),
    getSuppliers(),
  ]);

  return (
    <EmployeeRiwayatClient
      initialClosings={closings}
      initialItems={items}
      initialSuppliers={suppliers}
    />
  );
}
