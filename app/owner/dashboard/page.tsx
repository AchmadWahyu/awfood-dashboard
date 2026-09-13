import { Suspense } from "react";
import { getDashboardData } from "./actions";
import OwnerDashboardClient from "./OwnerDashboardClient";

export default async function OwnerDashboardPage() {
  const data = await getDashboardData();
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <OwnerDashboardClient initialData={data} />
    </Suspense>
  );
}
