"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";
import Avatar from "@/components/portal/Avatar";

interface SessionRow {
  client_id: string;
  created_at: string;
  assigned_workout: { day_label: string } | null;
}
interface CheckinRow {
  client_id: string | null;
  client_name: string;
  created_at: string;
}
interface EventRow {
  client_id: string;
  title: string;
  type: string;
}
interface TodayWorkout {
  client_id: string;
  day_label: string;
  status: string;
}

interface ActivityItem {
  key: string;
  clientId: string | null;
  clientName: string;
  action: string;
  at: string;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const EVENT_LABEL: Record<string, string> = {
  rest: "Rest day",
  session: "Session",
  appointment: "Appointment",
  checkin: "Check-in",
  other: "Event",
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventRow[]>([]);
  const [todayWorkouts, setTodayWorkouts] = useState<TodayWorkout[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const today = localDateStr(new Date());
      const [{ data: profs }, { data: sess }, { data: cis }, { data: evts }, { data: tw }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("role", "client"),
          supabase
            .from("workout_sessions")
            .select("client_id, created_at, assigned_workout:assigned_workouts(day_label)")
            .eq("submitted", true)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("checkins")
            .select("client_id, client_name, created_at")
            .order("created_at", { ascending: false })
            .limit(200),
          supabase.from("calendar_events").select("client_id, title, type").eq("event_date", today),
          supabase
            .from("assigned_workouts")
            .select("client_id, day_label, status")
            .eq("scheduled_date", today),
        ]);
      setClients((profs as Profile[]) ?? []);
      setSessions((sess as unknown as SessionRow[]) ?? []);
      setCheckins((cis as CheckinRow[]) ?? []);
      setTodayEvents((evts as EventRow[]) ?? []);
      setTodayWorkouts((tw as TodayWorkout[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  const byId = new Map(clients.map((c) => [c.id, c]));
  const nameOf = (id: string | null, fallback = "Client") =>
    (id && byId.get(id)?.full_name) || fallback;
  const colorOf = (id: string | null) => (id && byId.get(id)?.color) || null;

  const ClientTag = ({ id, extra }: { id: string; extra?: string }) => (
    <p className="flex items-center gap-1.5 font-sans text-xs text-text-muted">
      {colorOf(id) && (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf(id)! }} />
      )}
      {extra ? `${extra} · ` : ""}
      {nameOf(id)}
    </p>
  );

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const activeClients = clients.filter((c) => c.onboarding_complete);
  const workouts7d = sessions.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length;
  const checkins7d = checkins.filter((c) => new Date(c.created_at).getTime() >= weekAgo).length;

  // Latest activity per client for "needs attention".
  const lastWorkoutAt = new Map<string, number>();
  for (const s of sessions) {
    const t = new Date(s.created_at).getTime();
    if (!lastWorkoutAt.has(s.client_id)) lastWorkoutAt.set(s.client_id, t);
  }
  const lastCheckinAt = new Map<string, number>();
  for (const c of checkins) {
    const t = new Date(c.created_at).getTime();
    if (c.client_id && !lastCheckinAt.has(c.client_id)) lastCheckinAt.set(c.client_id, t);
    const key = (c.client_name ?? "").trim().toLowerCase();
    if (key && !lastCheckinAt.has(`name:${key}`)) lastCheckinAt.set(`name:${key}`, t);
  }
  const needsAttention = activeClients
    .map((c) => {
      const lw = lastWorkoutAt.get(c.id) ?? 0;
      const lc =
        lastCheckinAt.get(c.id) ??
        lastCheckinAt.get(`name:${(c.full_name ?? "").trim().toLowerCase()}`) ??
        0;
      const flags: string[] = [];
      if (lw < weekAgo) flags.push(lw === 0 ? "No workouts logged yet" : "No workout in 7+ days");
      if (lc < twoWeeksAgo) flags.push(lc === 0 ? "No check-ins yet" : "No check-in in 14+ days");
      return { client: c, flags };
    })
    .filter((x) => x.flags.length > 0)
    .slice(0, 6);

  // Merged activity feed.
  const activity: ActivityItem[] = [
    ...sessions.slice(0, 12).map((s) => ({
      key: `s-${s.client_id}-${s.created_at}`,
      clientId: s.client_id,
      clientName: nameOf(s.client_id),
      action: `completed ${s.assigned_workout?.day_label ?? "a workout"}`,
      at: s.created_at,
    })),
    ...checkins.slice(0, 12).map((c) => ({
      key: `c-${c.client_id ?? c.client_name}-${c.created_at}`,
      clientId: c.client_id,
      clientName: nameOf(c.client_id, c.client_name || "Client"),
      action: "submitted a weekly check-in",
      at: c.created_at,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="font-serif text-2xl tracking-tight text-text">Dashboard</h1>
        <p className="mt-0.5 font-sans text-sm text-text-muted">{todayLabel}</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Active clients" value={activeClients.length} href="/trainer/clients" />
        <Stat label="Workouts · 7 days" value={workouts7d} />
        <Stat label="Check-ins · 7 days" value={checkins7d} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Today */}
        <Card>
          <SectionTitle title="Today" href="/trainer/calendar" linkLabel="Calendar" />
          {todayWorkouts.length === 0 && todayEvents.length === 0 ? (
            <Empty text="Nothing scheduled for today." />
          ) : (
            <ul className="space-y-2.5">
              {todayWorkouts.map((w, i) => (
                <li key={`w-${i}`} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-medium text-text">{w.day_label}</p>
                    <ClientTag id={w.client_id} />
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                      w.status === "completed"
                        ? "bg-olive/10 text-olive"
                        : w.status === "in_progress"
                        ? "bg-terracotta/10 text-terracotta"
                        : "bg-bg-alt text-text-muted"
                    }`}
                  >
                    {w.status === "completed" ? "Done" : w.status === "in_progress" ? "Active" : "Planned"}
                  </span>
                </li>
              ))}
              {todayEvents.map((e, i) => (
                <li key={`e-${i}`} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-alt text-text-muted">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-medium text-text">{e.title}</p>
                    <ClientTag id={e.client_id} extra={EVENT_LABEL[e.type] ?? "Event"} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Needs attention */}
        <Card>
          <SectionTitle title="Needs attention" href="/trainer/clients" linkLabel="All clients" />
          {needsAttention.length === 0 ? (
            <Empty text="Everyone is on track. Nice." />
          ) : (
            <ul className="space-y-2.5">
              {needsAttention.map(({ client, flags }) => (
                <li key={client.id}>
                  <Link
                    href={`/trainer/clients/${client.id}`}
                    className="group flex items-center gap-3 rounded-lg p-1 transition hover:bg-bg-alt/60"
                  >
                    <Avatar name={client.full_name} url={client.avatar_url} size={34} color={client.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm font-medium text-text group-hover:text-terracotta">
                        {client.full_name || "Unnamed"}
                      </p>
                      <p className="truncate font-sans text-xs text-burgundy">{flags.join(" · ")}</p>
                    </div>
                    <svg
                      className="shrink-0 text-text-muted/50"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="mt-5">
        <SectionTitle title="Recent activity" />
        {activity.length === 0 ? (
          <Empty text="No activity yet — it shows up here when clients log workouts or check in." />
        ) : (
          <ul className="divide-y divide-border/70">
            {activity.map((a) => (
              <li key={a.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Avatar
                  name={a.clientName}
                  url={(a.clientId && byId.get(a.clientId)?.avatar_url) || null}
                  color={(a.clientId && byId.get(a.clientId)?.color) || null}
                  size={30}
                />
                <p className="min-w-0 flex-1 truncate font-sans text-sm text-text">
                  {a.clientId ? (
                    <Link href={`/trainer/clients/${a.clientId}`} className="font-medium hover:text-terracotta">
                      {a.clientName}
                    </Link>
                  ) : (
                    <span className="font-medium">{a.clientName}</span>
                  )}{" "}
                  <span className="text-text-muted">{a.action}</span>
                </p>
                <span className="shrink-0 font-sans text-xs text-text-muted">{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="font-sans text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-sans text-2xl font-semibold tracking-tight text-text">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-sans text-sm font-semibold text-text">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="font-sans text-xs font-medium text-terracotta hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-4 text-center font-sans text-sm text-text-muted">{text}</p>;
}

export default function TrainerHome() {
  return (
    <TrainerLayout>
      <Dashboard />
    </TrainerLayout>
  );
}
