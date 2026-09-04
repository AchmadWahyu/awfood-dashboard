import { getItems, getBeverageItems } from "./actions";
import { getActiveSuppliers } from "../supplier/actions";
import OwnerItemsClient from "./OwnerItemsClient";

export default async function OwnerItemsPage() {
  const [items, suppliers, beverages] = await Promise.all([
    getItems(),
    getActiveSuppliers(),
    getBeverageItems(),
  ]);
  return <OwnerItemsClient initialItems={items} initialSuppliers={suppliers} initialBeverages={beverages} />;
}