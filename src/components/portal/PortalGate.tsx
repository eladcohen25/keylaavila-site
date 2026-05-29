"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import PortalHeader from "@/components/portal/PortalHeader";
import { Spinner } from "@/components/portal/ui";

/**
 * Client-side gate for the client portal.
 * - No session → /portal/login
 * - Trainer role → /trainer (Phase 2 area)
 * - onboarding_complete = false → /portal/onboarding (unless already there)
 *
 * Security note: this is UX gating only. Real authorization is enforced by
 * Supabase RLS on every table, so a client can never read another user's data
 * even if they reach a page directly.
 */
export default function PortalGate({
  children,
  requireOnboarding = true,
  hideHeader = false,
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
  hideHeader?: boolean;
}) {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  const loading = sessionLoading || profileLoading;

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/portal/login");
      return;
    }
    if (profile?.role === "trainer") {
      router.replace("/trainer");
      return;
    }
    if (
      requireOnboarding &&
      profile &&
      !profile.onboarding_complete &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/portal/onboarding")
    ) {
      router.replace("/portal/onboarding");
    }
  }, [loading, session, profile, requireOnboarding, router]);

  if (loading || !session || !profile) {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  if (profile.role === "trainer") {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {!hideHeader && <PortalHeader name={profile.full_name ?? undefined} />}
      {children}
    </div>
  );
}
