import { NextResponse } from "next/server";
import { getInstagramData } from "@/lib/instagram";

/** ISR: cache the route response at the Vercel edge for 1 hour, serve
 *  stale while revalidating in the background. The `lib/instagram` module
 *  also memoizes in-memory and serves stale on Apify errors. */
export const revalidate = 3600;

export async function GET() {
  const { profile, posts } = await getInstagramData();

  return NextResponse.json(
    { profile, posts },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
