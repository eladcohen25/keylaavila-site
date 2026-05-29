import { NextResponse } from "next/server";
import { parseCheckInForm } from "@/lib/checkin-types";
import { uploadCheckInPhoto } from "@/lib/checkin-storage";
import { sendCheckInEmail } from "@/lib/checkin-email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 60;

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function validatePhoto(file: File | null, field: string): string | null {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_PHOTO_BYTES) {
    return `${field} must be under 10 MB`;
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return `${field} must be JPEG, PNG, or WebP`;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const { data, missing } = parseCheckInForm(form);

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields", missing },
        { status: 400 }
      );
    }

    const frontFile = form.get("photo_front");
    const backFile = form.get("photo_back");
    const front =
      frontFile instanceof File && frontFile.size > 0 ? frontFile : null;
    const back =
      backFile instanceof File && backFile.size > 0 ? backFile : null;

    for (const [file, name] of [
      [front, "photo_front"],
      [back, "photo_back"],
    ] as const) {
      const err = validatePhoto(file, name);
      if (err) {
        return NextResponse.json({ ok: false, error: err }, { status: 400 });
      }
    }

    let photoFrontUrl: string | null = null;
    let photoBackUrl: string | null = null;

    if (front) {
      photoFrontUrl = await uploadCheckInPhoto(
        front,
        data.client_name,
        data.week_of,
        "front"
      );
    }
    if (back) {
      photoBackUrl = await uploadCheckInPhoto(
        back,
        data.client_name,
        data.week_of,
        "back"
      );
    }

    data.photo_front_url = photoFrontUrl;
    data.photo_back_url = photoBackUrl;

    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase.from("checkins").insert(data);

    if (dbError) {
      console.error("[checkin] DB insert failed:", dbError);
      return NextResponse.json(
        { ok: false, error: "Failed to save check-in" },
        { status: 500 }
      );
    }

    try {
      await sendCheckInEmail(data, photoFrontUrl, photoBackUrl);
    } catch (emailErr) {
      console.error("[checkin] Email failed (row saved):", emailErr);
      // Row is saved — don't fail the client submission for email issues
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[checkin] Unexpected error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
