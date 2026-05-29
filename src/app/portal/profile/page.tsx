"use client";

import { useEffect, useState } from "react";
import PortalGate from "@/components/portal/PortalGate";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  formatDuration,
  type WorkoutSession,
  type AssignedWorkout,
  type HealthIntake,
} from "@/lib/portal/types";
import { Card, Spinner, Field, TextInput, PortalButton } from "@/components/portal/ui";

interface SessionWithWorkout extends WorkoutSession {
  assigned_workout: Pick<AssignedWorkout, "day_label" | "week_of"> | null;
}

function ProfileInner() {
  const { profile, refresh } = useProfile();
  const [sessions, setSessions] = useState<SessionWithWorkout[]>([]);
  const [intake, setIntake] = useState<HealthIntake | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    (async () => {
      const supabase = getSupabaseBrowser();
      const [{ data: sess }, { data: hi }] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("*, assigned_workout:assigned_workouts(day_label, week_of)")
          .eq("client_id", profile.id)
          .eq("submitted", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("health_intake")
          .select("*")
          .eq("client_id", profile.id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setSessions((sess as SessionWithWorkout[]) ?? []);
      setIntake((hi as HealthIntake) ?? null);
      setLoading(false);
    })();
  }, [profile]);

  async function saveInfo() {
    if (!profile) return;
    setSaving(true);
    const supabase = getSupabaseBrowser();
    await supabase
      .from("profiles")
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq("id", profile.id);
    await refresh();
    setSaving(false);
    setEditing(false);
  }

  if (!profile) return <Spinner />;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="font-serif text-3xl font-light tracking-tight text-text md:text-4xl">
        Profile
      </h1>

      {/* Info */}
      <Card className="mt-6">
        <div className="flex items-start justify-between">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
            Your info
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="font-sans text-sm font-medium text-terracotta hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-4 space-y-4">
            <Field label="Full name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <div className="flex gap-3">
              <PortalButton variant="secondary" onClick={() => setEditing(false)} className="flex-1">
                Cancel
              </PortalButton>
              <PortalButton onClick={saveInfo} disabled={saving} className="flex-1">
                {saving ? "Saving…" : "Save"}
              </PortalButton>
            </div>
          </div>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Name" value={profile.full_name} />
            <Info label="Email" value={profile.email} />
            <Info label="Phone" value={profile.phone} />
            <Info
              label="Member since"
              value={new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            />
          </dl>
        )}
      </Card>

      {/* Body metrics snapshot */}
      {intake && (
        <Card className="mt-4">
          <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
            Health snapshot
          </h2>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Info label="Weight" value={intake.weight ? `${intake.weight} lbs` : null} />
            <Info label="Height" value={intake.height} />
            <Info label="Activity level" value={intake.activity_level} />
          </dl>
          {intake.goals && (
            <p className="mt-4 rounded-lg bg-bg p-3 font-sans text-sm text-text-muted">
              <span className="font-medium text-text">Goals:</span> {intake.goals}
            </p>
          )}
        </Card>
      )}

      {/* Workout history */}
      <section className="mt-8">
        <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Workout history
        </h2>
        {loading ? (
          <Spinner />
        ) : sessions.length === 0 ? (
          <Card className="text-center">
            <p className="font-sans text-sm text-text-muted">
              No logged workouts yet. Your completed sessions will show here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id} className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans text-base font-medium text-text">
                    {s.assigned_workout?.day_label ?? "Workout"}
                  </h3>
                  <p className="mt-0.5 font-sans text-xs text-text-muted">
                    {new Date(s.completed_at ?? s.created_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-bg-alt px-3 py-1 font-sans text-xs font-medium text-text-muted">
                  {s.total_duration_seconds != null
                    ? formatDuration(s.total_duration_seconds)
                    : "—"}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="font-sans text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-sans text-sm text-text">{value || "—"}</dd>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PortalGate>
      <ProfileInner />
    </PortalGate>
  );
}
