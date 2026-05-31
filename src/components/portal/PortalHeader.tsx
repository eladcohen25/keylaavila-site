"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/hooks/useSession";

const NAV = [
  { href: "/portal/dashboard", label: "Home" },
  { href: "/portal/calendar", label: "Calendar" },
  { href: "/portal/nutrition", label: "Nutrition" },
  { href: "/portal/profile", label: "Profile" },
];

export default function PortalHeader({ name }: { name?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link
          href="/portal/dashboard"
          className="font-serif text-xl font-light tracking-tight text-text"
        >
          Keyla Avila
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-sans text-sm transition ${
                pathname === item.href
                  ? "text-terracotta"
                  : "text-text-muted hover:text-text"
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

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-text md:hidden"
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-bg px-5 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-2.5 font-sans text-sm ${
                pathname === item.href ? "text-terracotta" : "text-text"
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
            className="block w-full py-2.5 text-left font-sans text-sm text-text-muted"
          >
            Sign Out
          </button>
        </nav>
      )}
    </header>
  );
}
