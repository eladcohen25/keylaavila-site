import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { clientSlug } from "@/lib/checkin-types";

const BUCKET = "checkin-photos";
/** Signed URLs valid 7 days — long enough for email review */
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[mime] ?? "jpg";
}

export async function uploadCheckInPhoto(
  file: File,
  clientName: string,
  weekOf: string,
  side: "front" | "back"
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const slug = clientSlug(clientName);
  const ext = extFromMime(file.type || "image/jpeg");
  const path = `${slug}/${weekOf}/${side}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Photo upload failed (${side}): ${uploadError.message}`);
  }

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (signError || !data?.signedUrl) {
    throw new Error(`Signed URL failed (${side}): ${signError?.message}`);
  }

  return data.signedUrl;
}
