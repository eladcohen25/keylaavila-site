import { NextResponse } from "next/server";
import { getInstagramPosts, getInstagramProfile } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [posts, profile] = await Promise.all([
      getInstagramPosts(12),
      getInstagramProfile(),
    ]);
    return NextResponse.json(
      { posts, profile },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { posts: [], profile: null, error: "Failed to fetch" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
