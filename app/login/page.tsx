"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ownerLogin } from "./actions";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(ownerLogin, null);
  const { user, setAuthenticatedUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state?.user) setAuthenticatedUser(state.user);
  }, [state, setAuthenticatedUser]);

  useEffect(() => {
    if (state?.user && user?.id === state.user.id) {
      router.replace("/owner/dashboard");
    }
  }, [router, state, user]);

  return (
    <div className="flex min-h-full items-center justify-center notebook-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-notch-border bg-paper-light p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-marker text-white text-lg font-bold">A</div>
          <div>
            <h1 className="text-xl font-bold text-ink">AW Food</h1>
            <p className="text-xs text-ink-light">Login Owner</p>
          </div>
        </div>

        <form action={action} className="space-y-4">
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker transition-colors"
              placeholder="awfood.owner@gmail.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
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
          <Link href="/login/pin" className="text-xs text-ink-light underline hover:text-ink">
            Login sebagai Staff dengan PIN →
          </Link>
        </div>
      </div>
    </div>
  );
}
