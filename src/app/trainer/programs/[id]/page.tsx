"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { type Exercise, parseDuration, formatRest } from "@/lib/portal/types";
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
  use_percent: boolean;
  tempo: string | null;
  percent_1rm: number | null;
  each_side: boolean;
  exercise: Exercise | null;
}
interface ProgramDay {
  id: string;
  program_id: string;
  day_label: string;
  order_index: number;
  warmup_text: string | null;
  warmup_seconds: number | null;
  cooldown_text: string | null;
  cooldown_seconds: number | null;
  program_exercises: ProgramExercise[];
}

function Builder({ id }: { id: string }) {
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDayLabel, setNewDayLabel] = useState("");
  const [programName, setProgramName] = useState("");

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
    setProgramName((prog as Program).name);
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

  async function renameProgram() {
    if (!program) return;
    const trimmed = programName.trim();
    if (!trimmed || trimmed === program.name) {
      setProgramName(program.name);
      return;
    }
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("programs")
      .update({ name: trimmed })
      .eq("id", id);
    if (!error) setProgram({ ...program, name: trimmed });
    else setProgramName(program.name);
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
        <label className="mb-1.5 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
          Program name
        </label>
        <input
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          onBlur={renameProgram}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full max-w-xl rounded-lg border border-border bg-white px-3 py-2 font-serif text-2xl font-light tracking-tight text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
        />
        {program.description && (
          <p className="mt-2 font-sans text-sm text-text-muted">{program.description}</p>
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = day.program_exercises;

  async function removeExercise(peId: string) {
    const supabase = getSupabaseBrowser();
    await supabase.from("program_exercises").delete().eq("id", peId);
    onChanged();
  }

  async function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[idx];
    const b = list[target];
    const supabase = getSupabaseBrowser();
    await Promise.all([
      supabase.from("program_exercises").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("program_exercises").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
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

      <WarmCoolEditor table="program_days" rowId={day.id} initial={day} />

      {list.length > 0 && (
        <div className="mt-3 space-y-2">
          {list.map((pe, idx) =>
            editingId === pe.id ? (
              <EditExerciseForm
                key={pe.id}
                pe={pe}
                library={library}
                onDone={() => {
                  setEditingId(null);
                  onChanged();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={pe.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg px-3 py-2"
              >
                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="text-text-muted transition hover:text-terracotta disabled:opacity-30"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === list.length - 1}
                    aria-label="Move down"
                    className="text-text-muted transition hover:text-terracotta disabled:opacity-30"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm font-medium text-text">
                    {pe.exercise?.name ?? "Exercise"}
                  </p>
                  <p className="font-sans text-xs text-text-muted">
                    {pe.target_sets ?? "?"} × {pe.target_reps ?? "?"}
                    {pe.use_percent && pe.percent_1rm != null ? ` · ${pe.percent_1rm}% 1RM` : ""}
                    {pe.target_rpe ? ` · RPE ${pe.target_rpe}` : ""}
                    {pe.rest_seconds != null ? ` · ${pe.rest_seconds}s rest` : ""}
                    {pe.tempo ? ` · tempo ${pe.tempo}` : ""}
                    {pe.each_side ? " · each side" : ""}
                  </p>
                  {pe.notes && <p className="font-sans text-xs italic text-text-muted">{pe.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => {
                      setAdding(false);
                      setEditingId(pe.id);
                    }}
                    className="font-sans text-xs font-medium text-terracotta hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeExercise(pe.id)}
                    className="font-sans text-xs text-text-muted hover:text-burgundy"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {adding ? (
        <AddExerciseForm
          dayId={day.id}
          library={library}
          nextOrder={list.length}
          onDone={() => {
            setAdding(false);
            onChanged();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
          className="mt-3 w-full rounded-lg border border-dashed border-border py-2 font-sans text-sm font-medium text-text-muted transition hover:border-terracotta hover:text-terracotta"
        >
          + Add exercise
        </button>
      )}
    </Card>
  );
}

/** Warm-up / cool-down freestyle text + timer editor.
 *  Reused by the program builder (program_days) and the assign panel (assigned_workouts). */
export function WarmCoolEditor({
  table,
  rowId,
  initial,
}: {
  table: "program_days" | "assigned_workouts";
  rowId: string;
  initial: { warmup_text: string | null; warmup_seconds: number | null; cooldown_text: string | null; cooldown_seconds: number | null };
}) {
  const [warmupText, setWarmupText] = useState(initial.warmup_text ?? "");
  const [warmupDur, setWarmupDur] = useState(initial.warmup_seconds != null ? formatRest(initial.warmup_seconds) : "");
  const [cooldownText, setCooldownText] = useState(initial.cooldown_text ?? "");
  const [cooldownDur, setCooldownDur] = useState(initial.cooldown_seconds != null ? formatRest(initial.cooldown_seconds) : "");

  async function saveWarmup() {
    const supabase = getSupabaseBrowser();
    await supabase
      .from(table)
      .update({ warmup_text: warmupText.trim() || null, warmup_seconds: parseDuration(warmupDur) })
      .eq("id", rowId);
  }
  async function saveCooldown() {
    const supabase = getSupabaseBrowser();
    await supabase
      .from(table)
      .update({ cooldown_text: cooldownText.trim() || null, cooldown_seconds: parseDuration(cooldownDur) })
      .eq("id", rowId);
  }

  const fieldCls =
    "w-full rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30";

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <FreestyleBlock
        title="Warm-up (freestyle)"
        text={warmupText}
        setText={setWarmupText}
        dur={warmupDur}
        setDur={setWarmupDur}
        onBlur={saveWarmup}
        fieldCls={fieldCls}
      />
      <FreestyleBlock
        title="Cool-down (freestyle)"
        text={cooldownText}
        setText={setCooldownText}
        dur={cooldownDur}
        setDur={setCooldownDur}
        onBlur={saveCooldown}
        fieldCls={fieldCls}
      />
    </div>
  );
}

function FreestyleBlock({
  title,
  text,
  setText,
  dur,
  setDur,
  onBlur,
  fieldCls,
}: {
  title: string;
  text: string;
  setText: (v: string) => void;
  dur: string;
  setDur: (v: string) => void;
  onBlur: () => void;
  fieldCls: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-bg p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </span>
        <input
          className="w-20 rounded-md border border-border bg-white px-2 py-1 text-center font-sans text-xs text-text outline-none focus:border-terracotta"
          placeholder="mm:ss"
          value={dur}
          onChange={(e) => setDur(e.target.value)}
          onBlur={onBlur}
          aria-label={`${title} timer`}
        />
      </div>
      <textarea
        className={`${fieldCls} resize-none`}
        rows={2}
        placeholder="e.g. 5 min bike, dynamic stretches, banded warm-up…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

/** Edit an already-added program exercise (full prescription). */
function EditExerciseForm({
  pe,
  library,
  onDone,
  onCancel,
}: {
  pe: ProgramExercise;
  library: Exercise[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [exerciseId, setExerciseId] = useState(pe.exercise_id);
  const [sets, setSets] = useState(pe.target_sets != null ? String(pe.target_sets) : "");
  const [reps, setReps] = useState(pe.target_reps ?? "");
  const [rpe, setRpe] = useState(pe.target_rpe ?? "");
  const [rest, setRest] = useState(pe.rest_seconds != null ? String(pe.rest_seconds) : "");
  const [notes, setNotes] = useState(pe.notes ?? "");
  const [usePercent, setUsePercent] = useState(!!pe.use_percent);
  const [percent, setPercent] = useState(pe.percent_1rm != null ? String(pe.percent_1rm) : "");
  const [tempo, setTempo] = useState(pe.tempo ?? "");
  const [eachSide, setEachSide] = useState(!!pe.each_side);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!exerciseId) return;
    setSaving(true);
    const supabase = getSupabaseBrowser();
    await supabase
      .from("program_exercises")
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
      .eq("id", pe.id);
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
  const [usePercent, setUsePercent] = useState(false);
  const [percent, setPercent] = useState("");
  const [tempo, setTempo] = useState("");
  const [eachSide, setEachSide] = useState(false);
  const [saving, setSaving] = useState(false);

  function onPick(id: string) {
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
    await supabase.from("program_exercises").insert({
      program_day_id: dayId,
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
    onDone();
  }

  return (
    <ExercisePrescriptionForm
      library={library}
      exerciseId={exerciseId}
      onPick={onPick}
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
    />
  );
}

/** Shared prescription editor used by the program builder and the assign panel. */
export function ExercisePrescriptionForm({
  library,
  exerciseId,
  onPick,
  sets, setSets,
  reps, setReps,
  rpe, setRpe,
  rest, setRest,
  notes, setNotes,
  usePercent, setUsePercent,
  percent, setPercent,
  tempo, setTempo,
  eachSide, setEachSide,
  saving,
  onCancel,
  onSave,
  saveLabel = "Add",
  savingLabel = "Adding…",
}: {
  library: Exercise[];
  exerciseId: string;
  onPick: (id: string) => void;
  sets: string; setSets: (v: string) => void;
  reps: string; setReps: (v: string) => void;
  rpe: string; setRpe: (v: string) => void;
  rest: string; setRest: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  usePercent: boolean; setUsePercent: (v: boolean) => void;
  percent: string; setPercent: (v: string) => void;
  tempo: string; setTempo: (v: string) => void;
  eachSide: boolean; setEachSide: (v: boolean) => void;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  savingLabel?: string;
}) {
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
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input className={fieldCls} placeholder="Tempo (2-0-3-0)" value={tempo} onChange={(e) => setTempo(e.target.value)} />
        <input
          className={`${fieldCls} disabled:opacity-40`}
          placeholder="% 1RM"
          inputMode="decimal"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          disabled={!usePercent}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 font-sans text-sm text-text">
          <input
            type="checkbox"
            checked={usePercent}
            onChange={(e) => setUsePercent(e.target.checked)}
            className="h-4 w-4 accent-terracotta"
          />
          Use % of 1RM
        </label>
        <label className="flex items-center gap-2 font-sans text-sm text-text">
          <input
            type="checkbox"
            checked={eachSide}
            onChange={(e) => setEachSide(e.target.checked)}
            className="h-4 w-4 accent-terracotta"
          />
          Each side
        </label>
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
        <PortalButton onClick={onSave} disabled={!exerciseId || saving} className="flex-1">
          {saving ? savingLabel : saveLabel}
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
