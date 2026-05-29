"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PortalGate from "@/components/portal/PortalGate";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  formatDuration,
  type AssignedWorkout,
  type AssignedExercise,
  type Exercise,
} from "@/lib/portal/types";
import { Spinner, PortalButton, ErrorBanner } from "@/components/portal/ui";

interface SetState {
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
  rest_taken_seconds: number | null;
}

interface ExerciseState {
  assigned_exercise_id: string;
  notes: string;
  sets: SetState[];
}

interface LoadedExercise extends AssignedExercise {
  exercise: Exercise;
}

interface PersistedState {
  startedAtMs: number;
  current: number;
  exercises: Record<string, ExerciseState>;
}

function emptySet(): SetState {
  return { weight: "", reps: "", rpe: "", done: false, rest_taken_seconds: null };
}

function storageKey(id: string) {
  return `kworkout:${id}`;
}

function WorkoutInner({ id }: { id: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<AssignedWorkout | null>(null);
  const [exercises, setExercises] = useState<LoadedExercise[]>([]);
  const [state, setState] = useState<Record<string, ExerciseState>>({});
  const [current, setCurrent] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useRef(false);

  // ─── Load workout + exercises, restore any local backup ──────────────────
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data: w } = await supabase
        .from("assigned_workouts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!w) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setWorkout(w as AssignedWorkout);

      const { data: ex } = await supabase
        .from("assigned_exercises")
        .select("*, exercise:exercises(*)")
        .eq("assigned_workout_id", id)
        .order("order_index", { ascending: true });

      const loaded = (ex as LoadedExercise[]) ?? [];
      setExercises(loaded);

      // Restore local backup if present
      let restored: PersistedState | null = null;
      try {
        const raw = localStorage.getItem(storageKey(id));
        if (raw) restored = JSON.parse(raw) as PersistedState;
      } catch {
        restored = null;
      }

      if (restored && restored.exercises) {
        setState(restored.exercises);
        setCurrent(restored.current ?? 0);
        setStartedAtMs(restored.startedAtMs ?? Date.now());
      } else {
        const initial: Record<string, ExerciseState> = {};
        for (const ae of loaded) {
          const count = ae.target_sets && ae.target_sets > 0 ? ae.target_sets : 3;
          initial[ae.id] = {
            assigned_exercise_id: ae.id,
            notes: "",
            sets: Array.from({ length: count }, emptySet),
          };
        }
        setState(initial);
        setStartedAtMs(Date.now());
      }

      // Mark as in_progress (best-effort)
      if ((w as AssignedWorkout).status === "assigned") {
        await supabase
          .from("assigned_workouts")
          .update({ status: "in_progress" })
          .eq("id", id);
      }

      hydrated.current = true;
      setLoading(false);
    })();
  }, [id]);

  // ─── Persist to localStorage on every change ─────────────────────────────
  useEffect(() => {
    if (!hydrated.current || startedAtMs === null) return;
    const payload: PersistedState = { startedAtMs, current, exercises: state };
    try {
      localStorage.setItem(storageKey(id), JSON.stringify(payload));
    } catch {
      // storage full / unavailable — ignore, in-memory state still holds
    }
  }, [state, current, startedAtMs, id]);

  // ─── Running elapsed timer ───────────────────────────────────────────────
  useEffect(() => {
    if (startedAtMs === null || submitted) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAtMs) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [startedAtMs, submitted]);

  const updateSet = useCallback(
    (exId: string, setIdx: number, patch: Partial<SetState>) => {
      setState((prev) => {
        const ex = prev[exId];
        if (!ex) return prev;
        const sets = ex.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s));
        return { ...prev, [exId]: { ...ex, sets } };
      });
    },
    []
  );

  const setNotes = useCallback((exId: string, notes: string) => {
    setState((prev) => ({ ...prev, [exId]: { ...prev[exId], notes } }));
  }, []);

  const addSet = useCallback((exId: string) => {
    setState((prev) => ({
      ...prev,
      [exId]: { ...prev[exId], sets: [...prev[exId].sets, emptySet()] },
    }));
  }, []);

  const removeSet = useCallback((exId: string, setIdx: number) => {
    setState((prev) => {
      const ex = prev[exId];
      if (ex.sets.length <= 1) return prev;
      return { ...prev, [exId]: { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) } };
    });
  }, []);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    const supabase = getSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expired. Please log in again.");
      setSubmitting(false);
      return;
    }

    const payloadExercises = exercises.map((ae) => {
      const st = state[ae.id];
      return {
        assigned_exercise_id: ae.id,
        exercise_name: ae.exercise?.name ?? "Exercise",
        target_sets: ae.target_sets,
        target_reps: ae.target_reps,
        notes: st?.notes?.trim() || null,
        sets: (st?.sets ?? []).map((s, i) => ({
          set_number: i + 1,
          weight: s.weight === "" ? null : Number(s.weight),
          reps: s.reps === "" ? null : Number(s.reps),
          rpe: s.rpe === "" ? null : Number(s.rpe),
          rest_taken_seconds: s.rest_taken_seconds,
          done: s.done,
        })),
      };
    });

    const startedIso = new Date(startedAtMs ?? Date.now()).toISOString();
    const res = await fetch("/api/portal/workout-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        assigned_workout_id: id,
        day_label: workout?.day_label ?? "Workout",
        started_at: startedIso,
        completed_at: new Date().toISOString(),
        total_duration_seconds: elapsed,
        exercises: payloadExercises,
      }),
    });

    const json = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok || !json.ok) {
      setError(json.error || "Could not submit. Your data is still saved on this device — try again.");
      return;
    }

    try {
      localStorage.removeItem(storageKey(id));
    } catch {}
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <Spinner />;

  if (notFound) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-serif text-2xl font-light text-text">Workout not found</h1>
        <p className="mt-2 font-sans text-sm text-text-muted">
          This workout doesn&apos;t exist or isn&apos;t assigned to you.
        </p>
        <Link href="/portal/dashboard" className="mt-6 inline-block font-sans text-sm font-medium text-terracotta">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  if (submitted) {
    const totalSets = exercises.reduce(
      (n, ae) => n + (state[ae.id]?.sets.filter((s) => s.done).length ?? 0),
      0
    );
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-olive/15">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7355" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-light text-text">Workout complete</h1>
        <p className="mt-2 font-sans text-sm text-text-muted">
          Logged {totalSets} sets in {formatDuration(elapsed)}. Keyla got your summary.
        </p>
        <Link
          href="/portal/dashboard"
          className="mt-8 inline-block rounded-lg bg-terracotta px-6 py-3 font-sans text-sm font-medium text-white transition hover:bg-terracotta/90"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (exercises.length === 0) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-serif text-2xl font-light text-text">No exercises yet</h1>
        <p className="mt-2 font-sans text-sm text-text-muted">
          This workout has no exercises assigned. Check back soon.
        </p>
        <Link href="/portal/dashboard" className="mt-6 inline-block font-sans text-sm font-medium text-terracotta">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  const ae = exercises[current];
  const exState = state[ae.id];
  const isLast = current === exercises.length - 1;

  return (
    <div className="pb-28">
      {/* Sticky timer header */}
      <div className="sticky top-[57px] z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-wider text-text-muted">
              {workout?.day_label}
            </p>
            <p className="font-serif text-2xl font-light tabular-nums text-text">
              {formatDuration(elapsed)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-sans text-[11px] uppercase tracking-wider text-text-muted">
              Exercise
            </p>
            <p className="font-sans text-sm font-medium text-text">
              {current + 1} / {exercises.length}
            </p>
          </div>
        </div>
        {/* progress bar */}
        <div className="mx-auto flex max-w-2xl gap-1 px-5 pb-3">
          {exercises.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 flex-1 rounded-full transition ${
                i === current ? "bg-terracotta" : i < current ? "bg-terracotta/40" : "bg-border"
              }`}
              aria-label={`Go to exercise ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-5 py-6">
        <ExerciseCard
          key={ae.id}
          ae={ae}
          state={exState}
          onUpdateSet={(idx, patch) => updateSet(ae.id, idx, patch)}
          onNotes={(notes) => setNotes(ae.id, notes)}
          onAddSet={() => addSet(ae.id)}
          onRemoveSet={(idx) => removeSet(ae.id, idx)}
        />

        <ErrorBanner message={error} />
      </main>

      {/* Sticky bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <PortalButton
            variant="secondary"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex-1"
          >
            ← Prev
          </PortalButton>
          {isLast ? (
            <PortalButton onClick={handleSubmit} disabled={submitting} className="flex-[2]">
              {submitting ? "Submitting…" : "Finish & Submit"}
            </PortalButton>
          ) : (
            <PortalButton onClick={() => setCurrent((c) => Math.min(exercises.length - 1, c + 1))} className="flex-[2]">
              Next →
            </PortalButton>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Exercise card with sets + rest timer ──────────────────────────────────

function ExerciseCard({
  ae,
  state,
  onUpdateSet,
  onNotes,
  onAddSet,
  onRemoveSet,
}: {
  ae: LoadedExercise;
  state: ExerciseState | undefined;
  onUpdateSet: (idx: number, patch: Partial<SetState>) => void;
  onNotes: (notes: string) => void;
  onAddSet: () => void;
  onRemoveSet: (idx: number) => void;
}) {
  const ex = ae.exercise;
  if (!state) return null;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 className="font-serif text-2xl font-light text-text">{ex?.name}</h2>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-sm text-text-muted">
        {ae.target_sets && <span>{ae.target_sets} sets</span>}
        {ae.target_reps && <span>{ae.target_reps} reps</span>}
        {ae.target_rpe && <span>RPE {ae.target_rpe}</span>}
        {ae.rest_seconds != null && <span>{ae.rest_seconds}s rest</span>}
      </div>

      {(ae.notes || ex?.cue_notes) && (
        <div className="mt-3 rounded-lg bg-bg p-3 font-sans text-sm leading-relaxed text-text-muted">
          {ae.notes && <p>{ae.notes}</p>}
          {ex?.cue_notes && <p className="mt-1 italic">{ex.cue_notes}</p>}
        </div>
      )}

      {ex?.video_url && (
        <a
          href={ex.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 font-sans text-sm font-medium text-terracotta hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Watch demo
        </a>
      )}

      {/* Sets table */}
      <div className="mt-5">
        <div className="mb-2 grid grid-cols-[28px_1fr_1fr_1fr_44px] items-center gap-2 px-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <span>Set</span>
          <span>Weight</span>
          <span>Reps</span>
          <span>RPE</span>
          <span className="text-center">Done</span>
        </div>
        <div className="space-y-2">
          {state.sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              set={s}
              restSeconds={ae.rest_seconds ?? 60}
              onUpdate={(patch) => onUpdateSet(i, patch)}
              onRemove={state.sets.length > 1 ? () => onRemoveSet(i) : undefined}
            />
          ))}
        </div>
        <button
          onClick={onAddSet}
          className="mt-3 w-full rounded-lg border border-dashed border-border py-2.5 font-sans text-sm font-medium text-text-muted transition hover:border-terracotta hover:text-terracotta"
        >
          + Add set
        </button>
      </div>

      {/* Notes */}
      <div className="mt-5">
        <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Notes for Keyla
        </label>
        <textarea
          rows={2}
          value={state.notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Felt strong, left knee a little tight…"
          className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
        />
      </div>
    </div>
  );
}

function SetRow({
  index,
  set,
  restSeconds,
  onUpdate,
  onRemove,
}: {
  index: number;
  set: SetState;
  restSeconds: number;
  onUpdate: (patch: Partial<SetState>) => void;
  onRemove?: () => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-border bg-white px-2 py-3 text-center font-sans text-lg text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30";

  return (
    <div>
      <div className="grid grid-cols-[28px_1fr_1fr_1fr_44px] items-center gap-2">
        <span className="text-center font-sans text-sm font-medium text-text-muted">{index + 1}</span>
        <input
          type="number"
          inputMode="decimal"
          value={set.weight}
          onChange={(e) => onUpdate({ weight: e.target.value })}
          placeholder="—"
          className={inputClass}
        />
        <input
          type="number"
          inputMode="numeric"
          value={set.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          placeholder="—"
          className={inputClass}
        />
        <input
          type="number"
          inputMode="decimal"
          value={set.rpe}
          onChange={(e) => onUpdate({ rpe: e.target.value })}
          placeholder="—"
          className={inputClass}
        />
        <button
          onClick={() => onUpdate({ done: !set.done })}
          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border transition ${
            set.done
              ? "border-olive bg-olive/15 text-olive"
              : "border-border bg-white text-transparent hover:border-terracotta"
          }`}
          aria-label={`Mark set ${index + 1} done`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
      {set.done && (
        <div className="mt-1.5 flex items-center justify-end gap-2 pr-[52px]">
          <RestChip
            restSeconds={restSeconds}
            taken={set.rest_taken_seconds}
            onTaken={(secs) => onUpdate({ rest_taken_seconds: secs })}
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="font-sans text-xs text-text-muted hover:text-burgundy"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RestChip({
  restSeconds,
  taken,
  onTaken,
}: {
  restSeconds: number;
  taken: number | null;
  onTaken: (secs: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(restSeconds);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const startMs = Date.now();
    startRef.current = startMs;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      setRemaining(Math.max(0, restSeconds - elapsed));
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [running, restSeconds]);

  function toggle() {
    if (running) {
      // stop & record actual rest taken
      const startMs = startRef.current;
      if (startMs) onTaken(Math.floor((Date.now() - startMs) / 1000));
      setRunning(false);
      setRemaining(restSeconds);
    } else {
      setRemaining(restSeconds);
      setRunning(true);
    }
  }

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const done = running && remaining === 0;

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-medium transition ${
        done
          ? "bg-terracotta text-white"
          : running
            ? "bg-blush text-burgundy"
            : "bg-bg-alt text-text-muted hover:bg-blush"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
      {running ? (done ? "Rest done — stop" : `${mm}:${ss}`) : taken != null ? `Rested ${taken}s · restart` : `Rest ${restSeconds}s`}
    </button>
  );
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <PortalGate>
      <WorkoutInner id={id} />
    </PortalGate>
  );
}
