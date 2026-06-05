"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkoutInner } from "@/app/portal/workout/[id]/page";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Spinner } from "@/components/portal/ui";

export default function TrainerClientWorkoutPage({
  params,
}: {
  params: Promise<{ id: string; workoutId: string }>;
}) {
  const { id: clientId, workoutId } = use(params);
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [clientName, setClientName] = useState<string | null>(null);
  const loading = sessionLoading || profileLoading;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/portal/login");
    } else if (profile && profile.role !== "trainer") {
      router.replace("/portal/dashboard");
    }
  }, [loading, session, profile, router]);

  useEffect(() => {
    if (!session || profile?.role !== "trainer") return;
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", clientId)
        .maybeSingle();
      setClientName((data?.full_name as string | null) ?? "Client");
    })();
  }, [session, profile?.role, clientId]);

  if (loading || !profile || profile.role !== "trainer" || clientName === null) {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  return (
    <WorkoutInner
      id={workoutId}
      trainer={{
        clientId,
        clientName,
        backHref: `/trainer/clients/${clientId}?tab=assign`,
      }}
    />
  );
}
