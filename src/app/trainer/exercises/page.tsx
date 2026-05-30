"use client";

import { useCallback, useEffect, useState } from "react";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import ExerciseFormModal from "@/components/trainer/ExerciseFormModal";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Exercise } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";

function ExerciseLibrary() {
  const { profile } = useProfile();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .order("name", { ascending: true });
    setExercises((data as Exercise[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this exercise? It will be removed from programs that reference it.")) return;
    const supabase = getSupabaseBrowser();
    await supabase.from("exercises").delete().eq("id", id);
    load();
  }

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.muscle_group ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light tracking-tight text-text">Exercise Library</h1>
          <p className="mt-1 font-sans text-sm text-text-muted">{exercises.length} exercises</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-terracotta px-4 py-2.5 font-sans text-sm font-medium text-white transition hover:bg-terracotta/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New exercise
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or muscle group…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full max-w-sm rounded-lg border border-border bg-white px-4 py-2.5 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
      />

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Card className="text-center">
          <p className="font-sans text-sm text-text-muted">
            {search ? "No exercises match." : "No exercises yet — add your first one."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <h3 className="font-sans text-base font-medium text-text">{e.name}</h3>
                {e.video_url && (
                  <a
                    href={e.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta"
                    title="Watch demo"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </a>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-sans text-xs text-text-muted">
                {e.muscle_group && <span>{e.muscle_group}</span>}
                {e.equipment && <span>· {e.equipment}</span>}
                {(e.default_sets || e.default_reps) && (
                  <span>
                    · {e.default_sets ?? "?"} × {e.default_reps ?? "?"}
                  </span>
                )}
              </div>
              {e.cue_notes && (
                <p className="mt-2 line-clamp-2 font-sans text-xs italic text-text-muted">{e.cue_notes}</p>
              )}
              <div className="mt-4 flex gap-3 border-t border-border pt-3">
                <button
                  onClick={() => {
                    setEditing(e);
                    setModalOpen(true);
                  }}
                  className="font-sans text-xs font-medium text-terracotta hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(e.id)}
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
        <ExerciseFormModal
          initial={editing}
          trainerId={profile.id}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </>
  );
}

export default function ExercisesPage() {
  return (
    <TrainerLayout>
      <ExerciseLibrary />
    </TrainerLayout>
  );
}
