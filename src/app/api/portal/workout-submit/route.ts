import { NextResponse } from "next/server";
import { getSupabaseForToken } from "@/lib/supabase-token";
import { submitWorkoutSession, type SubmitBody } from "@/lib/portal/submit-workout";

export const maxDuration = 30;

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

  try {
    const { sessionId } = await submitWorkoutSession(supabase, userData.user.id, body);
    return NextResponse.json({ ok: true, session_id: sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save workout";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
