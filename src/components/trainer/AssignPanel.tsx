"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { currentWeekMonday, formatDayLabel, type Exercise } from "@/lib/portal/types";
import { assignProgram, assignWorkoutTemplate, duplicateLastWeek } from "@/lib/trainer/assign";
import { Card, PortalButton, TextInput } from "@/components/portal/ui";
import { ExercisePrescriptionForm, WarmCoolEditor } from "@/app/trainer/programs/[id]/page";

interface Program {
  id: string;
  name: string;
}
interface WorkoutTemplate {
  id: string;
  name: string;
}
interface AssignedExerciseRow {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_rpe: string | null;
  rest_seconds: number | null;
  notes: string | null;
  use_percent: boolean;
  tempo: string | null;
  percent_1rm: number | null;
  each_side: boolean;
  superset_group: string | null;
  superset_order: number;
  exercise: Exercise | null;
}
interface AssignedWorkoutRow {
  id: string;
  day_label: string;
  scheduled_date: string | null;
  status: string;
  order_index: number;
  warmup_text: string | null;
  warmup_seconds: number | null;
  cooldown_text: string | null;
  cooldown_seconds: number | null;
  assigned_exercises: AssignedExerciseRow[];
}

function shiftWeek(weekOf: string, deltaWeeks: number): string {
  const d = new Date(weekOf + "T00:00:00");
  d.setDate(d.getDate() + deltaWeeks * 7);
  return d.toISOString().slice(0, 10);
}

export default function AssignPanel({ clientId }: { clientId: string }) {
  const [weekOf, setWeekOf] = useState(currentWeekMonday());
  const [workouts, setWorkouts] = useState<AssignedWorkoutRow[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [programId, setProgramId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateDate, setTemplateDate] = useState("");
  const [newDayLabel, setNewDayLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [msg, setMsg] = useState("");

  const loadWeek = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("assigned_workouts")
      .select("*, assigned_exercises(*, exercise:exercises(*))")
      .eq("client_id", clientId)
      .eq("week_of", weekOf)
      .order("order_index", { ascending: true });
    const sorted = ((data as AssignedWorkoutRow[]) ?? [])
      .map((w) => ({
        ...w,
        assigned_exercises: [...(w.assigned_exercises ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      }))
      .sort((a, b) => {
        const da = a.scheduled_date ?? "";
        const db = b.scheduled_date ?? "";
        if (da && db && da !== db) return da < db ? -1 : 1;
        if (da && !db) return -1;
        if (!da && db) return 1;
        return a.order_index - b.order_index;
      });
    setWorkouts(sorted);
    setLoading(false);
  }, [clientId, weekOf]);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const [{ data: progs }, { data: tpls }, { data: lib }] = await Promise.all([
        supabase.from("programs").select("id, name").order("name"),
        supabase.from("workout_templates").select("id, name").order("name"),
        supabase.from("exercises").select("*").order("name"),
      ]);
      setPrograms((progs as Program[]) ?? []);
      setTemplates((tpls as WorkoutTemplate[]) ?? []);
      setLibrary((lib as Exercise[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleAssignProgram() {
    if (!programId) return;
    setBusy(true);
    await assignProgram(clientId, programId, weekOf);
    setBusy(false);
    setProgramId("");
    flash("Program assigned for this week.");
    loadWeek();
  }

  async function handleAssignTemplate() {
    if (!templateId) return;
    setBusy(true);
    const targetWeek = templateDate
      ? currentWeekMonday(new Date(templateDate + "T00:00:00"))
      : weekOf;
    await assignWorkoutTemplate(clientId, templateId, targetWeek, templateDate || null);
    const tplName = templates.find((t) => t.id === templateId)?.name ?? "Workout";
    setBusy(false);
    setTemplateId("");
    // Jump to the week we just assigned into so it's visible right away.
    if (templateDate && targetWeek !== weekOf) {
      setWeekOf(targetWeek);
    } else {
      loadWeek();
    }
    flash(
      templateDate
        ? `${tplName} added for ${formatDayLabel(templateDate)}.`
        : `${tplName} added for this week.`
    );
    setTemplateDate("");
  }

  async function handleDuplicate() {
    setBusy(true);
    const n = await duplicateLastWeek(clientId, weekOf);
    setBusy(false);
    flash(n > 0 ? `Duplicated ${n} workout(s) from the previous week.` : "No prior week to duplicate.");
    loadWeek();
  }

  async function addBlank() {
    if (!newDayLabel.trim()) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    // If a specific date is chosen, pin the workout to that day and put it in
    // that date's week (so it shows up on the client's dashboard that week).
    const targetWeek = newDate ? currentWeekMonday(new Date(newDate + "T00:00:00")) : weekOf;
    await supabase.from("assigned_workouts").insert({
      client_id: clientId,
      week_of: targetWeek,
      scheduled_date: newDate || null,
      day_label: newDayLabel.trim(),
      status: "assigned",
      order_index: workouts.length,
    });
    setBusy(false);
    setNewDayLabel("");
    // Jump to the week we just assigned into so it's visible right away.
    if (newDate && targetWeek !== weekOf) {
      setWeekOf(targetWeek);
    } else {
      loadWeek();
    }
    setNewDate("");
    flash(newDate ? `Workout added for ${formatDayLabel(newDate)}.` : "Workout added for this week.");
  }

  async function deleteWorkout(id: string) {
    if (!confirm("Delete this assigned workout?")) return;
    const supabase = getSupabaseBrowser();
    await supabase.from("assigned_workouts").delete().eq("id", id);
    loadWeek();
  }

  const weekLabel = new Date(weekOf + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* Week selector */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOf((w) => shiftWeek(w, -1))}
              className="rounded-lg border border-border p-2 text-text-muted transition hover:border-terracotta hover:text-terracotta"
              aria-label="Previous week"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="text-center">
              <p className="font-sans text-[11px] uppercase tracking-wider text-text-muted">Week of</p>
              <p className="font-serif text-lg font-light text-text">{weekLabel}</p>
            </div>
            <button
              onClick={() => setWeekOf((w) => shiftWeek(w, 1))}
              className="rounded-lg border border-border p-2 text-text-muted transition hover:border-terracotta hover:text-terracotta"
              aria-label="Next week"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setWeekOf(currentWeekMonday())}
            className="font-sans text-xs font-medium text-terracotta hover:underline"
          >
            This week
          </button>
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none focus:border-terracotta"
            >
              <option value="">Assign from program…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <PortalButton onClick={handleAssignProgram} disabled={!programId || busy}>
              Assign
            </PortalButton>
          </div>
          <PortalButton variant="secondary" onClick={handleDuplicate} disabled={busy}>
            ⧉ Duplicate last week
          </PortalButton>
        </div>

        {/* Assign a saved single-session workout */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none focus:border-terracotta"
          >
            <option value="">Assign from workout…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={templateDate}
            onChange={(e) => setTemplateDate(e.target.value)}
            title="Pin to a specific day (optional)"
            className="rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none focus:border-terracotta sm:w-44"
          />
          <PortalButton onClick={handleAssignTemplate} disabled={!templateId || busy}>
            Assign
          </PortalButton>
        </div>

        {msg && <p className="mt-3 font-sans text-xs font-medium text-olive">{msg}</p>}
      </Card>

      {/* Assigned workouts this week */}
      {loading && workouts.length === 0 ? (
        <p className="font-sans text-sm text-text-muted">Loading…</p>
      ) : workouts.length === 0 ? (
        <Card className="text-center">
          <p className="font-sans text-sm text-text-muted">
            Nothing assigned for this week. Assign a program, duplicate last week, or add a blank day below.
          </p>
        </Card>
      ) : (
        workouts.map((w) => (
          <Card key={w.id}>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-lg font-light text-text">{w.day_label}</h3>
                {w.scheduled_date && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2 py-0.5 font-sans text-[11px] font-medium text-terracotta">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    {formatDayLabel(w.scheduled_date)}
                  </span>
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
              <div className="flex items-center gap-3">
                {(w.status === "assigned" || w.status === "in_progress") && (
                  <Link
                    href={`/trainer/clients/${clientId}/workout/${w.id}`}
                    className="rounded-lg bg-terracotta px-3 py-1.5 font-sans text-xs font-medium text-white transition hover:bg-terracotta/90"
                  >
                    {w.status === "in_progress" ? "Resume log" : "Log workout"}
                  </Link>
                )}
                <button
                  onClick={() => deleteWorkout(w.id)}
                  className="font-sans text-xs text-text-muted hover:text-burgundy"
                >
                  Delete
                </button>
              </div>
            </div>

            <WarmCoolEditor table="assigned_workouts" rowId={w.id} initial={w} />

            <WorkoutExercises workout={w} library={library} onChanged={loadWeek} />
          </Card>
        ))
      )}

      {/* Quick assign a workout */}
      <Card>
        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Quick assign a workout
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block font-sans text-xs font-medium text-text-muted">
              Label
            </label>
            <TextInput
              value={newDayLabel}
              onChange={(e) => setNewDayLabel(e.target.value)}
              placeholder="Push Day, Leg Session, In-Person…"
              onKeyDown={(e) => {
                if (e.key === "Enter") addBlank();
              }}
            />
          </div>
          <div className="sm:w-44">
            <label className="mb-1.5 block font-sans text-xs font-medium text-text-muted">
              Day (optional)
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-3 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
            />
          </div>
          <PortalButton onClick={addBlank} disabled={!newDayLabel.trim() || busy}>
            Add
          </PortalButton>
        </div>
        <p className="mt-2 font-sans text-xs text-text-muted">
          Pick a day to pin this session to a specific date (it shows on the client&apos;s dashboard that
          week). Leave the day blank to add it to the selected week.
        </p>
      </Card>
    </div>
  );
}

/** Group consecutive exercises that share a superset_group into blocks. */
function buildGroups(list: AssignedExerciseRow[]): AssignedExerciseRow[][] {
  const groups: AssignedExerciseRow[][] = [];
  for (const ae of list) {
    const last = groups[groups.length - 1];
    if (ae.superset_group && last && last[0].superset_group === ae.superset_group) {
      last.push(ae);
    } else {
      groups.push([ae]);
    }
  }
  return groups;
}

function ExerciseMeta({ ae }: { ae: AssignedExerciseRow }) {
  return (
    <p className="font-sans text-xs text-text-muted">
      {ae.target_sets ?? "?"} × {ae.target_reps ?? "?"}
      {ae.use_percent && ae.percent_1rm != null ? ` · ${ae.percent_1rm}% 1RM` : ""}
      {ae.target_rpe ? ` · RPE ${ae.target_rpe}` : ""}
      {ae.rest_seconds != null ? ` · ${ae.rest_seconds}s rest` : ""}
      {ae.tempo ? ` · tempo ${ae.tempo}` : ""}
      {ae.each_side ? " · each side" : ""}
    </p>
  );
}

function WorkoutExercises({
  workout,
  library,
  onChanged,
}: {
  workout: AssignedWorkoutRow;
  library: Exercise[];
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const list = workout.assigned_exercises;
  const groups = buildGroups(list);

  // Persist order_index across all exercises from a reordered group layout.
  async function persistOrder(newGroups: AssignedExerciseRow[][]) {
    const supabase = getSupabaseBrowser();
    let idx = 0;
    const updates: Promise<unknown>[] = [];
    for (const g of newGroups) {
      for (const ae of g) {
        updates.push(
          supabase.from("assigned_exercises").update({ order_index: idx }).eq("id", ae.id) as unknown as Promise<unknown>
        );
        idx += 1;
      }
    }
    await Promise.all(updates);
    onChanged();
  }

  function handleDrop(targetGi: number) {
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === targetGi) return;
    const next = [...groups];
    const [moved] = next.splice(from, 1);
    next.splice(targetGi, 0, moved);
    persistOrder(next);
  }

  /** Merge groups gi and gi+1 into a single superset (handles singles & supersets). */
  async function mergeAt(gi: number) {
    const a = groups[gi];
    const b = groups[gi + 1];
    if (!a || !b) return;
    const supabase = getSupabaseBrowser();
    const existing = a[0].superset_group || b[0].superset_group;
    const group =
      existing ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${a[0].id}-${b[0].id}`);
    const members = [...a, ...b];
    await Promise.all(
      members.map(
        (ae, i) =>
          supabase
            .from("assigned_exercises")
            .update({ superset_group: group, superset_order: i })
            .eq("id", ae.id) as unknown as Promise<unknown>
      )
    );
    onChanged();
  }

  async function unlink(group: string) {
    const supabase = getSupabaseBrowser();
    await supabase
      .from("assigned_exercises")
      .update({ superset_group: null, superset_order: 0 })
      .eq("superset_group", group);
    onChanged();
  }

  async function removeExercise(id: string) {
    const supabase = getSupabaseBrowser();
    await supabase.from("assigned_exercises").delete().eq("id", id);
    onChanged();
  }

  function DragHandle() {
    return (
      <div
        className="flex w-5 shrink-0 cursor-grab items-center justify-center text-text-muted/60 transition hover:text-terracotta active:cursor-grabbing"
        aria-hidden
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
    );
  }

  function Row({ ae }: { ae: AssignedExerciseRow }) {
    if (editingId === ae.id) {
      return (
        <EditAssignedExercise
          ae={ae}
          library={library}
          onDone={() => {
            setEditingId(null);
            onChanged();
          }}
          onCancel={() => setEditingId(null)}
        />
      );
    }
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-medium text-text">{ae.exercise?.name}</p>
          <ExerciseMeta ae={ae} />
          {ae.notes && <p className="font-sans text-xs italic text-text-muted">{ae.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setEditingId(ae.id)}
            className="font-sans text-xs font-medium text-terracotta hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => removeExercise(ae.id)}
            className="font-sans text-xs text-text-muted hover:text-burgundy"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  const canDrag = editingId === null && groups.length > 1;

  return (
    <>
      {groups.length > 0 && (
        <div className="mt-3">
          {groups.map((g, gi) => {
            const isSuperset = g.length > 1;
            const isDragging = dragIndex === gi;
            const isOver = overIndex === gi && dragIndex !== null && dragIndex !== gi;
            return (
              <div key={g[0].id}>
                <div
                  draggable={canDrag}
                  onDragStart={() => setDragIndex(gi)}
                  onDragOver={(e) => {
                    if (dragIndex === null) return;
                    e.preventDefault();
                    setOverIndex(gi);
                  }}
                  onDrop={() => handleDrop(gi)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`flex items-stretch gap-1.5 rounded-lg transition ${
                    isDragging ? "opacity-40" : ""
                  } ${isOver ? "ring-2 ring-terracotta/50" : ""}`}
                >
                  {canDrag && <DragHandle />}
                  <div className="flex-1">
                    {isSuperset ? (
                      <div className="rounded-lg border border-terracotta/40 bg-terracotta/[0.04] p-2">
                        <div className="mb-1 flex items-center justify-between px-1">
                          <span className="inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-terracotta">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                              <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                            </svg>
                            Superset
                          </span>
                          <button
                            onClick={() => unlink(g[0].superset_group!)}
                            className="font-sans text-[11px] text-text-muted hover:text-burgundy"
                          >
                            Unlink
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {g.map((ae, i) => (
                            <div key={ae.id} className="rounded-md border border-border bg-white px-3 py-2">
                              <div className="mb-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-terracotta/70">
                                A{i + 1}
                              </div>
                              <Row ae={ae} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-bg px-3 py-2">
                        <Row ae={g[0]} />
                      </div>
                    )}
                  </div>
                </div>

                {gi < groups.length - 1 && (
                  <div className="flex justify-center py-1">
                    <button
                      onClick={() => mergeAt(gi)}
                      title="Merge into a superset"
                      aria-label="Merge with next into a superset"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-text-muted transition hover:border-terracotta hover:text-terracotta"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2">
        <AddAssignedExercise
          workoutId={workout.id}
          library={library}
          nextOrder={list.length}
          onAdded={onChanged}
        />
      </div>
    </>
  );
}

function EditAssignedExercise({
  ae,
  library,
  onDone,
  onCancel,
}: {
  ae: AssignedExerciseRow;
  library: Exercise[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [exerciseId, setExerciseId] = useState(ae.exercise_id);
  const [sets, setSets] = useState(ae.target_sets != null ? String(ae.target_sets) : "");
  const [reps, setReps] = useState(ae.target_reps ?? "");
  const [rpe, setRpe] = useState(ae.target_rpe ?? "");
  const [rest, setRest] = useState(ae.rest_seconds != null ? String(ae.rest_seconds) : "");
  const [notes, setNotes] = useState(ae.notes ?? "");
  const [usePercent, setUsePercent] = useState(!!ae.use_percent);
  const [percent, setPercent] = useState(ae.percent_1rm != null ? String(ae.percent_1rm) : "");
  const [tempo, setTempo] = useState(ae.tempo ?? "");
  const [eachSide, setEachSide] = useState(!!ae.each_side);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!exerciseId) return;
    setSaving(true);
    const supabase = getSupabaseBrowser();
    await supabase
      .from("assigned_exercises")
      .update({
        exercise_id: exerciseId,
        target_sets: sets === "" ? null : Number(sets),
        target_reps: reps.trim() || null,
        target_rpe: rpe.trim() || null,
        rest_seconds: rest === "" ? null : Number(rest),
        notes: notes.trim() || null,
        use_percent: usePercent,
        percent_1rm: usePercent && percent !== "" ? Number(percent) : null,
        tempo: tempo.trim() || null,
        each_side: eachSide,
      })
      .eq("id", ae.id);
    setSaving(false);
    onDone();
  }

  return (
    <ExercisePrescriptionForm
      library={library}
      exerciseId={exerciseId}
      onPick={setExerciseId}
      sets={sets} setSets={setSets}
      reps={reps} setReps={setReps}
      rpe={rpe} setRpe={setRpe}
      rest={rest} setRest={setRest}
      notes={notes} setNotes={setNotes}
      usePercent={usePercent} setUsePercent={setUsePercent}
      percent={percent} setPercent={setPercent}
      tempo={tempo} setTempo={setTempo}
      eachSide={eachSide} setEachSide={setEachSide}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
      saveLabel="Save"
      savingLabel="Saving…"
    />
  );
}

export function AddAssignedExercise({
  workoutId,
  library,
  nextOrder,
  onAdded,
}: {
  workoutId: string;
  library: Exercise[];
  nextOrder: number;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [rest, setRest] = useState("");
  const [notes, setNotes] = useState("");
  const [usePercent, setUsePercent] = useState(false);
  const [percent, setPercent] = useState("");
  const [tempo, setTempo] = useState("");
  const [eachSide, setEachSide] = useState(false);
  const [saving, setSaving] = useState(false);

  function pick(id: string) {
    setExerciseId(id);
    const ex = library.find((e) => e.id === id);
    if (ex) {
      if (ex.default_sets != null) setSets(String(ex.default_sets));
      if (ex.default_reps) setReps(ex.default_reps);
      setTempo(ex.tempo ?? "");
      setEachSide(ex.is_unilateral);
    }
  }

  async function save() {
    if (!exerciseId) return;
    setSaving(true);
    const supabase = getSupabaseBrowser();
    await supabase.from("assigned_exercises").insert({
      assigned_workout_id: workoutId,
      exercise_id: exerciseId,
      order_index: nextOrder,
      target_sets: sets === "" ? null : Number(sets),
      target_reps: reps.trim() || null,
      target_rpe: rpe.trim() || null,
      rest_seconds: rest === "" ? null : Number(rest),
      notes: notes.trim() || null,
      use_percent: usePercent,
      percent_1rm: usePercent && percent !== "" ? Number(percent) : null,
      tempo: tempo.trim() || null,
      each_side: eachSide,
    });
    setSaving(false);
    setOpen(false);
    setExerciseId("");
    setSets("");
    setReps("");
    setRpe("");
    setRest("");
    setNotes("");
    setUsePercent(false);
    setPercent("");
    setTempo("");
    setEachSide(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-dashed border-border py-2 font-sans text-sm font-medium text-text-muted transition hover:border-terracotta hover:text-terracotta"
      >
        + Add exercise
      </button>
    );
  }

  return (
    <ExercisePrescriptionForm
      library={library}
      exerciseId={exerciseId}
      onPick={pick}
      sets={sets} setSets={setSets}
      reps={reps} setReps={setReps}
      rpe={rpe} setRpe={setRpe}
      rest={rest} setRest={setRest}
      notes={notes} setNotes={setNotes}
      usePercent={usePercent} setUsePercent={setUsePercent}
      percent={percent} setPercent={setPercent}
      tempo={tempo} setTempo={setTempo}
      eachSide={eachSide} setEachSide={setEachSide}
      saving={saving}
      onCancel={() => setOpen(false)}
      onSave={save}
    />
  );
}
