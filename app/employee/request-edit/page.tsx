import { Suspense } from "react";
import EmployeeRequestEditClient from "./EmployeeRequestEditClient";
import { getRequestEditsByStaff } from "./actions";
import { getClosingsByStaff, getItems, getSuppliers } from "@/app/employee/riwayat/actions";

export default async function EmployeeRequestEditPage() {
  const [closings, items, suppliers] = await Promise.all([
    getClosingsByStaff(),
    getItems(),
    getSuppliers(),
  ]);

  const myReqs = await getRequestEditsByStaff();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <EmployeeRequestEditClient
        initialClosings={closings}
        initialItems={items}
        initialSuppliers={suppliers}
        initialRequestEdits={myReqs}
      />
    </Suspense>
  );
}
