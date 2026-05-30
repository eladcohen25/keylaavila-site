import { NextResponse } from "next/server";
import { getSupabaseForToken } from "@/lib/supabase-token";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: { client_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  const clientId = body.client_id;
  if (!clientId) {
    return NextResponse.json({ ok: false, error: "Missing client_id" }, { status: 400 });
  }

  // Verify the caller is a trainer.
  const userClient = getSupabaseForToken(token);
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }
  const { data: caller } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (caller?.role !== "trainer") {
    return NextResponse.json({ ok: false, error: "Trainer access required" }, { status: 403 });
  }

  // Don't allow deleting another trainer (safety) or self.
  if (clientId === userData.user.id) {
    return NextResponse.json({ ok: false, error: "You cannot delete your own account here." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", clientId)
    .maybeSingle();
  if (target?.role === "trainer") {
    return NextResponse.json({ ok: false, error: "Cannot delete a trainer account." }, { status: 400 });
  }

  // Best-effort: remove the client's nutrition PDFs (folder = their uid).
  try {
    const { data: files } = await admin.storage.from("nutrition-plans").list(clientId);
    if (files && files.length > 0) {
      await admin.storage
        .from("nutrition-plans")
        .remove(files.map((f) => `${clientId}/${f.name}`));
    }
  } catch {
    // ignore storage cleanup failures
  }

  // Deleting the auth user cascades to profiles and all client-owned rows
  // (health_intake, waivers, assigned_workouts/exercises, workout_sessions,
  // set_logs, nutrition_plans) via ON DELETE CASCADE.
  const { error: delErr } = await admin.auth.admin.deleteUser(clientId);
  if (delErr) {
    return NextResponse.json(
      { ok: false, error: `Could not delete client: ${delErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
