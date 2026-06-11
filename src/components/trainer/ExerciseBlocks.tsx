"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { type Exercise } from "@/lib/portal/types";
import { ExercisePrescriptionForm } from "@/app/trainer/programs/[id]/page";

/**
 * A reusable exercise list editor with drag-to-reorder and superset merging.
 * Works against any table that has the standard prescription columns plus
 * `superset_group` / `superset_order` (e.g. assigned_exercises,
 * workout_template_exercises), keyed by a parent foreign-key column.
 */
export interface ExerciseBlockRow {
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

function buildGroups(list: ExerciseBlockRow[]): ExerciseBlockRow[][] {
  const groups: ExerciseBlockRow[][] = [];
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

function ExerciseMeta({ ae }: { ae: ExerciseBlockRow }) {
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

export default function ExerciseBlocks({
  table,
  fkColumn,
  parentId,
  list,
  library,
  onChanged,
}: {
  table: string;
  fkColumn: string;
  parentId: string;
  list: ExerciseBlockRow[];
  library: Exercise[];
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const groups = buildGroups(list);

  async function persistOrder(newGroups: ExerciseBlockRow[][]) {
    const supabase = getSupabaseBrowser();
    let idx = 0;
    const updates: Promise<unknown>[] = [];
    for (const g of newGroups) {
      for (const ae of g) {
        updates.push(
          supabase.from(table).update({ order_index: idx }).eq("id", ae.id) as unknown as Promise<unknown>
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
            .from(table)
            .update({ superset_group: group, superset_order: i })
            .eq("id", ae.id) as unknown as Promise<unknown>
      )
    );
    onChanged();
  }

  async function unlink(group: string) {
    const supabase = getSupabaseBrowser();
    await supabase
      .from(table)
      .update({ superset_group: null, superset_order: 0 })
      .eq("superset_group", group);
    onChanged();
  }

  async function removeExercise(id: string) {
    const supabase = getSupabaseBrowser();
    await supabase.from(table).delete().eq("id", id);
    onChanged();
  }

  function Row({ ae }: { ae: ExerciseBlockRow }) {
    if (editingId === ae.id) {
      return (
        <EditBlockExercise
          table={table}
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
        <AddBlockExercise
          table={table}
          fkColumn={fkColumn}
          parentId={parentId}
          library={library}
          nextOrder={list.length}
          onAdded={onChanged}
        />
      </div>
    </>
  );
}

function EditBlockExercise({
  table,
  ae,
  library,
  onDone,
  onCancel,
}: {
  table: string;
  ae: ExerciseBlockRow;
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
      .from(table)
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

export function AddBlockExercise({
  table,
  fkColumn,
  parentId,
  library,
  nextOrder,
  onAdded,
}: {
  table: string;
  fkColumn: string;
  parentId: string;
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
    await supabase.from(table).insert({
      [fkColumn]: parentId,
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
