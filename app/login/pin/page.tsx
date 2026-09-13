"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { staffLogin } from "../actions";
import { useAuth } from "@/lib/auth";

export default function StaffLoginPage() {
  const [state, action, pending] = useActionState(staffLogin, null);
  const { user, setAuthenticatedUser } = useAuth();
  const router = useRouter();

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
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              required
              autoComplete="off"
              className="rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-marker px-4 py-2.5 text-sm font-bold text-white hover:bg-marker-hover transition-colors disabled:opacity-50"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 border-t border-ruled pt-4 text-center">
          <Link href="/login" className="text-xs text-ink-light underline hover:text-ink">
            ← Login sebagai Owner
          </Link>
        </div>
      </div>
    </div>
  );
}
