import { NextResponse } from "next/server";
import { getSupabaseForToken } from "@/lib/supabase-token";
import { sendWorkoutEmail, type EmailExercise } from "@/lib/portal/workout-email";

export const maxDuration = 30;

interface SubmitSet {
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  rest_taken_seconds: number | null;
  done: boolean;
}

interface SubmitExercise {
  assigned_exercise_id: string;
  exercise_name: string;
  target_sets: number | null;
  target_reps: string | null;
  notes: string | null;
  sets: SubmitSet[];
}

interface SubmitBody {
  assigned_workout_id: string;
  day_label: string;
  started_at: string;
  completed_at: string;
  total_duration_seconds: number;
  exercises: SubmitExercise[];
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  if (!body.assigned_workout_id || !Array.isArray(body.exercises)) {
    return NextResponse.json({ ok: false, error: "Missing workout data" }, { status: 400 });
  }

  const supabase = getSupabaseForToken(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }
  const userId = userData.user.id;

  // 1. Create the workout session
  const { data: sessionRow, error: sessionErr } = await supabase
    .from("workout_sessions")
    .insert({
      assigned_workout_id: body.assigned_workout_id,
      client_id: userId,
      started_at: body.started_at,
      completed_at: body.completed_at,
      total_duration_seconds: body.total_duration_seconds,
      submitted: true,
    })
    .select("id")
    .single();

  if (sessionErr || !sessionRow) {
    return NextResponse.json(
      { ok: false, error: `Could not save session: ${sessionErr?.message}` },
      { status: 500 }
    );
  }

  // 2. Insert all set logs (single batched write)
  const setRows = body.exercises.flatMap((ex) =>
    ex.sets.map((s) => ({
      workout_session_id: sessionRow.id,
      assigned_exercise_id: ex.assigned_exercise_id,
      set_number: s.set_number,
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
      rest_taken_seconds: s.rest_taken_seconds,
      done: s.done,
      notes: ex.notes,
    }))
  );

  if (setRows.length > 0) {
    const { error: logsErr } = await supabase.from("set_logs").insert(setRows);
    if (logsErr) {
      return NextResponse.json(
        { ok: false, error: `Could not save sets: ${logsErr.message}` },
        { status: 500 }
      );
    }
  }

  // 3. Mark the assigned workout completed
  await supabase
    .from("assigned_workouts")
    .update({ status: "completed" })
    .eq("id", body.assigned_workout_id)
    .eq("client_id", userId);

  // 4. Email Keyla a summary (best-effort — don't fail the submission)
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

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
        done: s.done,
      })),
    }));

    await sendWorkoutEmail({
      clientName: profile?.full_name || "Client",
      dayLabel: body.day_label,
      durationSeconds: body.total_duration_seconds,
      exercises: emailExercises,
    });
  } catch (emailErr) {
    console.error("[workout-submit] email failed (session saved):", emailErr);
  }

  return NextResponse.json({ ok: true, session_id: sessionRow.id });
}
