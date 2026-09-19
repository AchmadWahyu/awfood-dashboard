import { Suspense } from "react";
import { getDashboardData } from "./actions";
import { todayJakarta } from "@/lib/utils/date";
import OwnerDashboardClient from "./OwnerDashboardClient";

export default async function OwnerDashboardPage() {
  const data = await getDashboardData();
  const today = todayJakarta();
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <OwnerDashboardClient initialData={data} initialDate={today} />
    </Suspense>
  );
}
