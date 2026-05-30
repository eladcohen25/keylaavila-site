import { getSupabaseBrowser } from "@/lib/supabase-browser";

/**
 * Assign a saved program to a client for a given week.
 * Clones each program_day into an assigned_workout and copies its
 * program_exercises into assigned_exercises.
 */
export async function assignProgram(
  clientId: string,
  programId: string,
  weekOf: string
): Promise<void> {
  const supabase = getSupabaseBrowser();

  const { data: days } = await supabase
    .from("program_days")
    .select("*, program_exercises(*)")
    .eq("program_id", programId)
    .order("order_index", { ascending: true });

  for (const day of (days ?? []) as Array<{
    day_label: string;
    order_index: number;
    program_exercises: Array<{
      exercise_id: string;
      order_index: number;
      target_sets: number | null;
      target_reps: string | null;
      target_rpe: string | null;
      rest_seconds: number | null;
      notes: string | null;
      use_percent: boolean | null;
      tempo: string | null;
      percent_1rm: number | null;
      each_side: boolean | null;
    }>;
  }>) {
    const { data: aw } = await supabase
      .from("assigned_workouts")
      .insert({
        client_id: clientId,
        program_id: programId,
        week_of: weekOf,
        day_label: day.day_label,
        status: "assigned",
        order_index: day.order_index,
      })
      .select("id")
      .single();

    if (!aw) continue;
    const rows = (day.program_exercises ?? []).map((pe) => ({
      assigned_workout_id: aw.id,
      exercise_id: pe.exercise_id,
      order_index: pe.order_index,
      target_sets: pe.target_sets,
      target_reps: pe.target_reps,
      target_rpe: pe.target_rpe,
      rest_seconds: pe.rest_seconds,
      notes: pe.notes,
      use_percent: pe.use_percent ?? false,
      tempo: pe.tempo,
      percent_1rm: pe.percent_1rm,
      each_side: pe.each_side ?? false,
    }));
    if (rows.length > 0) {
      await supabase.from("assigned_exercises").insert(rows);
    }
  }
}

/**
 * Clone a client's most recent prior week of assigned workouts into a new week.
 * Returns the number of workouts duplicated.
 */
export async function duplicateLastWeek(
  clientId: string,
  targetWeekOf: string
): Promise<number> {
  const supabase = getSupabaseBrowser();

  // Find the most recent week strictly before the target week.
  const { data: prior } = await supabase
    .from("assigned_workouts")
    .select("week_of")
    .eq("client_id", clientId)
    .lt("week_of", targetWeekOf)
    .order("week_of", { ascending: false })
    .limit(1);

  const sourceWeek = (prior as { week_of: string }[] | null)?.[0]?.week_of;
  if (!sourceWeek) return 0;

  const { data: workouts } = await supabase
    .from("assigned_workouts")
    .select("*, assigned_exercises(*)")
    .eq("client_id", clientId)
    .eq("week_of", sourceWeek)
    .order("order_index", { ascending: true });

  let count = 0;
  for (const w of (workouts ?? []) as Array<{
    program_id: string | null;
    day_label: string;
    order_index: number;
    assigned_exercises: Array<{
      exercise_id: string;
      order_index: number;
      target_sets: number | null;
      target_reps: string | null;
      target_rpe: string | null;
      rest_seconds: number | null;
      notes: string | null;
      use_percent: boolean | null;
      tempo: string | null;
      percent_1rm: number | null;
      each_side: boolean | null;
    }>;
  }>) {
    const { data: aw } = await supabase
      .from("assigned_workouts")
      .insert({
        client_id: clientId,
        program_id: w.program_id,
        week_of: targetWeekOf,
        day_label: w.day_label,
        status: "assigned",
        order_index: w.order_index,
      })
      .select("id")
      .single();
    if (!aw) continue;
    count += 1;
    const rows = (w.assigned_exercises ?? []).map((ae) => ({
      assigned_workout_id: aw.id,
      exercise_id: ae.exercise_id,
      order_index: ae.order_index,
      target_sets: ae.target_sets,
      target_reps: ae.target_reps,
      target_rpe: ae.target_rpe,
      rest_seconds: ae.rest_seconds,
      notes: ae.notes,
      use_percent: ae.use_percent ?? false,
      tempo: ae.tempo,
      percent_1rm: ae.percent_1rm,
      each_side: ae.each_side ?? false,
    }));
    if (rows.length > 0) {
      await supabase.from("assigned_exercises").insert(rows);
    }
  }
  return count;
}
