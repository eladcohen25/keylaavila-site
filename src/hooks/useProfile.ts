"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useSession } from "@/hooks/useSession";
import type { Profile } from "@/lib/portal/types";

interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const { session, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      setLoading(false);
      return;
    }

    // Self-heal: an authenticated user with no profile row (e.g. signed up
    // before the trigger existed). Create a default client profile.
    const meta = (session.user.user_metadata ?? {}) as { full_name?: string };
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: session.user.id,
        email: session.user.email,
        full_name: meta.full_name ?? "",
      })
      .select("*")
      .maybeSingle();

    setProfile((created as Profile) ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (sessionLoading) return;
    setLoading(true);
    load();
  }, [sessionLoading, load]);

  return { profile, loading: loading || sessionLoading, refresh: load };
}
