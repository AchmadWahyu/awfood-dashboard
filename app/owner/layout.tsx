"use client";

import { useState, useEffect } from "react";
import { useAuth, useRequireRole } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isEnabled } from "@/lib/feature-flags";
import type { FeatureFlag } from "@/lib/feature-flags";
import { getNavBadgeCounts } from "./actions";

type NavItem = { href: string; label: string; flag?: FeatureFlag };

const NAV: NavItem[] = [
  { href: "/owner/dashboard", label: "Dashboard" },
  { href: "/owner/supplier", label: "Supplier" },
  { href: "/owner/items", label: "Items" },
  { href: "/owner/restock", label: "Restock", flag: "restock" as FeatureFlag },
  { href: "/owner/verifikasi", label: "Verifikasi" },
  { href: "/owner/selisih", label: "Selisih" },
  { href: "/owner/klaim", label: "Klaim", flag: "klaim" as FeatureFlag },
  { href: "/owner/request-edit", label: "Req. Edit", flag: "requestEdit" as FeatureFlag },
  { href: "/owner/ledger", label: "Ledger", flag: "ledger" as FeatureFlag },
  { href: "/owner/pengeluaran", label: "Pengeluaran" },
  { href: "/owner/laporan", label: "Laporan" },
  { href: "/owner/karyawan", label: "Karyawan" },
].filter((n) => !n.flag || isEnabled(n.flag));

function NavLinks({
  pathname,
  counts,
  onNavigate,
}: {
  pathname: string;
  counts: { pendingCount: number; openDiscrepancyCount: number };
  onNavigate: () => void;
}) {
  return (
    <>
      {NAV.map((n) => {
        const count = n.label === "Selisih"
          ? counts.openDiscrepancyCount
          : n.label === "Verifikasi"
          ? counts.pendingCount
          : 0;
        const active = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-marker text-white" : "text-ink-light hover:bg-paper"
            }`}
          >
            <span>{n.label}</span>
            {count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white text-marker" : "bg-marker text-white"}`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  useRequireRole("OWNER");
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ pendingCount: 0, openDiscrepancyCount: 0 });

  useEffect(() => {
    getNavBadgeCounts().then(setCounts).catch(() => {});
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] flex notebook-bg">
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-notch-border bg-paper-light/95 backdrop-blur-sm px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-paper transition-colors" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <span className="text-xs font-medium text-ink-light">Menu</span>
          </button>
          <div>
            <h1 className="text-sm font-bold text-ink leading-tight">AW Food</h1>
            <p className="text-xs text-marker leading-tight">Owner</p>
          </div>
        </div>
        <button onClick={logout} className="rounded-lg border border-notch-border px-3 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Logout</button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform fixed lg:sticky top-0 left-0 z-40 w-64 h-[100dvh] shrink-0 border-r border-notch-border bg-paper-light/95 backdrop-blur-sm flex flex-col`}>
        <div className="px-5 py-4 border-b border-notch-border hidden lg:flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-marker text-white text-sm font-bold">A</div>
          <div>
            <h1 className="text-sm font-bold text-ink">AW Food</h1>
            <p className="text-xs text-ink-light">Owner Dashboard</p>
          </div>
        </div>
        <div className="lg:hidden h-14" /> {/* spacer for mobile header */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <NavLinks pathname={pathname} counts={counts} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="px-4 py-3 border-t border-notch-border hidden lg:block">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-light truncate max-w-[120px]">{user?.full_name}</span>
            <button onClick={logout} className="rounded-md border border-notch-border px-2 py-1 text-xs text-ink-light hover:bg-paper transition-colors">Logout</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
