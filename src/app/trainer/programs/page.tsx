"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Card, Spinner, Field, TextInput, TextArea, PortalButton, ErrorBanner } from "@/components/portal/ui";

interface Program {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

function ProgramList() {
  const { profile } = useProfile();
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });
    setPrograms((data as Program[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this program and all its days/exercises?")) return;
    const supabase = getSupabaseBrowser();
    await supabase.from("programs").delete().eq("id", id);
    load();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light tracking-tight text-text">Programs</h1>
          <p className="mt-1 font-sans text-sm text-text-muted">
            Reusable workout templates · {programs.length}
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
          New program
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : programs.length === 0 ? (
        <Card className="text-center">
          <p className="font-sans text-sm text-text-muted">
            No programs yet. Create a template you can reuse across clients.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <button onClick={() => router.push(`/trainer/programs/${p.id}`)} className="text-left">
                <h3 className="font-sans text-base font-medium text-text hover:text-terracotta">
                  {p.name}
                </h3>
                {p.description && (
                  <p className="mt-1 line-clamp-2 font-sans text-xs text-text-muted">{p.description}</p>
                )}
              </button>
              <div className="mt-4 flex gap-3 border-t border-border pt-3">
                <button
                  onClick={() => router.push(`/trainer/programs/${p.id}`)}
                  className="font-sans text-xs font-medium text-terracotta hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
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
        <NewProgramModal
          trainerId={profile.id}
          onClose={() => setModalOpen(false)}
          onCreated={(id) => router.push(`/trainer/programs/${id}`)}
        />
      )}
    </>
  );
}

function NewProgramModal({
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
      .from("programs")
      .insert({ name: name.trim(), description: description.trim() || null, created_by: trainerId })
      .select("id")
      .single();
    setSaving(false);
    if (err || !data) {
      setError(err?.message ?? "Could not create program.");
      return;
    }
    onCreated(data.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-5 font-serif text-xl font-light text-text">New program</h3>
        <div className="space-y-4">
          <Field label="Program name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="12-Week Strength" />
          </Field>
          <Field label="Description">
            <TextArea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goal, split, intended client…"
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

export default function ProgramsPage() {
  return (
    <TrainerLayout>
      <ProgramList />
    </TrainerLayout>
  );
}
