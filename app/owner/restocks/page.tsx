import { getRestocks } from "./actions";
import { getBeverageItems } from "../items/actions";
import OwnerRestocksClient from "./OwnerRestocksClient";

export default async function OwnerRestocksPage() {
  const [restocks, beverages] = await Promise.all([
    getRestocks(),
    getBeverageItems(),
  ]);
  return <OwnerRestocksClient initialRestocks={restocks} initialBeverages={beverages} />;
}
