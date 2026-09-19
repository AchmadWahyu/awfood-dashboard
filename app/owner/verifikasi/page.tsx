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
    <OwnerVerifikasiClient
      initialClosings={closings}
      initialItems={items}
      initialSuppliers={suppliers}
    />
  );
}
