"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { Spinner } from "@/components/portal/ui";

const NAV = [
  { href: "/trainer", label: "Clients", match: (p: string) => p === "/trainer" || p.startsWith("/trainer/clients") },
  { href: "/trainer/exercises", label: "Exercises", match: (p: string) => p.startsWith("/trainer/exercises") },
  { href: "/trainer/programs", label: "Programs", match: (p: string) => p.startsWith("/trainer/programs") },
];

export default function TrainerLayout({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const loading = sessionLoading || profileLoading;

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
          <nav className="flex items-center gap-6">
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
