import { NextResponse } from "next/server";
import { getInstagramData } from "@/lib/instagram";

/** Run per-request. The expensive Apify call is bounded by the in-memory
 *  cache inside `lib/instagram` (~1 call/hour/instance). The CDN is then
 *  told how long to hold the response via Cache-Control below. */
export const dynamic = "force-dynamic";

/** Apify cold scrapes take 5–20s. Default Vercel timeout is 10–15s and
 *  a timeout would otherwise produce a cached 504. 60s is plenty. */
export const maxDuration = 60;

export async function GET() {
  const { profile, posts } = await getInstagramData();
  const hasData = profile !== null && posts.length > 0;

  /** Critical: if the upstream call failed, cache the empty response for
   *  only 60s so transient errors (cold start, Apify hiccup, missing env
   *  var on first deploy) don't poison the CDN cache for an hour. */
  const cacheControl = hasData
    ? "public, s-maxage=3600, stale-while-revalidate=86400"
    : "public, s-maxage=60, stale-while-revalidate=300";

  return NextResponse.json(
    { profile, posts },
    {
      status: 200,
      headers: { "Cache-Control": cacheControl },
    }
  );
}
