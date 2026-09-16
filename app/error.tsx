"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[60dvh] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-ink-light">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h2 className="text-lg font-bold text-ink">Terjadi kesalahan</h2>
        <p className="text-sm text-ink-light">Silakan muat ulang halaman atau kembali ke dashboard.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors">Coba Lagi</button>
          <a href="/owner/dashboard" className="rounded-xl border border-notch-border px-4 py-2 text-xs text-ink-light hover:bg-paper transition-colors">Dashboard</a>
        </div>
      </div>
    </div>
  );
}
