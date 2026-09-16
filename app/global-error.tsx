"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-[100dvh] flex items-center justify-center bg-paper text-ink">
        <div className="text-center space-y-4 p-6">
          <h2 className="text-xl font-bold">Terjadi kesalahan</h2>
          <p className="text-sm text-ink-light">Silakan muat ulang halaman.</p>
          <button onClick={reset} className="rounded-xl bg-marker px-4 py-2 text-sm font-bold text-white hover:bg-marker-hover transition-colors">Coba Lagi</button>
        </div>
      </body>
    </html>
  );
}
