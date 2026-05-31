"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import CalendarMonth, { type DayMarks } from "@/components/portal/CalendarMonth";
import { AddAssignedExercise } from "@/components/trainer/AssignPanel";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { assignProgramFromDate } from "@/lib/trainer/assign";
import { Card, Spinner, PortalButton, TextInput } from "@/components/portal/ui";
import {
  addMonths,
  monthMatrix,
  currentWeekMonday,
  todayYmd,
  formatFullDay,
  CALENDAR_EVENT_META,
  type AssignedWorkout,
  type CalendarEvent,
  type CalendarEventType,
  type DayNote,
  type Exercise,
} from "@/lib/portal/types";

interface ClientRow {
  id: string;
  full_name: string | null;
  email: string | null;
}
interface Program {
  id: string;
  name: string;
}
interface WorkoutWithExercises extends AssignedWorkout {
  assigned_exercises: Array<{
    id: string;
    order_index: number;
    target_sets: number | null;
    target_reps: string | null;
    exercise: Exercise | null;
  }>;
}

function TrainerCalendar() {
  const { profile } = useProfile();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [clientId, setClientId] = useState<string>(""); // "" = all clients

  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(todayYmd());

  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<DayNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [rangeStart, rangeEnd] = useMemo(() => {
    const weeks = monthMatrix(monthAnchor);
    return [weeks[0][0], weeks[5][6]];
  }, [monthAnchor]);

  // One-time reference data
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const [{ data: cl }, { data: pr }, { data: lib }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").eq("role", "client").order("full_name"),
        supabase.from("programs").select("id, name").order("name"),
        supabase.from("exercises").select("*").order("name"),
      ]);
      setClients((cl as ClientRow[]) ?? []);
      setPrograms((pr as Program[]) ?? []);
      setLibrary((lib as Exercise[]) ?? []);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseBrowser();

    let wq = supabase
      .from("assigned_workouts")
      .select("*, assigned_exercises(id, order_index, target_sets, target_reps, exercise:exercises(*))")
      .not("scheduled_date", "is", null)
      .gte("scheduled_date", rangeStart)
      .lte("scheduled_date", rangeEnd);
    let eq = supabase.from("calendar_events").select("*").gte("event_date", rangeStart).lte("event_date", rangeEnd);
    let nq = supabase.from("day_notes").select("*").gte("note_date", rangeStart).lte("note_date", rangeEnd);

    if (clientId) {
      wq = wq.eq("client_id", clientId);
      eq = eq.eq("client_id", clientId);
      nq = nq.eq("client_id", clientId);
    }

    const [{ data: w }, { data: e }, { data: n }] = await Promise.all([wq, eq, nq]);
    const sortedW = ((w as WorkoutWithExercises[]) ?? []).map((x) => ({
      ...x,
      assigned_exercises: [...(x.assigned_exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
    }));
    setWorkouts(sortedW);
    setEvents((e as CalendarEvent[]) ?? []);
    setNotes((n as DayNote[]) ?? []);
    setLoading(false);
  }, [clientId, rangeStart, rangeEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const marks = useMemo(() => {
    const map: Record<string, DayMarks> = {};
    for (const w of workouts) {
      if (!w.scheduled_date) continue;
      const m = (map[w.scheduled_date] ??= {});
      m.workouts = (m.workouts ?? 0) + 1;
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

  const nameOf = useCallback(
    (cid: string) => clients.find((c) => c.id === cid)?.full_name || "Unnamed client",
    [clients]
  );

  const dayWorkouts = workouts.filter((w) => w.scheduled_date === selected);
  const dayEvents = events.filter((e) => e.event_date === selected);
  const dayNote = notes.find((n) => n.note_date === selected && n.author_role === "trainer");

  // ─── Mutations (require a specific client) ───────────────────────────────
  async function addWorkout(label: string) {
    if (!clientId || !label.trim()) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    await supabase.from("assigned_workouts").insert({
      client_id: clientId,
      week_of: currentWeekMonday(new Date(selected + "T00:00:00")),
      scheduled_date: selected,
      day_label: label.trim(),
      status: "assigned",
      order_index: dayWorkouts.length,
    });
    setBusy(false);
    load();
  }

  async function assignProgram(programId: string) {
    if (!clientId || !programId) return;
    setBusy(true);
    await assignProgramFromDate(clientId, programId, selected);
    setBusy(false);
    load();
  }

  async function deleteWorkout(wid: string) {
    if (!confirm("Delete this workout?")) return;
    const supabase = getSupabaseBrowser();
    await supabase.from("assigned_workouts").delete().eq("id", wid);
    load();
  }

  async function addEvent(type: CalendarEventType, title: string, eventNotes: string) {
    if (!clientId || !title.trim()) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    await supabase.from("calendar_events").insert({
      client_id: clientId,
      event_date: selected,
      type,
      title: title.trim(),
      notes: eventNotes.trim() || null,
      created_by: profile?.id ?? null,
    });
    setBusy(false);
    load();
  }

  async function deleteEvent(eid: string) {
    const supabase = getSupabaseBrowser();
    await supabase.from("calendar_events").delete().eq("id", eid);
    load();
  }

  async function saveNote(text: string) {
    if (!clientId) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    if (!text.trim() && dayNote) {
      await supabase.from("day_notes").delete().eq("id", dayNote.id);
    } else if (text.trim()) {
      await supabase.from("day_notes").upsert(
        {
          client_id: clientId,
          note_date: selected,
          note: text.trim(),
          author_role: "trainer",
          created_by: profile?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,note_date,author_role" }
      );
    }
    setBusy(false);
    load();
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light tracking-tight text-text">Calendar</h1>
          <p className="mt-1 font-sans text-sm text-text-muted">
            Schedule workouts, programs, events, and day notes per client.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
            Client
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-sans text-sm text-text outline-none focus:border-terracotta sm:w-64"
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.email || "Unnamed"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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

        <div>
          <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            {formatFullDay(selected)}
          </h2>

          {loading ? (
            <Spinner />
          ) : (
            <div className="space-y-3">
              {/* Workouts */}
              {dayWorkouts.map((w) => (
                <Card key={w.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans text-base font-medium text-text">{w.day_label}</h3>
                      {!clientId && (
                        <span className="font-sans text-xs text-text-muted">· {nameOf(w.client_id)}</span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider ${
                          w.status === "completed"
                            ? "bg-olive/15 text-olive"
                            : w.status === "in_progress"
                              ? "bg-blush text-burgundy"
                              : "bg-bg-alt text-text-muted"
                        }`}
                      >
                        {w.status.replace("_", " ")}
                      </span>
                    </div>
                    {clientId && (
                      <button
                        onClick={() => deleteWorkout(w.id)}
                        className="font-sans text-xs text-text-muted hover:text-burgundy"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {w.assigned_exercises.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {w.assigned_exercises.map((ae) => (
                        <li key={ae.id} className="font-sans text-sm text-text-muted">
                          {ae.exercise?.name ?? "Exercise"}
                          {ae.target_sets || ae.target_reps
                            ? ` — ${ae.target_sets ?? "?"} × ${ae.target_reps ?? "?"}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  )}

                  {clientId && (
                    <AddAssignedExercise
                      workoutId={w.id}
                      library={library}
                      nextOrder={w.assigned_exercises.length}
                      onAdded={load}
                    />
                  )}
                </Card>
              ))}

              {/* Events */}
              {dayEvents.map((e) => {
                const meta = CALENDAR_EVENT_META[e.type];
                return (
                  <Card key={e.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 font-sans text-[11px] font-medium ${meta.chip}`}>
                          {meta.label}
                        </span>
                        {!clientId && (
                          <span className="font-sans text-xs text-text-muted">· {nameOf(e.client_id)}</span>
                        )}
                      </div>
                      {clientId && (
                        <button
                          onClick={() => deleteEvent(e.id)}
                          className="font-sans text-xs text-text-muted hover:text-burgundy"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <h3 className="mt-2 font-sans text-base font-medium text-text">{e.title}</h3>
                    {e.notes && <p className="mt-1 font-sans text-sm text-text-muted">{e.notes}</p>}
                  </Card>
                );
              })}

              {/* Existing note (all-clients view shows them read-only) */}
              {!clientId && dayNote && (
                <Card className="border-l-4 border-l-terracotta">
                  <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-terracotta">
                    Note · {nameOf(dayNote.client_id)}
                  </p>
                  <p className="whitespace-pre-wrap font-sans text-sm text-text">{dayNote.note}</p>
                </Card>
              )}

              {dayWorkouts.length === 0 && dayEvents.length === 0 && (!dayNote || clientId) && (
                <p className="font-sans text-sm text-text-muted">Nothing scheduled yet.</p>
              )}

              {/* Editing tools — require a specific client */}
              {clientId ? (
                <DayTools
                  busy={busy}
                  programs={programs}
                  note={dayNote?.note ?? ""}
                  onAddWorkout={addWorkout}
                  onAssignProgram={assignProgram}
                  onAddEvent={addEvent}
                  onSaveNote={saveNote}
                />
              ) : (
                <Card className="text-center">
                  <p className="font-sans text-sm text-text-muted">
                    Select a client above to add workouts, programs, events, or a day note.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <Link
        href="/trainer"
        className="mt-6 inline-flex items-center gap-1 font-sans text-sm text-text-muted hover:text-text"
      >
        ← Back to clients
      </Link>
    </>
  );
}

function DayTools({
  busy,
  programs,
  note,
  onAddWorkout,
  onAssignProgram,
  onAddEvent,
  onSaveNote,
}: {
  busy: boolean;
  programs: Program[];
  note: string;
  onAddWorkout: (label: string) => void;
  onAssignProgram: (programId: string) => void;
  onAddEvent: (type: CalendarEventType, title: string, notes: string) => void;
  onSaveNote: (text: string) => void;
}) {
  const [tab, setTab] = useState<"workout" | "program" | "event" | "note">("workout");
  const [label, setLabel] = useState("");
  const [programId, setProgramId] = useState("");
  const [evType, setEvType] = useState<CalendarEventType>("session");
  const [evTitle, setEvTitle] = useState("");
  const [evNotes, setEvNotes] = useState("");
  const [noteText, setNoteText] = useState(note);

  // keep the note editor in sync when switching days
  useEffect(() => {
    setNoteText(note);
  }, [note]);

  const fieldCls =
    "w-full rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30";

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "workout", label: "Workout" },
    { id: "program", label: "Program" },
    { id: "event", label: "Event" },
    { id: "note", label: "Note" },
  ];

  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-bg-alt p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-1.5 font-sans text-sm font-medium transition ${
              tab === t.id ? "bg-white text-text shadow-sm" : "text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "workout" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block font-sans text-xs font-medium text-text-muted">Workout label</label>
            <TextInput
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Push Day, Leg Session, In-Person…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && label.trim()) {
                  onAddWorkout(label);
                  setLabel("");
                }
              }}
            />
          </div>
          <PortalButton
            onClick={() => {
              onAddWorkout(label);
              setLabel("");
            }}
            disabled={!label.trim() || busy}
          >
            Add workout
          </PortalButton>
        </div>
      )}

      {tab === "program" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block font-sans text-xs font-medium text-text-muted">
              Program (lays each day on consecutive dates from this day)
            </label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={fieldCls}>
              <option value="">Choose a program…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <PortalButton
            onClick={() => {
              onAssignProgram(programId);
              setProgramId("");
            }}
            disabled={!programId || busy}
          >
            Assign
          </PortalButton>
        </div>
      )}

      {tab === "event" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-sans text-xs font-medium text-text-muted">Type</label>
              <select value={evType} onChange={(e) => setEvType(e.target.value as CalendarEventType)} className={fieldCls}>
                {(Object.keys(CALENDAR_EVENT_META) as CalendarEventType[]).map((t) => (
                  <option key={t} value={t}>
                    {CALENDAR_EVENT_META[t].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-xs font-medium text-text-muted">Title</label>
              <input className={fieldCls} value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="9am session" />
            </div>
          </div>
          <textarea
            className={`${fieldCls} resize-none`}
            rows={2}
            value={evNotes}
            onChange={(e) => setEvNotes(e.target.value)}
            placeholder="Details (optional)"
          />
          <PortalButton
            onClick={() => {
              onAddEvent(evType, evTitle, evNotes);
              setEvTitle("");
              setEvNotes("");
            }}
            disabled={!evTitle.trim() || busy}
          >
            Add event
          </PortalButton>
        </div>
      )}

      {tab === "note" && (
        <div className="space-y-3">
          <label className="block font-sans text-xs font-medium text-text-muted">
            Note for the client to read on this day
          </label>
          <textarea
            className={`${fieldCls} resize-none`}
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Bring resistance bands, focus on form, eat well beforehand…"
          />
          <PortalButton onClick={() => onSaveNote(noteText)} disabled={busy}>
            {noteText.trim() ? "Save note" : "Clear note"}
          </PortalButton>
        </div>
      )}
    </Card>
  );
}

export default function TrainerCalendarPage() {
  return (
    <TrainerLayout>
      <TrainerCalendar />
    </TrainerLayout>
  );
}
