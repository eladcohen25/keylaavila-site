export type SoloSession = "completed" | "partial" | "skipped";
export type SessionDifficulty = "too_easy" | "just_right" | "too_hard";
export type PushPreference = "push_more" | "keep_same" | "ease_off";
export type RecoveryLevel = "fresh" | "okay" | "sore" | "exhausted";

export interface CheckInRecord {
  client_name: string;
  week_of: string;
  weight: number | null;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  arms: number | null;
  thighs: number | null;
  photo_front_url: string | null;
  photo_back_url: string | null;
  sessions_with_keyla: number;
  solo_session: SoloSession | null;
  session_difficulty: SessionDifficulty;
  push_preference: PushPreference | null;
  nutrition_rating: number;
  nutrition_notes: string | null;
  sleep_hours: number | null;
  recovery: RecoveryLevel;
  energy_mood: number;
  weekly_notes: string | null;
}

const SOLO: SoloSession[] = ["completed", "partial", "skipped"];
const DIFFICULTY: SessionDifficulty[] = ["too_easy", "just_right", "too_hard"];
const PUSH: PushPreference[] = ["push_more", "keep_same", "ease_off"];
const RECOVERY: RecoveryLevel[] = ["fresh", "okay", "sore", "exhausted"];

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredString(
  form: FormData,
  key: string,
  missing: string[]
): string {
  const v = form.get(key);
  if (typeof v !== "string" || !v.trim()) {
    missing.push(key);
    return "";
  }
  return v.trim();
}

function parseEnum<T extends string>(
  form: FormData,
  key: string,
  allowed: readonly T[],
  missing: string[]
): T | null {
  const v = form.get(key);
  if (typeof v !== "string" || !allowed.includes(v as T)) {
    missing.push(key);
    return null;
  }
  return v as T;
}

function parseRating(
  form: FormData,
  key: string,
  missing: string[]
): number | null {
  const raw = form.get(key);
  const n = raw !== null && raw !== "" ? Number(raw) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    missing.push(key);
    return null;
  }
  return n;
}

/** Slug for storage paths: `jane-doe` */
export function clientSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "client"
  );
}

export function parseCheckInForm(form: FormData): {
  data: CheckInRecord | null;
  missing: string[];
} {
  const missing: string[] = [];

  const client_name = parseRequiredString(form, "client_name", missing);
  const week_of = parseRequiredString(form, "week_of", missing);

  const sessionsRaw = form.get("sessions_with_keyla");
  let sessions_with_keyla: number | null = null;
  if (sessionsRaw === "4+") {
    sessions_with_keyla = 4;
  } else {
    const n = Number(sessionsRaw);
    if (Number.isInteger(n) && n >= 0 && n <= 4) {
      sessions_with_keyla = n;
    } else {
      missing.push("sessions_with_keyla");
    }
  }

  const soloRaw = form.get("solo_session");
  let solo_session: SoloSession | null = null;
  if (typeof soloRaw === "string" && soloRaw !== "") {
    if (SOLO.includes(soloRaw as SoloSession)) {
      solo_session = soloRaw as SoloSession;
    } else {
      missing.push("solo_session");
    }
  }

  const session_difficulty = parseEnum(
    form,
    "session_difficulty",
    DIFFICULTY,
    missing
  );
  // push_preference is optional — only validate if a value was provided.
  const pushRaw = form.get("push_preference");
  let push_preference: PushPreference | null = null;
  if (typeof pushRaw === "string" && pushRaw !== "") {
    if (PUSH.includes(pushRaw as PushPreference)) {
      push_preference = pushRaw as PushPreference;
    } else {
      missing.push("push_preference");
    }
  }
  const recovery = parseEnum(form, "recovery", RECOVERY, missing);
  const nutrition_rating = parseRating(form, "nutrition_rating", missing);
  const energy_mood = parseRating(form, "energy_mood", missing);

  if (missing.length > 0) {
    return { data: null, missing: [...new Set(missing)] };
  }

  return {
    data: {
      client_name,
      week_of,
      weight: parseOptionalNumber(form.get("weight")),
      waist: parseOptionalNumber(form.get("waist")),
      hips: parseOptionalNumber(form.get("hips")),
      chest: parseOptionalNumber(form.get("chest")),
      arms: parseOptionalNumber(form.get("arms")),
      thighs: parseOptionalNumber(form.get("thighs")),
      photo_front_url: null,
      photo_back_url: null,
      sessions_with_keyla: sessions_with_keyla!,
      solo_session,
      session_difficulty: session_difficulty!,
      push_preference,
      nutrition_rating: nutrition_rating!,
      nutrition_notes:
        typeof form.get("nutrition_notes") === "string"
          ? (form.get("nutrition_notes") as string).trim() || null
          : null,
      sleep_hours: parseOptionalNumber(form.get("sleep_hours")),
      recovery: recovery!,
      energy_mood: energy_mood!,
      weekly_notes:
        typeof form.get("weekly_notes") === "string"
          ? (form.get("weekly_notes") as string).trim() || null
          : null,
    },
    missing: [],
  };
}

/** Human-readable labels for email + UI */
export const CHECKIN_LABELS = {
  session_difficulty: {
    too_easy: "Too easy (coasted)",
    just_right: "Just right (worked hard)",
    too_hard: "Too hard (couldn't keep up)",
  },
  push_preference: {
    push_more: "Push me harder",
    keep_same: "Keep it here",
    ease_off: "Ease off a bit",
  },
  solo_session: {
    completed: "Completed",
    partial: "Partial",
    skipped: "Skipped",
  },
  recovery: {
    fresh: "Fresh & recovered",
    okay: "Okay",
    sore: "Sore / run down",
    exhausted: "Exhausted",
  },
} as const;
