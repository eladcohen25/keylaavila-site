export type UserRole = "trainer" | "client";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
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
  created_by: string | null;
  created_at: string;
}

export type WorkoutStatus = "assigned" | "in_progress" | "completed";

export interface AssignedWorkout {
  id: string;
  client_id: string;
  program_id: string | null;
  week_of: string;
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
  rest_taken_seconds: number | null;
  done: boolean;
  notes: string | null;
}

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

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
