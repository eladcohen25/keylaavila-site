"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { Spinner, Card, PortalButton } from "@/components/portal/ui";

export default function TrainerHome() {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <Card className="max-w-md text-center">
        <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
          Trainer
        </span>
        <h1 className="mt-2 font-serif text-2xl font-light text-text">
          Hi {profile.full_name?.split(" ")[0] || "Keyla"}
        </h1>
        <p className="mt-2 font-sans text-sm text-text-muted">
          The full trainer dashboard (client list, exercise library, program
          builder, and weekly assignments) arrives in Phase 2. Your data model is
          already live.
        </p>
        <div className="mt-6">
          <PortalButton
            variant="secondary"
            onClick={async () => {
              await signOut();
              router.replace("/portal/login");
            }}
          >
            Sign Out
          </PortalButton>
        </div>
      </Card>
    </div>
  );
}
