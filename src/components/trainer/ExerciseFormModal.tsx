"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Exercise } from "@/lib/portal/types";
import { Field, TextInput, TextArea, PortalButton, ErrorBanner } from "@/components/portal/ui";

export default function ExerciseFormModal({
  initial,
  trainerId,
  onClose,
  onSaved,
}: {
  initial?: Exercise | null;
  trainerId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [muscle, setMuscle] = useState(initial?.muscle_group ?? "");
  const [equipment, setEquipment] = useState(initial?.equipment ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [defaultSets, setDefaultSets] = useState(
    initial?.default_sets != null ? String(initial.default_sets) : ""
  );
  const [defaultReps, setDefaultReps] = useState(initial?.default_reps ?? "");
  const [cueNotes, setCueNotes] = useState(initial?.cue_notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    const payload = {
      name: name.trim(),
      muscle_group: muscle.trim() || null,
      equipment: equipment.trim() || null,
      video_url: videoUrl.trim() || null,
      default_sets: defaultSets === "" ? null : Number(defaultSets),
      default_reps: defaultReps.trim() || null,
      cue_notes: cueNotes.trim() || null,
    };

    const { error: err } = initial
      ? await supabase.from("exercises").update(payload).eq("id", initial.id)
      : await supabase.from("exercises").insert({ ...payload, created_by: trainerId });

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-5 font-serif text-xl font-light text-text">
          {initial ? "Edit exercise" : "New exercise"}
        </h3>
        <div className="space-y-4">
          <Field label="Name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Goblet Squat" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Muscle group">
              <TextInput value={muscle} onChange={(e) => setMuscle(e.target.value)} placeholder="Legs" />
            </Field>
            <Field label="Equipment">
              <TextInput value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Dumbbell" />
            </Field>
            <Field label="Default sets">
              <TextInput
                type="number"
                inputMode="numeric"
                value={defaultSets}
                onChange={(e) => setDefaultSets(e.target.value)}
                placeholder="3"
              />
            </Field>
            <Field label="Default reps">
              <TextInput value={defaultReps} onChange={(e) => setDefaultReps(e.target.value)} placeholder="10-12" />
            </Field>
          </div>
          <Field label="Video URL" hint="YouTube / Vimeo / direct link (optional)">
            <TextInput value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Coaching cues">
            <TextArea
              rows={3}
              value={cueNotes}
              onChange={(e) => setCueNotes(e.target.value)}
              placeholder="Chest up, knees track over toes…"
            />
          </Field>
          <ErrorBanner message={error} />
          <div className="flex gap-3">
            <PortalButton variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </PortalButton>
            <PortalButton onClick={save} disabled={saving} className="flex-1">
              {saving ? "Saving…" : initial ? "Save changes" : "Add exercise"}
            </PortalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
