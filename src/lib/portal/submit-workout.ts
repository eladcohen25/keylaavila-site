import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWorkoutEmail, type EmailExercise } from "@/lib/portal/workout-email";

export interface SubmitSet {
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  percent_1rm: number | null;
  rest_taken_seconds: number | null;
  done: boolean;
}

export interface SubmitExercise {
  assigned_exercise_id: string;
  exercise_id?: string | null;
  exercise_name: string;
  target_sets: number | null;
  target_reps: string | null;
  tempo?: string | null;
  each_side?: boolean;
  notes: string | null;
  sets: SubmitSet[];
}

export interface SubmitMax {
  exercise_id: string;
  one_rep_max: number;
}

export interface SubmitBody {
  assigned_workout_id: string;
  day_label: string;
  started_at: string;
  completed_at: string;
  total_duration_seconds: number;
  exercises: SubmitExercise[];
  maxes?: SubmitMax[];
  /** When set, replace this existing (re-opened) session instead of creating a new one. */
  session_id?: string | null;
}

export async function submitWorkoutSession(
  supabase: SupabaseClient,
  clientId: string,
  body: SubmitBody,
  options?: { sendEmail?: boolean; clientName?: string }
): Promise<{ sessionId: string }> {
  let sessionId: string;

  if (body.session_id) {
    // Replace a re-opened (draft) session: update it in place and clear its
    // prior set logs so the fresh submission becomes the single record.
    const { data: updated, error: updErr } = await supabase
      .from("workout_sessions")
      .update({
        assigned_workout_id: body.assigned_workout_id,
        started_at: body.started_at,
        completed_at: body.completed_at,
        total_duration_seconds: body.total_duration_seconds,
        submitted: true,
      })
      .eq("id", body.session_id)
      .eq("client_id", clientId)
      .select("id")
      .single();

    if (updErr || !updated) {
      throw new Error(`Could not update session: ${updErr?.message ?? "session not found"}`);
    }
    sessionId = updated.id;
    await supabase.from("set_logs").delete().eq("workout_session_id", sessionId);
  } else {
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("workout_sessions")
      .insert({
        assigned_workout_id: body.assigned_workout_id,
        client_id: clientId,
        started_at: body.started_at,
        completed_at: body.completed_at,
        total_duration_seconds: body.total_duration_seconds,
        submitted: true,
      })
      .select("id")
      .single();

    if (sessionErr || !sessionRow) {
      throw new Error(`Could not save session: ${sessionErr?.message ?? "unknown error"}`);
    }
    sessionId = sessionRow.id;
  }

  const setRows = body.exercises.flatMap((ex) =>
    ex.sets.map((s) => ({
      workout_session_id: sessionId,
      assigned_exercise_id: ex.assigned_exercise_id,
      set_number: s.set_number,
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
      percent_1rm: s.percent_1rm,
      rest_taken_seconds: s.rest_taken_seconds,
      done: s.done,
      notes: ex.notes,
    }))
  );

  if (setRows.length > 0) {
    const { error: logsErr } = await supabase.from("set_logs").insert(setRows);
    if (logsErr) {
      throw new Error(`Could not save sets: ${logsErr.message}`);
    }
  }

  await supabase
    .from("assigned_workouts")
    .update({ status: "completed" })
    .eq("id", body.assigned_workout_id)
    .eq("client_id", clientId);

  const maxRows = (body.maxes ?? []).filter(
    (m) => m.exercise_id && Number.isFinite(m.one_rep_max) && m.one_rep_max > 0
  );
  if (maxRows.length > 0) {
    await supabase.from("client_exercise_maxes").upsert(
      maxRows.map((m) => ({
        client_id: clientId,
        exercise_id: m.exercise_id,
        one_rep_max: m.one_rep_max,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "client_id,exercise_id" }
    );
  }

  if (options?.sendEmail !== false) {
    try {
      let clientName = options?.clientName;
      if (!clientName) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", clientId)
          .single();
        clientName = profile?.full_name || "Client";
      }

      const emailExercises: EmailExercise[] = body.exercises.map((ex) => ({
        name: ex.exercise_name,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        notes: ex.notes,
        sets: ex.sets.map((s) => ({
          set_number: s.set_number,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          percent_1rm: s.percent_1rm,
          done: s.done,
        })),
      }));

      await sendWorkoutEmail({
        clientName: clientName || "Client",
        dayLabel: body.day_label,
        durationSeconds: body.total_duration_seconds,
        exercises: emailExercises,
      });
    } catch (emailErr) {
      console.error("[submit-workout] email failed (session saved):", emailErr);
    }
  }

  return { sessionId };
}
