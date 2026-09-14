"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalGate from "@/components/portal/PortalGate";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { currentWeekMonday, formatDayLabel, type AssignedWorkout } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";

const STATUS_LABEL: Record<string, string> = {
  assigned: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
      const sorted = ((data as AssignedWorkout[]) ?? []).sort((a, b) => {
        const da = a.scheduled_date ?? "";
        const db = b.scheduled_date ?? "";
        if (da && db && da !== db) return da < db ? -1 : 1;
        if (da && !db) return -1;
        if (!da && db) return 1;
        return a.order_index - b.order_index;
      });
      setWorkouts(sorted);
      setLoading(false);
    })();
  }, [profile]);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const today = localDateStr(new Date());
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Hero: today's scheduled workout first, otherwise the next incomplete one.
  const incomplete = workouts.filter((w) => w.status !== "completed");
  const hero =
    incomplete.find((w) => w.scheduled_date === today) ?? incomplete[0] ?? null;
  const rest = workouts.filter((w) => w.id !== hero?.id);
  const doneCount = workouts.filter((w) => w.status === "completed").length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-7">
        <p className="font-sans text-sm text-text-muted">{todayLabel}</p>
        <h1 className="mt-0.5 font-serif text-3xl tracking-tight text-text">
          Hi {firstName}
        </h1>
        {workouts.length > 0 && (
          <p className="mt-1.5 font-sans text-sm text-text-muted">
            {doneCount} of {workouts.length} workout{workouts.length === 1 ? "" : "s"} done this week
          </p>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Hero: today / next up */}
          {hero ? (
            <Link href={`/portal/workout/${hero.id}`} className="block">
              <div className="rounded-2xl bg-terracotta p-6 text-white shadow-md transition hover:shadow-lg">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                  {hero.scheduled_date === today ? "Today's workout" : "Next up"}
                </p>
                <h2 className="mt-1.5 font-sans text-2xl font-semibold tracking-tight">
                  {hero.day_label}
                </h2>
                {hero.scheduled_date && (
                  <p className="mt-1 font-sans text-sm text-white/80">
                    {formatDayLabel(hero.scheduled_date)}
                  </p>
                )}
                <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-sans text-sm font-semibold text-terracotta">
                  {hero.status === "in_progress" ? "Resume workout" : "Start workout"}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>
          ) : workouts.length > 0 ? (
            <Card className="border-olive/30 bg-olive/5 text-center">
              <p className="font-sans text-2xl">🎉</p>
              <p className="mt-1 font-sans text-base font-semibold text-text">All done for the week!</p>
              <p className="mt-1 font-sans text-sm text-text-muted">
                Every workout is complete. Great work.
              </p>
            </Card>
          ) : (
            <Card className="text-center">
              <p className="font-sans text-sm text-text-muted">
                No workouts assigned this week yet. Keyla will set you up soon.
              </p>
            </Card>
          )}

          {/* Rest of the week */}
          {rest.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                This week
              </h2>
              <div className="space-y-2.5">
                {rest.map((w) => {
                  const done = w.status === "completed";
                  const inner = (
                    <div
                      className={`flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition ${
                        done ? "opacity-70" : "hover:border-terracotta/40 hover:shadow-md"
                      }`}
                    >
                      <div className="min-w-0">
                        <h3 className="truncate font-sans text-sm font-semibold text-text">{w.day_label}</h3>
                        <p className="mt-0.5 font-sans text-xs text-text-muted">
                          {w.scheduled_date ? formatDayLabel(w.scheduled_date) : STATUS_LABEL[w.status]}
                          {w.scheduled_date ? ` · ${STATUS_LABEL[w.status]}` : ""}
                        </p>
                      </div>
                      {done ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive/15 text-olive">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <span className="shrink-0 font-sans text-sm font-medium text-terracotta">
                          {w.status === "in_progress" ? "Resume →" : "Start →"}
                        </span>
                      )}
                    </div>
                  );
                  return done ? (
                    <div key={w.id}>{inner}</div>
                  ) : (
                    <Link key={w.id} href={`/portal/workout/${w.id}`} className="block">
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Quick actions */}
      <section className="mt-8">
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Quick actions
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <QuickLink
            href={profile ? `/checkin/${profile.id}` : "/checkin"}
            title="Weekly Check-In"
            desc="Log your week & photos"
          />
          <QuickLink href="/portal/nutrition" title="Nutrition" desc="Meal plan & macros" />
          <QuickLink href="/portal/profile" title="Profile" desc="History & your info" />
        </div>
      </section>
    </main>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="h-full !p-4 transition hover:border-terracotta/40 hover:shadow-md">
        <h3 className="font-sans text-sm font-semibold text-text">{title}</h3>
        <p className="mt-0.5 font-sans text-xs text-text-muted">{desc}</p>
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
