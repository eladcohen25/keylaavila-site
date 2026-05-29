import { NextResponse } from "next/server";
import { getSupabaseForToken } from "@/lib/supabase-token";

const WAIVER_VERSION = "v1";

function getClientIp(request: Request): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: { signed_name?: string; agreed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const signedName = (body.signed_name ?? "").trim();
  if (!signedName || body.agreed !== true) {
    return NextResponse.json(
      { ok: false, error: "You must type your name and agree to the waiver." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseForToken(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }
  const userId = userData.user.id;

  const { error: waiverErr } = await supabase.from("liability_waivers").insert({
    client_id: userId,
    signed_name: signedName,
    agreed: true,
    ip_address: getClientIp(request),
    waiver_version: WAIVER_VERSION,
  });

  if (waiverErr) {
    return NextResponse.json(
      { ok: false, error: `Could not save waiver: ${waiverErr.message}` },
      { status: 500 }
    );
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", userId);

  if (profileErr) {
    return NextResponse.json(
      { ok: false, error: `Could not finish onboarding: ${profileErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
