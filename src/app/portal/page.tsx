"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { Spinner } from "@/components/portal/ui";

export default function PortalIndex() {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (sessionLoading || profileLoading) return;
    if (!session) {
      router.replace("/portal/login");
    } else if (profile?.role === "trainer") {
      router.replace("/trainer");
    } else if (profile && !profile.onboarding_complete) {
      router.replace("/portal/onboarding");
    } else {
      router.replace("/portal/dashboard");
    }
  }, [session, profile, sessionLoading, profileLoading, router]);

  return (
    <div className="min-h-screen bg-bg">
      <Spinner />
    </div>
  );
}
