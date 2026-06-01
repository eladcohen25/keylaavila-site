export type UserRole = "trainer" | "client";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  onboarding_complete: boolean;
}

export interface HealthIntake {
  id: string;
  client_id: string;
  dob: string | null;
  height: string | null;
  weight: number | null;
  injuries: string | null;
  medical_conditions: string | null;
  medications: string | null;
  goals: string | null;
  activity_level: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  submitted_at: string;
}

export interface LiabilityWaiver {
  id: string;
  client_id: string;
  signed_name: string;
  agreed: boolean;
  signed_at: string;
  ip_address: string | null;
  waiver_version: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  video_url: string | null;
  default_sets: number | null;
  default_reps: string | null;
  cue_notes: string | null;
  tempo: string | null;
  is_unilateral: boolean;
  category: string | null;
  tags: string | null;
  created_by: string | null;
  created_at: string;
}

export type WorkoutStatus = "assigned" | "in_progress" | "completed";

export interface AssignedWorkout {
  id: string;
  client_id: string;
  program_id: string | null;
  week_of: string;
  scheduled_date: string | null;
  day_label: string;
  status: WorkoutStatus;
  order_index: number;
  assigned_at: string;
}

export interface AssignedExercise {
  id: string;
  assigned_workout_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_rpe: string | null;
  rest_seconds: number | null;
  notes: string | null;
  use_percent: boolean;
  tempo: string | null;
  percent_1rm: number | null;
  each_side: boolean;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  assigned_workout_id: string | null;
  client_id: string;
  started_at: string | null;
  completed_at: string | null;
  total_duration_seconds: number | null;
  submitted: boolean;
  created_at: string;
}

export interface SetLog {
  id: string;
  workout_session_id: string;
  assigned_exercise_id: string | null;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  percent_1rm: number | null;
  rest_taken_seconds: number | null;
  done: boolean;
  notes: string | null;
}

export interface ClientExerciseMax {
  id: string;
  client_id: string;
  exercise_id: string;
  one_rep_max: number;
  updated_at: string;
}

export type CalendarEventType = "rest" | "session" | "appointment" | "checkin" | "other";

export interface CalendarEvent {
  id: string;
  client_id: string;
  event_date: string;
  type: CalendarEventType;
  title: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DayNote {
  id: string;
  client_id: string;
  note_date: string;
  note: string;
  author_role: "trainer" | "client";
  created_by: string | null;
  updated_at: string;
}

export const CALENDAR_EVENT_META: Record<CalendarEventType, { label: string; dot: string; chip: string }> = {
  session: { label: "In-person session", dot: "bg-terracotta", chip: "bg-terracotta/10 text-terracotta" },
  rest: { label: "Rest day", dot: "bg-olive", chip: "bg-olive/15 text-olive" },
  appointment: { label: "Appointment", dot: "bg-burgundy", chip: "bg-blush text-burgundy" },
  checkin: { label: "Check-in reminder", dot: "bg-burgundy", chip: "bg-blush text-burgundy" },
  other: { label: "Other", dot: "bg-text-muted", chip: "bg-bg-alt text-text-muted" },
};

export interface NutritionPlan {
  id: string;
  client_id: string;
  pdf_url: string | null;
  notes: string | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  calories: number | null;
  updated_at: string;
  updated_by: string | null;
}

/** Returns the Monday (ISO) of the current week as YYYY-MM-DD. */
export function currentWeekMonday(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Working weight from a 1RM and a target percentage, rounded to nearest 5 lb. */
export function weightFromPercent(oneRepMax: number, percent: number): number {
  return Math.round((oneRepMax * (percent / 100)) / 5) * 5;
}

/** MM:SS from a number of seconds (for inline rest display). */
export function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Build an embeddable URL for a YouTube/Vimeo link, or null if not embeddable. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) {
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      }
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

/** True if the URL points at a directly-playable video file. */
export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

export type VideoThumb =
  | { type: "image"; src: string } // ready-to-use poster image URL
  | { type: "video"; src: string } // direct file: render first frame
  | { type: "vimeo"; id: string } // needs an async oEmbed lookup
  | { type: "none" };

/** Resolve a demo video URL to a thumbnail strategy. */
export function getVideoThumb(url: string): VideoThumb {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const ytThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { type: "image", src: ytThumb(id) };
    }
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return { type: "image", src: ytThumb(v) };
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts") {
        if (parts[1]) return { type: "image", src: ytThumb(parts[1]) };
      }
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return { type: "vimeo", id };
    }
  } catch {
    return { type: "none" };
  }
  if (isDirectVideo(url)) return { type: "video", src: url };
  return { type: "none" };
}

/** Local YYYY-MM-DD for a Date (avoids UTC off-by-one from toISOString). */
export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today as YYYY-MM-DD in local time. */
export function todayYmd(): string {
  return ymd(new Date());
}

/**
 * 6-week (42-cell) matrix of YYYY-MM-DD strings for the month containing
 * `monthAnchor`, starting on Sunday. Cells outside the month are still real
 * dates (leading/trailing days) so the grid is always full.
 */
export function monthMatrix(monthAnchor: Date): string[][] {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay()); // back up to Sunday
  const weeks: string[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(ymd(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** "Saturday, May 30" full label for a YYYY-MM-DD string. */
export function formatFullDay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** "Mon, Jun 1" style label for a YYYY-MM-DD date string. */
export function formatDayLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
