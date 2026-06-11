"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Card, Spinner, Field, TextInput, TextArea, PortalButton, ErrorBanner } from "@/components/portal/ui";

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  workout_template_exercises: { id: string }[];
}

function WorkoutList() {
  const { profile } = useProfile();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("workout_templates")
      .select("*, workout_template_exercises(id)")
      .order("created_at", { ascending: false });
    setWorkouts((data as WorkoutTemplate[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this workout and its exercises?")) return;
    const supabase = getSupabaseBrowser();
    await supabase.from("workout_templates").delete().eq("id", id);
    load();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light tracking-tight text-text">Workouts</h1>
          <p className="mt-1 font-sans text-sm text-text-muted">
            Single-session templates you can quick-assign · {workouts.length}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 font-sans text-sm font-medium text-white transition hover:bg-terracotta/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New workout
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : workouts.length === 0 ? (
        <Card className="text-center">
          <p className="font-sans text-sm text-text-muted">
            No workouts yet. Build a single session (e.g. &ldquo;Upper Body Day&rdquo;) you can reuse and
            quick-assign to any client.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((w) => (
            <Card key={w.id} className="flex flex-col">
              <button onClick={() => router.push(`/trainer/workouts/${w.id}`)} className="text-left">
                <h3 className="font-sans text-base font-medium text-text hover:text-terracotta">
                  {w.name}
                </h3>
                <p className="mt-1 font-sans text-xs text-text-muted">
                  {w.workout_template_exercises?.length ?? 0} exercise
                  {(w.workout_template_exercises?.length ?? 0) === 1 ? "" : "s"}
                </p>
                {w.description && (
                  <p className="mt-1 line-clamp-2 font-sans text-xs text-text-muted">{w.description}</p>
                )}
              </button>
              <div className="mt-4 flex gap-3 border-t border-border pt-3">
                <button
                  onClick={() => router.push(`/trainer/workouts/${w.id}`)}
                  className="font-sans text-xs font-medium text-terracotta hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(w.id)}
                  className="font-sans text-xs text-text-muted hover:text-burgundy"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && profile && (
        <NewWorkoutModal
          trainerId={profile.id}
          onClose={() => setModalOpen(false)}
          onCreated={(id) => router.push(`/trainer/workouts/${id}`)}
        />
      )}
    </>
  );
}

function NewWorkoutModal({
  trainerId,
  onClose,
  onCreated,
}: {
  trainerId: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    const supabase = getSupabaseBrowser();
    const { data, error: err } = await supabase
      .from("workout_templates")
      .insert({ name: name.trim(), description: description.trim() || null, created_by: trainerId })
      .select("id")
      .single();
    setSaving(false);
    if (err || !data) {
      setError(err?.message ?? "Could not create workout.");
      return;
    }
    onCreated(data.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-5 font-serif text-xl font-light text-text">New workout</h3>
        <div className="space-y-4">
          <Field label="Workout name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Upper Body Day" />
          </Field>
          <Field label="Description">
            <TextArea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Focus, intended use…"
            />
          </Field>
          <ErrorBanner message={error} />
          <div className="flex gap-3">
            <PortalButton variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </PortalButton>
            <PortalButton onClick={create} disabled={saving} className="flex-1">
              {saving ? "Creating…" : "Create & build"}
            </PortalButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutsPage() {
  return (
    <TrainerLayout>
      <WorkoutList />
    </TrainerLayout>
  );
}
