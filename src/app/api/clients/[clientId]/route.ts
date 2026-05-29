import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  if (!clientId || clientId.length < 10) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .eq("active", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ id: data.id, name: data.name });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
