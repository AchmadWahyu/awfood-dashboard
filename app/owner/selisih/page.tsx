import { Suspense } from "react";
import SelisihClient from "./SelisihClient";
import { getClosingsWithDiscrepancy } from "./actions";
import { getItems, getSuppliers } from "@/app/employee/riwayat/actions";

export default async function OwnerSelisihPage() {
  const [closings, items, suppliers] = await Promise.all([
    getClosingsWithDiscrepancy(),
    getItems(),
    getSuppliers(),
  ]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <SelisihClient
        initialClosings={closings}
        initialItems={items}
        initialSuppliers={suppliers}
      />
    </Suspense>
  );
}
