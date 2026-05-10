/**
 * Instagram data via Apify's `apify/instagram-profile-scraper`.
 *
 * Why Apify instead of the Meta Graph API:
 *  - No 60-day token rotation. No password-change session invalidation.
 *  - Works on personal accounts (Graph API requires Business/Creator).
 *  - One call returns profile metadata + the latest N posts.
 *
 * Cost is bounded by an in-memory TTL cache here PLUS the route-level
 * `revalidate` in /api/instagram. In production each region calls Apify
 * roughly once per hour.
 */

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramProfile {
  id: string;
  username: string;
  full_name?: string;
  media_count?: number;
  account_type?: string;
  followers_count?: number;
  follows_count?: number;
  biography?: string;
  profile_picture_url?: string;
  verified?: boolean;
}

interface ApifyPost {
  id: string;
  type: "Image" | "Video" | "Sidecar";
  shortCode?: string;
  caption?: string;
  url: string;
  displayUrl: string;
  videoUrl?: string;
  timestamp: string;
  likesCount?: number;
  commentsCount?: number;
}

interface ApifyProfile {
  id: string;
  username: string;
  fullName?: string;
  biography?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  profilePicUrl?: string;
  profilePicUrlHD?: string;
  isBusinessAccount?: boolean;
  verified?: boolean;
  latestPosts?: ApifyPost[];
}

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const IG_USERNAME = process.env.INSTAGRAM_USERNAME ?? "keylanavila";
const APIFY_ACTOR = "apify~instagram-profile-scraper";
const RESULTS_LIMIT = 12;

/** 1 hour. Combined with the route's `revalidate`, Apify gets called ~once/hour. */
const TTL_MS = 60 * 60 * 1000;

type InstagramData = {
  profile: InstagramProfile | null;
  posts: InstagramPost[];
};

let memCache: { data: InstagramData; expiresAt: number } | null = null;

function mapType(t: ApifyPost["type"]): InstagramPost["media_type"] {
  if (t === "Video") return "VIDEO";
  if (t === "Sidecar") return "CAROUSEL_ALBUM";
  return "IMAGE";
}

function transform(raw: ApifyProfile): InstagramData {
  const profile: InstagramProfile = {
    id: raw.id,
    username: raw.username,
    full_name: raw.fullName,
    biography: raw.biography,
    followers_count: raw.followersCount,
    follows_count: raw.followsCount,
    media_count: raw.postsCount,
    profile_picture_url: raw.profilePicUrlHD || raw.profilePicUrl,
    account_type: raw.isBusinessAccount ? "BUSINESS" : "PERSONAL",
    verified: raw.verified,
  };

  const posts: InstagramPost[] = (raw.latestPosts ?? [])
    .filter((p) => p && p.displayUrl && p.url)
    .map((p) => ({
      id: p.id,
      caption: p.caption,
      media_type: mapType(p.type),
      media_url: p.displayUrl,
      thumbnail_url: p.displayUrl,
      permalink: p.url,
      timestamp: p.timestamp,
      like_count: p.likesCount,
      comments_count: p.commentsCount,
    }))
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return { profile, posts };
}

/** Throws on any non-success path so the caller can decide whether to serve stale. */
async function fetchFromApify(): Promise<InstagramData> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not set");
  }

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  const body = JSON.stringify({
    usernames: [IG_USERNAME],
    resultsLimit: RESULTS_LIMIT,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Apify ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as ApifyProfile[];
  const raw = Array.isArray(data) ? data[0] : null;
  if (!raw || !raw.username) {
    throw new Error("Apify returned no profile data");
  }

  return transform(raw);
}

/** Cached fetch with stale-on-error fallback. */
export async function getInstagramData(): Promise<InstagramData> {
  const now = Date.now();
  if (memCache && now < memCache.expiresAt) {
    return memCache.data;
  }

  try {
    const fresh = await fetchFromApify();
    memCache = { data: fresh, expiresAt: now + TTL_MS };
    return fresh;
  } catch (err) {
    console.error("[instagram] Apify fetch failed:", err);
    if (memCache) return memCache.data;
    return { profile: null, posts: [] };
  }
}

/** Backwards-compatible: used by the API route. */
export async function getInstagramPosts(
  limit: number = RESULTS_LIMIT
): Promise<InstagramPost[]> {
  const { posts } = await getInstagramData();
  return posts.slice(0, limit);
}

/** Backwards-compatible: used by the API route. */
export async function getInstagramProfile(): Promise<InstagramProfile | null> {
  const { profile } = await getInstagramData();
  return profile;
}
