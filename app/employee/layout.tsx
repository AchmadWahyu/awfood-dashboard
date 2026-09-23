"use client";

import { useAuth, useRequireRole } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isEnabled } from "@/lib/feature-flags";
import type { FeatureFlag } from "@/lib/feature-flags";

type NavItem = { href: string; label: string; flag?: FeatureFlag; icon: React.ReactNode };

const NAV: NavItem[] = [
  { href: "/employee/penutupan", label: "Penutupan", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  )},
  { href: "/employee/riwayat", label: "Riwayat", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )},
  { href: "/employee/klaim", label: "Klaim", flag: "klaim" as FeatureFlag, icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )},
  { href: "/employee/request-edit", label: "Edit", flag: "requestEdit" as FeatureFlag, icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  )},
].filter((n) => !n.flag || isEnabled(n.flag));

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  useRequireRole("STAFF");
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] notebook-bg flex flex-col pb-16 sm:pb-0">
      {/* Mobile/Tablet Header */}
      <header className="sticky top-0 z-10 border-b border-notch-border bg-paper-light/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-marker text-white text-xs font-bold">A</div>
            <div>
              <h1 className="text-sm font-bold text-ink leading-tight">AW Food</h1>
              <p className="text-xs text-marker leading-tight">Staff</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-light hidden sm:inline">{user?.full_name}</span>
            <button onClick={logout} className="rounded-lg border border-notch-border px-3 py-1 text-xs text-ink-light hover:bg-paper transition-colors active:scale-95">Logout</button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0">{children}</main>

      {/* Bottom Tab Bar (mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-notch-border bg-paper-light/95 backdrop-blur-sm sm:hidden">
        <div className="flex items-center justify-around">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  active ? "text-marker" : "text-ink-light"
                }`}
              >
                <span className={active ? "text-marker" : "text-ink-light"}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side/Top Nav (hidden on mobile) */}
      <nav className="hidden sm:flex sticky top-[53px] z-10 border-b border-notch-border bg-paper-light/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-2 flex gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                pathname === n.href ? "bg-marker text-white" : "text-ink-light hover:bg-paper"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
