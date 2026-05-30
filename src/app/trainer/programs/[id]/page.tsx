"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Exercise } from "@/lib/portal/types";
import { Card, Spinner, PortalButton, TextInput } from "@/components/portal/ui";

interface Program {
  id: string;
  name: string;
  description: string | null;
}
interface ProgramExercise {
  id: string;
  program_day_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_rpe: string | null;
  rest_seconds: number | null;
  notes: string | null;
  exercise: Exercise | null;
}
interface ProgramDay {
  id: string;
  program_id: string;
  day_label: string;
  order_index: number;
  program_exercises: ProgramExercise[];
}

function Builder({ id }: { id: string }) {
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDayLabel, setNewDayLabel] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const [{ data: prog }, { data: dayData }, { data: lib }] = await Promise.all([
      supabase.from("programs").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("program_days")
        .select("*, program_exercises(*, exercise:exercises(*))")
        .eq("program_id", id)
        .order("order_index", { ascending: true }),
      supabase.from("exercises").select("*").order("name", { ascending: true }),
    ]);

    if (!prog) {
      router.replace("/trainer/programs");
      return;
    }
    setProgram(prog as Program);
    const sortedDays = ((dayData as ProgramDay[]) ?? []).map((d) => ({
      ...d,
      program_exercises: [...(d.program_exercises ?? [])].sort(
        (a, b) => a.order_index - b.order_index
      ),
    }));
    setDays(sortedDays);
    setLibrary((lib as Exercise[]) ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function addDay() {
    if (!newDayLabel.trim()) return;
    const supabase = getSupabaseBrowser();
    await supabase
      .from("program_days")
      .insert({ program_id: id, day_label: newDayLabel.trim(), order_index: days.length });
    setNewDayLabel("");
    load();
  }

  async function deleteDay(dayId: string) {
    if (!confirm("Delete this day and its exercises?")) return;
    const supabase = getSupabaseBrowser();
    await supabase.from("program_days").delete().eq("id", dayId);
    load();
  }

  async function renameDay(dayId: string, label: string) {
    const supabase = getSupabaseBrowser();
    await supabase.from("program_days").update({ day_label: label }).eq("id", dayId);
  }

  if (loading) {
    return <Spinner />;
  }
  if (!program) return null;

  return (
    <>
      <Link
        href="/trainer/programs"
        className="mb-4 inline-flex items-center gap-1 font-sans text-sm text-text-muted hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Programs
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-light tracking-tight text-text">{program.name}</h1>
        {program.description && (
          <p className="mt-1 font-sans text-sm text-text-muted">{program.description}</p>
        )}
      </div>

      <div className="space-y-5">
        {days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            library={library}
            onChanged={load}
            onDelete={() => deleteDay(day.id)}
            onRename={(label) => renameDay(day.id, label)}
          />
        ))}
      </div>

      {/* Add day */}
      <Card className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
              Add a day
            </label>
            <TextInput
              value={newDayLabel}
              onChange={(e) => setNewDayLabel(e.target.value)}
              placeholder="Day 1 - Push"
              onKeyDown={(e) => {
                if (e.key === "Enter") addDay();
              }}
            />
          </div>
          <PortalButton onClick={addDay} disabled={!newDayLabel.trim()}>
            Add day
          </PortalButton>
        </div>
      </Card>
    </>
  );
}

function DayCard({
  day,
  library,
  onChanged,
  onDelete,
  onRename,
}: {
  day: ProgramDay;
  library: Exercise[];
  onChanged: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
}) {
  const [label, setLabel] = useState(day.day_label);
  const [adding, setAdding] = useState(false);

  async function removeExercise(peId: string) {
    const supabase = getSupabaseBrowser();
    await supabase.from("program_exercises").delete().eq("id", peId);
    onChanged();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => label !== day.day_label && onRename(label)}
          className="flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 font-serif text-lg font-light text-text outline-none transition hover:border-border focus:border-terracotta"
        />
        <button onClick={onDelete} className="font-sans text-xs text-text-muted hover:text-burgundy">
          Delete day
        </button>
      </div>

      {day.program_exercises.length > 0 && (
        <div className="mt-3 space-y-2">
          {day.program_exercises.map((pe) => (
            <div
              key={pe.id}
              className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2"
            >
              <div>
                <p className="font-sans text-sm font-medium text-text">
                  {pe.exercise?.name ?? "Exercise"}
                </p>
                <p className="font-sans text-xs text-text-muted">
                  {pe.target_sets ?? "?"} × {pe.target_reps ?? "?"}
                  {pe.target_rpe ? ` · RPE ${pe.target_rpe}` : ""}
                  {pe.rest_seconds != null ? ` · ${pe.rest_seconds}s rest` : ""}
                </p>
                {pe.notes && <p className="font-sans text-xs italic text-text-muted">{pe.notes}</p>}
              </div>
              <button
                onClick={() => removeExercise(pe.id)}
                className="shrink-0 font-sans text-xs text-text-muted hover:text-burgundy"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <AddExerciseForm
          dayId={day.id}
          library={library}
          nextOrder={day.program_exercises.length}
          onDone={() => {
            setAdding(false);
            onChanged();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 w-full rounded-lg border border-dashed border-border py-2 font-sans text-sm font-medium text-text-muted transition hover:border-terracotta hover:text-terracotta"
        >
          + Add exercise
        </button>
      )}
    </Card>
  );
}

function AddExerciseForm({
  dayId,
  library,
  nextOrder,
  onDone,
  onCancel,
}: {
  dayId: string;
  library: Exercise[];
  nextOrder: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [rest, setRest] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function onPick(id: string) {
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
    await supabase.from("program_exercises").insert({
      program_day_id: dayId,
      exercise_id: exerciseId,
      order_index: nextOrder,
      target_sets: sets === "" ? null : Number(sets),
      target_reps: reps.trim() || null,
      target_rpe: rpe.trim() || null,
      rest_seconds: rest === "" ? null : Number(rest),
      notes: notes.trim() || null,
    });
    setSaving(false);
    onDone();
  }

  const fieldCls =
    "w-full rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30";

  return (
    <div className="mt-3 rounded-lg border border-border bg-bg p-3">
      <select value={exerciseId} onChange={(e) => onPick(e.target.value)} className={fieldCls}>
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
        <PortalButton variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </PortalButton>
        <PortalButton onClick={save} disabled={!exerciseId || saving} className="flex-1">
          {saving ? "Adding…" : "Add"}
        </PortalButton>
      </div>
    </div>
  );
}

export default function ProgramBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <TrainerLayout>
      <Builder id={id} />
    </TrainerLayout>
  );
}
