"use client";

import { useActionState } from "react";
import { staffLogin } from "../actions";

export default function StaffLoginPage() {
  const [state, action, pending] = useActionState(staffLogin, null);

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          Login Staff
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Masuk menggunakan kode staff dan PIN
        </p>

        <form action={action} className="flex flex-col gap-4">
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="staff_code" className="text-sm font-medium">
              Kode Staff
            </label>
            <input
              id="staff_code"
              name="staff_code"
              type="text"
              required
              autoComplete="off"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="pin" className="text-sm font-medium">
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
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {pending ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <a href="/login" className="underline hover:text-zinc-800">
            ← Login sebagai Owner
          </a>
        </p>
      </div>
    </div>
  );
}
