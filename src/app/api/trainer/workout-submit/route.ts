import { NextResponse } from "next/server";
import { getSupabaseForToken } from "@/lib/supabase-token";
import { submitWorkoutSession, type SubmitBody } from "@/lib/portal/submit-workout";

export const maxDuration = 30;

interface TrainerSubmitBody extends SubmitBody {
  client_id: string;
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: TrainerSubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  if (!body.client_id || !body.assigned_workout_id || !Array.isArray(body.exercises)) {
    return NextResponse.json({ ok: false, error: "Missing workout data" }, { status: 400 });
  }

  const supabase = getSupabaseForToken(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (caller?.role !== "trainer") {
    return NextResponse.json({ ok: false, error: "Trainer access required" }, { status: 403 });
  }

  const { data: client } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", body.client_id)
    .maybeSingle();
  if (!client || client.role !== "client") {
    return NextResponse.json({ ok: false, error: "Invalid client" }, { status: 400 });
  }

  const { data: workout } = await supabase
    .from("assigned_workouts")
    .select("id")
    .eq("id", body.assigned_workout_id)
    .eq("client_id", body.client_id)
    .maybeSingle();
  if (!workout) {
    return NextResponse.json({ ok: false, error: "Workout not found for this client" }, { status: 404 });
  }

  try {
    const { sessionId } = await submitWorkoutSession(supabase, body.client_id, body, {
      sendEmail: false,
      clientName: client.full_name || "Client",
    });
    return NextResponse.json({ ok: true, session_id: sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save workout";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
