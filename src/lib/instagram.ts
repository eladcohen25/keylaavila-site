export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramProfile {
  id: string;
  username: string;
  media_count?: number;
  account_type?: string;
  followers_count?: number;
  follows_count?: number;
  biography?: string;
  profile_picture_url?: string;
}

interface InstagramAPIResponse {
  data: InstagramPost[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
/** Profile / counts — cache to limit API usage */
const PROFILE_CACHE_MS = 1000 * 60 * 5;

let cachedPosts: InstagramPost[] | null = null;
let cachedProfile: InstagramProfile | null = null;
let profileCacheTimestamp = 0;

export async function getInstagramProfile(): Promise<InstagramProfile | null> {
  if (cachedProfile && Date.now() - profileCacheTimestamp < PROFILE_CACHE_MS) {
    return cachedProfile;
  }

  if (!INSTAGRAM_TOKEN) return null;

  // Try Graph API fields first (Business/Creator accounts get followers_count)
  const graphFields = "id,username,media_count,account_type,followers_count,follows_count,biography,profile_picture_url";
  const basicFields = "id,username,media_count,account_type";

  try {
    let url = `https://graph.instagram.com/me?fields=${graphFields}&access_token=${INSTAGRAM_TOKEN}`;
    let response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      // Fallback to basic fields if Graph API extended fields aren't available
      url = `https://graph.instagram.com/me?fields=${basicFields}&access_token=${INSTAGRAM_TOKEN}`;
      response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return cachedProfile ?? null;
    }

    cachedProfile = await response.json();
    profileCacheTimestamp = Date.now();
    return cachedProfile;
  } catch {
    return cachedProfile ?? null;
  }
}

export async function getInstagramPosts(
  limit: number = 12
): Promise<InstagramPost[]> {
  if (!INSTAGRAM_TOKEN) return [];

  try {
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${Math.min(limit, 50)}&access_token=${INSTAGRAM_TOKEN}`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("Instagram API error:", response.status);
      return cachedPosts?.slice(0, limit) ?? [];
    }

    const data: InstagramAPIResponse = await response.json();
    const raw = Array.isArray(data.data) ? data.data : [];
    const sorted = [...raw].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    cachedPosts = sorted;

    return sorted.slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch Instagram posts:", error);
    return cachedPosts?.slice(0, limit) ?? [];
  }
}
