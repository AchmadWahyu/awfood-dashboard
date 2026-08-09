"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { seedAll } from "@/lib/dummy/seed";

export default function LoginPage() {
  useEffect(() => {
    seedAll();
  }, []);

  const { loginOwner, loginStaff } = useAuth();
  const [mode, setMode] = useState<"choose" | "owner" | "staff">("choose");
  const [staffCode, setStaffCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleOwner = () => {
    const ok = loginOwner();
    if (!ok) setError("Gagal login owner");
  };

  const handleStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = loginStaff(staffCode, pin);
    if (!ok) setError("Kode staff atau PIN salah");
  };

  return (
    <div className="flex min-h-full items-center justify-center notebook-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-notch-border bg-paper-light p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-marker text-white text-lg font-bold">A</div>
          <div>
            <h1 className="text-xl font-bold text-ink">AW Food</h1>
            <p className="text-xs text-ink-light">Login untuk test UX flow</p>
          </div>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("owner")}
              className="w-full rounded-xl border-2 border-notch-border px-4 py-3 text-left hover:bg-paper transition-colors"
            >
              <span className="block text-sm font-bold text-ink">👤 Login sebagai Owner</span>
              <span className="text-xs text-ink-light">Akses penuh dashboard</span>
            </button>
            <button
              onClick={() => setMode("staff")}
              className="w-full rounded-xl border-2 border-notch-border px-4 py-3 text-left hover:bg-paper transition-colors"
            >
              <span className="block text-sm font-bold text-ink">🧑‍🍳 Login sebagai Staff</span>
              <span className="text-xs text-ink-light">Form penutupan</span>
            </button>
            <div className="rounded-lg bg-marker-light/50 px-3 py-2 text-xs text-marker">
              <p className="font-semibold">Akun dummy:</p>
              <p>Owner: klik langsung</p>
              <p>Staff: B001 / 1234 atau A002 / 5678</p>
            </div>
          </div>
        )}

        {mode === "owner" && (
          <div className="space-y-4">
            <p className="text-sm text-ink-light">Klik tombol di bawah untuk masuk sebagai Owner (dummy).</p>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              onClick={handleOwner}
              className="w-full rounded-xl bg-marker px-4 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors"
            >
              Masuk sebagai Owner
            </button>
            <button onClick={() => setMode("choose")} className="text-xs text-ink-light underline hover:text-ink">← Kembali</button>
          </div>
        )}

        {mode === "staff" && (
          <form onSubmit={handleStaff} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink">Kode Staff</label>
              <input
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                className="rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker transition-colors"
                placeholder="B001"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink">PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker transition-colors"
                placeholder="1234"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-marker px-4 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors"
            >
              Masuk sebagai Staff
            </button>
            <button type="button" onClick={() => setMode("choose")} className="text-xs text-ink-light underline hover:text-ink">← Kembali</button>
          </form>
        )}
      </div>
    </div>
  );
}
