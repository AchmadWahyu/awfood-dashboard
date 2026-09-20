"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { staffLogin } from "./actions";
import { useAuth } from "@/lib/auth";

export default function StaffLoginPage() {
  const [state, action, pending] = useActionState(staffLogin, null);
  const { user, setAuthenticatedUser } = useAuth();
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (state?.user) setAuthenticatedUser(state.user);
  }, [state, setAuthenticatedUser]);

  useEffect(() => {
    if (state?.user && user?.id === state.user.id) {
      router.replace("/employee/penutupan");
    }
  }, [router, state, user]);

  return (
    <div className="flex min-h-full items-center justify-center notebook-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-notch-border bg-paper-light p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-marker text-white text-lg font-bold">A</div>
          <div>
            <h1 className="text-xl font-bold text-ink">AW Food</h1>
            <p className="text-xs text-ink-light">Login Staff</p>
          </div>
        </div>

        <form action={action} className="flex flex-col gap-4">
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="staff_code" className="text-sm font-medium text-ink">
              Kode Staff
            </label>
            <input
              id="staff_code"
              name="staff_code"
              type="text"
              required
              autoComplete="off"
              className="rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="pin" className="text-sm font-medium text-ink">
              PIN
            </label>
            <div className="relative">
              <input
                id="pin"
                name="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                required
                autoComplete="off"
                className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 pr-10 text-sm outline-none focus:border-marker transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-light hover:text-ink"
                aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
              >
                {showPin ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-marker px-4 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors disabled:opacity-50"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
