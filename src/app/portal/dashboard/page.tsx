"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalGate from "@/components/portal/PortalGate";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { currentWeekMonday, type AssignedWorkout } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";

const STATUS_STYLES: Record<string, string> = {
  assigned: "bg-bg-alt text-text-muted",
  in_progress: "bg-blush text-burgundy",
  completed: "bg-olive/15 text-olive",
};

const STATUS_LABEL: Record<string, string> = {
  assigned: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function DashboardInner() {
  const { profile } = useProfile();
  const [workouts, setWorkouts] = useState<AssignedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from("assigned_workouts")
        .select("*")
        .eq("client_id", profile.id)
        .eq("week_of", currentWeekMonday())
        .order("order_index", { ascending: true });
      setWorkouts((data as AssignedWorkout[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const weekLabel = new Date(currentWeekMonday()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light tracking-tight text-text md:text-4xl">
          Hi {firstName}
        </h1>
        <p className="mt-1 font-sans text-sm text-text-muted">
          Here&apos;s your training for the week of {weekLabel}.
        </p>
      </div>

      {/* This week's workouts */}
      <section className="mb-10">
        <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          This week&apos;s workouts
        </h2>

        {loading ? (
          <Spinner />
        ) : workouts.length === 0 ? (
          <Card className="text-center">
            <p className="font-sans text-sm text-text-muted">
              No workouts assigned for this week yet. Keyla will add them soon.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {workouts.map((w) => {
              const done = w.status === "completed";
              const inner = (
                <Card
                  className={`flex items-center justify-between transition ${
                    done ? "opacity-70" : "hover:border-terracotta/40 hover:shadow-md"
                  }`}
                >
                  <div>
                    <h3 className="font-sans text-base font-medium text-text">
                      {w.day_label}
                    </h3>
                    <span
                      className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium ${
                        STATUS_STYLES[w.status]
                      }`}
                    >
                      {STATUS_LABEL[w.status]}
                    </span>
                  </div>
                  {!done && (
                    <span className="font-sans text-sm font-medium text-terracotta">
                      {w.status === "in_progress" ? "Resume →" : "Start →"}
                    </span>
                  )}
                  {done && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7355" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </Card>
              );
              return done ? (
                <div key={w.id}>{inner}</div>
              ) : (
                <Link key={w.id} href={`/portal/workout/${w.id}`}>
                  {inner}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Quick links
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink href="/checkin" title="Weekly Check-In" desc="Log your week & progress photos" />
          <QuickLink href="/portal/nutrition" title="Nutrition" desc="Your meal plan & macros" />
          <QuickLink href="/portal/profile" title="Profile" desc="History & your info" />
        </div>
      </section>
    </main>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:border-terracotta/40 hover:shadow-md">
        <h3 className="font-sans text-sm font-medium text-text">{title}</h3>
        <p className="mt-1 font-sans text-xs text-text-muted">{desc}</p>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <PortalGate>
      <DashboardInner />
    </PortalGate>
  );
}
