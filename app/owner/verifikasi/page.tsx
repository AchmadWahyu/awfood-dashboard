import { Suspense } from "react";
import OwnerVerifikasiClient from "./OwnerVerifikasiClient";
import { getSubmittedClosings } from "./actions";
import { getItems, getSuppliers } from "@/app/employee/riwayat/actions";

export default async function OwnerVerifikasiPage() {
  const [closings, items, suppliers] = await Promise.all([
    getSubmittedClosings(),
    getItems(),
    getSuppliers(),
  ]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <OwnerVerifikasiClient
        initialClosings={closings}
        initialItems={items}
        initialSuppliers={suppliers}
      />
    </Suspense>
  );
}
