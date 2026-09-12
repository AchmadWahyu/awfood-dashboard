import { Suspense } from "react";
import EmployeeRiwayatClient from "./EmployeeRiwayatClient";
import { getClosingsByStaff, getItems, getSuppliers } from "./actions";

export default async function EmployeeRiwayatPage() {
  const [closings, items, suppliers] = await Promise.all([
    getClosingsByStaff(),
    getItems(),
    getSuppliers(),
  ]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <EmployeeRiwayatClient
        initialClosings={closings}
        initialItems={items}
        initialSuppliers={suppliers}
      />
    </Suspense>
  );
}
