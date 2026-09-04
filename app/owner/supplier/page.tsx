import { getSuppliers } from "./actions";
import OwnerSupplierClient from "./OwnerSupplierClient";

export default async function OwnerSupplierPage() {
  const suppliers = await getSuppliers();
  return <OwnerSupplierClient initialSuppliers={suppliers} />;
}