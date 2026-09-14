"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { Spinner } from "@/components/portal/ui";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  match: (p: string) => boolean;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  clients: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  payments: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  exercises: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M6.5 6.5v11" />
      <path d="M17.5 6.5v11" />
      <path d="M3 9v6" />
      <path d="M21 9v6" />
      <path d="M6.5 12h11" />
    </svg>
  ),
  workouts: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  programs: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  signout: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const NAV_MAIN: NavItem[] = [
  { href: "/trainer", label: "Dashboard", icon: ICONS.dashboard, match: (p) => p === "/trainer" },
  { href: "/trainer/clients", label: "Clients", icon: ICONS.clients, match: (p) => p.startsWith("/trainer/clients") },
  { href: "/trainer/calendar", label: "Calendar", icon: ICONS.calendar, match: (p) => p.startsWith("/trainer/calendar") },
  { href: "/trainer/payments", label: "Payments", icon: ICONS.payments, match: (p) => p.startsWith("/trainer/payments") },
];

const NAV_LIBRARY: NavItem[] = [
  { href: "/trainer/exercises", label: "Exercises", icon: ICONS.exercises, match: (p) => p.startsWith("/trainer/exercises") },
  { href: "/trainer/workouts", label: "Workouts", icon: ICONS.workouts, match: (p) => p.startsWith("/trainer/workouts") },
  { href: "/trainer/programs", label: "Programs", icon: ICONS.programs, match: (p) => p.startsWith("/trainer/programs") },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm transition ${
        active
          ? "bg-terracotta/10 font-medium text-terracotta"
          : "text-text-muted hover:bg-bg-alt hover:text-text"
      }`}
    >
      <span className={active ? "text-terracotta" : "text-text-muted/80"}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

function SidebarContent({ pathname, onSignOut }: { pathname: string; onSignOut: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-6 pt-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta font-sans text-sm font-bold text-white">
          KA
        </span>
        <div>
          <p className="font-sans text-sm font-semibold leading-tight text-text">Keyla Avila</p>
          <p className="font-sans text-[11px] leading-tight text-text-muted">Coaching Studio</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_MAIN.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        <p className="px-3 pb-1 pt-5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted/70">
          Library
        </p>
        {NAV_LIBRARY.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm text-text-muted transition hover:bg-bg-alt hover:text-text"
        >
          {ICONS.signout}
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function TrainerLayout({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const loading = sessionLoading || profileLoading;
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/portal/login");
    } else if (profile && profile.role !== "trainer") {
      router.replace("/portal/dashboard");
    }
  }, [loading, session, profile, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/portal/login");
  }

  if (loading || !profile || profile.role !== "trainer") {
    return (
      <div className="theme-app min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="theme-app min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-white lg:block">
        <SidebarContent pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta font-sans text-xs font-bold text-white">
            KA
          </span>
          <span className="font-sans text-sm font-semibold text-text">Keyla Avila</span>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-text-muted transition hover:bg-bg-alt hover:text-text"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-text-muted hover:bg-bg-alt"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <SidebarContent pathname={pathname} onSignOut={handleSignOut} />
          </div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
