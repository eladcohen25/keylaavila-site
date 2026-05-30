"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PortalGate from "@/components/portal/PortalGate";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  formatDuration,
  formatRest,
  weightFromPercent,
  toEmbedUrl,
  isDirectVideo,
  type AssignedWorkout,
  type AssignedExercise,
  type Exercise,
} from "@/lib/portal/types";
import { Spinner, PortalButton, ErrorBanner } from "@/components/portal/ui";

interface SetState {
  percent: string;
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
  rest_taken_seconds: number | null;
  weightEdited: boolean;
}

interface ExerciseState {
  assigned_exercise_id: string;
  notes: string;
  usePercent: boolean;
  eachSide: boolean;
  oneRepMax: string;
  showRpe: boolean;
  sets: SetState[];
}

interface LoadedExercise extends AssignedExercise {
  exercise: Exercise;
}

interface LastTimeSet {
  set_number: number;
  weight: number | null;
  reps: number | null;
}

interface PersistedState {
  startedAtMs: number;
  current: number;
  exercises: Record<string, ExerciseState>;
}

function emptySet(percent = ""): SetState {
  return { percent, weight: "", reps: "", rpe: "", done: false, rest_taken_seconds: null, weightEdited: false };
}

function storageKey(id: string) {
  return `kworkout:${id}`;
}

/** The weight to show for a set: auto-calculated from %1RM unless overridden. */
function effectiveWeight(s: SetState, usePercent: boolean, oneRepMax: number | null): string {
  if (s.weightEdited) return s.weight;
  if (usePercent && oneRepMax && s.percent !== "") {
    const pct = Number(s.percent);
    if (Number.isFinite(pct)) return String(weightFromPercent(oneRepMax, pct));
  }
  return s.weight;
}

function WorkoutInner({ id }: { id: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<AssignedWorkout | null>(null);
  const [exercises, setExercises] = useState<LoadedExercise[]>([]);
  const [state, setState] = useState<Record<string, ExerciseState>>({});
  const [lastTime, setLastTime] = useState<Record<string, LastTimeSet[]>>({});
  const [current, setCurrent] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const hydrated = useRef(false);

  // ─── Load workout + exercises + maxes + last-time, restore local backup ────
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const clientId = user?.id ?? null;

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

      const exerciseIds = [...new Set(loaded.map((l) => l.exercise_id))];

      // Client's stored 1RMs for these exercises
      const maxMap: Record<string, number> = {};
      if (clientId && exerciseIds.length > 0) {
        const { data: maxes } = await supabase
          .from("client_exercise_maxes")
          .select("exercise_id, one_rep_max")
          .eq("client_id", clientId)
          .in("exercise_id", exerciseIds);
        for (const m of (maxes as { exercise_id: string; one_rep_max: number }[]) ?? []) {
          maxMap[m.exercise_id] = m.one_rep_max;
        }
      }

      // Last-time performance: most recent submitted session's logged sets
      // for each exercise (so the client knows what to beat).
      if (clientId && exerciseIds.length > 0) {
        const { data: sessions } = await supabase
          .from("workout_sessions")
          .select("id, completed_at")
          .eq("client_id", clientId)
          .eq("submitted", true)
          .neq("assigned_workout_id", id)
          .order("completed_at", { ascending: false })
          .limit(12);
        const sessionIds = (sessions as { id: string }[] | null)?.map((s) => s.id) ?? [];
        if (sessionIds.length > 0) {
          const { data: logs } = await supabase
            .from("set_logs")
            .select("set_number, weight, reps, assigned_exercise:assigned_exercises(exercise_id), workout_session_id")
            .in("workout_session_id", sessionIds);
          // sessionIds is already newest-first; group by exercise, keep newest session only
          const order = new Map(sessionIds.map((sid, i) => [sid, i]));
          const byExercise: Record<string, { sessionIdx: number; sets: LastTimeSet[] }> = {};
          for (const row of (logs as Array<{
            set_number: number;
            weight: number | null;
            reps: number | null;
            assigned_exercise: { exercise_id: string } | { exercise_id: string }[] | null;
            workout_session_id: string;
          }>) ?? []) {
            const ae = Array.isArray(row.assigned_exercise) ? row.assigned_exercise[0] : row.assigned_exercise;
            const exId = ae?.exercise_id;
            if (!exId) continue;
            const idx = order.get(row.workout_session_id) ?? 999;
            const existing = byExercise[exId];
            if (!existing || idx < existing.sessionIdx) {
              byExercise[exId] = { sessionIdx: idx, sets: [{ set_number: row.set_number, weight: row.weight, reps: row.reps }] };
            } else if (idx === existing.sessionIdx) {
              existing.sets.push({ set_number: row.set_number, weight: row.weight, reps: row.reps });
            }
          }
          const lastMap: Record<string, LastTimeSet[]> = {};
          for (const l of loaded) {
            const entry = byExercise[l.exercise_id];
            if (entry) {
              lastMap[l.id] = [...entry.sets].sort((a, b) => a.set_number - b.set_number);
            }
          }
          setLastTime(lastMap);
        }
      }

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
          const pct = ae.percent_1rm != null ? String(ae.percent_1rm) : "";
          initial[ae.id] = {
            assigned_exercise_id: ae.id,
            notes: "",
            usePercent: !!ae.use_percent,
            eachSide: !!ae.each_side,
            oneRepMax: maxMap[ae.exercise_id] != null ? String(maxMap[ae.exercise_id]) : "",
            showRpe: false,
            sets: Array.from({ length: count }, () => emptySet(pct)),
          };
        }
        setState(initial);
        setStartedAtMs(Date.now());
      }

      if ((w as AssignedWorkout).status === "assigned") {
        await supabase.from("assigned_workouts").update({ status: "in_progress" }).eq("id", id);
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

  const updateSet = useCallback((exId: string, setIdx: number, patch: Partial<SetState>) => {
    setState((prev) => {
      const ex = prev[exId];
      if (!ex) return prev;
      const sets = ex.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s));
      return { ...prev, [exId]: { ...ex, sets } };
    });
  }, []);

  const patchExercise = useCallback((exId: string, patch: Partial<ExerciseState>) => {
    setState((prev) => ({ ...prev, [exId]: { ...prev[exId], ...patch } }));
  }, []);

  const markAll = useCallback((exId: string) => {
    setState((prev) => {
      const ex = prev[exId];
      if (!ex) return prev;
      const allDone = ex.sets.every((s) => s.done);
      return { ...prev, [exId]: { ...ex, sets: ex.sets.map((s) => ({ ...s, done: !allDone })) } };
    });
  }, []);

  const addSet = useCallback((exId: string) => {
    setState((prev) => {
      const ex = prev[exId];
      const lastPct = ex.sets[ex.sets.length - 1]?.percent ?? "";
      return { ...prev, [exId]: { ...ex, sets: [...ex.sets, emptySet(lastPct)] } };
    });
  }, []);

  const removeSet = useCallback((exId: string, setIdx: number) => {
    setState((prev) => {
      const ex = prev[exId];
      if (ex.sets.length <= 1) return prev;
      return { ...prev, [exId]: { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) } };
    });
  }, []);

  // ─── Swipe navigation ────────────────────────────────────────────────────
  const touchX = useRef<number | null>(null);
  const goTo = useCallback(
    (i: number) => setCurrent((c) => Math.min(exercises.length - 1, Math.max(0, i ?? c))),
    [exercises.length]
  );
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx > 60) goTo(current - 1);
    else if (dx < -60) goTo(current + 1);
    touchX.current = null;
  }

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
      const orm = st?.oneRepMax !== "" ? Number(st?.oneRepMax) : null;
      return {
        assigned_exercise_id: ae.id,
        exercise_id: ae.exercise_id,
        exercise_name: ae.exercise?.name ?? "Exercise",
        target_sets: ae.target_sets,
        target_reps: ae.target_reps,
        tempo: ae.tempo ?? ae.exercise?.tempo ?? null,
        each_side: st?.eachSide ?? false,
        notes: st?.notes?.trim() || null,
        sets: (st?.sets ?? []).map((s, i) => {
          const w = effectiveWeight(s, st?.usePercent ?? false, orm);
          return {
            set_number: i + 1,
            weight: w === "" ? null : Number(w),
            reps: s.reps === "" ? null : Number(s.reps),
            rpe: s.rpe === "" ? null : Number(s.rpe),
            percent_1rm: st?.usePercent && s.percent !== "" ? Number(s.percent) : null,
            rest_taken_seconds: s.rest_taken_seconds,
            done: s.done,
          };
        }),
      };
    });

    // Collect any 1RMs the client set this session (one per exercise).
    const maxMap: Record<string, number> = {};
    for (const ae of exercises) {
      const orm = state[ae.id]?.oneRepMax;
      if (orm && orm !== "" && Number(orm) > 0) maxMap[ae.exercise_id] = Number(orm);
    }
    const maxes = Object.entries(maxMap).map(([exercise_id, one_rep_max]) => ({ exercise_id, one_rep_max }));

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
        maxes,
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
    <div className="min-h-screen bg-bg pb-28">
      {/* ─── Header: collapse · timer · stopwatch + progress dots ─── */}
      <div className="sticky top-0 z-30 bg-text text-bg shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/portal/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-bg/80 transition hover:bg-white/10 hover:text-bg"
            aria-label="Close workout"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className="text-center">
            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-bg/60">
              Total Duration
            </p>
            <p className="font-serif text-2xl font-light leading-none tabular-nums text-bg">
              {formatDuration(elapsed)}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center text-bg/70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2 2" />
              <path d="M9 2h6" />
            </svg>
          </div>
        </div>
        {/* progress dots */}
        <div className="flex items-center justify-center gap-1.5 px-4 pb-3">
          {exercises.map((ex, i) => {
            const allDone = state[ex.id]?.sets.every((s) => s.done);
            return (
              <button
                key={ex.id}
                onClick={() => goTo(i)}
                aria-label={`Go to exercise ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === current
                    ? "w-5 bg-terracotta"
                    : allDone
                      ? "w-2 bg-terracotta/60"
                      : "w-2 bg-white/25"
                }`}
              />
            );
          })}
        </div>
      </div>

      <main
        className="mx-auto max-w-2xl px-4 py-5"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ExerciseCard
          key={ae.id}
          ae={ae}
          state={exState}
          lastTime={lastTime[ae.id]}
          onUpdateSet={(idx, patch) => updateSet(ae.id, idx, patch)}
          onPatch={(patch) => patchExercise(ae.id, patch)}
          onMarkAll={() => markAll(ae.id)}
          onAddSet={() => addSet(ae.id)}
          onRemoveSet={(idx) => removeSet(ae.id, idx)}
          onPlayVideo={setPlayingVideo}
        />

        <ErrorBanner message={error} />
      </main>

      {/* Sticky bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <PortalButton
            variant="secondary"
            onClick={() => goTo(current - 1)}
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
            <PortalButton onClick={() => goTo(current + 1)} className="flex-[2]">
              Next →
            </PortalButton>
          )}
        </div>
      </div>

      {playingVideo && <VideoModal url={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}

// ─── Exercise card ─────────────────────────────────────────────────────────

function ExerciseCard({
  ae,
  state,
  lastTime,
  onUpdateSet,
  onPatch,
  onMarkAll,
  onAddSet,
  onRemoveSet,
  onPlayVideo,
}: {
  ae: LoadedExercise;
  state: ExerciseState | undefined;
  lastTime: LastTimeSet[] | undefined;
  onUpdateSet: (idx: number, patch: Partial<SetState>) => void;
  onPatch: (patch: Partial<ExerciseState>) => void;
  onMarkAll: () => void;
  onAddSet: () => void;
  onRemoveSet: (idx: number) => void;
  onPlayVideo: (url: string) => void;
}) {
  const ex = ae.exercise;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNote, setShowNote] = useState(false);

  if (!state) return null;

  const tempo = ae.tempo ?? ex?.tempo ?? null;
  const coachNote = ae.notes || ex?.cue_notes || "";
  const orm = state.oneRepMax !== "" ? Number(state.oneRepMax) : null;
  const activeIdx = state.sets.findIndex((s) => !s.done);

  // grid template depends on which optional columns are visible
  const cols = [
    "30px", // set #
    state.usePercent ? "48px" : null, // %1RM
    "minmax(0,1fr)", // weight
    "minmax(0,1fr)", // reps
    state.showRpe ? "48px" : null, // rpe
    "62px", // rest
    "40px", // done
  ].filter(Boolean) as string[];
  const gridStyle = { gridTemplateColumns: cols.join(" ") };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Video */}
      <button
        onClick={() => ex?.video_url && onPlayVideo(ex.video_url)}
        disabled={!ex?.video_url}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-gradient-to-br from-text to-[#3a322e] disabled:cursor-default"
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_30%,rgba(196,113,74,0.5),transparent_60%)]" />
        <span
          className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition ${
            ex?.video_url ? "group-hover:scale-105 group-hover:bg-white" : "opacity-40"
          }`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#C4714A" className="ml-1">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        </span>
        {!ex?.video_url && (
          <span className="absolute bottom-3 font-sans text-xs text-bg/60">No demo video</span>
        )}
      </button>

      <div className="p-5">
        {/* Title row + icons */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-light leading-tight text-text">{ex?.name}</h2>
            {tempo && (
              <p className="mt-0.5 font-sans text-sm text-text-muted">Tempo {tempo}</p>
            )}
          </div>
          <div className="relative flex shrink-0 items-center gap-1">
            <IconButton
              label="Last time"
              active={showHistory}
              onClick={() => setShowHistory((v) => !v)}
            >
              <path d="M3 3v5h5" />
              <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              <path d="M12 7v5l3 2" />
            </IconButton>
            <IconButton
              label="Note"
              active={showNote || !!state.notes}
              onClick={() => setShowNote((v) => !v)}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </IconButton>
            <IconButton label="More" active={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </IconButton>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg">
                <MenuToggle
                  label="Use % of 1RM"
                  on={state.usePercent}
                  onClick={() => onPatch({ usePercent: !state.usePercent })}
                />
                <MenuToggle
                  label="Each side"
                  on={state.eachSide}
                  onClick={() => onPatch({ eachSide: !state.eachSide })}
                />
                <MenuToggle
                  label="Show RPE column"
                  on={state.showRpe}
                  onClick={() => onPatch({ showRpe: !state.showRpe })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Coach note */}
        {coachNote && (
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-muted">{coachNote}</p>
        )}

        {/* 1RM (when using %) */}
        {state.usePercent && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-bg px-3 py-2">
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              Your 1RM
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={state.oneRepMax}
              onChange={(e) => onPatch({ oneRepMax: e.target.value })}
              placeholder="—"
              className="w-24 rounded-lg border border-border bg-white px-2 py-1.5 text-center font-sans text-sm text-text outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
            />
            <span className="font-sans text-xs text-text-muted">lb · weights auto-calc from %</span>
          </div>
        )}

        {/* Last time */}
        {showHistory && (
          <div className="mt-4 rounded-lg border border-border bg-bg px-3 py-3">
            <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Last time
            </p>
            {lastTime && lastTime.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-sm text-text">
                {lastTime.map((s) => (
                  <span key={s.set_number}>
                    <span className="text-text-muted">Set {s.set_number}:</span>{" "}
                    {s.weight != null ? `${s.weight} lb` : "—"} × {s.reps != null ? `${s.reps}` : "—"}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-sans text-sm text-text-muted">No previous log for this exercise yet.</p>
            )}
          </div>
        )}

        {/* Sets table */}
        <div className="mt-5">
          <div
            className="mb-2 grid items-center gap-2 px-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            style={gridStyle}
          >
            <span>Set</span>
            {state.usePercent && <span className="text-center">%1RM</span>}
            <span className="text-center">Weight</span>
            <span className="text-center">Reps{state.eachSide ? " /side" : ""}</span>
            {state.showRpe && <span className="text-center">RPE</span>}
            <span className="text-center">Rest</span>
            <span className="text-center">✓</span>
          </div>
          <div className="space-y-2">
            {state.sets.map((s, i) => (
              <SetRow
                key={i}
                index={i}
                set={s}
                gridStyle={gridStyle}
                usePercent={state.usePercent}
                showRpe={state.showRpe}
                oneRepMax={orm}
                isActive={i === activeIdx}
                restSeconds={ae.rest_seconds ?? 60}
                onUpdate={(patch) => onUpdateSet(i, patch)}
                onRemove={state.sets.length > 1 ? () => onRemoveSet(i) : undefined}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={onAddSet}
              className="font-sans text-sm font-medium text-terracotta hover:underline"
            >
              + Add set
            </button>
            <button
              onClick={onMarkAll}
              className="font-sans text-sm font-medium text-text-muted transition hover:text-text"
            >
              {state.sets.every((s) => s.done) ? "Unmark all" : "Mark All"}
            </button>
          </div>
        </div>

        {/* Client note */}
        {(showNote || state.notes) && (
          <div className="mt-5">
            <label className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Note for Keyla
            </label>
            <textarea
              rows={2}
              value={state.notes}
              onChange={(e) => onPatch({ notes: e.target.value })}
              placeholder="Felt strong, left knee a little tight…"
              className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
        active ? "bg-blush text-burgundy" : "text-text-muted hover:bg-bg-alt"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {children}
      </svg>
    </button>
  );
}

function MenuToggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-2.5 font-sans text-sm text-text transition hover:bg-bg"
    >
      {label}
      <span
        className={`flex h-5 w-9 items-center rounded-full px-0.5 transition ${
          on ? "justify-end bg-terracotta" : "justify-start bg-border"
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

function SetRow({
  index,
  set,
  gridStyle,
  usePercent,
  showRpe,
  oneRepMax,
  isActive,
  restSeconds,
  onUpdate,
  onRemove,
}: {
  index: number;
  set: SetState;
  gridStyle: React.CSSProperties;
  usePercent: boolean;
  showRpe: boolean;
  oneRepMax: number | null;
  isActive: boolean;
  restSeconds: number;
  onUpdate: (patch: Partial<SetState>) => void;
  onRemove?: () => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-border bg-white px-1 py-2.5 text-center font-sans text-base text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30";

  const shownWeight = effectiveWeight(set, usePercent, oneRepMax);
  const weightIsAuto = usePercent && !set.weightEdited && oneRepMax != null && set.percent !== "";

  return (
    <div
      className={`rounded-lg border-l-2 py-1 pl-1.5 transition ${
        set.done
          ? "border-l-olive bg-olive/5"
          : isActive
            ? "border-l-terracotta bg-blush/20"
            : "border-l-transparent"
      }`}
    >
      <div className="grid items-center gap-2" style={gridStyle}>
        <span
          className={`text-center font-sans text-sm font-semibold ${
            isActive ? "text-terracotta" : "text-text-muted"
          }`}
        >
          {index + 1}
        </span>

        {usePercent && (
          <input
            type="number"
            inputMode="numeric"
            value={set.percent}
            onChange={(e) => onUpdate({ percent: e.target.value })}
            placeholder="—"
            className={inputClass}
          />
        )}

        <input
          type="number"
          inputMode="decimal"
          value={shownWeight}
          onChange={(e) => onUpdate({ weight: e.target.value, weightEdited: true })}
          placeholder="—"
          className={`${inputClass} ${weightIsAuto ? "text-text-muted" : ""}`}
        />

        <input
          type="number"
          inputMode="numeric"
          value={set.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          placeholder="—"
          className={inputClass}
        />

        {showRpe && (
          <input
            type="number"
            inputMode="decimal"
            value={set.rpe}
            onChange={(e) => onUpdate({ rpe: e.target.value })}
            placeholder="—"
            className={inputClass}
          />
        )}

        <RestCell
          restSeconds={restSeconds}
          taken={set.rest_taken_seconds}
          onTaken={(secs) => onUpdate({ rest_taken_seconds: secs })}
        />

        <button
          onClick={() => onUpdate({ done: !set.done })}
          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border transition ${
            set.done
              ? "border-olive bg-olive text-white"
              : "border-border bg-white text-transparent hover:border-terracotta"
          }`}
          aria-label={`Mark set ${index + 1} done`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      {onRemove && (
        <div className="mt-1 flex justify-end pr-11">
          <button
            onClick={onRemove}
            className="font-sans text-[11px] text-text-muted hover:text-burgundy"
          >
            Remove set
          </button>
        </div>
      )}
    </div>
  );
}

/** Rest column cell: shows target rest as MM:SS; tap to run a countdown timer. */
function RestCell({
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
      const el = Math.floor((Date.now() - startMs) / 1000);
      setRemaining(Math.max(0, restSeconds - el));
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [running, restSeconds]);

  function toggle() {
    if (running) {
      const startMs = startRef.current;
      if (startMs) onTaken(Math.floor((Date.now() - startMs) / 1000));
      setRunning(false);
      setRemaining(restSeconds);
    } else {
      setRemaining(restSeconds);
      setRunning(true);
    }
  }

  const done = running && remaining === 0;
  const label = running ? (done ? "done" : formatRest(remaining)) : formatRest(restSeconds);

  return (
    <button
      onClick={toggle}
      className={`mx-auto rounded-md px-1.5 py-1.5 text-center font-sans text-xs font-medium tabular-nums transition ${
        done
          ? "bg-terracotta text-white"
          : running
            ? "bg-blush text-burgundy"
            : taken != null
              ? "text-olive hover:bg-bg-alt"
              : "text-text-muted hover:bg-bg-alt"
      }`}
      aria-label="Rest timer"
    >
      {label}
    </button>
  );
}

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  const embed = useMemo(() => toEmbedUrl(url), [url]);
  const direct = useMemo(() => isDirectVideo(url), [url]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
          aria-label="Close video"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {direct ? (
            <video src={url} controls autoPlay className="h-full w-full" />
          ) : embed ? (
            <iframe
              src={`${embed}?autoplay=1`}
              title="Exercise demo"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-white/80">
              <p className="font-sans text-sm">This video opens in a new tab.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-terracotta px-4 py-2 font-sans text-sm font-medium text-white"
              >
                Open demo ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
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
