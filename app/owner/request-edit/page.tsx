import { Suspense } from "react";
import OwnerRequestEditClient from "./OwnerRequestEditClient";
import { getAllRequestEdits } from "./actions";
import { getItems, getSuppliers } from "@/app/employee/riwayat/actions";

export default async function OwnerRequestEditPage() {
  const [edits, items, suppliers] = await Promise.all([
    getAllRequestEdits(),
    getItems(),
    getSuppliers(),
  ]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <OwnerRequestEditClient
        initialEdits={edits}
        initialItems={items}
        initialSuppliers={suppliers}
      />
    </Suspense>
  );
}
