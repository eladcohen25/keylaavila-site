"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { type Exercise } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";
import { WarmCoolEditor } from "@/app/trainer/programs/[id]/page";
import ExerciseBlocks, { type ExerciseBlockRow } from "@/components/trainer/ExerciseBlocks";

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  warmup_text: string | null;
  warmup_seconds: number | null;
  cooldown_text: string | null;
  cooldown_seconds: number | null;
}

function Builder({ id }: { id: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<ExerciseBlockRow[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const [{ data: tpl }, { data: exRows }, { data: lib }] = await Promise.all([
      supabase.from("workout_templates").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("workout_template_exercises")
        .select("*, exercise:exercises(*)")
        .eq("workout_template_id", id)
        .order("order_index", { ascending: true }),
      supabase.from("exercises").select("*").order("name", { ascending: true }),
    ]);

    if (!tpl) {
      router.replace("/trainer/workouts");
      return;
    }
    setWorkout(tpl as WorkoutTemplate);
    setName((tpl as WorkoutTemplate).name);
    setExercises(
      [...((exRows as ExerciseBlockRow[]) ?? [])].sort((a, b) => a.order_index - b.order_index)
    );
    setLibrary((lib as Exercise[]) ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function renameWorkout() {
    if (!workout) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === workout.name) {
      setName(workout.name);
      return;
    }
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("workout_templates")
      .update({ name: trimmed })
      .eq("id", id);
    if (!error) setWorkout({ ...workout, name: trimmed });
    else setName(workout.name);
  }

  if (loading) return <Spinner />;
  if (!workout) return null;

  return (
    <>
      <Link
        href="/trainer/workouts"
        className="mb-4 inline-flex items-center gap-1 font-sans text-sm text-text-muted hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Workouts
      </Link>

      <div className="mb-6">
        <label className="mb-1.5 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
          Workout name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={renameWorkout}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full max-w-xl rounded-lg border border-border bg-white px-3 py-2 font-serif text-2xl font-light tracking-tight text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
        />
        {workout.description && (
          <p className="mt-2 font-sans text-sm text-text-muted">{workout.description}</p>
        )}
      </div>

      <Card>
        <WarmCoolEditor table="workout_templates" rowId={workout.id} initial={workout} />

        <ExerciseBlocks
          table="workout_template_exercises"
          fkColumn="workout_template_id"
          parentId={workout.id}
          list={exercises}
          library={library}
          onChanged={load}
        />
      </Card>
    </>
  );
}

export default function WorkoutBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <TrainerLayout>
      <Builder id={id} />
    </TrainerLayout>
  );
}
