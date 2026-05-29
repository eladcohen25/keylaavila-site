"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/hooks/useSession";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/admin");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-text/10 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl font-light tracking-tight text-text">
              Keyla Avila
            </h1>
            <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 font-sans text-[11px] font-medium uppercase tracking-wider text-terracotta">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="font-sans text-sm text-text-muted transition hover:text-text"
            >
              Clients
            </button>
            <button
              onClick={async () => {
                await signOut();
                router.replace("/admin");
              }}
              className="font-sans text-sm text-text-muted transition hover:text-terracotta"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
