"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/hooks/useSession";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const NAV: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/portal/dashboard",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/portal/calendar",
    label: "Calendar",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/portal/nutrition",
    label: "Nutrition",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    href: "/portal/profile",
    label: "Profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function PortalHeader({ name }: { name?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const firstName = name?.split(" ")[0];

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/portal/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta font-sans text-xs font-bold text-white">
              KA
            </span>
            <span className="font-sans text-sm font-semibold text-text">
              {firstName ? `${firstName}'s Training` : "Keyla Avila"}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-sans text-sm transition ${
                  pathname === item.href ? "font-medium text-terracotta" : "text-text-muted hover:text-text"
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

          {/* Mobile: sign out only — main nav lives in the bottom tab bar */}
          <button
            onClick={async () => {
              await signOut();
              router.replace("/portal/login");
            }}
            className="rounded-lg p-2 text-text-muted transition hover:bg-bg-alt hover:text-text md:hidden"
            aria-label="Sign out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 font-sans text-[10px] font-medium transition ${
                  active ? "text-terracotta" : "text-text-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
