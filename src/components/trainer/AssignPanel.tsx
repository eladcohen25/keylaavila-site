"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { currentWeekMonday, type Exercise } from "@/lib/portal/types";
import { assignProgram, duplicateLastWeek } from "@/lib/trainer/assign";
import { Card, PortalButton, TextInput } from "@/components/portal/ui";

interface Program {
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
  exercise: Exercise | null;
}
interface AssignedWorkoutRow {
  id: string;
  day_label: string;
  status: string;
  order_index: number;
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
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [programId, setProgramId] = useState("");
  const [newDayLabel, setNewDayLabel] = useState("");
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
    const sorted = ((data as AssignedWorkoutRow[]) ?? []).map((w) => ({
      ...w,
      assigned_exercises: [...(w.assigned_exercises ?? [])].sort(
        (a, b) => a.order_index - b.order_index
      ),
    }));
    setWorkouts(sorted);
    setLoading(false);
  }, [clientId, weekOf]);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const [{ data: progs }, { data: lib }] = await Promise.all([
        supabase.from("programs").select("id, name").order("name"),
        supabase.from("exercises").select("*").order("name"),
      ]);
      setPrograms((progs as Program[]) ?? []);
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
    await supabase.from("assigned_workouts").insert({
      client_id: clientId,
      week_of: weekOf,
      day_label: newDayLabel.trim(),
      status: "assigned",
      order_index: workouts.length,
    });
    setBusy(false);
    setNewDayLabel("");
    loadWeek();
  }

  async function deleteWorkout(id: string) {
    if (!confirm("Delete this assigned workout?")) return;
    const supabase = getSupabaseBrowser();
    await supabase.from("assigned_workouts").delete().eq("id", id);
    loadWeek();
  }

  async function removeExercise(id: string) {
    const supabase = getSupabaseBrowser();
    await supabase.from("assigned_exercises").delete().eq("id", id);
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

        {msg && <p className="mt-3 font-sans text-xs font-medium text-olive">{msg}</p>}
      </Card>

      {/* Assigned workouts this week */}
      {loading ? (
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
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-light text-text">{w.day_label}</h3>
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
              <button
                onClick={() => deleteWorkout(w.id)}
                className="font-sans text-xs text-text-muted hover:text-burgundy"
              >
                Delete
              </button>
            </div>

            {w.assigned_exercises.length > 0 && (
              <div className="mt-3 space-y-2">
                {w.assigned_exercises.map((ae) => (
                  <div
                    key={ae.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2"
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-text">{ae.exercise?.name}</p>
                      <p className="font-sans text-xs text-text-muted">
                        {ae.target_sets ?? "?"} × {ae.target_reps ?? "?"}
                        {ae.target_rpe ? ` · RPE ${ae.target_rpe}` : ""}
                        {ae.rest_seconds != null ? ` · ${ae.rest_seconds}s rest` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => removeExercise(ae.id)}
                      className="shrink-0 font-sans text-xs text-text-muted hover:text-burgundy"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AddAssignedExercise
              workoutId={w.id}
              library={library}
              nextOrder={w.assigned_exercises.length}
              onAdded={loadWeek}
            />
          </Card>
        ))
      )}

      {/* Add blank day */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
              Add a blank workout (ad hoc)
            </label>
            <TextInput
              value={newDayLabel}
              onChange={(e) => setNewDayLabel(e.target.value)}
              placeholder="Day 1 - Push"
              onKeyDown={(e) => {
                if (e.key === "Enter") addBlank();
              }}
            />
          </div>
          <PortalButton onClick={addBlank} disabled={!newDayLabel.trim() || busy}>
            Add
          </PortalButton>
        </div>
      </Card>
    </div>
  );
}

function AddAssignedExercise({
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
  const [saving, setSaving] = useState(false);

  function pick(id: string) {
    setExerciseId(id);
    const ex = library.find((e) => e.id === id);
    if (ex) {
      if (ex.default_sets != null) setSets(String(ex.default_sets));
      if (ex.default_reps) setReps(ex.default_reps);
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
    });
    setSaving(false);
    setOpen(false);
    setExerciseId("");
    setSets("");
    setReps("");
    setRpe("");
    setRest("");
    setNotes("");
    onAdded();
  }

  const fieldCls =
    "w-full rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30";

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
    <div className="mt-3 rounded-lg border border-border bg-bg p-3">
      <select value={exerciseId} onChange={(e) => pick(e.target.value)} className={fieldCls}>
        <option value="">Choose an exercise…</option>
        {library.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
            {e.muscle_group ? ` (${e.muscle_group})` : ""}
          </option>
        ))}
      </select>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input className={fieldCls} placeholder="Sets" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} />
        <input className={fieldCls} placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} />
        <input className={fieldCls} placeholder="RPE" value={rpe} onChange={(e) => setRpe(e.target.value)} />
        <input className={fieldCls} placeholder="Rest (s)" inputMode="numeric" value={rest} onChange={(e) => setRest(e.target.value)} />
      </div>
      <input
        className={`${fieldCls} mt-2`}
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <PortalButton variant="secondary" onClick={() => setOpen(false)} className="flex-1">
          Cancel
        </PortalButton>
        <PortalButton onClick={save} disabled={!exerciseId || saving} className="flex-1">
          {saving ? "Adding…" : "Add"}
        </PortalButton>
      </div>
    </div>
  );
}
