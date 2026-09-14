import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "checkin-photos";
/** Fresh signed URLs live for 1 hour — plenty for a viewing session. */
const VIEW_TTL = 60 * 60;

/**
 * Check-in photo values in the DB come in two flavors:
 *  - new rows: a bare storage path ("jane-doe/2026-06-15/front.jpg")
 *  - old rows: a full signed URL (which expires after 7 days)
 * This extracts the storage path from either format.
 */
export function checkinPhotoPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("http")) return value; // already a bare path
  const m = value.match(/\/object\/(?:sign|public|authenticated)\/checkin-photos\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Resolve a batch of stored photo values (paths or stale signed URLs) into
 * fresh signed URLs. Returns a map keyed by the original stored value.
 */
export async function resolveCheckinPhotoUrls(
  supabase: SupabaseClient,
  values: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const byPath = new Map<string, string[]>(); // path -> original values
  for (const v of values) {
    const path = checkinPhotoPath(v);
    if (!v || !path) continue;
    const list = byPath.get(path) ?? [];
    list.push(v);
    byPath.set(path, list);
  }

  const result = new Map<string, string>();
  const paths = [...byPath.keys()];
  if (paths.length === 0) return result;

  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, VIEW_TTL);
  for (const item of data ?? []) {
    if (!item.signedUrl || !item.path) continue;
    for (const original of byPath.get(item.path) ?? []) {
      result.set(original, item.signedUrl);
    }
  }
  return result;
}
