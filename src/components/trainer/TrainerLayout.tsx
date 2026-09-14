"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { Spinner } from "@/components/portal/ui";

const NAV = [
  { href: "/trainer", label: "Clients", match: (p: string) => p === "/trainer" || p.startsWith("/trainer/clients") },
  { href: "/trainer/payments", label: "Payments", match: (p: string) => p.startsWith("/trainer/payments") },
  { href: "/trainer/calendar", label: "Calendar", match: (p: string) => p.startsWith("/trainer/calendar") },
  { href: "/trainer/exercises", label: "Exercises", match: (p: string) => p.startsWith("/trainer/exercises") },
  { href: "/trainer/workouts", label: "Workouts", match: (p: string) => p.startsWith("/trainer/workouts") },
  { href: "/trainer/programs", label: "Programs", match: (p: string) => p.startsWith("/trainer/programs") },
];

export default function TrainerLayout({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const loading = sessionLoading || profileLoading;
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation.
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

  if (loading || !profile || profile.role !== "trainer") {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/trainer" className="font-serif text-xl font-light tracking-tight text-text">
              Keyla Avila
            </Link>
            <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 font-sans text-[11px] font-medium uppercase tracking-wider text-terracotta">
              Trainer
            </span>
          </div>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-sans text-sm transition ${
                  item.match(pathname) ? "text-terracotta" : "text-text-muted hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={async () => {
                await signOut();
                router.replace("/portal/login");
              }}
              className="font-sans text-sm text-text-muted transition hover:text-terracotta"
            >
              Sign Out
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-text-muted transition hover:bg-bg-alt hover:text-text md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav panel */}
        {menuOpen && (
          <nav className="border-t border-border bg-bg px-5 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2.5 font-sans text-sm transition ${
                  item.match(pathname)
                    ? "bg-terracotta/10 font-medium text-terracotta"
                    : "text-text-muted hover:bg-bg-alt hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={async () => {
                await signOut();
                router.replace("/portal/login");
              }}
              className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left font-sans text-sm text-text-muted transition hover:bg-bg-alt hover:text-terracotta"
            >
              Sign Out
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
