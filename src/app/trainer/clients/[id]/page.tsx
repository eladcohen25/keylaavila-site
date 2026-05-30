"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import AssignPanel from "@/components/trainer/AssignPanel";
import NutritionEditor from "@/components/trainer/NutritionEditor";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  formatDuration,
  type Profile,
  type HealthIntake,
  type LiabilityWaiver,
} from "@/lib/portal/types";
import { Card, Spinner, ErrorBanner } from "@/components/portal/ui";

interface CheckIn {
  id: string;
  created_at: string;
  week_of: string;
  weight: number | null;
  sessions_with_keyla: number;
  session_difficulty: string;
  push_preference: string;
  nutrition_rating: number;
  recovery: string;
  energy_mood: number;
  weekly_notes: string | null;
  nutrition_notes: string | null;
  photo_front_url: string | null;
  photo_back_url: string | null;
}

interface SetLog {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  done: boolean;
  notes: string | null;
  assigned_exercise: { exercise: { name: string } | null } | null;
}
interface Session {
  id: string;
  created_at: string;
  completed_at: string | null;
  total_duration_seconds: number | null;
  day_label?: string;
  assigned_workout: { day_label: string } | null;
  set_logs: SetLog[];
}

type Tab = "overview" | "assign" | "nutrition" | "checkins" | "workouts";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ClientDetail({ id }: { id: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [intake, setIntake] = useState<HealthIntake | null>(null);
  const [waiver, setWaiver] = useState<LiabilityWaiver | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!prof) {
        router.replace("/trainer");
        return;
      }
      setProfile(prof as Profile);
      const fullName = (prof as Profile).full_name ?? "";

      const [{ data: hi }, { data: lw }, { data: ci }, { data: ws }] = await Promise.all([
        supabase
          .from("health_intake")
          .select("*")
          .eq("client_id", id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("liability_waivers")
          .select("*")
          .eq("client_id", id)
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        fullName
          ? supabase
              .from("checkins")
              .select("*")
              .ilike("client_name", fullName)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase
          .from("workout_sessions")
          .select(
            "*, assigned_workout:assigned_workouts(day_label), set_logs(*, assigned_exercise:assigned_exercises(exercise:exercises(name)))"
          )
          .eq("client_id", id)
          .eq("submitted", true)
          .order("created_at", { ascending: false }),
      ]);

      setIntake((hi as HealthIntake) ?? null);
      setWaiver((lw as LiabilityWaiver) ?? null);
      setCheckins((ci as CheckIn[]) ?? []);
      setSessions((ws as Session[]) ?? []);
      setLoading(false);
    })();
  }, [id, router]);

  if (loading || !profile) return <Spinner />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "assign", label: "Assign" },
    { id: "nutrition", label: "Nutrition" },
    { id: "checkins", label: `Check-ins${checkins.length ? ` (${checkins.length})` : ""}` },
    { id: "workouts", label: `Workouts${sessions.length ? ` (${sessions.length})` : ""}` },
  ];

  return (
    <>
      <Link
        href="/trainer"
        className="mb-4 inline-flex items-center gap-1 font-sans text-sm text-text-muted hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Clients
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-light tracking-tight text-text">
          {profile.full_name || "Unnamed client"}
        </h1>
        <div className="mt-1 flex flex-wrap gap-x-4 font-sans text-sm text-text-muted">
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>{profile.phone}</span>}
          <span>{profile.onboarding_complete ? "Onboarded" : "Onboarding pending"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg bg-bg-alt p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 font-sans text-sm font-medium transition ${
              tab === t.id ? "bg-white text-text shadow-sm" : "text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Overview intake={intake} waiver={waiver} clientId={id} clientName={profile.full_name} />
      )}
      {tab === "assign" && <AssignPanel clientId={id} />}
      {tab === "nutrition" && <NutritionEditor clientId={id} />}
      {tab === "checkins" && <CheckIns checkins={checkins} />}
      {tab === "workouts" && <Workouts sessions={sessions} />}
    </>
  );
}

function DangerZone({ clientId, clientName }: { clientId: string; clientName: string | null }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteClient() {
    const label = clientName || "this client";
    if (
      !confirm(
        `Permanently delete ${label}? This removes their account, workouts, logs, intake, waiver, and nutrition plan. This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    setError("");

    const supabase = getSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expired. Please log in again.");
      setDeleting(false);
      return;
    }

    const res = await fetch("/api/trainer/delete-client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ client_id: clientId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      setError(json.error || "Could not delete client.");
      setDeleting(false);
      return;
    }
    router.replace("/trainer");
  }

  return (
    <Card className="mt-5 border-burgundy/30">
      <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-burgundy">
        Danger zone
      </h2>
      <p className="mt-2 font-sans text-sm text-text-muted">
        Permanently delete this client and all of their data.
      </p>
      <ErrorBanner message={error} />
      <button
        onClick={deleteClient}
        disabled={deleting}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-burgundy/40 px-4 py-2.5 font-sans text-sm font-medium text-burgundy transition hover:bg-burgundy hover:text-white disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete client"}
      </button>
    </Card>
  );
}

function Overview({
  intake,
  waiver,
  clientId,
  clientName,
}: {
  intake: HealthIntake | null;
  waiver: LiabilityWaiver | null;
  clientId: string;
  clientName: string | null;
}) {
  return (
    <>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Health Intake
        </h2>
        {!intake ? (
          <p className="font-sans text-sm text-text-muted">Not submitted yet.</p>
        ) : (
          <dl className="space-y-3">
            <Row label="Date of birth" value={intake.dob} />
            <Row label="Height" value={intake.height} />
            <Row label="Weight" value={intake.weight ? `${intake.weight} lbs` : null} />
            <Row label="Activity level" value={intake.activity_level} />
            <Row label="Goals" value={intake.goals} />
            <Row label="Injuries" value={intake.injuries} />
            <Row label="Medical conditions" value={intake.medical_conditions} />
            <Row label="Medications" value={intake.medications} />
            <Row label="Emergency contact" value={
              intake.emergency_contact_name
                ? `${intake.emergency_contact_name}${intake.emergency_contact_phone ? ` · ${intake.emergency_contact_phone}` : ""}`
                : null
            } />
          </dl>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Liability Waiver
        </h2>
        {!waiver ? (
          <p className="font-sans text-sm text-text-muted">Not signed yet.</p>
        ) : (
          <dl className="space-y-3">
            <Row label="Status" value={waiver.agreed ? "✓ Agreed & signed" : "Not agreed"} />
            <Row label="Signed name" value={waiver.signed_name} />
            <Row label="Signed at" value={new Date(waiver.signed_at).toLocaleString()} />
            <Row label="Version" value={waiver.waiver_version} />
            <Row label="IP address" value={waiver.ip_address} />
          </dl>
        )}
      </Card>
    </div>
    <DangerZone clientId={clientId} clientName={clientName} />
    </>
  );
}

function CheckIns({ checkins }: { checkins: CheckIn[] }) {
  if (checkins.length === 0) {
    return (
      <Card className="text-center">
        <p className="font-sans text-sm text-text-muted">
          No check-ins found. (Check-ins are matched to this client by name.)
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {checkins.map((c) => (
        <Card key={c.id}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-sans text-base font-medium text-text">Week of {fmtDate(c.week_of)}</h3>
              <p className="font-sans text-xs text-text-muted">Submitted {fmtDate(c.created_at)}</p>
            </div>
            <div className="flex gap-2 font-sans text-[11px] font-medium">
              <span className="rounded-full bg-bg-alt px-2 py-1 text-text-muted">Energy {c.energy_mood}/5</span>
              <span className="rounded-full bg-bg-alt px-2 py-1 text-text-muted">Nutrition {c.nutrition_rating}/5</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 font-sans text-xs text-text-muted sm:grid-cols-4">
            <Mini label="Weight" value={c.weight ? `${c.weight} lbs` : "—"} />
            <Mini label="Sessions" value={String(c.sessions_with_keyla)} />
            <Mini label="Difficulty" value={c.session_difficulty?.replace(/_/g, " ")} />
            <Mini label="Wants" value={c.push_preference?.replace(/_/g, " ")} />
          </div>
          {(c.nutrition_notes || c.weekly_notes) && (
            <div className="mt-3 space-y-2">
              {c.nutrition_notes && (
                <p className="rounded-lg bg-bg p-3 font-sans text-xs text-text-muted">
                  <span className="font-medium text-text">Nutrition:</span> {c.nutrition_notes}
                </p>
              )}
              {c.weekly_notes && (
                <p className="rounded-lg bg-bg p-3 font-sans text-xs text-text-muted">
                  <span className="font-medium text-text">Notes:</span> {c.weekly_notes}
                </p>
              )}
            </div>
          )}
          {(c.photo_front_url || c.photo_back_url) && (
            <div className="mt-3 flex gap-3">
              {c.photo_front_url && <Photo url={c.photo_front_url} label="Front" />}
              {c.photo_back_url && <Photo url={c.photo_back_url} label="Back" />}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function Photo({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="relative block">
      <Image
        src={url}
        alt={label}
        width={120}
        height={160}
        className="h-40 w-auto rounded-lg object-cover"
        unoptimized
      />
      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {label}
      </span>
    </a>
  );
}

function Workouts({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <Card className="text-center">
        <p className="font-sans text-sm text-text-muted">No logged workout sessions yet.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {sessions.map((s) => {
        // group set logs by exercise name
        const groups = new Map<string, SetLog[]>();
        for (const log of s.set_logs ?? []) {
          const name = log.assigned_exercise?.exercise?.name ?? "Exercise";
          if (!groups.has(name)) groups.set(name, []);
          groups.get(name)!.push(log);
        }
        return (
          <Card key={s.id}>
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-medium text-text">
                {s.assigned_workout?.day_label ?? "Workout"}
              </h3>
              <span className="rounded-full bg-bg-alt px-3 py-1 font-sans text-xs font-medium text-text-muted">
                {fmtDate(s.completed_at ?? s.created_at)} ·{" "}
                {s.total_duration_seconds != null ? formatDuration(s.total_duration_seconds) : "—"}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {[...groups.entries()].map(([name, logs]) => (
                <div key={name}>
                  <p className="font-sans text-sm font-medium text-text">{name}</p>
                  <ul className="mt-1 space-y-0.5">
                    {logs
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((l) => (
                        <li
                          key={l.id}
                          className={`font-sans text-xs ${l.done ? "text-text" : "text-text-muted/60"}`}
                        >
                          {l.done ? "✓" : "○"} Set {l.set_number}:{" "}
                          {l.weight != null ? `${l.weight} lb` : "—"} ×{" "}
                          {l.reps != null ? `${l.reps}` : "—"} reps
                          {l.rpe != null ? ` @ RPE ${l.rpe}` : ""}
                        </li>
                      ))}
                  </ul>
                  {logs[0]?.notes && (
                    <p className="mt-1 font-sans text-xs italic text-text-muted">&ldquo;{logs[0].notes}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col border-b border-border/50 pb-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="font-sans text-xs font-medium uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="font-sans text-sm text-text sm:max-w-[60%] sm:text-right">{value || "—"}</dd>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-[10px] font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p className="font-sans text-sm capitalize text-text">{value}</p>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <TrainerLayout>
      <ClientDetail id={id} />
    </TrainerLayout>
  );
}
