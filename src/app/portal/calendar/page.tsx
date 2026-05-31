"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PortalGate from "@/components/portal/PortalGate";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import CalendarMonth, { type DayMarks } from "@/components/portal/CalendarMonth";
import { Card, Spinner } from "@/components/portal/ui";
import {
  addMonths,
  monthMatrix,
  todayYmd,
  formatFullDay,
  CALENDAR_EVENT_META,
  type AssignedWorkout,
  type CalendarEvent,
  type DayNote,
} from "@/lib/portal/types";

function CalendarInner() {
  const { profile } = useProfile();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(todayYmd());
  const [workouts, setWorkouts] = useState<AssignedWorkout[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<DayNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [rangeStart, rangeEnd] = useMemo(() => {
    const weeks = monthMatrix(monthAnchor);
    return [weeks[0][0], weeks[5][6]];
  }, [monthAnchor]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const [{ data: w }, { data: e }, { data: n }] = await Promise.all([
      supabase
        .from("assigned_workouts")
        .select("*")
        .eq("client_id", profile.id)
        .not("scheduled_date", "is", null)
        .gte("scheduled_date", rangeStart)
        .lte("scheduled_date", rangeEnd),
      supabase
        .from("calendar_events")
        .select("*")
        .eq("client_id", profile.id)
        .gte("event_date", rangeStart)
        .lte("event_date", rangeEnd),
      supabase
        .from("day_notes")
        .select("*")
        .eq("client_id", profile.id)
        .gte("note_date", rangeStart)
        .lte("note_date", rangeEnd),
    ]);
    setWorkouts((w as AssignedWorkout[]) ?? []);
    setEvents((e as CalendarEvent[]) ?? []);
    setNotes((n as DayNote[]) ?? []);
    setLoading(false);
  }, [profile, rangeStart, rangeEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const marks = useMemo(() => {
    const map: Record<string, DayMarks> = {};
    for (const w of workouts) {
      if (!w.scheduled_date) continue;
      const m = (map[w.scheduled_date] ??= {});
      m.workouts = (m.workouts ?? 0) + 1;
      if (w.status !== "completed") m.completed = false;
      else if (m.completed === undefined) m.completed = true;
    }
    for (const e of events) {
      const m = (map[e.event_date] ??= {});
      m.events = (m.events ?? 0) + 1;
    }
    for (const n of notes) {
      const m = (map[n.note_date] ??= {});
      m.hasNote = true;
    }
    return map;
  }, [workouts, events, notes]);

  const dayWorkouts = workouts.filter((w) => w.scheduled_date === selected);
  const dayEvents = events.filter((e) => e.event_date === selected);
  const dayNote = notes.find((n) => n.note_date === selected && n.author_role === "trainer");

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-light tracking-tight text-text">Calendar</h1>
        <p className="mt-1 font-sans text-sm text-text-muted">
          {firstName}, here&apos;s your schedule. Tap a day for details.
        </p>
      </div>

      <CalendarMonth
        monthAnchor={monthAnchor}
        today={todayYmd()}
        selected={selected}
        marks={marks}
        onSelect={setSelected}
        onShiftMonth={(delta) => setMonthAnchor((a) => addMonths(a, delta))}
        onToday={() => {
          setMonthAnchor(new Date());
          setSelected(todayYmd());
        }}
      />

      <div className="mt-5">
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          {formatFullDay(selected)}
        </h2>

        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-3">
            {dayNote && (
              <Card className="border-l-4 border-l-terracotta">
                <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-terracotta">
                  Note from Keyla
                </p>
                <p className="whitespace-pre-wrap font-sans text-sm text-text">{dayNote.note}</p>
              </Card>
            )}

            {dayWorkouts.map((w) => {
              const done = w.status === "completed";
              const inner = (
                <Card
                  className={`flex items-center justify-between transition ${
                    done ? "opacity-70" : "hover:border-terracotta/40 hover:shadow-md"
                  }`}
                >
                  <div>
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Workout
                    </p>
                    <h3 className="font-sans text-base font-medium text-text">{w.day_label}</h3>
                  </div>
                  {done ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7355" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="font-sans text-sm font-medium text-terracotta">
                      {w.status === "in_progress" ? "Resume →" : "Start →"}
                    </span>
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

            {dayEvents.map((e) => {
              const meta = CALENDAR_EVENT_META[e.type];
              return (
                <Card key={e.id}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
                    <span className={`rounded-full px-2 py-0.5 font-sans text-[11px] font-medium ${meta.chip}`}>
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="mt-2 font-sans text-base font-medium text-text">{e.title}</h3>
                  {e.notes && <p className="mt-1 font-sans text-sm text-text-muted">{e.notes}</p>}
                </Card>
              );
            })}

            {dayWorkouts.length === 0 && dayEvents.length === 0 && !dayNote && (
              <Card className="text-center">
                <p className="font-sans text-sm text-text-muted">Nothing scheduled for this day.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function CalendarPage() {
  return (
    <PortalGate>
      <CalendarInner />
    </PortalGate>
  );
}
