import { Suspense } from "react";
import OwnerLaporanClient from "./OwnerLaporanClient";

export default async function OwnerLaporanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-paper text-ink-light">Memuat...</div>}>
      <OwnerLaporanClient />
    </Suspense>
  );
}
